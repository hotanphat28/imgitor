# imgdithr

A focused, browser-based image processing tool designed to turn your modern images into beautiful, tactile retro prints. Built with a raw Brutalist UI, HTML5 Canvas, and Flask.

## 🌟 Features

- **Tactile Kiosk Interface**: A bold, high-contrast Split-Screen UI featuring hard drop shadows and satisfying physical button press states.
- **Client-Side Live Preview**: See a live preview of your retro edits instantly. The rendering engine computes Halftone and Dithering effects directly on your browser's HTML5 Canvas, offering zero-latency adjustments.
- **Retro Effects Engine**:
    1. **Dithering**: Apply classic 1-bit dithering algorithms (Floyd-Steinberg, Bayer, Atkinson).
    2. **Halftone**: Generate customizable halftone dot patterns with dedicated controls for dot size, angle, and shape (Round, Square, Line).
- **Essential Tools**: Includes a visual Cropper and AI-powered Background Removal to prep your subjects before applying retro effects.
- **Stateless Backend**: The server is completely stateless. It acts only as a high-performance rendering API for your final "Download High Res" export.
- **RESTful API**: Exposes a `/api/v1/process` endpoint for developers to process images programmatically. (See [API Documentation](API.md)).

## 🛠️ Prerequisites

- **Python 3.12+**
- **Flask**
- **Pillow** (PIL Fork)
- **rembg** (Background Removal)

## 🚀 Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/hotanphat28/imgdithr.git
   cd imgdithr
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Copy `.env.example` to `.env` and configure your settings.

## ▶️ Usage (Development)

1. Run the Flask application using the development server:
   ```bash
   python run.py
   ```
2. Open your browser and go to `http://127.0.0.1:5000`.

## 🚀 Production Deployment

To run the application in a production environment, use the provided Waitress WSGI server:
```bash
python wsgi.py
```

### Docker

You can also run the application using Docker:
```bash
docker build -t imgdithr .
docker run -p 5000:5000 imgdithr
```

## 🧪 Testing

To run the automated test suite, which includes both Python unit tests and Playwright End-to-End (E2E) browser tests, use `uv`:
```bash
uv run pytest
```
*(Note: To run the E2E UI tests, you must run `uv run playwright install --with-deps chromium` to fetch browser binaries.)*

## 📝 License

This project is licensed under the [MIT License](LICENSE).
