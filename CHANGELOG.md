# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
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
