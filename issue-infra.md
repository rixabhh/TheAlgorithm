Title: Docker: Cache dependencies in multi-stage build

The current `Dockerfile` uses a multi-stage build but does not use Docker's BuildKit caching mechanism for `pip` packages (e.g., `RUN --mount=type=cache,target=/root/.cache/pip pip install ...`).

Why it matters for contributors:
Implementing dependency caching will significantly speed up local rebuilds and potentially CI pipelines, creating a faster feedback loop during development and reducing CI runner minutes.
