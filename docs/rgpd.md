# Registre des traitements RGPD — WasteLens

**Responsable du traitement :** Antoine Gobbe — agobbe@marseille-tourisme.com
**Dernière mise à jour :** juin 2026

---

## 1. Tableau des traitements

| Traitement | Finalité | Données concernées | Base légale | Durée de conservation |
|---|---|---|---|---|
| Authentification | Vérifier l'identité de l'utilisateur et délivrer un JWT | `username`, `password_hash` | Consentement (connexion volontaire) | Jusqu'à suppression du compte par l'admin |
| Historique des prédictions | Traçabilité des classifications IA par utilisateur | `user_id`, `predicted_class`, `confidence`, `timestamp` | Consentement (utilisation volontaire de l'application) | Jusqu'à suppression du compte par l'admin |
| Logs applicatifs | Débogage et monitoring (FastAPI + Grafana) | Adresse IP, endpoint appelé, code HTTP, latence | Intérêt légitime (sécurité et maintenance) | 15 jours (rétention Prometheus) |
| Token JWT | Maintien de session côté navigateur | JWT signé (contient `user_id` et `role`) | Consentement | Durée de validité du token (`JWT_EXPIRE_HOURS`, défaut 24h) |

**Données non collectées :**
- Aucune image n'est stockée — traitement en mémoire uniquement, aucune persistance
- Aucun cookie de tracking ou publicitaire
- Aucune donnée transmise à des tiers hors UE

---

## 2. Procédure de suppression manuelle

La suppression d'un utilisateur et de ses données est réalisée par l'administrateur via l'interface d'administration de WasteLens.

### Étapes

1. Se connecter à l'application avec un compte `role=admin`
2. Accéder au tableau de bord administrateur → section **Utilisateurs**
3. Identifier l'utilisateur concerné dans la liste
4. Cliquer sur **Supprimer** et confirmer

### Effet technique

L'appel `DELETE /users/{user_id}` déclenche en base :
- Suppression de toutes les entrées `predictions` liées à `user_id` (cascade `ON DELETE CASCADE`)
- Suppression de l'entrée `users` correspondante

La suppression est **immédiate et irréversible** — aucune corbeille, aucune soft-delete.

### Délai de traitement

Conformément au RGPD (article 12), toute demande de suppression reçue à l'adresse agobbe@marseille-tourisme.com est traitée **sous 30 jours**.

---

## 3. Mesures de sécurité techniques

| Mesure | Détail |
|---|---|
| **Hachage des mots de passe** | bcrypt avec `rounds=12` — irréversible, résistant aux attaques par dictionnaire |
| **Authentification JWT** | Tokens signés avec `HS256`, expiration configurable (`JWT_EXPIRE_HOURS`), vérification à chaque requête |
| **Transport chiffré** | HTTPS obligatoire en production via Cloudflare + Traefik (TLS automatique) |
| **Stockage côté client** | JWT dans `localStorage` uniquement — aucun cookie, pas de session serveur |
| **Validation des entrées** | Magic bytes vérifiés sur chaque image uploadée (JPEG/PNG), taille limitée à 10 MB |
| **Rate limiting** | 5 tentatives de connexion par minute par IP (`slowapi`) — protection brute-force |
| **En-têtes de sécurité HTTP** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy` |
| **Hébergement** | OVHcloud, 2 rue Kellermann, 59100 Roubaix — serveurs localisés dans l'Union Européenne |
| **Isolation réseau** | Services Docker exposés uniquement via nginx (pas d'exposition directe de l'API) |
| **Secrets** | Variables sensibles jamais versionnées — injectées via Coolify en production et `.env` en local |
