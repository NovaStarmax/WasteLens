# Modélisation des données WasteLens — Merise (C14)

## 1. MCD — Modèle Conceptuel des Données

Deux entités sont identifiées : **User** et **Prediction**.

Un utilisateur peut effectuer zéro ou plusieurs prédictions. Chaque prédiction est effectuée par exactement un utilisateur.

```
┌─────────────────┐         effectue         ┌──────────────────────┐
│      USER       │ 1,1 ────────────── 0,N   │     PREDICTION       │
├─────────────────┤                          ├──────────────────────┤
│ id (PK)         │                          │ id (PK)              │
│ username        │                          │ user_id (FK)         │
│ email           │                          │ predicted_class      │
│ password_hash   │                          │ confidence           │
│ role            │                          │ timestamp            │
│ created_at      │                          └──────────────────────┘
└─────────────────┘
```

**Lecture des cardinalités :**
- `(1,1)` côté User : une prédiction est toujours rattachée à exactement un utilisateur.
- `(0,N)` côté Prediction : un utilisateur peut n'avoir aucune prédiction ou en avoir plusieurs.

---

## 2. MPD — Modèle Physique des Données

Traduction du MCD en tables relationnelles PostgreSQL.

### Table `users`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `username` | `VARCHAR(50)` | `UNIQUE NOT NULL` |
| `email` | `VARCHAR(255)` | `UNIQUE` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` |
| `role` | `VARCHAR(10)` | `NOT NULL DEFAULT 'user'` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` |

### Table `predictions`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `predicted_class` | `VARCHAR(50)` | `NOT NULL` |
| `confidence` | `FLOAT` | `NOT NULL` |
| `timestamp` | `TIMESTAMPTZ` | `NOT NULL` |

La clé étrangère `user_id` matérialise la relation du MCD. Le `ON DELETE CASCADE` garantit qu'à la suppression d'un utilisateur, toutes ses prédictions sont supprimées.

---

## 3. Règles de gestion

| Règle | Description |
|---|---|
| RG-01 | Un utilisateur possède le rôle `user` ou `admin`. |
| RG-02 | Un utilisateur avec le rôle `user` ne peut consulter que ses propres prédictions. |
| RG-03 | Un utilisateur avec le rôle `admin` peut consulter toutes les prédictions. |
| RG-04 | La suppression d'un utilisateur entraîne la suppression en cascade de toutes ses prédictions. |
| RG-05 | Le champ `confidence` est compris entre 0.0 et 1.0 (retourné par le modèle ResNet18). |
| RG-06 | Le champ `predicted_class` prend l'une des six valeurs : `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`. |

---

## 4. Technologie

| Composant | Choix |
|---|---|
| Base de données | PostgreSQL 18 |
| ORM | SQLAlchemy 2.x (mode async) |
| Driver | asyncpg |
| Migrations | Alembic |
| Primary keys | UUID v4 (généré côté application) |
| Timestamps | `TIMESTAMPTZ` — stockés en UTC, timezone-aware |
