#!/bin/sh
set -e

# Parse DATABASE_URL to extract connection params
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|\3|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|\4|')
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|\2|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)|\5|')

echo "⏳ Waiting for database to be ready..."
for i in $(seq 1 30); do
  if node -e "
    const net = require('net');
    const s = net.createConnection({host: '$DB_HOST', port: $DB_PORT});
    s.on('connect', () => { s.destroy(); process.exit(0); });
    s.on('error', () => process.exit(1));
    setTimeout(() => process.exit(1), 3000);
  " 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ Database connection timeout"
    exit 1
  fi
  echo "  Attempt $i/30 - waiting..."
  sleep 2
done

# Small extra wait for MySQL to fully accept queries
sleep 2

# Check if tables exist
TABLE_COUNT=$(mysql --skip-ssl -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "🔄 Creating database schema..."
  mysql --skip-ssl -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /app/schema.sql
  echo "✅ Schema created!"

  # Seed mock data
  if [ -f /app/seed/mock_data.sql ]; then
    echo "🌱 Seeding mock data..."
    mysql --skip-ssl -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /app/seed/mock_data.sql 2>&1 || echo "⚠️ Some seed data may have failed, continuing..."
    echo "✅ Seeding complete!"
  fi
else
  echo "📦 Database already has $TABLE_COUNT tables, skipping init."
fi

echo "🚀 Starting Next.js server..."
exec node server.js
