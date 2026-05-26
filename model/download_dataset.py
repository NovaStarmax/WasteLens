from pathlib import Path
import zipfile

from kaggle.api.kaggle_api_extended import KaggleApiExtended

DATASET_SLUG = "asdasdasasdas/garbage-classification"
EXPECTED_CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]

DATA_DIR = Path(__file__).parent / "data" / "dataset"


def download_dataset() -> None:
    # Skip download if all class folders already contain images
    if DATA_DIR.exists():
        existing = [
            c for c in EXPECTED_CLASSES
            if (DATA_DIR / c).is_dir() and any((DATA_DIR / c).glob("*.jpg"))
        ]
        if len(existing) == len(EXPECTED_CLASSES):
            print("Dataset already present, skipping download.")
            _print_class_counts()
            return

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("Authenticating with Kaggle API...")
    api = KaggleApiExtended()
    api.authenticate()

    print(f"Downloading dataset: {DATASET_SLUG}")
    api.dataset_download_files(
        DATASET_SLUG,
        path=str(DATA_DIR),
        quiet=False,
        unzip=False,
    )

    # Extract any downloaded zip files
    for zip_path in DATA_DIR.glob("*.zip"):
        print(f"Extracting {zip_path.name}...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(DATA_DIR)
        zip_path.unlink()
        print(f"Removed {zip_path.name}")

    _verify_structure()
    _print_class_counts()


def _verify_structure() -> None:
    missing = [c for c in EXPECTED_CLASSES if not (DATA_DIR / c).is_dir()]
    if missing:
        raise RuntimeError(
            f"Missing class folders after extraction: {missing}\n"
            f"Expected structure: {DATA_DIR}/<class>/*.jpg"
        )
    print("All 6 class folders verified.")


def _print_class_counts() -> None:
    print("\nImages per class:")
    for cls in EXPECTED_CLASSES:
        count = len(list((DATA_DIR / cls).glob("*.jpg")))
        print(f"  {cls:<12} {count} images")


if __name__ == "__main__":
    download_dataset()
