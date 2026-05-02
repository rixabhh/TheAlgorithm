Title: Contributor Experience: Create a setup script or interactive CLI tool

Currently, contributors have to manually copy `.env.example`, potentially set up their own virtual environment, install dependencies, and run multiple `make` commands before they can get started. We should create a simple `./setup.sh` or Python script that automates the initial configuration.

Why it matters for contributors:
A one-click or single-command setup reduces friction for first-time contributors and ensures everyone starts from a correctly configured environment. A contributor who can clone and be running in under 5 minutes is a contributor who might actually submit a PR.
