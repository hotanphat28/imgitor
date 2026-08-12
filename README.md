# Image Processing Web Tool (Imgitor)

A browser-based image processing tool created with Flask. It allows you to:
- Resize, crop, and rotate images.
- Convert images to different formats (JPEG, PNG, WEBP, GIF).
- Apply color filters (Grayscale, Sepia, etc.).
- Remove backgrounds from images using AI.

## 🌟 Features

- **Brutalist Web Interface**: A bold, high-contrast Brutalist UI with a Dark/Light Mode toggle, accessible focus states, and fully responsive interactions for mobile devices.
- **Seamless Auto-Commit Workflow**: Edit properties and seamlessly transition between tools without ever hitting 'Apply'. The system intelligently commits your changes to an undo stack as you work.
- **Non-Destructive Pipeline**: The backend dynamically processes an edit stack in memory, preventing compounding artifacts and allowing you to adjust sliders infinitely without degrading the original image quality.
- **Interactive Undo/Redo History**: A brutalist drop-down menu tracks every UI interaction. Simply click any state in the history list to instantly jump back in time, with zero-latency live preview rollbacks.
- **Blazing-Fast Live Preview**: See a live preview of your edits instantly on the canvas. The engine dynamically downscales images during slider adjustments for native, sub-50ms desktop-like performance.
- **Batch Processing**: Upload multiple images, configure a bulk edit (e.g., watermark all images), and download them as a ZIP archive.
- **RESTful API**: Exposes a `/api/v1/process` endpoint for developers to process images programmatically.
- **Processing Modes**:
    1. **Resize**: Interactive modal with pixel or percentage scaling, aspect ratio locking, and live file-size estimation before downloading.
    2. **Crop & Rotate**: Unified interactive visual tool with preset aspect ratios, custom angle slider, and flip controls.
    3. **Filters**: Apply Grayscale, Sepia, Blue Tone, Warm Tone, Invert, Posterize, High Contrast, or Vintage using an interactive visual thumbnail grid.
    4. **Adjustments**: Fine-tune Brightness, Contrast, Saturation, and Sharpness.
    5. **Watermark**: Protect images with text (opacity/color) or image logos.
    6. **Dithering**: Apply retro 1-bit dithering effects (Floyd-Steinberg, Bayer, Atkinson).
    7. **Remove Background**: AI-powered background removal.
- **Format Conversion**: Choose output format or let the app automatically decide to preserve transparency.
- **Security & Performance**: Rate limiting prevents abuse, while local caching ensures lightning-fast undo/redo.
- **Modular Design**: Scalable Flask application structure using blueprints and background threads.

## 🛠️ Prerequisites

- **Python 3.12+** (Recommended due to dependency compatibility)
- **Flask**
- **Pillow** (PIL Fork)
- **rembg**
- **onnxruntime**

## 🚀 Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/hotanphat28/imgitor.git
   cd imgitor
   ```

2. Create and activate a virtual environment (optional but recommended):
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
   
   **On Linux/macOS:**
   ```bash
   cp .env.example .env
   ```
   **On Windows (Command Prompt):**
   ```cmd
   copy .env.example .env
   ```

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
docker build -t imgitor .
docker run -p 5000:5000 imgitor
```

## 🧪 Testing

To run the automated test suite, which includes both pure Python unit tests and Playwright End-to-End (E2E) browser tests, use `uv`:
```bash
uv run pytest --cov=app
```
*(Note: To run the E2E UI tests, you must run `uv run playwright install --with-deps chromium` to fetch browser binaries.)*

## 📂 Project Structure

```
imgitor/
├── run.py                 # Entry point
├── app/
│   ├── __init__.py        # App initialization
│   ├── routes.py          # Route definitions
│   ├── utils.py           # Image processing logic
│   ├── templates/         # HTML templates
│   │   └── index.html
│   └── static/            # Static assets
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── main.js
├── CONTEXT.md           # Project context and architecture details
└── README.md
```
