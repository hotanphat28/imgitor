# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
