from pathlib import Path
import shutil
import zipfile

DATASET_SLUG = "asdasdasasdas/garbage-classification"
EXPECTED_CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]

DATA_DIR = Path(__file__).parent / "data" / "dataset"


def download_dataset() -> None:
    if _dataset_exists():
        print("Dataset already present, skipping download.")
        _print_class_counts()
        return

    from kaggle.api.kaggle_api_extended import KaggleApi

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("Authenticating with Kaggle API...")
    api = KaggleApi()
    api.authenticate()

    print(f"Downloading dataset: {DATASET_SLUG}")
    api.dataset_download_files(
        DATASET_SLUG,
        path=str(DATA_DIR),
        quiet=False,
        unzip=False,
    )

    for zip_path in DATA_DIR.glob("*.zip"):
        print(f"Extracting {zip_path.name}...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(DATA_DIR)
        zip_path.unlink()
        print(f"Removed {zip_path.name}")

    _normalize_structure(DATA_DIR)
    _verify_structure()
    _print_class_counts()


def _find_dataset_root(base_dir: Path) -> Path | None:
    for candidate in sorted(base_dir.rglob("*")):
        if not candidate.is_dir():
            continue
        found = [c for c in EXPECTED_CLASSES if (candidate / c).is_dir()]
        if len(found) == len(EXPECTED_CLASSES):
            return candidate
    return None


def _normalize_structure(base_dir: Path) -> None:
    direct = [c for c in EXPECTED_CLASSES if (base_dir / c).is_dir()]
    if len(direct) < len(EXPECTED_CLASSES):
        nested_root = _find_dataset_root(base_dir)
        if nested_root is None:
            raise RuntimeError(f"Could not locate all class folders under {base_dir}")
        print(f"Intermediate folder detected: '{nested_root.relative_to(base_dir)}'")
        for cls in EXPECTED_CLASSES:
            dst = base_dir / cls
            if dst.exists():
                raise RuntimeError(f"Cannot flatten: '{dst}' already exists")
            shutil.move(str(nested_root / cls), str(dst))
        shutil.rmtree(nested_root)
        print("Flattened successfully.")

    for path in list(base_dir.iterdir()):
        if path.is_dir() and path.name not in EXPECTED_CLASSES:
            shutil.rmtree(path)
            print(f"Removed non-class directory: {path.name}")


def _dataset_exists() -> bool:
    if not DATA_DIR.exists():
        return False

    existing = [
        c
        for c in EXPECTED_CLASSES
        if (DATA_DIR / c).is_dir() and any((DATA_DIR / c).glob("*.jpg"))
    ]

    return len(existing) == len(EXPECTED_CLASSES)


def _verify_structure() -> None:
    missing = [c for c in EXPECTED_CLASSES if not (DATA_DIR / c).is_dir()]
    if missing:
        raise RuntimeError(
            f"Missing class folders after extraction: {missing}\n"
            f"Expected structure: {DATA_DIR}/<class>/*.jpg"
        )
    extra = [p.name for p in DATA_DIR.iterdir() if p.is_dir() and p.name not in EXPECTED_CLASSES]
    if extra:
        raise RuntimeError(f"Unexpected directories at dataset root: {extra}")
    print("All 6 class folders verified, no extra directories.")


def _print_class_counts() -> None:
    print("\nImages per class:")
    for cls in EXPECTED_CLASSES:
        count = len(list((DATA_DIR / cls).glob("*.jpg")))
        print(f"  {cls:<12} {count} images")


if __name__ == "__main__":
    download_dataset()
