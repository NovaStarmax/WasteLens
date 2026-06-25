# Pipeline CI/CD WasteLens — Documentation technique (C13)

## 1. Vue d'ensemble

Le pipeline CI/CD de WasteLens est composé de trois workflows GitHub Actions indépendants qui forment une chaîne automatisée : test → entraînement → déploiement.

```
Push code (api/)          Push code (model/)         Model Training réussi
       │                         │                           │
       ▼                         ▼                           ▼
  api-ci.yml              model-training.yml           cd-model.yml
  Tests API                Entraîne ResNet18         Déploie sur VPS
  Coverage                 Évalue + artifacts         Redémarre l'API
```

### Récapitulatif des workflows

| Workflow | Fichier | Déclencheur principal | Rôle |
|---|---|---|---|
| API CI | `api-ci.yml` | Push sur `feature/**`, `develop` ou `main` (fichiers `api/`) | Lance les tests, scan CVE + coverage |
| Model Training | `model-training.yml` | Push sur `develop` (fichiers `model/`) ou manuel | Entraîne et évalue le modèle |
| CD Model | `cd-model.yml` | Fin réussie de Model Training sur `develop` | Déploie le modèle sur le VPS |

---

## 2. Secrets GitHub requis

Ces secrets sont configurés dans **Settings → Secrets and variables → Actions** du dépôt GitHub.

| Secret | Utilisé par | Description |
|---|---|---|
| `VPS_HOST` | `cd-model.yml` | Adresse IP ou hostname du VPS de production |
| `VPS_USER` | `cd-model.yml` | Utilisateur SSH sur le VPS (ex. `ubuntu`) |
| `VPS_SSH_KEY` | `cd-model.yml` | Clé privée SSH pour s'authentifier sur le VPS |
| `KAGGLE_USERNAME` | `model-training.yml` | Identifiant Kaggle pour télécharger le dataset |
| `KAGGLE_KEY` | `model-training.yml` | Clé API Kaggle |

> `GITHUB_TOKEN` est un secret automatiquement injecté par GitHub Actions — il n'est pas à configurer manuellement.

---

## 3. Déclencheurs

### API CI (`api-ci.yml`)

Se déclenche sur :
- **Push** vers `feature/**`, `develop` ou `main` — uniquement si des fichiers dans `api/` ou `.github/workflows/api-ci.yml` ont été modifiés
- **Pull Request** vers `develop` — mêmes conditions de path

### Model Training (`model-training.yml`)

Se déclenche sur :
- **Push** vers `develop` — uniquement si des fichiers dans `model/` ou `.github/workflows/model-training.yml` ont été modifiés
- **workflow_dispatch** — déclenchement manuel depuis l'interface GitHub Actions (voir section 5)

### CD Model (`cd-model.yml`)

Se déclenche sur :
- **workflow_run** — automatiquement quand le workflow `Model Training` se termine avec succès (`conclusion == 'success'`) sur la branche `develop`

> Si `Model Training` échoue, `CD Model` ne se déclenche pas. Le modèle en production n'est jamais remplacé par un modèle non validé.

---

## 4. Artifacts produits

Les artifacts sont des fichiers produits pendant l'exécution d'un workflow et stockés temporairement par GitHub.

| Artifact | Workflow | Rétention | Contenu |
|---|---|---|---|
| `best-model-{sha}` | `model-training.yml` | 30 jours | `best_model.pt` — poids ResNet18 entraîné |
| `training-reports-{sha}` | `model-training.yml` | 30 jours | `evaluation_report.json`, `confusion_matrix.png`, `training_history.json`, `best_model.sha256` |

Le `{sha}` dans le nom de l'artifact correspond au SHA du commit qui a déclenché l'entraînement. Cela permet à `cd-model.yml` de retrouver l'artifact correspondant au bon run.

### Téléchargement des artifacts

Les artifacts sont accessibles dans l'onglet **Actions → workflow run → Artifacts** sur GitHub, ou via la CLI `gh`:

```bash
gh run download <run-id> --name best-model-<sha>
```

---

## 5. Déclenchement manuel de Model Training

Le workflow `Model Training` peut être lancé manuellement sans pousser de code, via `workflow_dispatch`.

### Depuis l'interface GitHub

1. Aller dans **Actions** → **Model Training**
2. Cliquer sur **Run workflow**
3. Sélectionner la branche `develop`
4. Cliquer sur **Run workflow**

Le workflow télécharge le dataset Kaggle, entraîne ResNet18, évalue le modèle, puis publie les artifacts. Si tout réussit, `CD Model` se déclenche automatiquement pour déployer le nouveau modèle.

### Via la CLI GitHub

```bash
gh workflow run model-training.yml --ref develop
```

---

## 6. Déploiement VPS

### Flux complet

```
GitHub Actions (cd-model.yml)
  │
  ├── Télécharge best_model.pt                                  (artifact best-model-{sha})
  ├── SCP → /tmp/best_model.pt                                  (sur le VPS)
  │
  ├── Télécharge evaluation_report.json + best_model.sha256    (artifact training-reports-{sha})
  ├── Vérifie sha256sum -c best_model.sha256                    (CI s'arrête si altéré)
  │
  ├── SCP → /tmp/evaluation_report.json  (sur le VPS)
  ├── SCP → /tmp/confusion_matrix.png    (sur le VPS)
  │
  └── SSH → sudo /usr/local/bin/deploy-wastelens-model
```

### Script de déploiement (`/usr/local/bin/deploy-wastelens-model`)

Le script est installé sur le VPS et exécuté via `sudo` par le runner GitHub Actions. Il effectue les opérations suivantes :

1. Déplace `best_model.pt` vers le répertoire de l'application Coolify (`model/checkpoints/`)
2. Déplace `evaluation_report.json` et `confusion_matrix.png` vers `model/reports/`
3. Applique les permissions correctes (`ubuntu:ubuntu`, `644`)
4. Redémarre le conteneur `wastelens-api` via `docker restart`

Le conteneur redémarré recharge automatiquement le nouveau modèle au démarrage, grâce au volume monté sur `model/checkpoints/`.

### Accès SSH

Le runner GitHub Actions utilise `webfactory/ssh-agent` pour charger la clé privée `VPS_SSH_KEY` en mémoire. Le VPS a été configuré pour accepter cette clé dans `~/.ssh/authorized_keys` de l'utilisateur `VPS_USER`.

---

## 7. Gestion des environnements

| Environnement | Déploiement | Variables |
|---|---|---|
| Local | `docker compose up -d` | Fichier `api/.env` + `.env` racine |
| Production | Coolify (auto sur push `develop`) | Variables configurées dans l'interface Coolify |

Les secrets applicatifs (`APP_USERNAME`, `APP_PASSWORD_HASH`, `JWT_SECRET`, `GRAFANA_ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) ne sont jamais versionnés dans le dépôt git. Ils sont injectés au runtime via Coolify en production et via `.env` en local.

---

## 8. Sécurité de la chaîne CI/CD (OWASP A06 + A08)

### A06 — Scan de vulnérabilités des dépendances

Le workflow `api-ci.yml` intègre un step `pip-audit` après `uv sync --frozen` :

```yaml
- name: Scan dependencies for vulnerabilities
  run: |
    uv run --with pip-audit pip-audit \
      --ignore-vuln PYSEC-2026-161 \
      --ignore-vuln CVE-2026-48818 \
      --ignore-vuln CVE-2026-48817 \
      --ignore-vuln CVE-2026-54283 \
      --ignore-vuln CVE-2026-54282 \
      --ignore-vuln CVE-2025-3000
```

`pip-audit` audite le lockfile `uv.lock` contre les bases CVE et PyPA. La CI échoue si une nouvelle vulnérabilité non ignorée est détectée.

**CVEs ignorées et justification :**

| ID | Package | Raison |
|---|---|---|
| PYSEC-2026-161, CVE-2026-48817/18, CVE-2026-54282/83 | `starlette 0.52.1` | Fix nécessite starlette ≥ 1.3.1, incompatible avec FastAPI 0.136.1 + prometheus_fastapi_instrumentator |
| CVE-2025-3000 | `torch 2.12.0` | Installé depuis l'index PyTorch CPU (`+cpu`), non résolvable via PyPI standard |

**CVE corrigée lors de la mise en place :** `python-multipart 0.0.29` → `0.0.32` (CVE-2026-53538/39/40).

### A08 — Vérification d'intégrité du modèle

Le modèle IA est signé par checksum SHA-256 à la source et vérifié avant déploiement :

1. **`model-training.yml`** — après l'entraînement, calcule `best_model.sha256` et le publie dans l'artifact `training-reports-{sha}`
2. **`cd-model.yml`** — après SCP du modèle vers le VPS, télécharge l'artifact `training-reports` et vérifie `sha256sum -c best_model.sha256` sur le runner ; si le checksum échoue, le workflow s'arrête avant toute activation du modèle

Si le fichier `best_model.pt` a été altéré entre la génération et le déploiement, la CI s'interrompt avec une erreur.
