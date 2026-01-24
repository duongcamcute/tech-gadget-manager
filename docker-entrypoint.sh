#!/bin/sh
set -e

# Fix permissions for the database directory
# This script runs as root, so we can change ownership of the mounted volume
echo "Fixing permissions for /app/db..."
mkdir -p /app/db
chown -R nextjs:nodejs /app/db
if [ -f "/app/db/prod.db" ]; then
    chown nextjs:nodejs /app/db/prod.db
fi
if [ -f "/app/db/prod.db-journal" ]; then
    chown nextjs:nodejs /app/db/prod.db-journal
fi
if [ -f "/app/db/prod.db-shm" ]; then
    chown nextjs:nodejs /app/db/prod.db-shm
fi
if [ -f "/app/db/prod.db-wal" ]; then
    chown nextjs:nodejs /app/db/prod.db-wal
fi

# Switch to nextjs user to run migration and app
# Deploy migrations (using db push for auto-sync without history conflicts)
echo "Running database migrations..."
su-exec nextjs npx prisma db push --skip-generate

echo "Starting Next.js application..."
# exec replaces the shell process, su-exec switches user
exec su-exec nextjs node server.js
