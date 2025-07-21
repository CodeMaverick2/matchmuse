-- BreadButter Talent Matchmaking Database Schema
-- Production-ready schema with proper indexing and constraints

-- Core Tables
CREATE TABLE IF NOT EXISTS talents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    hometown TEXT,
    experience_years INTEGER,
    budget_min INTEGER,
    budget_max INTEGER,
    soft_skills TEXT, -- JSON object
    software_skills TEXT, -- JSON object
    languages TEXT, -- JSON array
    past_credits TEXT, -- JSON array
    endorsements TEXT, -- JSON array
    interest_tags TEXT, -- JSON array
    tier_tags TEXT, -- JSON array
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talent_categories (
    talent_id TEXT,
    category TEXT,
    PRIMARY KEY (talent_id, category),
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS talent_skills (
    talent_id TEXT,
    skill TEXT,
    PRIMARY KEY (talent_id, skill),
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS talent_style_tags (
    talent_id TEXT,
    style_tag TEXT,
    PRIMARY KEY (talent_id, style_tag),
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS talent_portfolio (
    id SERIAL PRIMARY KEY,
    talent_id TEXT,
    title TEXT,
    tags TEXT, -- JSON array
    keywords TEXT, -- JSON array
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS talent_availability (
    id SERIAL PRIMARY KEY,
    talent_id TEXT,
    city TEXT,
    from_date DATE,
    to_date DATE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    industry TEXT,
    sub_industry TEXT,
    city TEXT,
    headquarters_city TEXT,
    operating_cities TEXT, -- JSON array
    contact_person TEXT,
    designation TEXT,
    communication TEXT, -- JSON object
    personality TEXT, -- JSON array
    brand_style TEXT, -- JSON array
    project_behavior TEXT, -- JSON object
    budgeting TEXT, -- JSON object
    client_tier TEXT,
    talent_preferences TEXT, -- JSON object
    project_history TEXT, -- JSON array
    inbound_source TEXT,
    important_dates TEXT, -- JSON object
    social_profiles TEXT, -- JSON object
    notes_and_history TEXT,
    past_feedback TEXT,
    lead_owner TEXT,
    is_repeat_client BOOLEAN DEFAULT FALSE,
    attachments_docs_provided TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_style_preferences (
    client_id TEXT,
    style_preference TEXT,
    PRIMARY KEY (client_id, style_preference),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gigs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    brief_text TEXT,
    category TEXT,
    city TEXT,
    budget INTEGER,
    budget_range TEXT,
    client_id TEXT,
    style_tags TEXT, -- JSON array
    expectation_level TEXT,
    status TEXT DEFAULT 'ready_to_matchmake',
    start_date DATE,
    has_docs BOOLEAN DEFAULT FALSE,
    docs_type TEXT,
    is_date_fixed BOOLEAN DEFAULT FALSE,
    references_given BOOLEAN DEFAULT FALSE,
    urgency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gig_style_tags (
    gig_id TEXT,
    style_tag TEXT,
    PRIMARY KEY (gig_id, style_tag),
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    gig_id TEXT,
    talent_id TEXT,
    score REAL,
    rank INTEGER,
    status TEXT DEFAULT 'pending',
    algorithm_type TEXT DEFAULT 'legacy', -- 'legacy', 'gale-shapley', 'enhanced'
    match_type TEXT DEFAULT 'ranked', -- 'ranked', 'stable'
    stability_verified BOOLEAN DEFAULT FALSE,
    feedback_from_client TEXT,
    feedback_from_talent TEXT,
    shared_on DATE,
    final_decision TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS talent_embeddings (
    talent_id TEXT PRIMARY KEY,
    embedding_vector TEXT, -- JSON array of floats
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gig_embeddings (
    gig_id TEXT PRIMARY KEY,
    embedding_vector TEXT, -- JSON array of floats
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
);

-- Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_talents_city ON talents(city);
CREATE INDEX IF NOT EXISTS idx_talents_experience ON talents(experience_years);
CREATE INDEX IF NOT EXISTS idx_talents_budget ON talents(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_talents_created ON talents(created_at);

CREATE INDEX IF NOT EXISTS idx_talent_categories_category ON talent_categories(category);
CREATE INDEX IF NOT EXISTS idx_talent_skills_skill ON talent_skills(skill);
CREATE INDEX IF NOT EXISTS idx_talent_style_tags_style ON talent_style_tags(style_tag);

CREATE INDEX IF NOT EXISTS idx_talent_availability_city ON talent_availability(city);
CREATE INDEX IF NOT EXISTS idx_talent_availability_dates ON talent_availability(from_date, to_date);

CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(client_tier);

CREATE INDEX IF NOT EXISTS idx_gigs_city ON gigs(city);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_budget ON gigs(budget);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_client ON gigs(client_id);
CREATE INDEX IF NOT EXISTS idx_gigs_start_date ON gigs(start_date);

CREATE INDEX IF NOT EXISTS idx_matches_gig ON matches(gig_id);
CREATE INDEX IF NOT EXISTS idx_matches_talent ON matches(talent_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(score);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_decision ON matches(final_decision);

-- Triggers for updated_at timestamps in PostgreSQL
-- Drop triggers if they exist before creating (idempotent)
DROP TRIGGER IF EXISTS update_talents_timestamp ON talents;
DROP TRIGGER IF EXISTS update_clients_timestamp ON clients;
DROP TRIGGER IF EXISTS update_gigs_timestamp ON gigs;
DROP TRIGGER IF EXISTS update_matches_timestamp ON matches;

-- Drop function if it exists before creating (idempotent)
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_talents_timestamp
  BEFORE UPDATE ON talents
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_clients_timestamp
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_gigs_timestamp
  BEFORE UPDATE ON gigs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_matches_timestamp
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 