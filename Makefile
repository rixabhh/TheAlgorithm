.PHONY: dev preview test format deploy

dev:
	npm run dev

preview:
	npm run preview

test:
	npm test

format:
	npx prettier --write .

deploy:
	npm run deploy
