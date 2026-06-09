// Point d'entrée du pack WasteLens — DA Bleu Civique.
// Permet d'importer tout depuis une seule ligne :
//   import { LoginScreen, PredictHomeScreen, ResultScreen, LegalScreen } from "./wastelens";

export { default as LoginScreen } from "./screens/LoginScreen";
export { default as PredictHomeScreen } from "./screens/PredictHomeScreen";
export { default as ResultScreen } from "./screens/ResultScreen";
export { default as LegalScreen, DEFAULT_LEGAL_SECTIONS } from "./screens/LegalScreen";
export { default as AdminScreen } from "./screens/AdminScreen";

export { default as WastePic } from "./WastePic";
export { Ic } from "./icons";

export { default as TopBar } from "./components/TopBar";
export { default as Field } from "./components/Field";
export { PrimaryButton, SecondaryButton } from "./components/Button";
export { default as ConfidenceBar } from "./components/ConfidenceBar";
export { default as HistoryRow } from "./components/HistoryRow";
export { default as OfflineBanner } from "./components/OfflineBanner";

export {
  WASTE_CLASSES,
  CLASS_LABEL,
  CLASS_BIN,
  DEFAULT_LOW_CONFIDENCE,
} from "./constants";
