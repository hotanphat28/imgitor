# Imgitor Project Rules & Guidelines

*Note: For project architecture, tech stack, and design context, please refer to [CONTEXT.md](../CONTEXT.md).*

## General Development Guidelines
- Make sure to consider the impact on the auto-commit workflow and session state manager when modifying image processing routes or the frontend JS.
- Avoid introducing heavy frontend frameworks (e.g., React, Vue) to maintain the simple, vanilla architecture unless explicitly required.
- Maintain comprehensive error handling and input validation on the backend to avoid processing failures.
- Always run `/product-analyze` and `/product-design` for any requests related to planning or a comprehensive plan.
- Always run `/product-develop` for any requests related to proceeding the comprehensive plan.
- Always run `/product-develop` for any requests related to fixing bugs.
- Always update `CHANGELOG.md`, `README.md` and related markdown files before pushing any changes to Git.
- Always use `uv` for anything related to Python (e.g., package management, running tests).
- Always ensure GitHub Actions are correct and passing when a new feature or code change is added to this project.
