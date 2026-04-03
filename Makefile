.PHONY: dev test lint format docker-build docker-run

dev:
	python app.py

test:
	python -m pytest tests/ -v

lint:
	ruff check .

format:
	ruff format .

docker-build:
	docker build -t the-algorithm .

docker-run:
	docker run -p 7860:7860 the-algorithm
