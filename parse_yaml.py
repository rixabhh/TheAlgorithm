import yaml

content = """
frontend:
  - any:
    - changed-files:
      - any-glob-to-any-file:
        - 'static/**/*'
        - '*.html'

backend:
  - any:
    - changed-files:
      - any-glob-to-any-file:
        - 'functions/**/*'
        - 'app.py'

infra:
  - any:
    - changed-files:
      - any-glob-to-any-file:
        - 'Dockerfile'
        - '.github/**/*'
        - 'requirements.txt'
        - 'pyproject.toml'
        - 'Makefile'

docs:
  - any:
    - changed-files:
      - any-glob-to-any-file:
        - '*.md'
"""
print(yaml.safe_load(content))
