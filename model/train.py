import json
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models
from torchvision.datasets import ImageFolder
from torchvision.models import ResNet18_Weights

from dataset import get_dataloaders

BASE_DIR = Path(__file__).parent
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
REPORTS_DIR = BASE_DIR / "reports"
CHECKPOINTS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

NUM_CLASSES = 6
NUM_EPOCHS = 15
LEARNING_RATE = 0.001
EARLY_STOPPING_PATIENCE = 3


def select_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def build_model() -> nn.Module:
    # Load ImageNet-pretrained ResNet18
    model = models.resnet18(weights=ResNet18_Weights.DEFAULT)

    # Freeze all layers first
    for param in model.parameters():
        param.requires_grad = False

    # Unfreeze layer4 to let the model adapt high-level features to waste visuals
    for param in model.layer4.parameters():
        param.requires_grad = True

    # Replace the classifier head for 6 waste categories
    model.fc = nn.Linear(512, NUM_CLASSES)

    return model


def run_epoch(
    model: nn.Module,
    loader,
    criterion: nn.Module,
    device: torch.device,
    training: bool,
    optimizer=None,
) -> tuple[float, float]:
    model.train() if training else model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.set_grad_enabled(training):
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)

            if training:
                optimizer.zero_grad()

            outputs = model(imgs)
            loss = criterion(outputs, labels)

            if training:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * imgs.size(0)
            correct += (outputs.argmax(dim=1) == labels).sum().item()
            total += imgs.size(0)

    return total_loss / total, correct / total


def train():
    device = select_device()
    print(f"Device: {device}")

    train_loader, val_loader, _ = get_dataloaders()

    # Class names from the dataset directory (alphabetical order, matches ImageFolder)
    class_names = ImageFolder(root=BASE_DIR / "data" / "dataset").classes

    model = build_model().to(device)
    criterion = nn.CrossEntropyLoss()
    # Lower lr on layer4 to avoid overwriting pretrained features, higher on fresh FC head
    optimizer = torch.optim.Adam([
        {"params": model.layer4.parameters(), "lr": 0.0001},
        {"params": model.fc.parameters(), "lr": LEARNING_RATE},
    ])

    history: dict[str, list] = {
        "train_loss": [],
        "train_accuracy": [],
        "val_loss": [],
        "val_accuracy": [],
    }

    best_val_loss = float("inf")
    best_val_accuracy = 0.0
    epochs_without_improvement = 0

    print(f"\n{'Epoch':>5} | {'Train Loss':>10} | {'Train Acc':>9} | {'Val Loss':>9} | {'Val Acc':>8}")
    print("-" * 58)

    for epoch in range(1, NUM_EPOCHS + 1):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, device, training=True, optimizer=optimizer)
        val_loss, val_acc = run_epoch(model, val_loader, criterion, device, training=False)

        history["train_loss"].append(round(train_loss, 6))
        history["train_accuracy"].append(round(train_acc, 6))
        history["val_loss"].append(round(val_loss, 6))
        history["val_accuracy"].append(round(val_acc, 6))

        print(f"{epoch:>5} | {train_loss:>10.4f} | {train_acc:>8.2%} | {val_loss:>9.4f} | {val_acc:>7.2%}")

        # Save checkpoint whenever val_loss improves
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_val_accuracy = val_acc
            epochs_without_improvement = 0
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "val_accuracy": val_acc,
                    "class_names": class_names,
                },
                CHECKPOINTS_DIR / "best_model.pt",
            )
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= EARLY_STOPPING_PATIENCE:
                print(f"\nEarly stopping after epoch {epoch} — no val_loss improvement for {EARLY_STOPPING_PATIENCE} epochs.")
                break

    print(f"\nBest val accuracy : {best_val_accuracy:.2%}")

    # Persist full training history
    history_path = REPORTS_DIR / "training_history.json"
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)
    print(f"Training history  : {history_path}")


if __name__ == "__main__":
    train()
