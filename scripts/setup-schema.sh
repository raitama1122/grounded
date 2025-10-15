#!/bin/bash

# Setup D1 Database Schema for Grounded
echo "🏗️  Setting up database schema..."

# Execute the schema
wrangler d1 execute grounded-db --file=./schema.sql

echo "✅ Database schema created successfully!"
echo ""
echo "📋 Next step: Run ./scripts/seed-db.sh to add sample data"
