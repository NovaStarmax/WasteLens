# Incidents WasteLens — Post-mortems

---

### Incident 1 — Grafana inaccessible en production (port non exposé)

- **Date** : 5 juin 2026
- **Environnement** : Production (Coolify / VPS OVH)
- **Symptôme** : Grafana déployé mais inaccessible via l'URL publique — Traefik retourne 404, aucun routing possible vers le dashboard.
- **Cause identifiée** : Le service `grafana` dans `docker-compose.yml` utilisait `expose` (port interne Docker uniquement) au lieu de `ports` — Traefik ne pouvait pas détecter le service pour le routing.
- **Étapes de reproduction** :
  1. Déployer le stack avec `expose: ["3000"]` sur Grafana
  2. Accéder à l'URL publique Grafana → 404
  3. Inspecter `docker inspect grafana` → port 3000 non bindé sur l'hôte
- **Solution appliquée** : Remplacement de `expose` par `ports: ["3000:3000"]` dans `docker-compose.yml` pour rendre le port visible par Traefik.
- **Commit/PR de référence** : `8d6b8d6` — fix/grafana-expose-port (PR #40)

---

### Incident 2 — Prometheus ne démarre pas (dossier fantôme au lieu du fichier de config)

- **Date** : 5 juin 2026
- **Environnement** : Production (Coolify / VPS OVH)
- **Symptôme** : Le conteneur `prometheus` crashe au démarrage avec l'erreur `config file is a directory`.
- **Cause identifiée** : Coolify ne clone pas le dépôt Git sur le VPS — il transfère uniquement l'image Docker buildée. Le volume mount `./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml` référençait un chemin relatif inexistant sur le VPS. Docker a alors créé un dossier vide à la place du fichier, rendant la configuration illisible par Prometheus.
- **Étapes de reproduction** :
  1. Monter `prometheus.yml` comme volume fichier dans `docker-compose.yml`
  2. Déployer via Coolify (pas de clone repo sur le VPS)
  3. Docker crée un dossier fantôme → Prometheus refuse de démarrer
- **Solution appliquée** : Abandon des volumes fichiers pour la config. La configuration `prometheus.yml` et les dashboards Grafana sont désormais **baked** dans les images Docker via des `Dockerfile` dédiés (`Dockerfile.prometheus`, `Dockerfile.grafana`). Plus aucune dépendance à un fichier hôte.
- **Commit/PR de référence** : `d6a5d3c` (mount directory) → `81eb156` (bake configs) — fix/grafana-expose-port (PR #40)

---

### Incident 3 — Le frontend en production appelait l'API via le DNS VPS au lieu du réseau Docker interne

- **Date** : Juin 2026 (phase d'intégration Docker)
- **Environnement** : Production (Docker Compose)
- **Symptôme** : Les requêtes du frontend vers l'API aboutissaient à des erreurs CORS ou des timeouts en production, alors que tout fonctionnait en développement local (`npm run dev`).
- **Cause identifiée** : En mode dev, Vite proxy redirige `/api` vers `localhost:8000`. Lors du build Docker, si une variable `VITE_API_URL` pointe vers le VPS public, le navigateur envoie les requêtes vers l'URL externe au lieu de passer par nginx en interne. Le service `wastelens-api` n'était pas accessible depuis l'extérieur directement (pas de port exposé), provoquant des échecs de connexion.
- **Étapes de reproduction** :
  1. Builder le frontend avec une URL d'API hardcodée pointant vers le VPS
  2. nginx reçoit les requêtes `/api/*` mais le frontend bypasse nginx et appelle directement l'URL externe
  3. CORS ou timeout selon la configuration
- **Solution appliquée** : Le frontend utilise uniquement des **chemins relatifs** (`/api/...`). nginx intercepte ces chemins et proxifie vers `wastelens-api:8000` via le réseau Docker interne. Aucune URL absolue de l'API dans le code frontend.
- **Commit/PR de référence** : `f35037b` — feat: add Dockerfiles, nginx config and docker-compose for local build

---

### Incident 4 — 502 Bad Gateway après chaque redéploiement Coolify

- **Date** : 9 juin 2026
- **Environnement** : Production (Coolify / VPS OVH)
- **Symptôme** : Après chaque redéploiement du conteneur `wastelens-api` via Coolify, le frontend retournait une erreur 502 pendant 30 à 60 secondes avant de revenir à la normale.
- **Cause identifiée** : nginx résout le DNS du service `wastelens-api` **une seule fois au démarrage** et met l'IP en cache. Lors d'un redéploiement Coolify, le conteneur `wastelens-api` est recréé avec une **nouvelle IP Docker**. nginx conservait l'ancienne IP, toutes les requêtes aboutissaient sur un conteneur mort → 502.
- **Étapes de reproduction** :
  1. Déployer le stack complet
  2. Redéployer uniquement `wastelens-api` via Coolify
  3. nginx maintient l'ancienne IP → 502 jusqu'au prochain restart nginx
- **Solution appliquée** : Ajout de `resolver 127.0.0.11 valid=10s;` dans `app/nginx.conf`. Le resolver Docker interne (`127.0.0.11`) force nginx à re-résoudre le DNS toutes les 10 secondes, récupérant la nouvelle IP après redéploiement.
- **Commit/PR de référence** : `c80a033` — fix/nginx-resolve (PR #80)
