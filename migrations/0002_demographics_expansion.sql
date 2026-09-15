-- Phase 2 Migration: Demographics & Welfare Tracking
-- Adds demographic fields and welfare scheme tracking

-- Add demographic fields to households table
ALTER TABLE households ADD COLUMN district TEXT;
ALTER TABLE households ADD COLUMN religion TEXT;
ALTER TABLE households ADD COLUMN sub_community TEXT;
ALTER TABLE households ADD COLUMN reservation_category TEXT;

-- Add women employment tracking to households
ALTER TABLE households ADD COLUMN women_workers_count INTEGER DEFAULT 0;
ALTER TABLE households ADD COLUMN women_work_types TEXT; -- JSON array

-- Lookup table for districts (6 TN districts)
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state TEXT DEFAULT 'Tamil Nadu',
  region TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO districts (id, name, region) VALUES
('dist_001', 'Ramanathapuram', 'South'),
('dist_002', 'Chennai', 'North'),
('dist_003', 'Vellore', 'North'),
('dist_004', 'Tirunelveli', 'South'),
('dist_005', 'Madurai', 'South'),
('dist_006', 'Tiruchirappalli', 'Central');

-- Lookup table for religions
CREATE TABLE IF NOT EXISTS religions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO religions (id, name, description) VALUES
('rel_001', 'Muslim', 'Islam'),
('rel_002', 'Hindu', 'Hinduism'),
('rel_003', 'Christian', 'Christianity'),
('rel_004', 'Other', 'Other religions');

-- Lookup table for Muslim sub-communities ⭐ CRITICAL
CREATE TABLE IF NOT EXISTS sub_communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  religion_id TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (religion_id) REFERENCES religions(id)
);

INSERT OR IGNORE INTO sub_communities (id, name, religion_id, description) VALUES
('subcm_001', 'Labbai', 'rel_001', 'Labbai - Tamil Muslim merchants'),
('subcm_002', 'Rowther', 'rel_001', 'Rowther - Muslim community in Tamil Nadu'),
('subcm_003', 'Marakkayar', 'rel_001', 'Marakkayar - Muslim community'),
('subcm_004', 'Kayalar', 'rel_001', 'Kayalar - Muslim community'),
('subcm_005', 'Dakhni', 'rel_001', 'Dakhni - Urdu-speaking Muslim community'),
('subcm_006', 'Sheik / Sayyid', 'rel_001', 'Sheik / Sayyid - Muslim nobility'),
('subcm_007', 'Other', 'rel_001', 'Other Muslim sub-communities');

-- Lookup table for reservation categories
CREATE TABLE IF NOT EXISTS reservation_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT,
  description TEXT,
  percentage_reserved REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO reservation_categories (id, name, abbreviation, description, percentage_reserved) VALUES
('res_001', 'BC-M (3.5%)', 'BC-M', 'Muslim Backward Caste (3.5% sub-quota)', 3.5),
('res_002', 'BC', 'BC', 'Backward Caste', NULL),
('res_003', 'MBC', 'MBC', 'Most Backward Caste', NULL),
('res_004', 'SC', 'SC', 'Scheduled Caste', NULL),
('res_005', 'ST', 'ST', 'Scheduled Tribe', NULL),
('res_006', 'OC', 'OC', 'Other/General Category', NULL);

-- Lookup table for welfare schemes
CREATE TABLE IF NOT EXISTS welfare_schemes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  scheme_code TEXT,
  description TEXT,
  ministry TEXT,
  target_group TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO welfare_schemes (id, name, scheme_code, description, ministry, target_group) VALUES
('scheme_001', 'PMAY-G', 'PMAY-G', 'Pradhan Mantri Awas Yojana - Gramin (Housing)', 'Ministry of Rural Development', 'Rural households'),
('scheme_002', 'Post-matric scholarship', 'PMS', 'Post-Matric Scholarship Scheme', 'Ministry of Social Justice', 'SC/ST/OBC students'),
('scheme_003', 'MGNREGA', 'MGNREGA', 'Mahatma Gandhi National Rural Employment Guarantee Act', 'Ministry of Rural Development', 'Rural workers'),
('scheme_004', 'Ujjwala', 'PMUY', 'Pradhan Mantri Ujjwala Yojana (LPG)', 'Ministry of Petroleum', 'Below poverty line households'),
('scheme_005', 'Maternity benefit', 'JSY', 'Janani Suraksha Yojana / Maternity Schemes', 'Ministry of Health', 'Pregnant women');

-- Lookup table for women's work types
CREATE TABLE IF NOT EXISTS women_work_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO women_work_types (id, name, category, description) VALUES
('work_001', 'Home-based piece work', 'Informal', 'Tailoring, beedi rolling, agarbatti making'),
('work_002', 'Agricultural labour', 'Informal', 'Farm work, seasonal employment'),
('work_003', 'Salaried (govt/private)', 'Formal', 'Regular employment with salary'),
('work_004', 'Self-employed / shop', 'Informal', 'Own business or shop operation'),
('work_005', 'Domestic work', 'Informal', 'Domestic help or household work');

-- Welfare schemes accessed by households
CREATE TABLE IF NOT EXISTS household_welfare_schemes (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  scheme_id TEXT NOT NULL,
  applied_date DATE,
  approved_date DATE,
  status TEXT DEFAULT 'unknown', -- unknown, applied, approved, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id),
  FOREIGN KEY (scheme_id) REFERENCES welfare_schemes(id),
  UNIQUE(household_id, scheme_id)
);

-- Women employment details
CREATE TABLE IF NOT EXISTS household_women_employment (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  women_workers_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id),
  UNIQUE(household_id)
);

-- Work types for women in a household
CREATE TABLE IF NOT EXISTS household_women_work_types (
  id TEXT PRIMARY KEY,
  employment_id TEXT NOT NULL,
  work_type_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employment_id) REFERENCES household_women_employment(id),
  FOREIGN KEY (work_type_id) REFERENCES women_work_types(id),
  UNIQUE(employment_id, work_type_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_households_district ON households(district);
CREATE INDEX IF NOT EXISTS idx_households_religion ON households(religion);
CREATE INDEX IF NOT EXISTS idx_households_subcommunity ON households(sub_community);
CREATE INDEX IF NOT EXISTS idx_households_reservation ON households(reservation_category);
CREATE INDEX IF NOT EXISTS idx_household_welfare ON household_welfare_schemes(household_id);
CREATE INDEX IF NOT EXISTS idx_welfare_scheme ON household_welfare_schemes(scheme_id);
CREATE INDEX IF NOT EXISTS idx_household_women ON household_women_employment(household_id);
CREATE INDEX IF NOT EXISTS idx_women_work ON household_women_work_types(employment_id);
