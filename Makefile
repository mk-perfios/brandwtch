.PHONY: up down build migrate logs backend frontend setup test lint

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

migrate:
	docker-compose exec backend alembic upgrade head

logs:
	docker-compose logs -f

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

setup: build up
	@sleep 5
	@docker-compose exec backend alembic upgrade head
	@echo "\n✅  BrandWtch is ready at http://localhost:3000"
	@echo "    API docs at     http://localhost:8000/docs"

test:
	cd backend && pytest -v

lint:
	cd backend && ruff check app/

format:
	cd backend && ruff format app/
