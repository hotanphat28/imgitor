# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
