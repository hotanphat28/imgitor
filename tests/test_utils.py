
from app.utils import (
    crop_image,
    process_image_core,
    resize_by_resolution,
    rotate_image,
)


def test_resize_by_resolution(sample_image):
    resized = resize_by_resolution(sample_image, 100, 100)
    assert resized.size == (100, 100)


def test_crop_image(sample_image):
    cropped = crop_image(sample_image, 10, 10, 50, 50)
    assert cropped.size == (50, 50)


def test_rotate_image(sample_image):
    rotated = rotate_image(sample_image, 90)
    assert rotated.size == (100, 100)


def test_process_image_core(sample_image):
    # Test valid modes
    params = {"resize_type": "pixels", "width": "200", "height": "150"}
    res = process_image_core(sample_image, "resolution", params)
    assert res.size == (200, 150)

    params = {"rotate_deg": "180"}
    res = process_image_core(sample_image, "rotate", params)
    assert res.size == (100, 100)
