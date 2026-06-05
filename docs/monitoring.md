# Monitoring WasteLens — Documentation technique (C11)

## 1. Métriques surveillées

### Métriques custom WasteLens

| Métrique | Type | Description |
|---|---|---|
| `wastelens_predictions_total{predicted_class}` | Counter | Nombre cumulé de prédictions, segmenté par classe détectée (cardboard, glass, metal, paper, plastic, trash). Augmente d'1 à chaque appel réussi à `/predict`. |
| `wastelens_confidence_score` | Histogram | Distribution des scores de confiance retournés par le modèle. Les buckets couvrent 0.5, 0.6, 0.7, 0.8, 0.9, 0.95 et 1.0 — cela permet de voir si le modèle répond avec une confiance élevée (>0.9) ou hésitante (<0.7). |

> **Interprétation correcte :** un Counter ne peut que croître ; pour obtenir un taux d'évolution, on utilise `rate()` en PromQL. Un Histogram expose `_sum`, `_count` et `_bucket` : `_sum/_count` donne la moyenne, les `_bucket` permettent les percentiles.

### Métriques HTTP automatiques (prometheus-fastapi-instrumentator)

| Métrique | Type | Description |
|---|---|---|
| `http_requests_total{handler, method, status}` | Counter | Nombre total de requêtes reçues, segmenté par endpoint (`handler`), méthode HTTP et code de statut. |
| `http_request_duration_seconds{handler}` | Histogram | Latence de traitement des requêtes par endpoint. Expose `_sum` et `_count` pour calculer la latence moyenne via PromQL. |

---

## 2. Architecture de monitoring

```
FastAPI  ──(/metrics)──►  Prometheus  ──(query)──►  Grafana  ──(alerte)──►  Telegram
  :8000                     :9090                     :3000
```

1. **FastAPI** expose un endpoint `/metrics` (format Prometheus text) mis à jour à chaque requête.
2. **Prometheus** scrape ce endpoint toutes les **15 secondes** et stocke les séries temporelles (rétention 15 jours).
3. **Grafana** interroge Prometheus via son API pour afficher les données en temps réel sur le dashboard.
4. **Telegram** reçoit les notifications d'alerte déclenchées par les règles Grafana.

---

## 3. Outils et installation

### Composants

| Outil | Image | Configuration |
|---|---|---|
| Prometheus | `prom/prometheus:latest` | `monitoring/prometheus/prometheus.yml` |
| Grafana | `grafana/grafana:10.4.0` | `monitoring/grafana/dashboards/` et `monitoring/grafana/provisioning/` |

### Configuration Prometheus (`monitoring/prometheus/prometheus.yml`)

```yaml
scrape_configs:
  - job_name: wastelens-api
    scrape_interval: 15s
    static_configs:
      - targets: ['wastelens-api:8000']
    metrics_path: /metrics
```

### Démarrage

```bash
# Démarrer tous les services (API + monitoring)
docker compose up -d

# Vérifier que les conteneurs sont bien lancés
docker compose ps
```

### Accès

| Environnement | URL | Identifiants |
|---|---|---|
| Local | `http://localhost:3000` | `admin` / valeur de `GRAFANA_ADMIN_PASSWORD` dans `.env` |
| Production | `https://grafana-wastelens.starspath-place.fr` | `admin` / variable Coolify `GRAFANA_ADMIN_PASSWORD` |

---

## 4. Dashboard Grafana — 4 panels

Le dashboard `WasteLens Dashboard` est provisionné automatiquement au démarrage depuis `monitoring/grafana/dashboards/wastelens-dashboard.json`.

### Panel 1 — Prédictions par classes (Pie chart)

**Query PromQL :**
```promql
wastelens_predictions_total
```

**Interprétation :** affiche la répartition des prédictions entre les 6 classes de déchets depuis le démarrage du conteneur. Permet d'identifier un éventuel déséquilibre dans les images soumises (ex. surreprésentation d'une classe).

---

### Panel 2 — Requêtes par endpoints (Bar gauge)

**Query PromQL :**
```promql
http_requests_total{handler!="/metrics", handler!="none", handler!="/openapi.json", handler!="/docs"}
```

**Interprétation :** volume de requêtes reçues par endpoint métier (`/predict`, `/login`, `/health`, `/reports/evaluation`, `/reports/confusion-matrix`). Les endpoints techniques (docs, metrics) sont exclus du filtre pour ne pas parasiter la lecture.

---

### Panel 3 — Latence moyenne /predict (Stat)

**Query PromQL :**
```promql
rate(http_request_duration_seconds_sum{handler="/predict"}[5m])
/ rate(http_request_duration_seconds_count{handler="/predict"}[5m])
```

**Interprétation :** latence moyenne de traitement des requêtes de classification sur la fenêtre glissante des 5 dernières minutes. Une valeur > 5s indique une dégradation des performances du modèle. Une valeur > 15s déclenche l'alerte Telegram.

---

### Panel 4 — Score de confiance moyen (Stat)

**Query PromQL :**
```promql
wastelens_confidence_score_sum / wastelens_confidence_score_count
```

**Interprétation :** score de confiance moyen retourné par le modèle sur l'ensemble des prédictions. Une valeur proche de 1.0 indique que le modèle répond avec certitude. Une valeur inférieure à 0.7 peut signaler des images de mauvaise qualité ou des classes sous-représentées à l'entraînement.

---

## 5. Alertes configurées

### Alerte : Latence élevée /predict

| Paramètre | Valeur |
|---|---|
| Nom | Latence élevée /predict |
| Condition | Latence moyenne > 15s sur une fenêtre de 5 minutes |
| Canal | Telegram — bot `WasteLensAlertsBot` |
| Évaluation | Toutes les minutes |

**Seuils visuels (couleurs Grafana) :**

| Plage | Couleur | Signification |
|---|---|---|
| 0 — 5s | Vert | Performances nominales |
| 5 — 10s | Orange | Dégradation à surveiller |
| > 10s | Rouge | Anomalie — investigation requise |

**Configuration du canal Telegram :**  
Le bot token et le chat ID sont injectés via les variables d'environnement `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID`, définies dans Coolify (production) ou dans le fichier `.env` (local). Ces valeurs ne sont jamais versionnées dans le dépôt git.

---

## 6. Procédure d'installation locale

### Prérequis

- Docker et Docker Compose installés
- Fichier `api/.env` configuré (copier depuis `api/.env.example`)
- Fichier `.env` à la racine avec `GRAFANA_ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### Démarrage

```bash
# Cloner le dépôt
git clone https://github.com/NovaStarmax/WasteLens.git
cd WasteLens

# Configurer les variables d'environnement
cp api/.env.example api/.env
# Éditer api/.env avec les valeurs requises

# Démarrer la stack complète
docker compose up -d

# Vérifier les logs Prometheus
docker compose logs prometheus

# Vérifier les logs Grafana
docker compose logs grafana
```

### Vérification

```bash
# Prometheus scrape bien l'API
curl http://localhost:9090/api/v1/targets

# Métriques exposées par l'API
curl http://localhost:8000/metrics | grep wastelens
```

### Accès Grafana local

1. Ouvrir `http://localhost:3000`
2. Se connecter avec `admin` / valeur de `GRAFANA_ADMIN_PASSWORD`
3. Le dashboard **WasteLens Dashboard** est disponible dans le dossier **WasteLens**

---

## 7. Maintenance

### Rétention des données

Prometheus conserve les métriques **15 jours** (configurable via `--storage.tsdb.retention.time` dans `docker-compose.yml`).

### Nettoyage des volumes

```bash
# Supprimer les données Prometheus (repart de zéro)
docker compose down
docker volume rm wastelens_prometheus_data

# Supprimer les données Grafana (réinitialise dashboards et alertes manuels)
docker volume rm wastelens_grafana_data
```

> **Attention :** la suppression du volume Grafana efface les alertes et contact points configurés manuellement dans l'UI. Les datasources et dashboards provisionnés depuis les fichiers YAML/JSON sont automatiquement recréés au redémarrage.

---

## 8. Accessibilité

Le dashboard Grafana est accessible via tout navigateur standard (Chrome, Firefox, Safari, Edge).

- Les données des panels sont également disponibles en format tabulaire dans Grafana (bouton **Inspect → Data** sur chaque panel), compatible avec les lecteurs d'écran.
- Les titres de panels, labels d'axes et légendes sont explicites pour permettre une lecture sans interprétation visuelle exclusive.
- Les couleurs des seuils (vert/orange/rouge) sont accompagnées de valeurs numériques affichées dans les panels de type Stat pour ne pas reposer uniquement sur la couleur.
