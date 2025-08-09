#!/bin/bash
set -e

DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-fictionalize_me}

OUTPUT_FILE=${1:-"db/schema.sql"}

if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-fictionalize_me}

echo "Generating SQL schema from PostgreSQL database..."
echo "Database: $DB_NAME at $DB_HOST:$DB_PORT"
echo "Output file: $OUTPUT_FILE"

check_postgres_connection() {
  if command -v pg_isready &> /dev/null; then
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  elif command -v nc &> /dev/null; then
    if nc -z -w 5 $DB_HOST $DB_PORT > /dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  else
    (echo > /dev/tcp/$DB_HOST/$DB_PORT) > /dev/null 2>&1
    return $?
  fi
}

if ! check_postgres_connection; then
  echo "Error: Could not connect to PostgreSQL at $DB_HOST:$DB_PORT"
  echo "Please ensure your Docker PostgreSQL container is running:"
  echo "  docker compose up -d postgres"
  exit 1
fi

echo "Database is accessible. Generating schema..."

mkdir -p $(dirname $OUTPUT_FILE)

docker run --rm \
  --network=host \
  -e PGPASSWORD=$DB_PASSWORD \
  postgres:17 \
  pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-comments \
  --clean \
  --if-exists > $OUTPUT_FILE

if [ $? -eq 0 ]; then
  echo "Schema successfully generated and saved to $OUTPUT_FILE"
  echo "File size: $(wc -l < $OUTPUT_FILE) lines"
  echo ""
  echo "To view the schema:"
  echo "  cat $OUTPUT_FILE"
  echo ""
  echo "To generate schema with data:"
  echo "  $0 db/schema-with-data.sql --data"
else
  echo "Error: Failed to generate schema"
  exit 1
fi
