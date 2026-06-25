"""
Validates the dataset structure before training.

Checks:
  1. All 6 expected classes are present
  2. Each class has at least MIN_IMAGES_PER_CLASS images
  3. Configured train ratio is in [MIN_TRAIN_RATIO, MAX_TRAIN_RATIO]
  4. No corrupted images (PIL header + verify)
  5. No non-image files in class directories

Exit 0 if all checks pass, exit 1 on any failure.
"""

import sys
from pathlib import Path

from PIL import Image

EXPECTED_CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]
DATA_DIR = Path(__file__).parent / "data" / "dataset"
MIN_IMAGES_PER_CLASS = 50
TRAIN_RATIO = 0.70
MIN_TRAIN_RATIO = 0.60
MAX_TRAIN_RATIO = 0.90
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff", ".tif", ".webp"}


def _count_images(class_dir: Path) -> int:
    if not class_dir.exists():
        return 0
    return sum(
        1 for f in class_dir.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    )


def check_classes_present(data_dir: Path) -> list[str]:
    return [cls for cls in EXPECTED_CLASSES if not (data_dir / cls).is_dir()]


def check_min_images(data_dir: Path) -> dict[str, int]:
    failing = {}
    for cls in EXPECTED_CLASSES:
        count = _count_images(data_dir / cls)
        if count < MIN_IMAGES_PER_CLASS:
            failing[cls] = count
    return failing


def check_train_ratio() -> float:
    return TRAIN_RATIO


def check_corrupted_images(data_dir: Path) -> list[Path]:
    corrupted = []
    for cls in EXPECTED_CLASSES:
        class_dir = data_dir / cls
        if not class_dir.exists():
            continue
        for img_path in sorted(class_dir.iterdir()):
            if not img_path.is_file() or img_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            try:
                with Image.open(img_path) as img:
                    img.verify()
            except Exception:
                corrupted.append(img_path)
    return corrupted


def check_non_image_files(data_dir: Path) -> list[Path]:
    invalid = []
    for cls in EXPECTED_CLASSES:
        class_dir = data_dir / cls
        if not class_dir.exists():
            continue
        for f in class_dir.iterdir():
            if f.is_file() and not f.name.startswith(".") and f.suffix.lower() not in IMAGE_EXTENSIONS:
                invalid.append(f)
    return invalid


def main(data_dir: Path = DATA_DIR) -> None:
    errors: list[str] = []

    print(f"Validating dataset at: {data_dir}")
    print("=" * 60)

    if not data_dir.exists():
        print(f"[FAIL] Dataset directory not found: {data_dir}")
        print("       Run: uv run python download_dataset.py")
        sys.exit(1)

    # Check 1 — all 6 classes present
    missing = check_classes_present(data_dir)
    if missing:
        errors.append(f"Missing class directories: {missing}")
        print(f"[FAIL] Missing classes: {missing}")
    else:
        print("[OK]   All 6 classes present")

    if errors:
        print("\n[FAILED] Fix missing classes before continuing.")
        sys.exit(1)

    # Check 2 — minimum images per class
    failing_counts = check_min_images(data_dir)
    if failing_counts:
        for cls, count in failing_counts.items():
            errors.append(f"'{cls}': {count} images (minimum: {MIN_IMAGES_PER_CLASS})")
            print(f"[FAIL] {cls:<12} {count} images  (min {MIN_IMAGES_PER_CLASS} required)")
    else:
        print(f"[OK]   All classes have >= {MIN_IMAGES_PER_CLASS} images")

    # Check 3 — train ratio in range
    ratio = check_train_ratio()
    per_class_counts = {cls: _count_images(data_dir / cls) for cls in EXPECTED_CLASSES}
    if not (MIN_TRAIN_RATIO <= ratio <= MAX_TRAIN_RATIO):
        errors.append(f"Train ratio {ratio:.0%} outside [{MIN_TRAIN_RATIO:.0%}, {MAX_TRAIN_RATIO:.0%}]")
        print(f"[FAIL] Train ratio {ratio:.0%} outside [{MIN_TRAIN_RATIO:.0%}, {MAX_TRAIN_RATIO:.0%}]")
    else:
        min_count = min(per_class_counts.values())
        print(f"[OK]   Train ratio {ratio:.0%} — min per-class train images: ~{int(min_count * ratio)}")

    # Check 4 — no corrupted images
    total = sum(per_class_counts.values())
    print(f"\nScanning {total} images for corruption...")
    corrupted = check_corrupted_images(data_dir)
    if corrupted:
        for path in corrupted[:10]:
            errors.append(f"Corrupted: {path.name} ({path.parent.name}/)")
            print(f"[FAIL] Corrupted: {path.name}  (in {path.parent.name}/)")
        if len(corrupted) > 10:
            print(f"       ... and {len(corrupted) - 10} more")
    else:
        print("[OK]   No corrupted images")

    # Check 5 — no non-image files
    non_images = check_non_image_files(data_dir)
    if non_images:
        for path in non_images[:5]:
            print(f"[FAIL] Non-image file: {path.name}  (in {path.parent.name}/)")
        if len(non_images) > 5:
            print(f"       ... and {len(non_images) - 5} more")
        errors.append(f"{len(non_images)} non-image file(s) found in class directories")
    else:
        print("[OK]   No non-image files in class directories")

    # Summary
    print("\n" + "=" * 60)
    print("DATASET SUMMARY")
    for cls, count in per_class_counts.items():
        print(f"  {cls:<12} {count} images")
    print(
        f"  Total: {total}  |  Expected split:"
        f" ~{int(total * 0.70)} train /"
        f" ~{int(total * 0.15)} val /"
        f" ~{int(total * 0.15)} test"
    )

    if errors:
        print(f"\n[FAILED] {len(errors)} error(s) found — training aborted")
        for err in errors:
            print(f"  * {err}")
        sys.exit(1)

    print("\n[PASSED] Dataset is valid — training can proceed")
    sys.exit(0)


if __name__ == "__main__":
    main()
