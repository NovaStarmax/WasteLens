# WasteLens

![API CI](https://github.com/NovaStarmax/WasteLens/actions/workflows/api-ci.yml/badge.svg)
![Model Training](https://github.com/NovaStarmax/WasteLens/actions/workflows/model-training.yml/badge.svg)

Application de classification de déchets par intelligence artificielle. L'utilisateur uploade une image et reçoit en temps réel la catégorie de déchet détectée parmi 6 classes (cardboard, glass, metal, paper, plastic, trash) ainsi que la recommandation de tri correspondante.

---

## Stack technique

| Composant | Technologie | Version |
|---|---|---|
| API | FastAPI + Python | 3.13 |
| Frontend | React + Vite | 18 |
| Modèle | ResNet18 PyTorch (transfer learning) | CPU-only |
| Base de données | PostgreSQL | 18 |
| Monitoring | Prometheus + Grafana | 10.4.0 |
| Déploiement | Docker + Coolify | - |
| Proxy | nginx + Traefik | - |

---

## Environnements

| Environnement | URL |
|---|---|
| Production | https://wastelens.starspath-place.fr |
| Pré-production | https://preprod.wastelens.starspath-place.fr |
| Grafana | https://grafana-wastelens.starspath-place.fr |

---

## Installation locale

```bash
git clone https://github.com/NovaStarmax/WasteLens.git
cd WasteLens
cp api/.env.example api/.env
# Éditer api/.env avec les valeurs requises
docker compose up -d
```

L'application est accessible sur `http://localhost` (frontend) et `http://localhost:8000` (API).

---

## Variables d'environnement

### `api/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `ADMIN_USERNAME` | Identifiant administrateur |
| `ADMIN_PASSWORD` | Mot de passe administrateur |
| `JWT_SECRET` | Clé secrète de signature des tokens JWT |
| `JWT_EXPIRE_HOURS` | Durée de validité des tokens (défaut : 24) |
| `CORS_ORIGINS` | Origines autorisées (ex. `http://localhost:5173`) |
| `MODEL_PATH` | Chemin vers les poids du modèle |
| `REPORTS_PATH` | Chemin vers les rapports d'évaluation |

### `.env` (racine, monitoring)

| Variable | Description |
|---|---|
| `GRAFANA_ADMIN_PASSWORD` | Mot de passe admin Grafana |
| `TELEGRAM_BOT_TOKEN` | Token du bot d'alertes Telegram |
| `TELEGRAM_CHAT_ID` | ID du chat Telegram destinataire des alertes |

---

## Architecture

Voir [docs/architecture.md](docs/architecture.md) pour le diagramme complet du flux de données et le flux MLOps.

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Architecture système et flux MLOps |
| [docs/ci-cd.md](docs/ci-cd.md) | Pipeline CI/CD — workflows GitHub Actions |
| [docs/monitoring.md](docs/monitoring.md) | Monitoring Prometheus/Grafana et alertes |
| [docs/testing.md](docs/testing.md) | Plan de tests et couverture |
| [docs/merise.md](docs/merise.md) | Modélisation des données (MCD/MPD) |

---

## Tests

```bash
cd api
uv sync --frozen
uv run pytest tests/ -v --cov=app --cov-report=term-missing
```

42 tests d'intégration couvrant l'authentification, la validation des entrées, la prédiction et les rapports. Aucun fichier `.env` requis pour les tests.

---

## Licence

MIT
