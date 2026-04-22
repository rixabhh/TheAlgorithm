Title: [Infra] Migrate fully to pyproject.toml and remove redundant requirements.txt

The project currently uses both `pyproject.toml` and `requirements.txt` for defining dependencies. Managing dependencies in two places can lead to desynchronization and conflicts.

By migrating entirely to `pyproject.toml` (which is standard practice in modern Python projects) and removing `requirements.txt`, we simplify our tooling, standardize configuration, and make it easier for contributors to get the project running.
