# Imgitor Project Context

Imgitor is a browser-based image processing tool created with Flask. It allows users to resize, crop, rotate, convert, apply filters, and remove backgrounds from images.

## Tech Stack
- **Backend:** Python 3.12+, Flask.
- **Frontend:** HTML, Vanilla CSS, Vanilla JavaScript.
- **Image Processing:** Pillow (PIL fork), rembg (for AI background removal), onnxruntime.
- **Production Server:** Waitress.

## Architecture
- **Web Application:** Standard Flask application utilizing blueprints. Templates are located in `app/templates/` and static assets in `app/static/`.
- **RESTful API:** Exposes endpoints under `/api/v1/process` for programmatic access. (See `API.md`).
- **Session State Management:** The app features a seamless auto-commit workflow. Properties are edited and transitioned without a manual 'Apply' step, utilizing an undo/redo history stack tied to the user's session.
- **Non-Destructive Pipeline**: The backend dynamically processes an edit stack in memory, preventing compounding artifacts and allowing you to adjust sliders infinitely without degrading the original image quality.

## Design & UI Aesthetics
- **Neubrutalist Theme:** Use a bold, high-contrast Refined Neubrutalist UI featuring hard drop shadows and physical button press states. Prioritize accessibility and clear focus states. Includes a Dark/Light Mode toggle.
- **Theme Modes:** Must support both Dark and Light modes.
- **Interactivity:** Sub-50ms live previews are expected. Images are dynamically downscaled during slider adjustments to maintain performance. A sliding visual timeline drawer tracks every UI interaction for instant jump-back history, while auto-commit toast notifications provide real-time feedback.

## Features
- **Batch Processing**: Upload multiple images, configure a bulk edit (e.g., watermark all images), and download them as a ZIP archive.
- **Processing Modes**:
    1. **Resize**: Interactive modal with pixel or percentage scaling, aspect ratio locking, and live file-size estimation before downloading.
    2. **Crop & Rotate**: Unified interactive visual tool with preset aspect ratios, custom angle slider, and flip controls.
    3. **Filters**: Apply Grayscale, Sepia, Blue Tone, Warm Tone, Invert, Posterize, High Contrast, or Vintage using an interactive visual thumbnail grid.
    4. **Adjustments**: Fine-tune Brightness, Contrast, Saturation, and Sharpness.
    5. **Watermark**: Protect images with text (opacity/color) or image logos.
    6. **Dithering**: Apply retro 1-bit dithering effects (Floyd-Steinberg, Bayer, Atkinson).
    7. **Remove Background**: AI-powered background removal.
- **Format Conversion**: Choose output format or let the app automatically decide to preserve transparency.

## Testing
- **Frameworks:** Use `pytest` for unit tests and `pytest-playwright` for E2E testing.
- **Location:** All tests should be placed in the `tests/` directory.

## Project Structure
```text
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
