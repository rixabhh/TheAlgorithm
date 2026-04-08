.PHONY: dev test lint format typecheck docker-build docker-run

dev:
	python app.py

test:
	python -m pytest tests/ -v

lint:
	ruff check .

format:
	ruff format .

typecheck:
	mypy app.py tests/

docker-build:
	docker build -t the-algorithm .

docker-run:
	docker run -p 7860:7860 the-algorithm
