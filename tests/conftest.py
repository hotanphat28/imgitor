import pytest
from app import create_app
from PIL import Image
import io
import threading
from werkzeug.serving import make_server

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

class ServerThread(threading.Thread):
    def __init__(self, app):
        super().__init__()
        self.server = make_server('127.0.0.1', 0, app)
        self.port = self.server.port
        self.ctx = app.app_context()
        self.ctx.push()

    def run(self):
        self.server.serve_forever()

    def shutdown(self):
        self.server.shutdown()
        self.ctx.pop()

@pytest.fixture(scope="session")
def live_server_url():
    """Starts a live Flask server in a background thread and yields its URL."""
    app = create_app('testing')
    server = ServerThread(app)
    server.start()
    yield f"http://127.0.0.1:{server.port}"
    server.shutdown()
    server.join()
