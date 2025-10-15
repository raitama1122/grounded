#!/bin/bash

# Initialize D1 Database for Grounded
echo "🚀 Initializing Grounded D1 Database..."

# Create the database
echo "📦 Creating D1 database..."
wrangler d1 create grounded-db

echo ""
echo "⚠️  IMPORTANT: Copy the database_id from above and update wrangler.toml"
echo ""
echo "📋 Next steps:"
echo "1. Update the database_id in wrangler.toml"
echo "2. Run: ./scripts/setup-schema.sh"
echo "3. Run: ./scripts/seed-db.sh"
echo ""
echo "✅ Database creation initiated!"
