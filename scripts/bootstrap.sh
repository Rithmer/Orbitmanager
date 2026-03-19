#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$ROOT_DIR"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example"
fi

if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
  cp "backend/.env.example" "backend/.env"
  echo "Created backend/.env from backend/.env.example"
fi

if [ ! -f "backend/.env.test" ] && [ -f "backend/.env.test.example" ]; then
  cp "backend/.env.test.example" "backend/.env.test"
  echo "Created backend/.env.test from backend/.env.test.example"
fi

docker compose up -d --build

echo
echo "Project started."
echo "Swagger: http://localhost:3000/api/docs"
echo "Frontend: http://localhost:5173"
echo "Admin login: admin"
echo "Admin password: Admin123!"
