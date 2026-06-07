from app import create_app
import os
from dotenv import load_dotenv

load_dotenv()

app = create_app(os.getenv('FLASK_CONFIG') or 'default')

if __name__ == "__main__":
    from waitress import serve
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Waitress on port {port}...")
    serve(app, host='0.0.0.0', port=port)
