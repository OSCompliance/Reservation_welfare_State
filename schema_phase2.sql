-- Phase 2: Agent Processing Tables

-- Agent processing logs
CREATE TABLE IF NOT EXISTS agent_processing_logs (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  input_text TEXT,
  parsed_data TEXT, -- JSON
  validation_result TEXT, -- JSON
  confidence_score REAL,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Agent suggestions (for user review)
CREATE TABLE IF NOT EXISTS agent_suggestions (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  field_name TEXT,
  suggested_value TEXT,
  confidence_score REAL,
  user_accepted BOOLEAN,
  user_edit TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Bulk import jobs
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id TEXT PRIMARY KEY,
  file_name TEXT,
  file_format TEXT, -- csv, excel, json
  status TEXT DEFAULT 'pending',
  records_count INTEGER,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_log TEXT, -- JSON array of errors
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_by TEXT
);

-- Bulk import records
CREATE TABLE IF NOT EXISTS bulk_import_records (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  row_number INTEGER,
  input_text TEXT,
  household_id TEXT,
  status TEXT, -- success, error, pending
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES bulk_import_jobs(id),
  FOREIGN KEY (household_id) REFERENCES households(id)
);

-- Agent performance metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
  id TEXT PRIMARY KEY,
  agent_name TEXT,
  operation TEXT, -- parse, validate, enrich
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_processing_time_ms REAL,
  avg_confidence_score REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_household ON agent_processing_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_processing_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_suggestions_household ON agent_suggestions(household_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_accepted ON agent_suggestions(user_accepted);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON bulk_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON bulk_import_jobs(started_at);

CREATE INDEX IF NOT EXISTS idx_import_records_job ON bulk_import_records(job_id);
CREATE INDEX IF NOT EXISTS idx_import_records_household ON bulk_import_records(household_id);
