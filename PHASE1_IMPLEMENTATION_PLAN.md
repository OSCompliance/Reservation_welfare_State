# 🚀 PHASE 1 IMPLEMENTATION PLAN
## Governance + Project Management (Week 1-2)

**Status:** GREENLIT FOR DEVELOPMENT  
**Timeline:** 2 weeks (10 business days)  
**Cost:** $53K  
**Team:** 2 Backend Devs, 1 Frontend Dev, 1 PM  
**Critical Path:** Governance Framework (blocks publication)  

---

## SPRINT 1: Foundation (Days 1-5)

### 🎯 Sprint Goal
Build database schema and core APIs for project management and governance framework

### 📋 Sprint Backlog

#### BACKEND TRACK 1: Research Project Management Schema

**DELIVERABLE: Database Migration #001**

```sql
-- New Tables (Backward Compatible)

CREATE TABLE research_projects (
  id TEXT PRIMARY KEY,                    -- UUID
  title TEXT NOT NULL,
  description TEXT,
  budget_amount REAL NOT NULL,
  budget_currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'planning',         -- planning, active, completed, archived
  start_date DATE,
  end_date DATE,
  lead_researcher_id TEXT,
  project_type TEXT,                      -- secondary_data, primary_survey, qualitative, rti_based
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_researcher_id) REFERENCES researchers(id)
);

CREATE TABLE study_phases (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  phase_name TEXT NOT NULL,               -- e.g., "Phase 1: Scoping", "Phase 2: Fieldwork"
  phase_type TEXT,                        -- planning, active, data_collection, analysis, publication
  status TEXT DEFAULT 'pending',          -- pending, in_progress, completed, blocked
  target_start_date DATE,
  target_end_date DATE,
  completion_percentage REAL DEFAULT 0,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE project_budgets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,                 -- personnel, equipment, travel, supplies, other
  description TEXT,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'allocated',        -- allocated, spent, pending
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE project_researchers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  researcher_id TEXT NOT NULL,
  role TEXT,                              -- lead, co-investigator, field coordinator, analyst
  start_date DATE,
  end_date DATE,
  allocation_percentage REAL,             -- 100 = full-time
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id),
  FOREIGN KEY (researcher_id) REFERENCES researchers(id)
);

CREATE TABLE project_outputs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  output_type TEXT NOT NULL,              -- paper, policy_brief, dataset, report, manual
  title TEXT,
  status TEXT DEFAULT 'in_progress',      -- in_progress, completed, published
  target_date DATE,
  completion_date DATE,
  file_path TEXT,                         -- S3 or Cloudflare path
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE researchers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  organization TEXT,
  role TEXT,                              -- researcher, enumerator, supervisor, data_entry
  is_first_generation BOOLEAN DEFAULT FALSE,
  background_category TEXT,               -- marginalized, underrepresented, other
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_projects_status ON research_projects(status);
CREATE INDEX idx_projects_lead ON research_projects(lead_researcher_id);
CREATE INDEX idx_phases_project ON study_phases(project_id);
CREATE INDEX idx_budgets_project ON project_budgets(project_id);
CREATE INDEX idx_outputs_project ON project_outputs(project_id);
```

**Effort:** 1 dev-day  
**Owner:** Backend Lead  
**Dependencies:** None

---

#### BACKEND TRACK 2: Ethical Governance Schema

**DELIVERABLE: Database Migration #002**

```sql
-- Governance & Compliance Framework

CREATE TABLE governance_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                     -- "Informed Consent", "Data Security", "IRB Review"
  description TEXT,
  policy_type TEXT,                       -- consent, irb, security, community_return, open_data, equity
  status TEXT DEFAULT 'active',
  version TEXT,                           -- e.g., "1.0", "1.1"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consent_forms (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  language TEXT NOT NULL,                 -- ta, en, ur, hi, te, ml
  title TEXT NOT NULL,
  content TEXT NOT NULL,                  -- HTML/Markdown consent form
  status TEXT DEFAULT 'draft',            -- draft, approved, active, archived
  approval_date DATE,
  approved_by TEXT,                       -- researcher ID or admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE consent_signatures (
  id TEXT PRIMARY KEY,
  consent_form_id TEXT NOT NULL,
  household_id TEXT NOT NULL,
  consent_given BOOLEAN,
  signature_method TEXT,                  -- digital, thumbprint, audio, paper
  audio_file_path TEXT,
  signed_at DATETIME,
  ip_address TEXT,
  device_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consent_form_id) REFERENCES consent_forms(id),
  FOREIGN KEY (household_id) REFERENCES households(id)
);

CREATE TABLE irb_submissions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  submission_date DATE,
  status TEXT DEFAULT 'pending',          -- pending, under_review, approved, conditional, rejected
  protocol_document TEXT,                 -- File path
  risk_level TEXT,                        -- minimal, low, high
  review_notes TEXT,
  approved_date DATE,
  approved_by TEXT,                       -- IRB member ID
  validity_end_date DATE,                 -- Annual review requirement
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE irb_board_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,                              -- chair, member, external_reviewer
  institution TEXT,
  expertise_area TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_access_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  researcher_id TEXT NOT NULL,
  table_accessed TEXT,                    -- e.g., "households", "members", "survey_responses"
  action TEXT,                            -- SELECT, UPDATE, DELETE, EXPORT
  record_ids_accessed INT,
  pii_exposed BOOLEAN DEFAULT FALSE,
  access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  device_id TEXT,
  FOREIGN KEY (project_id) REFERENCES research_projects(id),
  FOREIGN KEY (researcher_id) REFERENCES researchers(id)
);

CREATE TABLE anonymization_rules (
  id TEXT PRIMARY KEY,
  field_name TEXT NOT NULL,               -- e.g., "phone", "address", "name"
  handling_method TEXT,                   -- delete, coarsen, generalize, hash
  rule_definition TEXT,                   -- e.g., "coarsen to block level", "keep first 6 digits"
  risk_level TEXT,                        -- low, medium, high
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE community_engagements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  engagement_type TEXT,                   -- workshop, brief, feedback_session, followup_survey
  date DATE,
  location TEXT,
  attendees_count INT,
  description TEXT,
  findings_brief_path TEXT,               -- S3 path to Tamil-language brief
  feedback_collected TEXT,                -- JSON summary of feedback
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE researcher_fellowships (
  id TEXT PRIMARY KEY,
  researcher_id TEXT NOT NULL,
  project_id TEXT,
  fellowship_name TEXT,
  amount REAL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',          -- pending, active, completed
  background_category TEXT,               -- first_generation, underrepresented, other
  selection_criteria_met TEXT,            -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (researcher_id) REFERENCES researchers(id),
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Indexes
CREATE INDEX idx_consent_project ON consent_forms(project_id);
CREATE INDEX idx_consent_sig_form ON consent_signatures(consent_form_id);
CREATE INDEX idx_irb_project ON irb_submissions(project_id);
CREATE INDEX idx_access_log_researcher ON data_access_logs(researcher_id);
CREATE INDEX idx_access_log_time ON data_access_logs(access_time);
```

**Effort:** 1 dev-day  
**Owner:** Backend Lead  
**Dependencies:** None (parallel to Track 1)

---

#### BACKEND TRACK 3: Core APIs

**DELIVERABLE: API Endpoints**

```typescript
// File: src/routes/projects.ts

router.post('/api/projects', async (c) => {
  // Create new research project
  // Body: { title, description, budget_amount, lead_researcher_id, project_type }
  // Returns: { project_id, status, created_at }
  // Triggers: Governance checklist creation
});

router.get('/api/projects', async (c) => {
  // List all projects with filters
  // Query: ?status=active&type=primary_survey&limit=20
  // Returns: [ { id, title, status, budget, lead_researcher, progress_pct } ]
});

router.get('/api/projects/:id', async (c) => {
  // Get project detail with all phases, budgets, outputs
  // Returns: { project, phases, budgets, researchers, outputs, governance_status }
});

router.post('/api/projects/:id/phases', async (c) => {
  // Create study phase
  // Body: { phase_name, phase_type, target_start_date, target_end_date }
  // Returns: { phase_id, status }
});

router.post('/api/projects/:id/budgets', async (c) => {
  // Add budget line item
  // Body: { category, description, amount }
  // Returns: { budget_id, total_allocated }
});

router.get('/api/projects/:id/governance', async (c) => {
  // Get governance status
  // Returns: {
  //   consent_status: "draft|approved|active",
  //   irb_status: "pending|approved|conditional",
  //   data_security_audit: "pending|passed",
  //   access_logs_clean: true|false,
  //   can_collect_data: true|false
  // }
});

router.post('/api/projects/:id/consent-forms', async (c) => {
  // Create/update consent form
  // Body: { language, title, content, status }
  // Returns: { form_id, version }
});

router.post('/api/irb/submissions', async (c) => {
  // Submit IRB protocol
  // Body: { project_id, protocol_document_path, risk_level }
  // Returns: { submission_id, submission_date, status }
});

router.get('/api/governance/compliance-status', async (c) => {
  // System-wide governance compliance dashboard
  // Returns: {
  //   projects_with_approved_consent: N,
  //   projects_pending_irb: N,
  //   data_access_violations: 0,
  //   upcoming_irb_reviews: [],
  //   embargo_expiring_soon: []
  // }
});

// Governance & Compliance Routes
router.post('/api/consent/:householdId/sign', async (c) => {
  // Record consent signature
  // Body: { consent_form_id, consent_given, signature_method, audio_file? }
  // Returns: { signature_id, acknowledged }
});

router.get('/api/data-access-logs', async (c) => {
  // Audit trail for data access
  // Query: ?project_id=X&start_date=Y&end_date=Z
  // Returns: [ { researcher, action, records_accessed, time } ]
});
```

**Effort:** 2 dev-days  
**Owner:** Backend Lead  
**Dependencies:** Schema (Track 1-2)

---

#### FRONTEND TRACK 1: Project Dashboard

**DELIVERABLE: React Components**

```typescript
// File: frontend/src/pages/projects.tsx

Components to Build:
1. ProjectsListPage
   - Table of all projects
   - Filters: status, type, lead researcher
   - Quick stats: total budget, active projects, completion %
   - "Create New Project" button

2. ProjectDetailPage
   - Project header (title, lead, status, budget)
   - Phases timeline (Gantt-like view)
   - Budget breakdown (pie chart + table)
   - Researchers (team members, roles, allocation %)
   - Outputs (papers, briefs, datasets)
   - Governance checklist (✓/✗ for compliance)
   - Recent activity log

3. ProjectFormPage
   - Create/edit project
   - Form fields:
     - Title (required)
     - Description (required)
     - Project type (dropdown: secondary_data, primary_survey, qualitative, rti_based)
     - Budget amount (required)
     - Lead researcher (dropdown)
     - Start date (required)
     - End date (required)
   - Auto-trigger: Governance policy creation
   - Save & Next (go to phase creation)

4. GovernanceChecklistComponent
   - Checklist format
   - Items:
     ☐ Consent forms drafted
     ☐ Consent forms approved by IRB
     ☐ Consent forms approved by legal
     ☐ IRB protocol submitted
     ☐ IRB protocol approved
     ☐ Data security audit completed
     ☐ First enumerator trained on consent
   - Status colors: red (blocking), yellow (pending), green (done)
   - "Can collect data" only when all green

5. BudgetTrackerComponent
   - Budget allocation vs. spent
   - Line-item breakdown
   - Variance analysis
   - Forecast to end date
```

**Effort:** 3 dev-days  
**Owner:** Frontend Dev  
**Dependencies:** Backend APIs

---

### 🎬 Daily Breakdown - Sprint 1

```
DAY 1 (Monday):
  08:00 - Standup (15 min)
  08:15 - Architecture review (30 min, PM leads)
  09:00 - Backend: Database schema design & review (2 devs, 2 hours)
  11:00 - Frontend: Component architecture (1 dev, 1 hour)
  12:00 - Lunch
  13:00 - Backend: Schema migration implementation (2 hours)
  15:00 - Testing schema (1 hour)
  16:00 - End of day sync (15 min)

DAY 2 (Tuesday):
  08:00 - Standup
  08:15 - API design workshop (all, 1 hour)
  09:15 - Backend: API implementation (Track 3)
  12:00 - Lunch
  13:00 - Frontend: Project list page component
  16:30 - Mid-sprint review (15 min)

DAY 3 (Wednesday):
  08:00 - Standup
  09:00 - Backend: API testing & database query optimization
  11:00 - Frontend: Project detail page component
  13:00 - Lunch
  14:00 - Integration testing (APIs ↔ Frontend)
  16:00 - Bug fixes

DAY 4 (Thursday):
  08:00 - Standup
  09:00 - Backend: Governance routes implementation
  11:00 - Frontend: Governance checklist component
  13:00 - Lunch
  14:00 - Access control layer (RBAC integration)
  16:30 - Sprint review preparation

DAY 5 (Friday):
  08:00 - Standup
  09:00 - Final testing & bug fixes
  11:00 - Documentation (API docs, component storybook)
  13:00 - Lunch
  14:00 - Sprint Review (demo to stakeholders)
  15:30 - Sprint Retrospective
  16:30 - End of week sync + planning for Sprint 2
```

---

## SPRINT 2: Governance Deep Dive (Days 6-10)

### 🎯 Sprint Goal
Build consent management, IRB workflows, and access control systems

### 📋 Sprint Backlog

#### BACKEND TRACK 1: Consent Management System

**DELIVERABLE: Consent Form Engine**

```typescript
// File: src/routes/consent.ts

router.post('/api/consent-forms/generate', async (c) => {
  // AI-powered consent form generation using Claude
  // Body: {
  //   project_id,
  //   study_title,
  //   key_risks,
  //   key_benefits,
  //   data_usage,
  //   language: "ta|en|ur" // Generate in multiple languages
  // }
  // Uses: Claude API + Jinja templates
  // Returns: { form_id, content, version, language }
  
  const { project_id, study_title, key_risks, key_benefits, data_usage, language } = await c.req.json();
  
  // Call Claude API to generate form
  const prompt = `Generate an informed consent form for:
    Study: ${study_title}
    Risks: ${key_risks}
    Benefits: ${key_benefits}
    Data use: ${data_usage}
    Language: ${language}
    
    Output format: HTML form with:
    1. Study overview
    2. Procedures
    3. Risks & benefits
    4. Data usage & protection
    5. Voluntary participation
    6. Contact information
    7. Signature block
    
    Make it accessible (plain language, non-technical)`;
  
  const consentContent = await claudeApi.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });
  
  // Save to database
  const formId = `consent_${Date.now()}`;
  await c.env.DB.prepare(`
    INSERT INTO consent_forms (id, project_id, version, language, title, content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    formId,
    project_id,
    '1.0',
    language,
    study_title + ' Consent Form',
    consentContent,
    'draft'
  ).run();
  
  return c.json({ form_id: formId, version: '1.0', status: 'draft' });
});

router.post('/api/consent-forms/:formId/sign', async (c) => {
  // Record household consent signature
  // Body: {
  //   household_id,
  //   consent_given: true|false,
  //   signature_method: "digital|thumbprint|audio|paper",
  //   audio_file?: base64 or S3 path
  // }
  // Returns: { signature_id, timestamp, household_can_participate }
  
  // Validation: Household must have this form
  // Effect: Unlock data collection for this household
});

router.get('/api/consent-forms/:projectId/status', async (c) => {
  // Get consent completion rate for project
  // Returns: {
  //   total_households_enrolled: N,
  //   consents_signed: N,
  //   consent_rate_pct: NN.N,
  //   missing_consent: [ household_ids ],
  //   consents_pending_review: [ household_ids ]
  // }
});
```

**Effort:** 2 dev-days  
**Owner:** Backend Lead

---

#### BACKEND TRACK 2: IRB Workflow Engine

**DELIVERABLE: IRB Protocol Management**

```typescript
// File: src/routes/irb.ts

router.post('/api/irb/protocols/generate', async (c) => {
  // AI-powered IRB protocol generation
  // Body: {
  //   project_id,
  //   study_design,
  //   sample_description,
  //   data_collection_procedures,
  //   risks_and_benefits,
  //   confidentiality_measures,
  //   researcher_qualifications
  // }
  // Returns: { protocol_id, document_path, ready_for_submission }
});

router.post('/api/irb/submissions', async (c) => {
  // Submit protocol to IRB board
  // Body: { project_id, protocol_id }
  // Triggers: Email to IRB members
  // Returns: { submission_id, submission_date }
});

router.post('/api/irb/board-meetings', async (c) => {
  // Schedule monthly IRB board meeting
  // Body: { date, location, protocols_to_review: [] }
  // Returns: { meeting_id, calendar_invites_sent }
});

router.post('/api/irb/reviews/:submissionId/decision', async (c) => {
  // IRB decision (Approved / Conditional / Rejected)
  // Body: {
  //   decision: "approved|conditional|rejected",
  //   reviewer_id,
  //   decision_notes,
  //   conditions_if_conditional?: []
  // }
  // Effect: If approved, unlock full data collection
});

router.get('/api/irb/status-dashboard', async (c) => {
  // IRB admin dashboard
  // Returns: {
  //   submissions_pending_review: N,
  //   submissions_requiring_response: N,
  //   upcoming_board_meetings: [],
  //   annually_expiring_approvals: []
  // }
});
```

**Effort:** 2 dev-days  
**Owner:** Backend Lead

---

#### BACKEND TRACK 3: Access Control & Audit Logging

**DELIVERABLE: RBAC + Audit Trail**

```typescript
// File: src/middleware/rbac.ts

// Role definitions
enum Role {
  SUPER_ADMIN = 'super_admin',      // All access
  RESEARCH_ADMIN = 'research_admin', // Project management, governance
  PRINCIPAL_INVESTIGATOR = 'pi',     // Own projects only
  CO_INVESTIGATOR = 'co_inv',        // Assigned projects only
  DATA_ANALYST = 'analyst',          // View data for assigned projects
  ENUMERATOR = 'enumerator',         // Collect data only
  RESPONDENT = 'respondent',         // View own data only
  AUDITOR = 'auditor'                // View-only access logs & compliance
}

// Permission matrix
const permissions = {
  'super_admin': ['*'],
  'research_admin': [
    'create_project', 'edit_project', 'delete_project',
    'view_all_projects', 'approve_consent',
    'view_access_logs', 'manage_researchers'
  ],
  'pi': [
    'create_project', 'edit_project',
    'view_own_project', 'manage_own_researchers',
    'view_own_data', 'export_own_data'
  ],
  'co_inv': [
    'view_assigned_project', 'manage_assigned_data',
    'view_assigned_data'
  ],
  'analyst': [
    'view_assigned_data', 'run_analyses', 'export_aggregate_data'
  ],
  'enumerator': [
    'collect_data_for_assigned_households',
    'view_assigned_household_data'
  ],
  'respondent': [
    'view_own_household_data', 'view_own_responses'
  ],
  'auditor': [
    'view_access_logs', 'view_compliance_status', 'view_all_projects'
  ]
};

// Middleware: Check permission before API call
function checkPermission(requiredPermission: string) {
  return async (c, next) => {
    const user = c.get('user');
    const role = user.role;
    
    if (!permissions[role]?.includes(requiredPermission) &&
        permissions[role] !== ['*']) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Log access
    await logDataAccess({
      researcher_id: user.id,
      action: requiredPermission,
      timestamp: new Date(),
      ip_address: c.req.header('x-forwarded-for'),
      device_id: c.get('device_id')
    });
    
    await next();
  };
}

// Usage
router.get('/api/projects/:id',
  checkPermission('view_assigned_project'),
  (c) => { /* handler */ }
);
```

**Effort:** 2 dev-days  
**Owner:** Backend Lead (Security focus)

---

#### FRONTEND TRACK 1: Consent Management UI

**DELIVERABLE: React Components**

```typescript
// File: frontend/src/pages/governance/consent-management.tsx

Components:
1. ConsentFormGeneratorPage
   - Form fields for AI generation
   - Preview of generated form
   - Multi-language tabs
   - Approval workflow buttons
   - Version history

2. ConsentSigningPage (For Enumerators)
   - Display consent form
   - Signature method selector
   - Audio consent recording (WebRTC)
   - Thumbprint capture (tablet UX)
   - Digital signature
   - Confirmation

3. ConsentStatusDashboard
   - Project-level consent completion
   - Progress bar (signed / total)
   - List of households pending consent
   - Export unsigned households
   - Resend consent links (email/SMS)

4. ConsentAuditLog
   - Who signed what when
   - Signature method used
   - Approval flow tracking
   - Export compliance report
```

**Effort:** 3 dev-days  
**Owner:** Frontend Dev

---

#### FRONTEND TRACK 2: IRB Management UI

**DELIVERABLE: React Components**

```typescript
// File: frontend/src/pages/governance/irb-management.tsx

Components:
1. IRBProtocolGeneratorPage
   - AI-powered form input
   - Protocol preview
   - Document download
   - Submission readiness checklist

2. IRBSubmissionPage
   - Submit protocol
   - Select IRB board members
   - Set review deadline
   - Track submission status

3. IRBBoardDashboard (Admin Only)
   - Submissions awaiting review
   - Board member assignments
   - Meeting scheduler
   - Decision tracker
   - Expiration alerts

4. IRBDecisionForm (Board Member Only)
   - Protocol details
   - Decision selector
   - Conditions input (if conditional)
   - Decision letter generation
   - Email notification
```

**Effort:** 2 dev-days  
**Owner:** Frontend Dev

---

#### FRONTEND TRACK 3: Access Control UI

**DELIVERABLE: React Components**

```typescript
// File: frontend/src/pages/governance/access-control.tsx

Components:
1. ResearcherManagementPage
   - List of researchers with roles
   - Role assignment interface
   - Permission matrix viewer
   - Deactivate researcher
   - Export access report

2. AccessAuditLogPage
   - Filter by: date range, researcher, action, table
   - Table view of all access
   - Export audit trail
   - Flagged suspicious access
   - Data download tracking

3. ComplianceDashboard
   - System-wide governance health
   - Projects with approved consent
   - Projects pending IRB
   - Data access violations (if any)
   - Upcoming annual reviews
   - Embargo expiration alerts
```

**Effort:** 2 dev-days  
**Owner:** Frontend Dev

---

### 🎬 Daily Breakdown - Sprint 2

```
DAY 6 (Monday):
  08:00 - Standup
  08:15 - Sprint 2 kickoff (1 hour)
  09:15 - Backend: Consent form generator (Claude integration)
  12:00 - Lunch
  13:00 - Frontend: Consent form UI
  16:00 - Integration test

DAY 7 (Tuesday):
  08:00 - Standup
  09:00 - Backend: IRB workflow APIs
  11:00 - Frontend: IRB management UI
  13:00 - Lunch
  14:00 - Testing & bug fixes

DAY 8 (Wednesday):
  08:00 - Standup
  09:00 - Backend: RBAC + access logging middleware
  11:00 - Frontend: Access control management UI
  13:00 - Lunch
  14:00 - Security audit of permission logic
  16:00 - Integration testing

DAY 9 (Thursday):
  08:00 - Standup
  09:00 - Backend: Final governance routes
  11:00 - Frontend: Compliance dashboard
  13:00 - Lunch
  14:00 - End-to-end testing (data collection workflow with governance checks)
  16:00 - Documentation

DAY 10 (Friday):
  08:00 - Standup
  09:00 - Load testing & performance tuning
  11:00 - Security review (PII handling, access logs)
  13:00 - Lunch
  14:00 - Sprint review & demo to stakeholders
  15:30 - Sprint retrospective
  16:30 - Planning for deployment
```

---

## 📊 CROSS-SPRINT INTEGRATION POINTS

### Survey Form ↔ Governance

```
Flow:
1. User wants to start household survey
2. System checks: Project exists? ✓
3. System checks: Consent form approved? (yes/no)
   → If NO: Block survey, show message "IRB approval required"
   → If YES: Continue
4. System checks: Respondent signed consent? (yes/no)
   → If NO: Show consent form to respondent
   → Respondent signs (digital/audio/thumbprint)
   → Record signature in consent_signatures table
5. System checks: Researcher has permission to collect? (RBAC)
   → If NO: Block survey (403 Unauthorized)
   → If YES: Allow data collection
6. Log access: researcher_id, action="collect_data", timestamp, device_id
7. Collect household data
8. Save to database
9. Log data saved
```

---

## 🔐 Security Checkpoints

### Before Any Data Collection Can Start

```
☐ Project created with IRB board assigned
☐ Consent form generated & approved by IRB
☐ Consent form translated to local language (Tamil)
☐ Researcher identity verified & credentials checked
☐ Researcher role assigned (RBAC)
☐ Researcher trained on consent process
☐ Audio consent option enabled for enumerators
☐ Access logging configured
☐ Data encryption enabled
☐ First household can be approached only AFTER all ✓
```

---

## 📈 Success Metrics (End of Phase 1)

### Technical Metrics
```
✓ 7 new database tables created (backward compatible)
✓ 15+ new API endpoints implemented
✓ 10+ new React components built
✓ 100% API documentation complete
✓ 90%+ code test coverage (unit + integration)
✓ Zero PII in logs
✓ Access audit trail clean
```

### Functional Metrics
```
✓ Research admin can create projects
✓ Consent forms can be generated & approved
✓ IRB board can submit/review protocols
✓ Researchers assigned with RBAC
✓ Household data collection gated behind consent
✓ All access logged & auditable
✓ Can export compliance report
```

### Compliance Metrics
```
✓ No data collection without approved consent
✓ No data access without RBAC permission
✓ 100% of data access logged
✓ IRB audit trail complete
✓ Confidentiality controls verified
✓ Ready for institutional IRB approval
```

---

## 🚨 Risk Mitigation

### Schema Migration Risks

```
Risk: New tables break existing survey flow
Mitigation:
  ✓ New tables are additive (no changes to household/members/survey_responses)
  ✓ Backward-compatible schema design
  ✓ Extensive migration testing on staging
  ✓ Rollback procedure tested
  ✓ Data validation suite before/after migration
```

### Claude API Rate Limits

```
Risk: Document generation hits API limits
Mitigation:
  ✓ Implement caching layer (redis)
  ✓ Queue system for batch generation
  ✓ Fallback to template-based generation
  ✓ Monitor token usage daily
```

### Security Gaps

```
Risk: Access control not properly enforced
Mitigation:
  ✓ Security audit during Phase 1 (parallel)
  ✓ Penetration testing on RBAC layer
  ✓ Code review focused on permission checks
  ✓ Staging environment mimics production exactly
```

---

## 📋 Deployment Plan

### Pre-Deployment Checklist

```
48 Hours Before:
☐ All tests passing (unit, integration, e2e)
☐ Performance testing completed (load test 100 concurrent users)
☐ Security audit signed off
☐ Database backup taken
☐ Rollback procedure tested
☐ Stakeholder notification sent
☐ Support team trained

Day of Deployment:
☐ 06:00 - Final backup
☐ 06:30 - Start migration (off-peak hours)
☐ 07:00 - Run data validation suite
☐ 08:00 - Deploy backend APIs
☐ 08:30 - Deploy frontend
☐ 09:00 - Smoke tests
☐ 10:00 - Open to research admin only (limited release)
☐ 11:00 - Monitor for 1 hour
☐ 12:00 - Full rollout to all users
☐ EOD - Success celebration 🎉
```

---

## 📞 Support & Escalation

### Phase 1 Support Structure

```
Daily:
  ├─ 09:00 Standup (15 min, all team)
  ├─ 12:00 Integration check (Tech lead)
  └─ 16:00 Daily debrief (PM leads)

Weekly:
  ├─ Monday: Kickoff sprint
  ├─ Wednesday: Mid-sprint check
  ├─ Friday: Sprint review + retro
  └─ Friday: Phase 2 planning

Escalation Path:
  ├─ Team level: Tech lead
  ├─ Program level: PM
  ├─ Stakeholder level: Executive sponsor
  └─ Critical blocker: Emergency meeting
```

---

## 💰 Budget Allocation

```
PHASE 1 COSTS: $53,000

Personnel: $48,000
  ├─ Backend Lead (10 days × $400/day): $4,000
  ├─ Backend Dev #2 (10 days × $300/day): $3,000
  ├─ Frontend Dev (10 days × $350/day): $3,500
  ├─ PM (10 days × $400/day): $4,000
  └─ QA/Testing (shared with other work): $2,000

Infrastructure: $3,000
  ├─ Additional Cloudflare D1 capacity: $500
  ├─ Claude API calls (document generation): $1,500
  └─ Staging environment (temporary): $1,000

External Services: $2,000
  ├─ Security audit (partial): $1,200
  └─ Legal review (governance framework): $800

Contingency: $3,000
  └─ Buffer for unknowns (10% of budget)
```

---

## 📅 Timeline Summary

```
WEEK 1 (Days 1-5): FOUNDATION
├─ Database schema migration ✓
├─ Core APIs implemented ✓
├─ Project management dashboard ✓
└─ Governance checklist framework ✓

WEEK 2 (Days 6-10): GOVERNANCE
├─ Consent management system ✓
├─ IRB workflow engine ✓
├─ Access control & RBAC ✓
└─ End-to-end testing ✓

POST-SPRINT:
├─ Phase 1 deployment
├─ Researcher onboarding
├─ First study created in system
└─ READY FOR PHASE 2 ✓
```

---

## ✅ Definition of Done (DoD)

```
PHASE 1 IS COMPLETE WHEN:

Code Quality:
☐ All code reviewed (2+ reviewers)
☐ All tests passing (unit, integration, e2e)
☐ No critical/high-severity bugs
☐ Code coverage > 90%

Documentation:
☐ API documentation complete
☐ Database schema documented
☐ User guide written
☐ Troubleshooting guide written

Security:
☐ Security audit passed
☐ PII handling verified
☐ Access logs clean
☐ Encryption enabled

Deployment:
☐ Staging environment mirrors production
☐ Rollback procedure tested
☐ Backup & recovery tested
☐ Performance baseline established

Stakeholder:
☐ Demo delivered to research leadership
☐ Feedback incorporated
☐ Governance board approved for pilot
☐ First researcher can create project
```

---

**NEXT STEP:** Approve Phase 1 budget & team allocation

**DECISION REQUIRED:** Proceed with implementation? → YES ✓

---

**Document Version:** 1.0  
**Status:** READY FOR IMPLEMENTATION  
**Next Review:** End of Sprint 1 (Day 5)

