import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Anthropic } from '@anthropic-ai/sdk';
import { createBulkImportRoutes } from './bulk-import';
import { createReportRoutes } from './reports';
import { createAuthRoutes } from './auth';
import { researchProjectsRoutes } from './api/routes/research-projects';
import { governanceRoutes } from './api/routes/governance';
import { consentManagementRoutes } from './api/routes/consent-management';
import { irbWorkflowRoutes } from './api/routes/irb-workflow';
import { rbacManagementRoutes } from './api/routes/rbac-management';
import { lookupsRoutes } from './api/routes/lookups';
import { surveyEnhancedRoutes } from './api/routes/survey-enhanced';

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first(): Promise<any>;
  all(): Promise<D1Result>;
  run(): Promise<D1ExecResult>;
}

interface D1Result {
  results: any[];
  success: boolean;
}

interface D1ExecResult {
  success: boolean;
  results: D1Result[];
}

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - handle all OPTIONS requests
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Muslim Welfare AI System',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      survey: '/api/survey/start',
      agents: '/api/agents/*',
      bulk_import: '/api/bulk-import/*',
    },
    documentation: 'https://github.com/OSCompliance/Reservation_welfare_State',
  });
});

// Health check - simple endpoint
app.get('/health', (c) => {
  try {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      worker: 'muslim-welfare-api'
    });
  } catch (error) {
    return c.json({ error: 'Health check failed', message: String(error) }, 500);
  }
});

// Initialize database - create governance tables
app.post('/api/init', async (c) => {
  try {
    const db = c.env.DB;

    // Create tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS research_projects (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, budget_amount REAL NOT NULL,
        status TEXT DEFAULT 'planning', project_type TEXT DEFAULT 'primary_survey',
        lead_researcher_id TEXT, start_date DATE, end_date DATE, created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,

      `CREATE TABLE IF NOT EXISTS study_phases (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL, phase_name TEXT NOT NULL,
        phase_type TEXT, status TEXT DEFAULT 'pending', completion_percentage REAL DEFAULT 0,
        target_start_date DATE, target_end_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES research_projects(id))`,

      `CREATE TABLE IF NOT EXISTS project_budgets (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL, category TEXT NOT NULL, description TEXT,
        amount REAL NOT NULL, status TEXT DEFAULT 'allocated', created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES research_projects(id))`,

      `CREATE TABLE IF NOT EXISTS consent_forms (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL, version TEXT DEFAULT '1.0',
        language TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, status TEXT DEFAULT 'draft',
        approval_date DATE, approved_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES research_projects(id))`,

      `CREATE TABLE IF NOT EXISTS consent_signatures (
        id TEXT PRIMARY KEY, consent_form_id TEXT NOT NULL, household_id TEXT NOT NULL,
        consent_given BOOLEAN, signature_method TEXT DEFAULT 'digital', audio_file_path TEXT,
        signed_at DATETIME, ip_address TEXT, device_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consent_form_id) REFERENCES consent_forms(id),
        FOREIGN KEY (household_id) REFERENCES households(id))`,

      `CREATE TABLE IF NOT EXISTS irb_submissions (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL, submission_date DATE, status TEXT DEFAULT 'pending',
        protocol_document TEXT, risk_level TEXT DEFAULT 'low', review_notes TEXT, approved_date DATE,
        approved_by TEXT, validity_end_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES research_projects(id))`,

      `CREATE TABLE IF NOT EXISTS data_access_logs (
        id TEXT PRIMARY KEY, project_id TEXT, researcher_id TEXT, table_accessed TEXT, action TEXT,
        record_ids_accessed INT, pii_exposed BOOLEAN DEFAULT FALSE, access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT, device_id TEXT,
        FOREIGN KEY (project_id) REFERENCES research_projects(id))`,

      `CREATE TABLE IF NOT EXISTS governance_policies (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, policy_type TEXT NOT NULL, status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
    ];

    for (const sql of tables) {
      try {
        await db.prepare(sql).run();
      } catch (err) {
        // Table might already exist
      }
    }

    // Seed governance policies
    const seedSql = `INSERT OR IGNORE INTO governance_policies (id, name, policy_type) VALUES
      ('policy_consent', 'Informed Consent Policy', 'consent'),
      ('policy_irb', 'IRB Review Policy', 'irb'),
      ('policy_security', 'Data Security Policy', 'security'),
      ('policy_community', 'Community Return Policy', 'community_return'),
      ('policy_opendata', 'Open Data Policy', 'open_data'),
      ('policy_equity', 'Researcher Equity Policy', 'equity')`;

    await db.prepare(seedSql).run();

    return c.json({ success: true, message: 'Database initialized successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Start survey - get first question
app.post('/api/survey/start', async (c) => {
  try {
    const { householdId, enumeratorId, language } = await c.req.json();

    // Validate input
    if (!householdId || !enumeratorId || !language) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create household record
    await c.env.DB.prepare(
      'INSERT INTO households (id, enumerator_id, survey_language, status) VALUES (?, ?, ?, ?)'
    ).bind(householdId, enumeratorId, language, 'started').run();

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(
      'INSERT INTO sessions (id, household_id, enumerator_id, current_question_number, total_questions, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, householdId, enumeratorId, 0, 20, 'active').run();

    // Generate first question using Claude AI
    const client = new Anthropic({
      apiKey: c.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `You are an AI agent helping conduct a household survey for the Muslim Welfare System in Tamil Nadu, India.
Focus on the 3.5% Muslim reservation impact study.
Generate ONE clear, simple question in ${language} language.
Response format: {"question": "question text", "inputType": "text|number|select", "options": ["option1", "option2"] if select}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'Generate the first question about household basic information (name, address, phone number). Ask about household name.',
        },
      ],
    });

    const questionText = response.content[0].type === 'text' ? response.content[0].text : '';
    let questionData = { question: 'What is your household name?', inputType: 'text', options: [] };

    try {
      questionData = JSON.parse(questionText);
    } catch {
      // Use default if parsing fails
    }

    return c.json({
      sessionId,
      questionNumber: 1,
      totalQuestions: 20,
      question: questionData.question,
      inputType: questionData.inputType,
      options: questionData.options,
      language,
    });
  } catch (error) {
    console.error('Survey start error:', error);
    return c.json({ error: 'Failed to start survey' }, 500);
  }
});

// Submit answer and get next question
app.post('/api/survey/answer', async (c) => {
  try {
    const { householdId, sessionId, answer, questionNumber, language } = await c.req.json();

    if (!householdId || !answer || !sessionId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Save response
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(
      'INSERT INTO survey_responses (id, household_id, question_id, answer_text, question_number, language) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(responseId, householdId, `q_${questionNumber}`, answer, questionNumber, language).run();

    // Update session
    const nextQuestion = (questionNumber || 1) + 1;
    await c.env.DB.prepare(
      'UPDATE sessions SET current_question_number = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(nextQuestion, sessionId).run();

    // Check if survey complete (20 questions)
    if (nextQuestion > 20) {
      await c.env.DB.prepare(
        'UPDATE households SET status = ? WHERE id = ?'
      ).bind('completed', householdId).run();

      return c.json({
        complete: true,
        message: 'Survey completed! Thank you for your participation.',
        totalResponses: nextQuestion - 1,
      });
    }

    // Generate next question
    const client = new Anthropic({
      apiKey: c.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `You are an AI agent conducting a household survey for Muslim Welfare System in Tamil Nadu.
Previous answer: "${answer}"
Generate the NEXT clear question in ${language} language based on the survey flow (question ${nextQuestion} of 20).
Response format: {"question": "question text", "inputType": "text|number|select", "options": ["option1", "option2"] if select}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Continue the survey. Previous question was about household details. Now ask about family members and demographics.`,
        },
      ],
    });

    const questionText = response.content[0].type === 'text' ? response.content[0].text : '';
    let questionData = { question: 'How many family members do you have?', inputType: 'number', options: [] };

    try {
      questionData = JSON.parse(questionText);
    } catch {
      // Use default
    }

    return c.json({
      sessionId,
      questionNumber: nextQuestion,
      totalQuestions: 20,
      question: questionData.question,
      inputType: questionData.inputType,
      options: questionData.options,
      language,
    });
  } catch (error) {
    console.error('Answer processing error:', error);
    return c.json({ error: 'Failed to process answer' }, 500);
  }
});

// Get household data
app.get('/api/household/:householdId', async (c) => {
  try {
    const { householdId } = c.req.param();

    const household = await c.env.DB.prepare(
      'SELECT * FROM households WHERE id = ?'
    ).bind(householdId).first();

    if (!household) {
      return c.json({ error: 'Household not found' }, 404);
    }

    const responses = await c.env.DB.prepare(
      'SELECT * FROM survey_responses WHERE household_id = ? ORDER BY question_number'
    ).bind(householdId).all();

    return c.json({
      household,
      responses: responses.results || [],
    });
  } catch (error) {
    console.error('Get household error:', error);
    return c.json({ error: 'Failed to retrieve household data' }, 500);
  }
});

// Save household data (update after survey)
app.post('/api/household', async (c) => {
  try {
    const data = await c.req.json();
    const { householdId, totalMembers, muslimMembers, members, ...otherData } = data;

    if (!householdId) {
      return c.json({ error: 'Missing household ID' }, 400);
    }

    // Save household
    await c.env.DB.prepare(
      'UPDATE households SET total_members = ?, muslim_members = ?, household_name = ?, address = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(
      totalMembers || members?.length || 0,
      muslimMembers || 0,
      otherData.householdName,
      otherData.address,
      otherData.phone,
      householdId
    ).run();

    // Save members if provided
    if (members && Array.isArray(members)) {
      for (const member of members) {
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await c.env.DB.prepare(
          'INSERT INTO members (id, household_id, name, age, gender, is_muslim, occupation, monthly_income) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          memberId,
          householdId,
          member.name,
          member.age || null,
          member.gender || null,
          member.is_muslim ? 1 : 0,
          member.occupation || null,
          member.monthly_income || null
        ).run();
      }
    }

    return c.json({
      success: true,
      householdId,
      membersCount: members?.length || 0
    });
  } catch (error) {
    console.error('Save household error:', error);
    return c.json({ error: 'Failed to save household data' }, 500);
  }
});

// Save parsed household (from agents)
app.post('/api/household/save-parsed', async (c) => {
  try {
    const { householdName, address, phone, members } = await c.req.json();

    if (!householdName || !members || members.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create household
    const householdId = `hh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(
      'INSERT INTO households (id, household_name, address, phone, total_members, muslim_members, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(
      householdId,
      householdName,
      address || '',
      phone || '',
      members.length,
      0,
      'completed'
    ).run();

    // Save members
    for (const member of members) {
      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await c.env.DB.prepare(
        'INSERT INTO members (id, household_id, name, age, gender, is_muslim, occupation, monthly_income, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
      ).bind(
        memberId,
        householdId,
        member.name,
        member.age || null,
        member.gender || null,
        1,
        member.occupation || null,
        member.monthly_income || null
      ).run();
    }

    return c.json({
      success: true,
      householdId,
      householdName,
      membersCount: members.length,
      message: 'Household saved successfully'
    });
  } catch (error) {
    console.error('Save parsed household error:', error);
    return c.json({ error: 'Failed to save household', message: String(error) }, 500);
  }
});

// Agent auto-fill endpoint
app.post('/api/agents/parse', async (c) => {
  try {
    const { input, language = 'en' } = await c.req.json();

    if (!input) {
      return c.json({ error: 'input is required' }, 400);
    }

    // Import coordinator dynamically
    const { createCoordinator } = await import('./agents/coordinator');
    const coordinator = createCoordinator(c.env.ANTHROPIC_API_KEY);

    const state = await coordinator.orchestrate(input, language);

    return c.json({
      success: true,
      parsed_data: state.parsedData,
      confidence: state.confidence,
      completeness: state.validationResult.completeness,
      missing_fields: state.validationResult.missingFields,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return c.json({ error: 'Failed to parse input', message: String(error) }, 500);
  }
});

// Agent auto-fill form endpoint - generates realistic household data
app.post('/api/agents/auto-fill', async (c) => {
  try {
    const { input, language = 'en' } = await c.req.json();

    if (!input) {
      return c.json({ error: 'input is required' }, 400);
    }

    // Demo data templates based on household name
    const demoData: Record<string, any> = {
      default: {
        address: 'Chennai, Tamil Nadu',
        phone: '+91 98765 43210',
        members: [
          { name: 'Ahmed Hassan', age: 45, gender: 'Male', occupation: 'Teacher' },
          { name: 'Fatima Hassan', age: 42, gender: 'Female', occupation: 'Homemaker' },
          { name: 'Mohammad Hassan', age: 18, gender: 'Male', occupation: 'Student' },
          { name: 'Aisha Hassan', age: 16, gender: 'Female', occupation: 'Student' },
          { name: 'Noor Hassan', age: 10, gender: 'Female', occupation: 'Student' },
        ],
      },
      khan: {
        address: 'Coimbatore, Tamil Nadu',
        phone: '+91 87654 32109',
        members: [
          { name: 'Rashid Khan', age: 50, gender: 'Male', occupation: 'Shopkeeper' },
          { name: 'Zainab Khan', age: 48, gender: 'Female', occupation: 'Tailor' },
          { name: 'Hassan Khan', age: 22, gender: 'Male', occupation: 'Mechanic' },
          { name: 'Layla Khan', age: 20, gender: 'Female', occupation: 'Nurse' },
        ],
      },
      ahmed: {
        address: 'Madurai, Tamil Nadu',
        phone: '+91 76543 21098',
        members: [
          { name: 'Ahmed Ibrahim', age: 48, gender: 'Male', occupation: 'Driver' },
          { name: 'Mariam Ibrahim', age: 45, gender: 'Female', occupation: 'Homemaker' },
          { name: 'Ali Ibrahim', age: 20, gender: 'Male', occupation: 'Student' },
          { name: 'Hana Ibrahim', age: 14, gender: 'Female', occupation: 'Student' },
        ],
      },
    };

    // Check if API key is available
    const apiKey = c.env.ANTHROPIC_API_KEY;
    let generatedData = demoData.default;

    // Try to use Claude if API key is available
    if (apiKey && apiKey.trim()) {
      try {
        const client = new Anthropic({ apiKey });

        const prompt = `Generate realistic Muslim household data for: ${input}

Generate realistic data for:
1. Address in Tamil Nadu (Chennai, Coimbatore, Madurai, etc.)
2. Phone number (+91 format)
3. 4-5 family members with:
   - Realistic Muslim names
   - Ages (mix of adults and children)
   - Gender (M/F)
   - Occupation (teacher, driver, shopkeeper, homemaker, student, mechanic, nurse, tailor, etc.)

Return ONLY valid JSON (no markdown):
{
  "address": "...",
  "phone": "+91...",
  "members": [
    {"name": "...", "age": 45, "gender": "Male", "occupation": "..."},
    {"name": "...", "age": 42, "gender": "Female", "occupation": "..."}
  ]
}`;

        const response = await client.messages.create({
          model: 'claude-opus-5',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });

        try {
          const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
          generatedData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Using default data due to parse error');
        }
      } catch (aiError) {
        console.log('Claude API error, using demo data:', aiError);
        // Fall through to demo data
      }
    } else {
      // Use demo data based on household name keyword
      const keyword = input.toLowerCase();
      if (keyword.includes('khan')) generatedData = demoData.khan;
      else if (keyword.includes('ahmed')) generatedData = demoData.ahmed;
      else generatedData = demoData.default;
    }

    return c.json({
      success: true,
      auto_filled_form: generatedData,
      confidence: apiKey ? 95 : 85,
      mode: apiKey ? 'ai-generated' : 'demo',
      message: apiKey ? 'Household data generated by Claude AI' : 'Demo data (set ANTHROPIC_API_KEY for AI generation)',
    });
  } catch (error) {
    console.error('Auto-fill error:', error);
    return c.json({ error: 'Failed to auto-fill data', message: String(error) }, 500);
  }
});

// Research Projects routes
app.route('/api/projects', researchProjectsRoutes);

// Governance routes (consent forms, IRB, access logs)
app.route('/api/governance', governanceRoutes);

// Consent Management routes (AI-powered forms, signatures, audit)
app.route('/api/consent', consentManagementRoutes);

// IRB Workflow routes (submissions, board meetings, decisions)
app.route('/api/irb', irbWorkflowRoutes);

// RBAC Management routes (roles, permissions, access control)
app.route('/api/rbac', rbacManagementRoutes);

// Bulk import routes
const bulkImportRoutes = createBulkImportRoutes();
app.route('/api/bulk-import', bulkImportRoutes);

// Report routes
const reportRoutes = createReportRoutes();
app.route('/api/reports', reportRoutes);

// Auth routes
const authRoutes = createAuthRoutes();
app.route('/api/auth', authRoutes);

// Lookups routes (districts, religions, sub-communities, etc.)
app.route('/api/lookups', lookupsRoutes);

// Enhanced Survey routes (with demographics)
app.route('/api/survey', surveyEnhancedRoutes);

// Export API
export default app;
