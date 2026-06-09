# Veille technique et réglementaire

## Organisation de la veille

- Fréquence : 1h minimum par semaine, le vendredi
- Format : notes markdown dans ce fichier, communiquées en format accessible (titres, listes, liens)

---

## Outils d'agrégation

| Outil | Type | Fréquence | Justification |
|---|---|---|---|
| Hugging Face Blog | Newsletter hebdo | Hebdomadaire | Source officielle de la plateforme ML la plus active — auteur identifié, contenu peer-reviewed |
| Papers With Code | Flux RSS | Hebdomadaire | Agrège les papers ML avec reproductibilité — peer-reviewed, code associé |
| Fast.ai Forum | Newsletter | Bimensuelle | Communauté praticienne active, focus deep learning appliqué |
| CNIL Newsletter | Newsletter réglementaire | Mensuelle | Source officielle française RGPD — autorité de contrôle désignée |
| The Batch — DeepLearning.AI | Newsletter | Hebdomadaire | Synthèse Andrew Ng, reconnu internationalement, contenu éditorialisé |

---

## Sources identifiées et critères de fiabilité

| Source | Auteur identifié | Contenu récent | Confirmé par tiers |
|---|---|---|---|
| Hugging Face Blog | ✅ Équipe Hugging Face (nommée) | ✅ Mises à jour hebdomadaires | ✅ Cité par arXiv, Google Research |
| Papers With Code | ✅ Équipe Papers With Code / Meta Research | ✅ Indexation en temps réel | ✅ Papers peer-reviewed (arXiv, NeurIPS, ICML) |
| Fast.ai Forum | ✅ Jeremy Howard + communauté identifiée | ✅ Actif quotidiennement | ✅ Référencé par Stanford CS231n |
| CNIL Newsletter | ✅ Commission Nationale Informatique et Libertés | ✅ Actualité réglementaire courante | ✅ Autorité officielle, Journal Officiel UE |
| The Batch — DeepLearning.AI | ✅ Andrew Ng (biographie publique) | ✅ Publication hebdomadaire | ✅ Cité par MIT Technology Review, IEEE |

---

## Synthèses de veille

### Synthèse 1 — Transfer Learning et modèles légers (mars 2026)

**Sujet :** alternatives légères à ResNet pour la classification d'images
**Sources :** Papers With Code, Hugging Face Blog

**Points clés :**
- EfficientNet-B0 offre un meilleur ratio accuracy/taille que ResNet18 sur ImageNet
- MobileNetV3 est adapté aux appareils sans GPU (inférence mobile)
- ResNet18 reste le choix pédagogique le plus documenté — communauté large, exemples abondants

**Impact projet :** confirme le choix ResNet18 pour WasteLens (documentation abondante, transfer learning maîtrisé, pas de contrainte de taille modèle en production)

---

### Synthèse 2 — Réglementation IA en Europe (avril 2026)

**Sujet :** AI Act européen et impacts sur les applications de classification
**Sources :** CNIL Newsletter, Journal Officiel UE

**Points clés :**
- Les systèmes de classification d'images à faible risque ne sont pas soumis aux obligations strictes de l'AI Act (annexe III)
- Obligation de transparence : informer l'utilisateur qu'il interagit avec un système IA
- Les données d'entraînement doivent être documentées (origine, biais potentiels)

**Impact projet :** WasteLens affiche explicitement les résultats IA avec score de confiance, la page légale RGPD informe l'utilisateur du traitement IA — conformité assurée

---

### Synthèse 3 — MLOps et déploiement continu de modèles (mai 2026)

**Sujet :** bonnes pratiques de livraison continue pour modèles ML
**Sources :** Fast.ai Forum, Hugging Face Blog

**Points clés :**
- Le versionnement des artifacts (modèle + métriques d'évaluation) est essentiel pour la traçabilité
- La séparation déploiement application / déploiement modèle est recommandée pour éviter les régressions
- Le monitoring post-déploiement (data drift, confidence drift) est indispensable pour détecter les dégradations silencieuses

**Impact projet :** justifie l'architecture `cd-model.yml` séparée de `api-ci.yml` dans WasteLens, et le monitoring Prometheus/Grafana du score de confiance moyen
