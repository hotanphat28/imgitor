# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **API Documentation**: Added comprehensive `API.md` to document the `/api/v1/process` RESTful endpoint, and linked it in the README.
- **Documentation**: Embedded feature showcase videos for Filters and Dithering into the README.
- **Dithering Effect**: Added a 1-bit retro dithering tool with options for Floyd-Steinberg, Bayer, and Atkinson algorithms via the `dithering` package.
- Created `CONTEXT.md` to serve as a comprehensive documentation of project context, merging information from `AGENTS.md` and `README.md`.
- **Quality & CI/CD**: Added GitHub Actions workflow (`ci.yml`) for automated testing, linting (`ruff`), and security scanning (`bandit`).
- **Test Coverage**: Added comprehensive backend unit tests (`test_api.py`, `test_routes.py`), increasing backend coverage to >60%.

### Changed
- Updated `AGENTS.md` to reference `CONTEXT.md` for project architecture, tech stack, and design aesthetics.
- Formatted entire backend with `ruff`.

### Fixed
- Fixed an import sorting lint error in `test_utils.py` that was causing GitHub Actions checks to fail.

## [2.1.0] - 2026-07-15
### Added
- **Interactive History Drop-Down Menu**: Replaced blind undo/redo clicking with a sleek, brutalist drop-down menu that chronicles every UI action. Users can click any item in the history list to instantly time-travel to past or future states.

### Changed
- **Non-Destructive Image Processing Pipeline**: The image processing logic now constructs a dynamic stack of operations in memory, completely eliminating the legacy "baking" process that caused compounding artifacts during adjustments (Brightness, Contrast, Saturation, Sharpness).
- **Frontend-Driven History Manager**: Migrated history tracking from the server's disk to an intelligent in-browser ES6 Class (`StateManager`), resulting in zero-latency UI rollbacks and massive reductions in server I/O overhead.

## [2.0.0] - 2026-07-14
### Added
- **Mobile-First Responsiveness**: Replaced the fixed left sidebar with a bottom navigation bar on mobile devices (<768px), and converted the settings panel into a collapsible slide-up drawer with an interactive backdrop.
- **Frontend ES6 Architecture**: Refactored the monolithic 600+ line `main.js` script into a clean, modern ES6 Class-based architecture (`StateManager`, `ThemeManager`, `CropTool`, `ResizeModal`, `ImgitorApp`).
- **Concurrent Threading**: Wraps heavy image processing (like AI background removal) in a `ThreadPoolExecutor` to prevent blocking Flask Waitress worker threads.
- **AI Thread Safety**: Added `threading.Lock` to the ONNX `rembg.remove` function to ensure local execution stability and completely eliminate OOM crashes under heavy load.
- **Improved UX for Background Removal**: Relocated the "Remove Background" action to the top canvas header for instant, one-click execution.

## [1.9.0] - 2026-07-14
### Added
- **Expanded Filter Library**: Added 4 new high-performance Pillow filters: Invert, High Contrast, Vintage, and Posterize.
- **Visual Filter UI**: Replaced the generic dropdown with a Brutalist 3x3 grid of interactive filter thumbnails.
- **Filter Live Preview**: Reworked the filter workflow to live-preview effects without auto-committing. Users can explore filters before clicking "Apply Filter".

### Fixed
- **Filter Initialization Bug**: Fixed an issue where the image preview failed to reset when switching away from the Filter tool with an unapplied filter.
- **Transparency Preview Crash**: Resolved a backend crash that occurred when generating JPEG live previews for RGBA images with the "Normal" filter selected.

## [1.8.0] - 2026-06-18
### Added
- **Playwright E2E Testing**: Replaced the basic Flask API integration tests with a robust End-to-End UI testing framework using `pytest-playwright`.
- **Live Server Testing**: The test suite now automatically spins up a background thread, allowing Playwright to upload files and interact with the frontend UI via a browser.

### Changed
- Consolidated `test_routes.py` backend integration scenarios into `test_e2e.py`.
## [1.7.0] - 2026-06-09
### Added
- **Unified Transformation Tool**: Successfully merged the Crop and Rotate tools into a single, cohesive interface. Features a new floating bottom toolbar providing a custom angle slider, aspect ratio presets, and instant horizontal/vertical flip controls.
- **Improved Auto Crop**: Initial crop box now spans 100% of the image to easily retain the full photo layout.

## [1.6.0] - 2026-06-09
### Added
- **Background Cleanup**: A daemon thread now automatically deletes temporary session folders older than 2 hours to prevent disk space leaks.
- **Mobile Responsiveness**: Refactored the UI with CSS media queries to ensure the application scales properly on phones and tablets.
- **Accessibility**: Implemented high-contrast `:focus-visible` states across all interactive elements for keyboard navigation (WCAG 2.2 AA).
- **Design Tokens**: Standardized CSS variables to use strict semantic tokens (`--primary`, `--bg-dark`, etc.).

### Fixed
- **Path Traversal Vulnerability**: Secured the `session_id` logic by strictly validating UUID formats, preventing attackers from escaping the temp directory.
- **File Validation**: Replaced basic extension checks with deep `PIL.Image.verify()` validation to reject spoofed/malicious file uploads.
- **API Error Formatting**: Fixed endpoints to consistently return JSON errors instead of raw strings to prevent frontend parsing crashes.


## [1.5.0] - 2026-06-09
### Added
- **Resize Modal UI**: Introduced a dedicated popup modal for the Resize feature, triggered from the top bar.
- **Advanced Resize Controls**: Added percentage-based scaling alongside pixel-based scaling, complete with an interactive aspect-ratio lock.
- **Export Settings within Resize**: Directly select the output format (JPEG, PNG, WEBP) and adjust compression quality from within the modal.
- **Live Size Estimation**: Instant, in-memory calculation of the final image size in bytes before applying.
- **Streamlined Workflow**: Clicking "Save" processes the resize and instantly triggers a download. Crop is now the default tool upon upload.

## [1.4.0] - 2026-06-07
### Added
- **Brutalist UI/UX**: Completely redesigned the interface using a strict Brutalist design system with high-contrast elements.
- **Seamless Auto-Commit Workflow**: Removed "Commit Edit" buttons in favor of an intelligent auto-commit system that saves edits in the background when you finish interacting or switch tools.
- **Dedicated Editor Mode**: The application now seamlessly locks into a distraction-free editor mode once an image is uploaded.
- **Reset All Capability**: Instantly wipe out all stacked edits to return to the original image without restarting your session.
- **Blazing-Fast Live Previews**: Rewrote the preview engine to downscale and JPEG-compress previews before processing, resulting in sub-50ms latency when dragging sliders.

## [1.3.0] - 2026-06-07
### Added
- **Batch Processing**: Upload multiple images and apply operations to all of them in the background, downloading the result as a ZIP archive.
- **Watermarking**: Add text (with color and opacity) or image logo watermarks to protect images.
- **RESTful API**: Added `/api/v1/process` endpoint secured by an API key for programmatic image processing.
- **Dark Mode**: Implemented a theme toggle switch supporting light and dark modes.
- **Live Preview**: Replaced the Before/After view with a clean, in-place Live Preview.

## [1.2.0] - 2026-06-07
### Added
- **Undo/Redo Stack**: Full state management for stacking multiple edits and reverting them seamlessly.
- **Interactive Cropping**: Integrated `Cropper.js` for an interactive, visual cropping experience with preset aspect ratios.
- **Advanced Adjustments**: Added fine-tuned sliders for Brightness, Contrast, Saturation, and Sharpness.
- **Result Caching**: Integrated `Flask-Caching` for instant playback of edit history without re-processing.

## [1.1.0] - 2026-06-07
### Added
- Native drag and drop support for image uploads.
- Progress spinner overlay for better UX during image processing.
- Image cropping capability with precise coordinate selection.
- Image rotation capability.
- Configurable output format selection (AUTO, JPEG, PNG, WEBP, GIF).
- Rate limiting using `Flask-Limiter` to protect the application.

## [1.0.0] - 2026-06-07
### Added
- Application factory pattern for Flask configuration.
- `waitress` WSGI server for production deployments.
- `config.py` and `.env` support for environment-based configuration.
- Automated testing using `pytest`.
- Dockerfile and `.dockerignore` for containerization.
- File size limit (`MAX_CONTENT_LENGTH`) to prevent large file uploads.
- Strict file extension validation and secure filename generation.
- Structured logging for better observability.
- `CODEOWNERS` file to define project ownership.
- This `CHANGELOG.md` file.

### Changed
- `run.py` now uses the application factory.
- Application logic moved into a `Blueprint` for better modularity.
