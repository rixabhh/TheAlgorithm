.PHONY: dev preview test deploy lint format

dev:
	npm run dev

preview:
	npm run preview

test:
	npm test

deploy:
	npm run deploy

lint:
	npx prettier --check .

format:
	npx prettier --write .
