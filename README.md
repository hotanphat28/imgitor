# Image Processing Web Tool (Imgitor)

A browser-based image processing tool created with Flask. It allows you to:
- Resize, crop, and rotate images.
- Convert images to different formats (JPEG, PNG, WEBP, GIF).
- Apply color filters (Grayscale, Sepia, etc.).
- Remove backgrounds from images using AI.

## 🌟 Features

- **Web Interface**: Simple and responsive UI with a Dark/Light Mode toggle and live progress overlays.
- **Interactive Workflow**: Step-by-step process with a native drag & drop upload zone and an interactive `Cropper.js` interface.
- **Undo/Redo History**: Stack multiple edits and seamlessly revert mistakes using the built-in session state manager.
- **Live Preview**: See a live preview of your edits instantly on the canvas.
- **Batch Processing**: Upload multiple images, configure a bulk edit (e.g., watermark all images), and download them as a ZIP archive.
- **RESTful API**: Exposes a `/api/v1/process` endpoint for developers to process images programmatically.
- **Processing Modes**:
    1. **Resize**: By resolution (Lanczos resampling).
    2. **Crop**: Interactive visual cropping with preset aspect ratios.
    3. **Rotate**: Rotation by specified degrees.
    4. **Filters**: Apply Grayscale, Sepia, Blue Tone, or Warm Tone.
    5. **Adjustments**: Fine-tune Brightness, Contrast, Saturation, and Sharpness.
    6. **Watermark**: Protect images with text (opacity/color) or image logos.
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

To run the automated test suite, use pytest:
```bash
pytest tests/
```

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
└── README.md
```
