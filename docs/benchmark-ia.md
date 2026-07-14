# Benchmark des services d'intelligence artificielle

## Expression du besoin

**Objectif :** classifier automatiquement des déchets en 6 catégories (cardboard, glass, metal, paper, plastic, trash) à partir d'une photo uploadée par l'utilisateur.

**Contraintes :**
- Données traitées en France (RGPD, pas de transfert hors UE)
- Pas de GPU disponible en production (VPS OVH standard)
- Budget limité (projet formation, pas de budget cloud récurrent)
- Temps de réponse < 10s acceptable pour le cas d'usage
- Modèle devant être auditable et explicable

---

## Services étudiés

| Service | Fournisseur | Modèle tarifaire | Localisation données | RGPD | Verdict |
|---|---|---|---|---|---|
| [Google Cloud Vision API](https://cloud.google.com/vision/pricing) | Google (USA) | 1,50 $/1 000 requêtes | Serveurs USA par défaut | ❌ Transfert hors UE ([FISA 702](https://www.cnil.fr/fr/presentation-de-larret-schrems-ii-de-la-cjue)) | ❌ Écarté |
| [AWS Rekognition](https://aws.amazon.com/rekognition/pricing/) | Amazon (USA) | 1 $/1 000 images (standard) ; Custom Labels facturé à l'heure d'endpoint actif (≈4 $/h), non au volume | Région configurable | ⚠️ Risque [CLOUD Act](https://www.justice.gov/criminal/cloud-act-resources) | ❌ Écarté |
| [Azure Computer Vision](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/computer-vision/) | Microsoft (USA) | 1 $/1 000 transactions | Région EU disponible | ⚠️ Acceptable mais vendor lock-in, soumis au CLOUD Act | ❌ Écarté |
| [OpenAI GPT-4V](https://openai.com/business/pricing/) | OpenAI (USA) | ~0,01 $/image (tarification réelle par tokens, dépendante de la résolution) | Serveurs USA | ❌ Transfert hors UE | ❌ Écarté |
| ResNet18 PyTorch (local) | Meta Research (open source) | 0 € (infra OVH existante) | VPS OVH Roubaix, France | ✅ Données en France | ✅ Retenu |

**Services non étudiés en détail :**
- [IBM Watson Visual Recognition](https://cloud.ibm.com/docs/visual-recognition?topic=visual-recognition-release-notes) — service retiré en 2021 (notes de version officielles IBM Cloud), écarté d'emblée.
- [Clarifai](https://www.clarifai.com/company/privacy-policy) — aucune garantie documentée de résidence des données en UE dans sa politique de confidentialité, hébergement principalement US, écarté d'emblée sans étude technique approfondie.

### Justification des services écartés

**Google Cloud Vision API** — Données envoyées vers des serveurs américains par défaut. Même avec la région EU activée, Google reste soumis au droit américain (FISA 702). Écarté pour non-conformité RGPD et coût récurrent.

*Prérequis techniques :*
- Compte Google Cloud avec facturation activée (carte bancaire obligatoire)
- SDK Python : `google-cloud-vision` — dépendance externe à intégrer et maintenir
- Authentification : fichier JSON de compte de service (`GOOGLE_APPLICATION_CREDENTIALS`) — rotation recommandée tous les 90 jours
- Rate limits : 1 800 requêtes/minute par défaut (quota augmentable sur demande)
- Latence réseau additionnelle : ~80 ms (requête transatlantique Europe → USA)
- Dépendance réseau totale : aucun mode offline possible

**AWS Rekognition** — Configuration région EU possible, mais soumission au CLOUD Act américain crée un risque juridique. Écarté pour risque réglementaire et dépendance fournisseur.

*Prérequis techniques :*
- Compte AWS avec facturation activée (carte bancaire obligatoire)
- SDK Python : `boto3` — dépendance externe à intégrer et maintenir
- Authentification : IAM credentials (Access Key ID + Secret Access Key) — rotation recommandée tous les 90 jours
- Rate limits : 50 transactions/seconde (3 000 req/min) — ThrottlingException au-delà
- Latence réseau additionnelle : ~30 ms depuis Europe (région eu-west-1 Dublin)
- Dépendance réseau totale : aucun mode offline possible

**Azure Computer Vision** — Techniquement conforme avec la région EU, mais coût récurrent incompatible avec le budget formation et création d'une dépendance fournisseur non justifiée pour un modèle de classification standard.

*Prérequis techniques :*
- Abonnement Azure avec facturation activée (carte bancaire obligatoire)
- SDK Python : `azure-cognitiveservices-vision-computervision` — dépendance externe à intégrer et maintenir
- Authentification : clé Cognitive Services (32 caractères) + endpoint URL — rotation manuelle depuis le portail Azure
- Rate limits : 10 transactions/seconde tier S1 (600 req/min) — HTTP 429 au-delà
- Latence réseau additionnelle : ~20 ms depuis Europe (région West Europe, Amsterdam)
- Dépendance réseau totale : aucun mode offline possible

**OpenAI GPT-4V** — Modèle multimodal surdimensionné pour une tâche de classification à 6 classes. Latence élevée, coût par requête, données traitées aux USA. Écarté pour RGPD, coût et sur-ingénierie.

*Prérequis techniques :*
- Compte OpenAI avec facturation activée (carte bancaire obligatoire)
- SDK Python : `openai` — dépendance externe à intégrer et maintenir
- Authentification : clé API Bearer token — rotation recommandée régulièrement
- Rate limits : tier-dépendant — Tier 1 : 500 req/min, Tier 5 : 10 000 req/min
- Latence requête : 5–15 secondes par inférence (temps de génération, indépendant du réseau)
- Dépendance réseau totale : aucun mode offline possible

---

## Adéquation fonctionnelle du service retenu

ResNet18 avec transfer learning sur le dataset Garbage Classification (Kaggle, 2 527 images, 6 classes), dérivé du dataset [TrashNet](https://github.com/garythung/trashnet) créé par Gary Thung et Mindy Yang (Stanford CS229, 2016) :

| Critère | Valeur | Adéquation |
|---|---|---|
| Accuracy sur jeu de test | ~90 % | ✅ Suffisant pour le cas d'usage |
| Latence inférence CPU | 2–8 s | ✅ < 10 s requis |
| Taille du modèle | 43 MB | ✅ Compatible VPS standard |
| Nombre de classes | 6 | ✅ Correspond exactement au besoin |
| Licence | BSD (PyTorch) | ✅ Usage commercial et formation autorisé |
| Auditabilité | Complète (poids accessibles) | ✅ Explicable et reproductible |

---

## Démarche éco-responsable

- **Modèle CPU-only :** pas de GPU → consommation énergétique réduite par rapport aux solutions cloud avec GPU
- **Transfer learning :** réutilisation des poids pré-entraînés sur ImageNet — moins de calcul d'entraînement qu'un modèle from scratch
- **Image Docker slim :** multi-stage build, suppression des dépendances CUDA (~14 GB économisés — commit `eb7d0bc`)
- **Hébergement OVH :** datacenter de Roubaix certifié ISO 50001 (management de l'énergie), 100 % d'énergie renouvelable (REF) et PUE de 1,30 sur l'exercice FY2025, audités par un tiers indépendant (APAVE) selon la norme ISO/IEC 30134 — [rapport KPI officiel OVHcloud](https://www.ovhcloud.com/sites/default/files/external_files/kpis_fy25.pdf)
- **Pas de stockage des images :** traitement en mémoire uniquement — pas de données résiduelles ni de coût de stockage

---

## Conclusions

ResNet18 en hébergement local est le seul service répondant à l'ensemble des contraintes du projet :

- ✅ RGPD natif — données traitées en France, pas de transfert hors UE
- ✅ Coût nul — open source + infrastructure VPS existante
- ✅ Pas de dépendance GPU — compatible VPS standard
- ✅ Accuracy suffisante — ~90 % sur 6 classes
- ✅ Auditabilité complète — poids et code accessibles, résultats reproductibles
- ✅ Éco-responsable — CPU-only, transfer learning, hébergement OVH ISO 50001, 100 % énergie renouvelable (PUE 1,30 audité, FY2025)

Les services cloud (Google, AWS, Azure, OpenAI) ont été écartés principalement pour des raisons RGPD (transfert hors UE ou risque CLOUD Act) et de coût récurrent incompatible avec le contexte du projet.
