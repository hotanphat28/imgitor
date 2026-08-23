# AGENTS

## Rules
* Make sure to consider the impact on the auto-commit workflow and session state manager when modifying image processing routes or the frontend JS.
* Avoid introducing heavy frontend frameworks (e.g., React, Vue) to maintain the simple, vanilla architecture unless explicitly required.
* Maintain comprehensive error handling and input validation on the backend to avoid processing failures.
* Always read `CONTEXT.md` at the beginning of any chat session to have a full context.
* Always update `CHANGELOG.md` (ensure having date and version), `CONTEXT.md`, `README.md`, and other related markdown documentation before pushing any changes to Git.
* Always use `uv` for anything related to Python (e.g., package management, running tests).
* Always ensure GitHub Actions are correct and passing when a new feature or code change is added to this project.
