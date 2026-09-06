# AGENTS

## General Rules

* Make sure to consider the impact on the auto-commit workflow and session state manager when modifying image processing routes or the frontend JS.
* Avoid introducing heavy frontend frameworks (e.g., React, Vue) to maintain the simple, vanilla architecture unless explicitly required.
* Maintain comprehensive error handling and input validation on the backend to avoid processing failures.
* Always read `CONTEXT.md` and `CHANGELOG.md` at the beginning of any chat session to have a full context.
* Always update `CHANGELOG.md` (with date YYYY-MM-DD and version included), `CONTEXT.md` and `README.md` whenever receving request to push the changes.
* Always use `uv` (e.g. `uv pip ...`, `uv run ...`) commands for anything related to Python.
* Always ensure GitHub Actions are correct and passing when a new feature or code change is added to this project.
