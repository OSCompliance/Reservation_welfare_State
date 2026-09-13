-- Cloudflare D1 SQLite Schema for Muslim Welfare AI System

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  enumerator_id TEXT NOT NULL,
  survey_language TEXT NOT NULL,
  household_name TEXT,
  address TEXT,
  phone TEXT,
  total_members INTEGER,
  muslim_members INTEGER,
  status TEXT DEFAULT 'started',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Members table (household members)
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  education TEXT,
  occupation TEXT,
  annual_income INTEGER,
  member_relationship TEXT,
  has_ration_card BOOLEAN,
  religion TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Education details
CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  highest_qualification TEXT,
  school_type TEXT,
  current_status TEXT,
  unemployment_reason TEXT,
  skill_training BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Employment details
CREATE TABLE IF NOT EXISTS employment (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  current_occupation TEXT,
  employment_type TEXT,
  monthly_income INTEGER,
  business_type TEXT,
  years_in_job INTEGER,
  unemployment_duration INTEGER,
  job_seeking BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Reservation benefits tracking
CREATE TABLE IF NOT EXISTS reservation_benefits (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  benefit_type TEXT,
  amount DECIMAL(10, 2),
  status TEXT,
  applied_date DATETIME,
  approved_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Survey responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT,
  answer_text TEXT,
  answer_type TEXT,
  question_number INTEGER,
  language TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Sync queue for offline mode
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  action TEXT,
  data TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME
);

-- Enumerators (field researchers)
CREATE TABLE IF NOT EXISTS enumerators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  region TEXT,
  active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session tracking
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  enumerator_id TEXT NOT NULL,
  current_question_number INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  last_activity DATETIME,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_households_enumerator ON households(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_households_status ON households(status);
CREATE INDEX IF NOT EXISTS idx_members_household ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_responses_household ON survey_responses(household_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sessions_household ON sessions(household_id);
