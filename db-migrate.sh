#!/bin/bash
set -e

# Script to check PostgreSQL connection and run Flyway migrations

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "Error: .env.local file not found"
  exit 1
fi

# Set default values if not provided
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-fictionalize_me}
ENVIRONMENT=${NODE_ENV:-local}

echo "Running migrations for environment: $ENVIRONMENT"

echo "Checking database connection..."

# Function to check PostgreSQL connection
check_postgres_connection() {
  # Method 1: Try pg_isready if available
  if command -v pg_isready &> /dev/null; then
    echo "Using pg_isready to check connection..."
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  
  # Method 2: Try netcat if available
  elif command -v nc &> /dev/null; then
    echo "Using netcat to check connection..."
    if nc -z -w 5 $DB_HOST $DB_PORT > /dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  
  # Method 3: Basic bash TCP connection test
  else
    echo "Using basic connection test..."
    (echo > /dev/tcp/$DB_HOST/$DB_PORT) > /dev/null 2>&1
    return $?
  fi
}

# Try to connect to PostgreSQL
if ! check_postgres_connection; then
  echo "Error: Could not connect to PostgreSQL at $DB_HOST:$DB_PORT"
  echo "Please ensure PostgreSQL is running and accessible"
  
  # Suggest installation if pg_isready not available
  if ! command -v pg_isready &> /dev/null; then
    echo "Note: pg_isready is not installed. For better database connectivity checks, consider installing:"
    echo "  sudo apt-get install postgresql-client    # For Debian/Ubuntu"
    echo "  sudo yum install postgresql              # For RHEL/CentOS"
    echo "  brew install postgresql                  # For macOS with Homebrew"
  fi
  
  exit 1
fi

echo "Database is accessible. Running migrations with Flyway..."

# Get the absolute path of the migrations directory
MIGRATIONS_DIR=$(realpath ./db/migrations)

# Run Flyway in Docker
docker run --rm \
  --network=host \
  -v $MIGRATIONS_DIR:/flyway/sql \
  -e FLYWAY_URL=jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME \
  -e FLYWAY_USER=$DB_USER \
  -e FLYWAY_PASSWORD=$DB_PASSWORD \
  -e FLYWAY_CONNECT_RETRIES=10 \
  -e FLYWAY_VALIDATE_MIGRATION_NAMING=true \
  -e FLYWAY_PLACEHOLDERS_ENVIRONMENT=$ENVIRONMENT \
  flyway/flyway:11 \
  migrate

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Error: Failed to apply migrations"
  exit 1
fi

