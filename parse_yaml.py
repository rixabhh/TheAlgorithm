import yaml

content = """
frontend:
  - changed-files:
    - any-glob-to-any-file:
      - 'static/**/*'
      - '*.html'
"""
print(yaml.safe_load(content))

content2 = """
frontend:
  - changed-files:
      - any-glob-to-any-file:
          - 'static/**/*'
          - '*.html'
"""
print(yaml.safe_load(content2))
