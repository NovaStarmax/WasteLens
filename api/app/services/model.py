import logging
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import ResNet18_Weights, resnet18

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent.parent.parent / "model" / "checkpoints" / "best_model.pt"

BIN_MAP = {
    "cardboard": "yellow bin",
    "glass":     "green bin",
    "metal":     "yellow bin",
    "paper":     "yellow bin",
    "plastic":   "yellow bin",
    "trash":     "gray bin",
}

_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def _select_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def _build_model(num_classes: int) -> nn.Module:
    model = resnet18(weights=ResNet18_Weights.DEFAULT)

    for param in model.parameters():
        param.requires_grad = False

    for param in model.layer4.parameters():
        param.requires_grad = True

    model.fc = nn.Linear(512, num_classes)

    return model


class ModelService:
    """Singleton : chargé une seule fois au démarrage de l'application."""

    _instance: "ModelService | None" = None

    def __init__(self) -> None:
        self._model: nn.Module | None = None
        self._class_names: list[str] = []
        self._device = _select_device()

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load(self) -> None:
        if self._model is not None:
            return

        logger.info("Loading model from %s on device=%s", MODEL_PATH, self._device)

        checkpoint = torch.load(MODEL_PATH, map_location=self._device)
        self._class_names = checkpoint["class_names"]

        self._model = _build_model(num_classes=len(self._class_names))
        self._model.load_state_dict(checkpoint["model_state_dict"])
        self._model.to(self._device)
        self._model.eval()

        logger.info(
            "Model ready — epoch=%s, val_accuracy=%.4f, classes=%s",
            checkpoint.get("epoch"),
            checkpoint.get("val_accuracy"),
            self._class_names,
        )

    def predict(self, image: Image.Image) -> dict:
        if self._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        tensor = _TRANSFORMS(image).unsqueeze(0).to(self._device)

        with torch.no_grad():
            logits = self._model(tensor)
            probs = torch.softmax(logits, dim=1)
            confidence, idx = probs.max(dim=1)

        predicted_class = self._class_names[idx.item()]

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence.item(), 4),
            "bin_recommendation": BIN_MAP.get(predicted_class, "unknown bin"),
        }
