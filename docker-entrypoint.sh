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
# Helper to creating/deploying migrations (safer than db push for production)
echo "Running database migrations..."
if [ -f "/app/prisma/migrations/migration_lock.toml" ]; then
    echo "Migration lock found. Running migrate deploy..."
    su-exec nextjs npx prisma migrate deploy
else
    echo "No migration lock found. Initializing..."
    # Fallback only for fresh install if needed, or force deploy
    su-exec nextjs npx prisma migrate deploy
fi

echo "Starting Next.js application..."
# exec replaces the shell process, su-exec switches user
exec su-exec nextjs node server.js
