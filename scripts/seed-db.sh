#!/bin/bash

# Seed D1 Database with sample data
echo "🌱 Seeding database with sample data..."

# Execute the seed data
wrangler d1 execute grounded-db --file=./seed.sql

echo "✅ Database seeded successfully!"
echo ""
echo "🎉 Your D1 database is ready!"
echo "📊 You can view your data with: wrangler d1 execute grounded-db --command='SELECT * FROM analyses;'"
