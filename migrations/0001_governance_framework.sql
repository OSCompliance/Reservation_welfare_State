-- Phase 1 Migration: Governance Framework & Project Management
-- Backward compatible - new tables only

-- Research Projects Table
CREATE TABLE IF NOT EXISTS research_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  budget_amount REAL NOT NULL,
  status TEXT DEFAULT 'planning',
  project_type TEXT DEFAULT 'primary_survey',
  lead_researcher_id TEXT,
  start_date DATE,
  end_date DATE,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Study Phases Table
CREATE TABLE IF NOT EXISTS study_phases (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  phase_type TEXT,
  status TEXT DEFAULT 'pending',
  completion_percentage REAL DEFAULT 0,
  target_start_date DATE,
  target_end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Project Budgets Table
CREATE TABLE IF NOT EXISTS project_budgets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'allocated',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Project Researchers Table
CREATE TABLE IF NOT EXISTS project_researchers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  researcher_id TEXT NOT NULL,
  role TEXT DEFAULT 'researcher',
  allocation_percentage REAL DEFAULT 100,
  start_date DATE,
  end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Researchers Table
CREATE TABLE IF NOT EXISTS researchers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  organization TEXT,
  role TEXT DEFAULT 'researcher',
  is_first_generation BOOLEAN DEFAULT FALSE,
  background_category TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consent Forms Table
CREATE TABLE IF NOT EXISTS consent_forms (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  approval_date DATE,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Consent Signatures Table
CREATE TABLE IF NOT EXISTS consent_signatures (
  id TEXT PRIMARY KEY,
  consent_form_id TEXT NOT NULL,
  household_id TEXT NOT NULL,
  consent_given BOOLEAN,
  signature_method TEXT DEFAULT 'digital',
  audio_file_path TEXT,
  signed_at DATETIME,
  ip_address TEXT,
  device_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consent_form_id) REFERENCES consent_forms(id),
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- IRB Submissions Table
CREATE TABLE IF NOT EXISTS irb_submissions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  submission_date DATE,
  status TEXT DEFAULT 'pending',
  protocol_document TEXT,
  risk_level TEXT DEFAULT 'low',
  review_notes TEXT,
  approved_date DATE,
  approved_by TEXT,
  validity_end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Data Access Logs Table (for audit trail)
CREATE TABLE IF NOT EXISTS data_access_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  researcher_id TEXT,
  table_accessed TEXT,
  action TEXT,
  record_ids_accessed INT,
  pii_exposed BOOLEAN DEFAULT FALSE,
  access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  device_id TEXT,
  FOREIGN KEY (project_id) REFERENCES research_projects(id),
  FOREIGN KEY (researcher_id) REFERENCES researchers(id)
);

-- Anonymization Rules Table
CREATE TABLE IF NOT EXISTS anonymization_rules (
  id TEXT PRIMARY KEY,
  field_name TEXT NOT NULL,
  handling_method TEXT,
  rule_definition TEXT,
  risk_level TEXT DEFAULT 'low',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community Engagements Table
CREATE TABLE IF NOT EXISTS community_engagements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  engagement_type TEXT,
  date_engagement DATE,
  location TEXT,
  attendees_count INT,
  description TEXT,
  feedback_collected TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_lead ON research_projects(lead_researcher_id);
CREATE INDEX IF NOT EXISTS idx_phases_project ON study_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_consent_project ON consent_forms(project_id);
CREATE INDEX IF NOT EXISTS idx_consent_sig_form ON consent_signatures(consent_form_id);
CREATE INDEX IF NOT EXISTS idx_irb_project ON irb_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_access_log_researcher ON data_access_logs(researcher_id);
CREATE INDEX IF NOT EXISTS idx_access_log_time ON data_access_logs(access_time);

-- Create Governance Policies (seed data)
CREATE TABLE IF NOT EXISTS governance_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO governance_policies (id, name, policy_type) VALUES
('policy_consent', 'Informed Consent Policy', 'consent'),
('policy_irb', 'IRB Review Policy', 'irb'),
('policy_security', 'Data Security Policy', 'security'),
('policy_community', 'Community Return Policy', 'community_return'),
('policy_opendata', 'Open Data Policy', 'open_data'),
('policy_equity', 'Researcher Equity Policy', 'equity');
