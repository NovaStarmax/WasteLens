import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
from torchvision import models
from torchvision.models import ResNet18_Weights

from dataset import get_dataloaders

BASE_DIR = Path(__file__).parent
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


def select_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def build_model(state_dict: dict) -> nn.Module:
    model = models.resnet18(weights=ResNet18_Weights.DEFAULT)

    for param in model.parameters():
        param.requires_grad = False

    for param in model.layer4.parameters():
        param.requires_grad = True

    model.fc = nn.Linear(512, 6)

    # Load fine-tuned weights — must happen after architecture is set
    model.load_state_dict(state_dict)

    return model


def run_inference(model: nn.Module, loader, device: torch.device) -> tuple[list, list]:
    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for imgs, labels in loader:
            imgs = imgs.to(device)
            outputs = model(imgs)
            preds = outputs.argmax(dim=1).cpu().tolist()
            all_preds.extend(preds)
            all_labels.extend(labels.tolist())

    return all_labels, all_preds


def save_confusion_matrix(labels: list, preds: list, class_names: list) -> Path:
    cm = confusion_matrix(labels, preds)
    # Normalize row-wise so each cell shows % of true class predicted as that column
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True) * 100

    fig, ax = plt.subplots(figsize=(8, 7))
    im = ax.imshow(cm_norm, interpolation="nearest", cmap="Blues", vmin=0, vmax=100)
    fig.colorbar(im, ax=ax, label="% of true class")

    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, rotation=45, ha="right")
    ax.set_yticklabels(class_names)
    ax.set_xlabel("Predicted label")
    ax.set_ylabel("True label")
    ax.set_title("Confusion Matrix (normalized, %)")

    # Annotate each cell with the percentage value
    thresh = cm_norm.max() / 2
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            ax.text(
                j, i, f"{cm_norm[i, j]:.1f}",
                ha="center", va="center",
                color="white" if cm_norm[i, j] > thresh else "black",
                fontsize=9,
            )

    fig.tight_layout()
    out_path = REPORTS_DIR / "confusion_matrix.png"
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return out_path


def evaluate():
    # Load checkpoint and recover metadata
    checkpoint = torch.load(CHECKPOINTS_DIR / "best_model.pt", map_location="cpu")
    class_names: list[str] = checkpoint["class_names"]
    best_val_accuracy: float = checkpoint["val_accuracy"]
    best_epoch: int = checkpoint["epoch"]

    device = select_device()
    print(f"Device  : {device}")
    print(f"Checkpoint — epoch {best_epoch}, val accuracy {best_val_accuracy:.2%}")

    model = build_model(checkpoint["model_state_dict"]).to(device)

    # Only the test split is needed for evaluation
    _, _, test_loader = get_dataloaders()

    labels, preds = run_inference(model, test_loader, device)

    # Global accuracy
    test_accuracy = sum(p == l for p, l in zip(preds, labels)) / len(labels)

    # Per-class metrics
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, preds, average=None, labels=list(range(len(class_names)))
    )

    per_class_metrics = {
        cls: {
            "precision": round(float(precision[i]), 4),
            "recall": round(float(recall[i]), 4),
            "f1": round(float(f1[i]), 4),
        }
        for i, cls in enumerate(class_names)
    }

    underperforming = [cls for cls, m in per_class_metrics.items() if m["f1"] < 0.80]

    # Terminal output
    print(f"\nTest accuracy : {test_accuracy:.2%}\n")
    print(classification_report(labels, preds, target_names=class_names, digits=4))

    if underperforming:
        print("Underperforming classes (F1 < 0.80):")
        for cls in underperforming:
            print(f"  {cls:<12}  F1 = {per_class_metrics[cls]['f1']:.4f}")
    else:
        print("All classes meet the F1 >= 0.80 threshold.")

    # Confusion matrix
    cm_path = save_confusion_matrix(labels, preds, class_names)
    print(f"\nConfusion matrix : {cm_path}")

    # JSON report
    report = {
        "test_accuracy": round(test_accuracy, 6),
        "best_val_accuracy": round(best_val_accuracy, 6),
        "epoch": best_epoch,
        "per_class_metrics": per_class_metrics,
        "underperforming_classes": underperforming,
    }
    report_path = REPORTS_DIR / "evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Evaluation report: {report_path}")


if __name__ == "__main__":
    evaluate()
