#!/bin/bash

# Supabase Database Migration Script
# This script creates all necessary tables in Supabase PostgreSQL database

echo "Generating Prisma migration..."
npx prisma migrate dev --name init

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your DATABASE_URL environment variable is set to your Supabase PostgreSQL connection string"
echo "2. The migration has created all tables in your Supabase database"
echo "3. You can now start the dev server: npm run dev"
