# Méthodologie Agile WasteLens

## 1. Méthodologie — Scrum solo adapté

WasteLens est développé en mode **Scrum solo adapté** : les cérémonies collectives sont simplifiées mais la structure reste itérative et incrémentale. Chaque sprint d'une semaine livre un incrément fonctionnel déployable.

Les sprints suivent le cycle classique : planification → développement → review → rétrospective personnelle. L'absence d'équipe supprime les stand-ups quotidiens mais renforce l'importance du backlog écrit comme outil de mémoire et de priorisation.

---

## 2. Outils

| Outil | Usage |
|---|---|
| **GitHub Issues** | Backlog produit — chaque issue = une user story ou une tâche technique |
| **GitHub Projects** | Kanban board (Backlog / In Progress / Review / Done) |
| **GitHub Labels** | Catégorisation : `feat`, `fix`, `docs`, `ci`, `chore`, `wcag` |
| **GitHub Milestones** | Jalons par sprint ou par domaine fonctionnel |
| **Pull Requests** | Unité de livraison — chaque PR référence l'issue associée |
| **Branch naming** | Convention : `feature/`, `fix/`, `docs/`, `feat/`, `chore/` |

---

## 3. Backlog et sprints

Le backlog produit est géré dans **GitHub Projects** :
→ [github.com/NovaStarmax/WasteLens/projects](https://github.com/NovaStarmax/WasteLens/projects)

### Sprints réalisés (extraits)

| Sprint | Thème principal | PRs clés |
|---|---|---|
| S1 | Infrastructure Docker + CI | #39 monitoring, #40 fix grafana |
| S2 | Base de données + Auth DB | #66 database, #69 roles |
| S3 | Historique + Admin dashboard | #70 history, #75-76 admin |
| S4 | CD + Monitoring WCAG | #77 CD logs, #78 WCAG + docs |
| S5 | RGPD + stabilisation prod | #80 nginx resolve, #81 RGPD page |

---

## 4. Rituels adaptés au contexte solo

| Cérémonie | Adaptation solo |
|---|---|
| **Sprint planning** | Rédaction des issues GitHub en début de semaine, estimation en points |
| **Daily stand-up** | Remplacé par une note dans l'issue en cours (`WIP:`) |
| **Sprint review** | Vérification du déploiement en production + smoke test manuel |
| **Rétrospective** | Issue de type `chore` notant ce qui a bloqué et la solution pour le sprint suivant |
| **Definition of Done** | Tests passants en CI, déployé en prod, PR merged sur `develop` |

---

## 5. Justification solo vs équipe

Le contexte solo implique des arbitrages spécifiques :

- **Pas de code review externe** : compensé par des PR systématiques (self-review + CI obligatoire) et un branch model strict (`feature/** → develop → main`)
- **Pas de merge sans CI vert** : `api-ci.yml` bloque toute fusion si les tests échouent
- **Documentation écrite en cours de sprint** : chaque fonctionnalité livrée s'accompagne de sa doc dans `docs/` pour éviter la dette documentaire en fin de projet
- **Branche de feature systématique** : même pour les petits fixes, pour garder un historique lisible et des PR traçables

---

## 6. Métriques du projet

| Métrique | Valeur |
|---|---|
| Pull Requests mergées | 81 |
| Branches créées | ~30 (feature, fix, docs, feat, chore) |
| Workflows CI/CD | 3 (`api-ci.yml`, `model-training.yml`, `cd-model.yml`) |
| Tests d'intégration | 42 |
| Couverture visée | > 85 % sur `api/app/` |
| Commits sur `develop` | ~60+ |
