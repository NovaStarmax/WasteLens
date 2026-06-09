// Classes de déchets reconnues par le modèle ResNet18.
export const WASTE_CLASSES = [
  "cardboard",
  "glass",
  "metal",
  "paper",
  "plastic",
  "trash",
];

// Libellés français des classes.
export const CLASS_LABEL = {
  cardboard: "Carton",
  glass: "Verre",
  metal: "Métal",
  paper: "Papier",
  plastic: "Plastique",
  trash: "Ordures",
};

// Recommandation de tri par classe.
export const CLASS_BIN = {
  cardboard: {
    bin: "Bac jaune · emballages",
    tip: "Plier la boîte avant de la jeter. Pas de carton souillé.",
  },
  glass: {
    bin: "Conteneur à verre",
    tip: "Sans bouchon ni couvercle. Pas de vaisselle.",
  },
  metal: {
    bin: "Bac jaune · emballages",
    tip: "Vider et écraser les canettes. Aérosols autorisés.",
  },
  paper: {
    bin: "Bac jaune · papier",
    tip: "Pas de papier gras ou souillé. Retirer le plastique.",
  },
  plastic: {
    bin: "Bac jaune · emballages",
    tip: "Bouteilles et flacons surtout. Retirer le bouchon.",
  },
  trash: {
    bin: "Ordures ménagères",
    tip: "Non recyclable. Sac fermé, bac gris.",
  },
};

// Seuil par défaut sous lequel un score est considéré "faible".
export const DEFAULT_LOW_CONFIDENCE = 70;
