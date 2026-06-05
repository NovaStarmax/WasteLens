# Plan de tests WasteLens — Documentation technique (C12)

## 1. Stratégie de tests

### Approche générale

WasteLens utilise une suite de tests d'intégration couvrant tous les endpoints de l'API FastAPI. Les tests vérifient le comportement de bout en bout : authentification, validation des entrées, codes de retour HTTP, et structure des réponses.

| Critère | Valeur |
|---|---|
| Framework | `pytest` + `httpx` + `TestClient` FastAPI |
| Type de tests | Tests d'intégration (pas de tests unitaires isolés) |
| Localisation | `api/tests/` |
| Isolation du modèle | `ModelService` est mocké — ResNet18 n'est pas chargé en CI |

### Pourquoi des mocks pour le modèle

Le modèle ResNet18 pèse 43 MB et nécessite PyTorch pour l'inférence. En CI, charger le vrai modèle allongerait chaque run de plusieurs minutes et nécessiterait le fichier `best_model.pt` dans le dépôt. Le mock retourne une prédiction déterministe (`plastic`, 0.9876) qui permet de tester la logique de l'API sans dépendance au modèle réel.

### Fixtures partagées (`api/tests/conftest.py`)

- `client` — `TestClient` FastAPI configuré avec l'app de test
- `valid_token` — JWT valide signé avec la clé de test
- `expired_token` — JWT expiré pour tester les rejets d'auth
- `valid_png_bytes` — Image PNG minimale valide (magic bytes `\x89PNG`)
- `pdf_bytes` — Fichier PDF pour tester le rejet de type MIME
- `oversized_png_bytes` — Image dépassant 10 MB pour tester la limite de taille
- `corrupted_png_bytes` — Données PNG avec magic bytes valides mais contenu corrompu

---

## 2. Cas de test

### `tests/test_health.py` — Endpoint de santé

| Test | Endpoint | Périmètre | Stratégie |
|---|---|---|---|
| `test_health_returns_200` | `GET /health` | Disponibilité de l'API | Requête sans auth, assertion code 200 |

### `tests/test_auth.py` — Authentification et rate limiting

| Test | Endpoint | Périmètre | Stratégie |
|---|---|---|---|
| `test_login_valid_returns_token` | `POST /login` | Authentification réussie | Credentials valides → 200 + token JWT + expires_in |
| `test_login_wrong_password_returns_401` | `POST /login` | Mauvais mot de passe | Credentials incorrects → 401 |
| `test_login_wrong_username_returns_401` | `POST /login` | Mauvais identifiant | Credentials incorrects → 401 |
| `test_login_missing_config_returns_500` | `POST /login` | Absence de configuration | Mock `os.getenv` → retourne None → 500 |
| `test_login_rate_limit_returns_429` | `POST /login` | Rate limiting (5/minute) | 6 appels successifs → dernier retourne 429 |

### `tests/test_predict.py` — Prédiction de déchets

| Test | Endpoint | Périmètre | Stratégie |
|---|---|---|---|
| `test_predict_no_token_returns_401` | `POST /predict` | Auth manquante | Requête sans header Authorization → 401 |
| `test_predict_invalid_token_returns_401` | `POST /predict` | Token invalide | Token malformé → 401 |
| `test_predict_expired_token_returns_401` | `POST /predict` | Token expiré | JWT expiré → 401 |
| `test_predict_valid_image_returns_200` | `POST /predict` | Prédiction réussie | Image PNG valide + token valide → 200 + `predicted_class`, `confidence`, `bin_recommendation` |
| `test_predict_pdf_returns_400` | `POST /predict` | Validation type MIME | Fichier PDF → 400 |
| `test_predict_oversized_file_returns_400` | `POST /predict` | Validation taille | Fichier > 10 MB → 400 |
| `test_predict_corrupted_image_returns_400` | `POST /predict` | Validation intégrité | Image corrompue → 400 |

### `tests/test_reports.py` — Rapports de performance du modèle

| Test | Endpoint | Périmètre | Stratégie |
|---|---|---|---|
| `test_evaluation_no_token_returns_401` | `GET /reports/evaluation` | Auth manquante | Requête sans token → 401 |
| `test_evaluation_invalid_token_returns_401` | `GET /reports/evaluation` | Token invalide | Token malformé → 401 |
| `test_evaluation_expired_token_returns_401` | `GET /reports/evaluation` | Token expiré | JWT expiré → 401 |
| `test_confusion_matrix_no_token_returns_401` | `GET /reports/confusion-matrix` | Auth manquante | Requête sans token → 401 |
| `test_confusion_matrix_invalid_token_returns_401` | `GET /reports/confusion-matrix` | Token invalide | Token malformé → 401 |
| `test_confusion_matrix_expired_token_returns_401` | `GET /reports/confusion-matrix` | Token expiré | JWT expiré → 401 |
| `test_evaluation_missing_file_returns_404` | `GET /reports/evaluation` | Fichier absent | `REPORTS_PATH` mocké sur répertoire vide → 404 |
| `test_confusion_matrix_missing_file_returns_404` | `GET /reports/confusion-matrix` | Fichier absent | `REPORTS_PATH` mocké sur répertoire vide → 404 |
| `test_evaluation_returns_json_with_accuracy` | `GET /reports/evaluation` | Rapport JSON valide | Fichier JSON créé dans `tmp_path` → 200 + contenu |
| `test_confusion_matrix_returns_png` | `GET /reports/confusion-matrix` | Image PNG valide | PNG créé dans `tmp_path` → 200 + `content-type: image/png` |

**Total : 23 tests**

---

## 3. Environnement de test

### Prérequis

- Python 3.13
- `uv` (gestionnaire de paquets)
- Dépendances installées depuis `api/pyproject.toml`

### Lancement des tests

```bash
cd api
uv sync --frozen
uv run pytest tests/ -v --cov=app --cov-report=term-missing
```

Options utilisées :
- `-v` — affichage verbeux (nom de chaque test + résultat)
- `--cov=app` — mesure la couverture du module `app/`
- `--cov-report=term-missing` — affiche les lignes non couvertes dans le terminal

### Variables d'environnement de test

Les tests utilisent des valeurs fictives définies dans `conftest.py` (ex. `TEST_USERNAME`, `TEST_PASSWORD`, `JWT_SECRET_TEST`). Aucun fichier `.env` n'est requis pour lancer la suite.

---

## 4. Coverage (couverture de code)

### Définition

Le coverage mesure le pourcentage de lignes du code source (`app/`) effectivement exécutées pendant les tests. Une ligne non couverte signifie qu'aucun test n't'a traversée — ce qui laisse un risque de régression non détectée.

### Interprétation du rapport

```
Name                          Stmts   Miss  Cover   Missing
-----------------------------------------------------------
app/core/security.py             42      3    93%   78-80
app/routers/predict.py           28      0   100%
```

- **Stmts** : nombre total de lignes exécutables
- **Miss** : lignes non parcourues par les tests
- **Cover** : pourcentage de couverture
- **Missing** : numéros de lignes non testées

### Objectif

La suite actuelle (23 tests) couvre l'ensemble des chemins critiques : auth, validation, prédiction et rapports. Le coverage vise > 85% sur le module `app/`.

---

## 5. Exécution en CI

Le workflow `.github/workflows/api-ci.yml` exécute automatiquement la suite de tests à chaque push sur une branche `feature/**` ou `develop`, et à chaque pull request vers `develop`, si des fichiers dans `api/` ont été modifiés.

### Étapes du job `test`

1. Checkout du dépôt
2. Installation de `uv`
3. Installation de Python 3.13
4. Installation des dépendances (`uv sync --frozen`)
5. Lancement des tests avec coverage (`uv run pytest tests/ -v --tb=short --cov=app --cov-report=term-missing`)

Si un test échoue, le job CI passe en erreur et bloque la fusion de la PR.
