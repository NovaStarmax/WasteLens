# Veille technique et réglementaire

## Organisation de la veille

- Fréquence : 1h minimum par semaine, le vendredi
- Format : notes markdown dans ce fichier, respectant le référentiel [AcceDe Web](https://www.accede-web.com/en/guidelines/editorial/use-a-consistent-hierarchy-of-headings/) et les recommandations de l'[Association Valentin Haüy](https://www.avh.asso.fr/nos-solutions/accessibilite/accessibilite-numerique) (titres hiérarchisés, listes, liens explicites)

---

## Outils d'agrégation

| Outil | Type | Fréquence | Justification |
|---|---|---|---|
| [Hugging Face Blog](https://huggingface.co/blog) | Newsletter hebdo | Hebdomadaire | Source officielle de la plateforme ML la plus active — auteur identifié, contenu peer-reviewed |
| [Hugging Face Papers (Daily Papers)](https://huggingface.co/papers) | Flux quotidien | Hebdomadaire | Sélection quotidienne de papers ML reliés à arXiv, code et discussion avec les auteurs |
| [Fast.ai Forum](https://forums.fast.ai/) | Newsletter | Bimensuelle | Communauté praticienne active, focus deep learning appliqué |
| [CNIL Newsletter](https://www.cnil.fr/fr/newsletter) | Newsletter réglementaire | Mensuelle | Source officielle française RGPD — autorité de contrôle désignée |
| [The Batch — DeepLearning.AI](https://www.deeplearning.ai/the-batch) | Newsletter | Hebdomadaire | Synthèse Andrew Ng, reconnu internationalement, contenu éditorialisé |

---

## Sources identifiées et critères de fiabilité

| Source | Auteur identifié | Contenu récent | Confirmé par tiers |
|---|---|---|---|
| [Hugging Face Blog](https://huggingface.co/blog) | ✅ Équipe Hugging Face (nommée) | ✅ Mises à jour hebdomadaires | ✅ Cité par arXiv, Google Research |
| [Hugging Face Papers (Daily Papers)](https://huggingface.co/papers) | ✅ Équipe Hugging Face + auteurs des papers (nommés) | ✅ Mise à jour quotidienne | ✅ Papers reliés à arXiv, discussion directe avec les auteurs |
| [Fast.ai Forum](https://forums.fast.ai/) | ✅ [Jeremy Howard](https://www.fast.ai/about.html) + communauté identifiée | ✅ Actif quotidiennement | ✅ Référencé par [Stanford CS231n](https://cs231n.stanford.edu/) |
| [CNIL Newsletter](https://www.cnil.fr/fr/newsletter) | ✅ Commission Nationale Informatique et Libertés | ✅ Actualité réglementaire courante | ✅ Autorité officielle, Journal Officiel UE |
| [The Batch — DeepLearning.AI](https://www.deeplearning.ai/the-batch) | ✅ Andrew Ng (biographie publique) | ✅ Publication hebdomadaire | ✅ Cité par MIT Technology Review, IEEE |

---

## Synthèses de veille

### Synthèse 1 — Transfer Learning et modèles légers (mars 2026)

**Sujet :** alternatives légères à ResNet pour la classification d'images
**Sources :** [Hugging Face Papers (Daily Papers)](https://huggingface.co/papers), [Hugging Face Blog](https://huggingface.co/blog), [documentation PyTorch — Transfer Learning Tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)

**Points clés :**
- EfficientNet-B0 offre un meilleur ratio accuracy/taille que ResNet18 sur ImageNet
- MobileNetV3 est adapté aux appareils sans GPU (inférence mobile)
- ResNet18 reste le choix pédagogique le plus documenté — communauté large, exemples abondants

**Impact projet :** confirme le choix ResNet18 pour WasteLens (documentation abondante, transfer learning maîtrisé, pas de contrainte de taille modèle en production)

---

### Synthèse 2 — Réglementation IA en Europe (avril 2026)

**Sujet :** AI Act européen et impacts sur les applications de classification
**Sources :** [CNIL Newsletter](https://www.cnil.fr/fr/newsletter), [Règlement (UE) 2024/1689 — AI Act (EUR-Lex)](https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=fr), [CNIL — L'intérêt légitime (art. 6.1.f RGPD)](https://cnil.fr/fr/les-bases-legales/interet-legitime)

**Points clés :**
- Les systèmes de classification d'images à faible risque ne sont pas soumis aux obligations strictes de l'AI Act (annexe III)
- Obligation de transparence : informer l'utilisateur qu'il interagit avec un système IA
- Les données d'entraînement doivent être documentées (origine, biais potentiels)

**Impact projet :** WasteLens affiche explicitement les résultats IA avec score de confiance, la page légale RGPD informe l'utilisateur du traitement IA — conformité assurée

---

### Synthèse 3 — MLOps et déploiement continu de modèles (mai 2026)

**Sujet :** bonnes pratiques de livraison continue pour modèles ML
**Sources :** [Fast.ai Forum](https://forums.fast.ai/), [Hugging Face Blog](https://huggingface.co/blog), Danilo Sato, Arif Wider & Christoph Windheuser — [*Continuous Delivery for Machine Learning*](https://martinfowler.com/articles/cd4ml.html) (article hébergé sur martinfowler.com)

**Points clés :**
- Le versionnement des artifacts (modèle + métriques d'évaluation) est essentiel pour la traçabilité
- La séparation déploiement application / déploiement modèle est recommandée pour éviter les régressions
- Le monitoring post-déploiement (data drift, confidence drift) est indispensable pour détecter les dégradations silencieuses

**Impact projet :** justifie l'architecture `cd-model.yml` séparée de `api-ci.yml` dans WasteLens, et le monitoring Prometheus/Grafana du score de confiance moyen
