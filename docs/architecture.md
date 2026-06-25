# Architecture WasteLens

## Vue d'ensemble

Diagramme Mermaid du flux de données complet :

```mermaid
graph TD
    A[Navigateur] -->|HTTPS| B[Cloudflare]
    B -->|Proxy| C[Traefik / VPS]
    C -->|HTTP| D[nginx]
    D -->|/api/*| E[FastAPI]
    D -->|/*| F[React App]
    E -->|Inférence| G[ResNet18]
    E -->|Persistance| H[PostgreSQL]
    E -->|Métriques| I[Prometheus]
    I -->|Visualisation| J[Grafana]
    J -->|Alertes| K[Telegram]
```

## Flux d'une prédiction
1. Utilisateur upload une image
2. nginx proxifie vers FastAPI
3. FastAPI valide (magic bytes, taille, JWT)
4. ResNet18 classifie l'image
5. Résultat sauvegardé en PostgreSQL
6. Métrique incrémentée dans Prometheus
7. Réponse retournée au frontend

## Flux MLOps
```mermaid
graph LR
    A[Push GitHub] -->|model/** changé| B[model-training.yml]
    B -->|Succès| C[cd-model.yml]
    C -->|SCP| D[VPS /tmp/]
    D -->|sudo script| E[Volume Coolify]
    E -->|docker restart| F[API rechargée]
```

## Stack technique
| Composant | Technologie | Version |
|---|---|---|
| API | FastAPI + Python | 3.13 |
| Frontend | React + Vite | 18 |
| Modèle | ResNet18 PyTorch | CPU-only |
| DB | PostgreSQL | 18 |
| Monitoring | Prometheus + Grafana | 10.4.0 |
| Déploiement | Docker + Coolify | - |
| Proxy | nginx + Traefik | - |

---

## Conclusion POC — Passage en production

La préprod (`https://preprod.wastelens.starspath-place.fr`) a servi de POC fonctionnel déployé sur la même infrastructure que la production (VPS OVH, Coolify, Docker Compose).

**Validations effectuées en préprod avant passage en production :**

| Validation | Résultat |
|---|---|
| Authentification JWT fonctionnelle | ✅ Validé |
| Endpoint `/predict` opérationnel (ResNet18 chargé) | ✅ Validé |
| Monitoring Prometheus + Grafana opérationnel | ✅ Validé |
| Pipeline CI/CD fonctionnel end-to-end | ✅ Validé |
| Accessibilité WCAG vérifiée | ✅ Validé |

**Décision de passage en production :** validée après ces vérifications. La préprod reste accessible comme environnement de staging — tout push sur `develop` y est automatiquement déployé par Coolify avant toute promotion en production stable.
