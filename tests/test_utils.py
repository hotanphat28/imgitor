from app.utils import (
    apply_dithering,
    apply_filter,
    apply_halftone,
    resize_by_resolution,
)


def test_resize_by_resolution(sample_image):
    resized = resize_by_resolution(sample_image, 50, 50)
    assert resized.size == (50, 50)


def test_apply_filter_grayscale(sample_image):
    filtered = apply_filter(sample_image, "grayscale")
    assert filtered.mode == "L"


def test_apply_filter_sepia(sample_image):
    filtered = apply_filter(sample_image, "sepia")
    # Should still be RGB, but modified pixels
    assert filtered.mode == "RGB"
    assert filtered.size == (100, 100)

def test_apply_dithering(sample_image):
    dithered = apply_dithering(sample_image, "floyd_steinberg")
    # Should be RGB with modified pixels
    assert dithered.mode == "RGB"
    assert dithered.size == (100, 100)
    
    dithered_bayer = apply_dithering(sample_image, "bayer4x4")
    assert dithered_bayer.mode == "RGB"
    assert dithered_bayer.size == (100, 100)


def test_apply_halftone(sample_image):
    halftoned = apply_halftone(sample_image, sample=10, angle=45, shape="square")
    assert halftoned.mode == "RGB"
    assert halftoned.size == (100, 100)
