from flask import Flask
import logging
from config import config
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache

limiter = Limiter(key_func=get_remote_address, default_limits=["10000 per day", "5000 per hour"], storage_uri="memory://")
cache = Cache()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    app.config['CACHE_TYPE'] = 'FileSystemCache'
    app.config['CACHE_DIR'] = 'app_cache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300

    limiter.init_app(app)
    cache.init_app(app)

    # Configure logging
    if not app.debug and not app.testing:
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Imgitor startup')

    from app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from app.api import api_bp
    app.register_blueprint(api_bp)

    return app
