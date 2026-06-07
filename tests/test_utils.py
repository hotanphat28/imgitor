from app.utils import resize_by_resolution, apply_filter

def test_resize_by_resolution(sample_image):
    resized = resize_by_resolution(sample_image, 50, 50)
    assert resized.size == (50, 50)

def test_apply_filter_grayscale(sample_image):
    filtered = apply_filter(sample_image, 'grayscale')
    assert filtered.mode == 'L'

def test_apply_filter_sepia(sample_image):
    filtered = apply_filter(sample_image, 'sepia')
    # Should still be RGB, but modified pixels
    assert filtered.mode == 'RGB'
    assert filtered.size == (100, 100)
