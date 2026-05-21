from pathlib import Path

import numpy as np
import torch
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Subset
from torchvision import transforms
from torchvision.datasets import ImageFolder

# ImageNet normalization stats
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

train_transforms = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

val_test_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


class TransformSubset(torch.utils.data.Dataset):
    """Wraps a Subset and applies a specific transform, overriding the parent dataset's."""

    def __init__(self, subset: Subset, transform):
        self.subset = subset
        self.transform = transform

    def __len__(self):
        return len(self.subset)

    def __getitem__(self, idx):
        img, label = self.subset.dataset.imgs[self.subset.indices[idx]]
        from PIL import Image
        img = Image.open(img).convert("RGB")
        return self.transform(img), label


def get_dataloaders(batch_size: int = 32):
    dataset_path = Path(__file__).parent / "data" / "dataset"

    # Load full dataset to extract file paths and labels
    full_dataset = ImageFolder(root=dataset_path)
    labels = [label for _, label in full_dataset.imgs]

    # First split: 70% train, 30% temp (val + test), stratified
    train_indices, temp_indices = train_test_split(
        np.arange(len(labels)),
        test_size=0.30,
        stratify=labels,
        random_state=42,
    )

    # Second split: split temp evenly into 15% val and 15% test
    temp_labels = [labels[i] for i in temp_indices]
    val_indices, test_indices = train_test_split(
        temp_indices,
        test_size=0.50,
        stratify=temp_labels,
        random_state=42,
    )

    # Build subsets with their respective transforms
    train_set = TransformSubset(Subset(full_dataset, train_indices), train_transforms)
    val_set = TransformSubset(Subset(full_dataset, val_indices), val_test_transforms)
    test_set = TransformSubset(Subset(full_dataset, test_indices), val_test_transforms)

    pin_memory = torch.cuda.is_available()
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=pin_memory)
    val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=pin_memory)
    test_loader = DataLoader(test_set, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=pin_memory)

    return train_loader, val_loader, test_loader


def _print_split_distribution(name: str, indices, labels, class_names):
    """Print per-class image counts for a given split."""
    counts = {cls: 0 for cls in class_names}
    for idx in indices:
        counts[class_names[labels[idx]]] += 1
    print(f"\n{name} ({sum(counts.values())} images):")
    for cls, count in counts.items():
        print(f"  {cls:<12} {count}")


if __name__ == "__main__":
    dataset_path = Path(__file__).parent / "data" / "dataset"
    full_dataset = ImageFolder(root=dataset_path)
    labels = [label for _, label in full_dataset.imgs]
    class_names = full_dataset.classes

    train_indices, temp_indices = train_test_split(
        np.arange(len(labels)), test_size=0.30, stratify=labels, random_state=42
    )
    temp_labels = [labels[i] for i in temp_indices]
    val_indices, test_indices = train_test_split(
        temp_indices, test_size=0.50, stratify=temp_labels, random_state=42
    )

    print(f"Dataset: {len(labels)} total images | Classes: {class_names}")
    _print_split_distribution("Train (70%)", train_indices, labels, class_names)
    _print_split_distribution("Val   (15%)", val_indices, labels, class_names)
    _print_split_distribution("Test  (15%)", test_indices, labels, class_names)

    train_loader, val_loader, test_loader = get_dataloaders()
    print(f"\nDataLoaders ready — batches: train={len(train_loader)}, val={len(val_loader)}, test={len(test_loader)}")

    # Verify a single batch shape
    imgs, lbls = next(iter(train_loader))
    print(f"Sample batch shape: {imgs.shape}, labels: {lbls.shape}")
