import shutil
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent))

from validate_dataset import (
    EXPECTED_CLASSES,
    MIN_IMAGES_PER_CLASS,
    TRAIN_RATIO,
    check_classes_present,
    check_corrupted_images,
    check_min_images,
    check_non_image_files,
    check_train_ratio,
)


def _make_dataset(tmp_path: Path, images_per_class: int = 60) -> Path:
    dataset = tmp_path / "dataset"
    for cls in EXPECTED_CLASSES:
        cls_dir = dataset / cls
        cls_dir.mkdir(parents=True)
        for i in range(images_per_class):
            img = Image.new("RGB", (10, 10), color=(i % 256, 0, 0))
            img.save(cls_dir / f"{cls}_{i:04d}.jpg")
    return dataset


# --- Check 1 — classes present ---

def test_classes_present_all_ok(tmp_path):
    data_dir = _make_dataset(tmp_path)
    assert check_classes_present(data_dir) == []


def test_classes_present_missing_one(tmp_path):
    data_dir = _make_dataset(tmp_path)
    shutil.rmtree(data_dir / "trash")
    assert "trash" in check_classes_present(data_dir)


def test_classes_present_multiple_missing(tmp_path):
    data_dir = _make_dataset(tmp_path)
    shutil.rmtree(data_dir / "trash")
    shutil.rmtree(data_dir / "glass")
    missing = check_classes_present(data_dir)
    assert "trash" in missing and "glass" in missing


# --- Check 2 — minimum images per class ---

def test_min_images_all_ok(tmp_path):
    data_dir = _make_dataset(tmp_path, images_per_class=MIN_IMAGES_PER_CLASS)
    assert check_min_images(data_dir) == {}


def test_min_images_one_class_insufficient(tmp_path):
    data_dir = _make_dataset(tmp_path, images_per_class=MIN_IMAGES_PER_CLASS)
    for f in list((data_dir / "plastic").iterdir())[:5]:
        f.unlink()
    failing = check_min_images(data_dir)
    assert "plastic" in failing
    assert failing["plastic"] == MIN_IMAGES_PER_CLASS - 5


def test_min_images_all_classes_insufficient(tmp_path):
    data_dir = _make_dataset(tmp_path, images_per_class=MIN_IMAGES_PER_CLASS - 1)
    failing = check_min_images(data_dir)
    assert len(failing) == len(EXPECTED_CLASSES)


# --- Check 3 — train ratio ---

def test_train_ratio_in_range():
    ratio = check_train_ratio()
    assert 0.60 <= ratio <= 0.90


def test_train_ratio_is_expected_value():
    assert check_train_ratio() == TRAIN_RATIO


# --- Check 4 — corrupted images ---

def test_no_corrupted_images(tmp_path):
    data_dir = _make_dataset(tmp_path)
    assert check_corrupted_images(data_dir) == []


def test_corrupted_image_detected(tmp_path):
    data_dir = _make_dataset(tmp_path)
    bad = data_dir / "cardboard" / "bad.jpg"
    bad.write_bytes(b"this is not a valid jpeg")
    corrupted = check_corrupted_images(data_dir)
    assert bad in corrupted


def test_corrupted_image_does_not_affect_valid_images(tmp_path):
    data_dir = _make_dataset(tmp_path, images_per_class=5)
    bad = data_dir / "metal" / "bad.jpg"
    bad.write_bytes(b"garbage")
    corrupted = check_corrupted_images(data_dir)
    assert len(corrupted) == 1
    assert corrupted[0] == bad


# --- Check 5 — non-image files ---

def test_no_non_image_files(tmp_path):
    data_dir = _make_dataset(tmp_path)
    assert check_non_image_files(data_dir) == []


def test_non_image_file_detected(tmp_path):
    data_dir = _make_dataset(tmp_path)
    txt = data_dir / "glass" / "notes.txt"
    txt.write_text("oops")
    invalid = check_non_image_files(data_dir)
    assert txt in invalid


def test_hidden_files_ignored(tmp_path):
    data_dir = _make_dataset(tmp_path)
    ds_store = data_dir / "paper" / ".DS_Store"
    ds_store.write_bytes(b"")
    assert check_non_image_files(data_dir) == []
