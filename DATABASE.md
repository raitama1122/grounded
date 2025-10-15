# Grounded Database Setup Guide

This guide explains how to set up the D1 database for the Grounded application.

## Overview

Grounded uses Cloudflare D1 (SQLite) database to store:
- Analysis sessions with unique UUIDs
- Guardian responses for each analysis
- Insight summaries compiled from guardian responses
- Analytics events for usage tracking

## Database Schema

### Tables

1. **`analyses`** - Main analysis sessions
   - `id` (TEXT PRIMARY KEY) - UUID for each analysis
   - `query` (TEXT) - User's original question
   - `status` - Processing status (pending, processing, completed, failed)
   - `created_at`, `updated_at` - Timestamps
   - `user_ip`, `user_agent` - Client information

2. **`guardian_responses`** - Individual guardian responses
   - Links to `analyses` table via `analysis_id`
   - Stores guardian metadata and response text

3. **`insight_summaries`** - Compiled analysis summaries
   - JSON fields for themes, consensus, divergent views, action items
   - Overall sentiment classification

4. **`analytics`** - Usage tracking and events
   - Event types: query_submitted, analysis_viewed, analysis_shared
   - Metadata stored as JSON

## Setup Instructions

### 1. Install Wrangler (if not already installed)

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create the D1 Database

```bash
./scripts/init-db.sh
```

This will create a new D1 database and provide you with a database ID.

### 4. Update Configuration

Copy the database ID from step 3 and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "grounded-db"
database_id = "your-actual-database-id-here"  # Replace with the ID from step 3
```

### 5. Setup Database Schema

```bash
./scripts/setup-schema.sh
```

This creates all the necessary tables and indexes.

### 6. Seed with Sample Data (Optional)

```bash
./scripts/seed-db.sh
```

This adds sample analysis data for testing.

## URL Structure

After setup, analyses will be accessible via:
- `domain.com/analysis/{uuid}` - View saved analysis
- API endpoints:
  - `POST /api/guardians` - Create new analysis (returns UUID)
  - `GET /api/analysis/{uuid}` - Retrieve saved analysis

## Development vs Production

### Development
- Uses local D1 database
- Run `wrangler dev` for local development with D1

### Production
- Deployed to Cloudflare Workers
- Uses production D1 database
- Deploy with `wrangler deploy`

## Database Operations

### View Data
```bash
# List all analyses
wrangler d1 execute grounded-db --command="SELECT id, query, created_at FROM analyses ORDER BY created_at DESC LIMIT 10;"

# View specific analysis
wrangler d1 execute grounded-db --command="SELECT * FROM analyses WHERE id = 'your-uuid-here';"

# Check guardian responses
wrangler d1 execute grounded-db --command="SELECT guardian_name, response FROM guardian_responses WHERE analysis_id = 'your-uuid-here';"
```

### Backup Data
```bash
# Export all data
wrangler d1 export grounded-db --output=backup.sql
```

### Reset Database
```bash
# Drop all tables and recreate
wrangler d1 execute grounded-db --command="DROP TABLE IF EXISTS analytics; DROP TABLE IF EXISTS insight_summaries; DROP TABLE IF EXISTS guardian_responses; DROP TABLE IF EXISTS analyses;"
./scripts/setup-schema.sh
```

## Analytics Events

The system tracks these events:
- `query_submitted` - When a user submits a new query
- `analysis_viewed` - When someone views an analysis page
- `analysis_shared` - When someone shares an analysis (future feature)

## Performance Considerations

- Indexes are created on frequently queried columns
- JSON fields are used for flexible data storage
- Foreign key constraints ensure data integrity
- Automatic timestamps track creation and updates

## Security

- UUIDs prevent enumeration attacks
- No personal data is stored beyond IP addresses
- User agents are stored for analytics only
- All queries are parameterized to prevent SQL injection

## Monitoring

Monitor your D1 usage in the Cloudflare dashboard:
- Query count and performance
- Storage usage
- Error rates

## Troubleshooting

### Common Issues

1. **Database not found**: Ensure the database_id in wrangler.toml matches your actual D1 database
2. **Permission errors**: Make sure you're logged into Wrangler with the correct account
3. **Schema errors**: Drop and recreate tables if schema changes are needed

### Useful Commands

```bash
# Check database info
wrangler d1 info grounded-db

# List all databases
wrangler d1 list

# Execute custom SQL
wrangler d1 execute grounded-db --command="YOUR SQL HERE"
```
