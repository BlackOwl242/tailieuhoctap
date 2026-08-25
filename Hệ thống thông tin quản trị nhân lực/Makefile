# Convenience wrappers around docker compose (optional — plain commands work too)
.PHONY: up down logs reset seed simulate test build

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

reset:
	docker compose down -v
	docker compose up -d --build

seed:
	docker compose exec api node dist/prisma/seed.js

simulate:
	docker compose exec api node dist/scripts/simulate-device.js

test:
	cd backend && npm test

build:
	docker compose build
