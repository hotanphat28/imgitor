import pytest
from app import create_app
from PIL import Image
import io

@pytest.fixture
def app():
    app = create_app('testing')
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def sample_image():
    # Create a 100x100 solid color image for testing
    img = Image.new('RGB', (100, 100), color = 'red')
    return img

@pytest.fixture
def sample_image_file():
    img = Image.new('RGB', (100, 100), color = 'red')
    img_io = io.BytesIO()
    img.save(img_io, 'JPEG')
    img_io.seek(0)
    return img_io
