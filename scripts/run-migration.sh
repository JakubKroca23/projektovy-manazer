#!/bin/bash
set -e

echo "Running Prisma migration..."
npx prisma migrate deploy
echo "Migration completed!"
