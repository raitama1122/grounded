-- Grounded Analysis Database Schema
-- This schema stores users, user queries, guardian responses, and analysis summaries

-- Table to store users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- UUID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,  -- Hashed password
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),  -- User plan
    plan_expires_at DATETIME,  -- For PRO plan expiration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table to store user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,  -- Session token
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to store analysis sessions
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,  -- UUID
    user_id TEXT,  -- NULL for anonymous users
    query TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    user_ip TEXT,
    user_agent TEXT,
    is_public BOOLEAN DEFAULT FALSE,  -- Whether analysis can be shared publicly
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table to store individual guardian responses
CREATE TABLE IF NOT EXISTS guardian_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL,
    guardian_id TEXT NOT NULL,
    guardian_name TEXT NOT NULL,
    guardian_avatar TEXT NOT NULL,
    guardian_personality TEXT NOT NULL,
    guardian_perspective TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

-- Table to store insight summaries
CREATE TABLE IF NOT EXISTS insight_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL UNIQUE,
    main_themes TEXT NOT NULL,  -- JSON array
    consensus TEXT NOT NULL,
    divergent_views TEXT,       -- JSON array
    action_items TEXT NOT NULL, -- JSON array
    overall_sentiment TEXT NOT NULL CHECK (overall_sentiment IN ('positive', 'neutral', 'negative')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

-- Table to store analytics and usage stats
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,  -- 'query_submitted', 'analysis_viewed', 'analysis_shared'
    analysis_id TEXT,
    metadata TEXT,             -- JSON for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL
);

-- Table to track daily usage for rate limiting
CREATE TABLE IF NOT EXISTS user_daily_usage (
    id TEXT PRIMARY KEY,  -- UUID
    user_id TEXT NOT NULL,
    usage_date DATE NOT NULL,  -- Date in YYYY-MM-DD format
    query_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, usage_date)  -- One record per user per day
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_guardian_responses_analysis_id ON guardian_responses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_guardian_responses_guardian_id ON guardian_responses(guardian_id);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_analysis_id ON insight_summaries(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_user_daily_usage_user_date ON user_daily_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_usage_date ON user_daily_usage(usage_date);
