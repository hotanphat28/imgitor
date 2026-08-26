# Retro Print Suite Context

Imgitor has pivoted into a browser-based **Retro Print Suite** focused on single-feature simplicity: applying high-quality halftone and dithering effects with a tactile, brutalist UI.

## Tech Stack
- **Backend:** Python 3.12+, Flask.
- **Frontend:** HTML5 Canvas, Vanilla CSS, Vanilla JavaScript, Cropper.js.
- **Image Processing:** Pillow (PIL fork), rembg (for AI background removal), dithering.

## Architecture
- **Web Application:** Standard Flask application. Templates are located in `app/templates/` and static assets in `app/static/`.
- **Stateless Backend:** The server acts purely as a REST endpoint for final high-res renders. There are no temporary sessions or files stored on the server disk.
- **Client-Side Rendering:** Real-time live previews of Halftone and Dithering are generated directly on the HTML5 Canvas in `main.js` using raw pixel manipulation algorithms (Floyd-Steinberg, custom Halftone patterns).
- **RESTful API:** Exposes endpoints under `/api/v1/process` for programmatic access. (See `API.md`).

## Design & UI Aesthetics
- **Tactile Kiosk (Brutalist):** A bold, split-screen UI (65% Canvas, 35% Control Board). Features hard drop shadows (`6px 6px 0px #000`), thick borders (`4px`), space-mono typography, and physical button push micro-interactions.
- **Interactivity:** Instant zero-latency live previews via Canvas.

## Features
- **Crop & Rotate**: Interactive visual tool (Cropper.js) before applying retro effects.
- **Remove Background**: AI-powered background removal.
- **Dithering**: Apply retro 1-bit dithering effects (Floyd-Steinberg, Bayer, Atkinson).
- **Halftone**: Apply customizable halftone effects with dedicated controls for dot size, angle, and shape (Round, Square, Line).

## Testing
- **Frameworks:** Use `pytest` for unit tests and `pytest-playwright` for E2E testing.
- **Location:** All tests should be placed in the `tests/` directory.
