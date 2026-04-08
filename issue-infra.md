Title: Add branch protection rules to require passing CI before merging

To prevent regressions and ensure code quality, we should enable branch protection rules on the `main` branch.

Currently, pull requests can be merged even if the CI workflow fails (e.g. tests failing or code not formatted correctly).

I propose we require the `test` job from `.github/workflows/ci.yml` to pass before a PR can be merged into the `main` branch. This will ensure contributors are aware of failing tests, typecheck errors, or linting errors, and fix them before the code is merged.
