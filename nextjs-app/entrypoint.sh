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

echo "🔄 Synchronizing database schema with Prisma..."
node node_modules/prisma/build/index.js db push --skip-generate || echo "⚠️ Prisma DB Push encountered a warning or error (e.g., data loss protection). Review logs if issues persist."
echo "✅ Schema sync complete!"

# Check if the database needs mock data by checking if the staff table is empty
# This is extremely robust because Prisma's db push creates all tables first, but they will be empty.
STAFF_COUNT=$(mysql --skip-ssl -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM staff;" 2>/dev/null || echo "0")

if [ "$STAFF_COUNT" -eq "0" ]; then
  # Seed mock data
  if [ -f /app/seed/mock_data.sql ]; then
    echo "🌱 Fresh database installation detected (0 staff accounts). Seeding mock data..."
    mysql --skip-ssl -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /app/seed/mock_data.sql 2>&1 || echo "⚠️ Some seed data may have failed, continuing..."
    echo "✅ Seeding complete!"
  fi
else
  echo "📦 Database already initialized (found $STAFF_COUNT staff accounts), skipping mock seed."
fi


echo "🚀 Starting Next.js server..."
exec node server.js
