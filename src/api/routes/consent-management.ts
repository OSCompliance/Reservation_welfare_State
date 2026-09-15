import { Hono } from 'hono';
import { generateConsentForm, generateRiskAssessment } from '../../services/consent-generator';
import { canApproveConsent } from '../../services/rbac';

const uuidv4 = () => {
  const chars = '0123456789abcdef'.split('');
  const uuid = [];
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid[i] = '-';
    } else {
      uuid[i] = chars[Math.floor(Math.random() * 16)];
    }
  }
  return uuid.join('');
};

interface Env {
  DB: any;
  ANTHROPIC_API_KEY: string;
}

const app = new Hono();

// Generate AI-powered consent form
app.post('/generate-form', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;
    const apiKey = (c.env as Env).ANTHROPIC_API_KEY;

    if (!body.project_title || !body.project_type) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Generate consent form using Claude
    const generatedForm = await generateConsentForm(
      {
        project_title: body.project_title,
        project_type: body.project_type,
        risk_level: body.risk_level || 'medium',
        language: body.language || 'en',
        duration_months: body.duration_months,
        data_types: body.data_types
      },
      apiKey
    );

    // Save to database
    const formId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO consent_forms
       (id, project_id, version, language, title, content, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    ).bind(
      formId,
      body.project_id || '',
      '1.0',
      body.language || 'en',
      generatedForm.title,
      generatedForm.content,
      'draft',
      now
    ).run();

    return c.json({
      success: true,
      data: {
        id: formId,
        ...generatedForm,
        status: 'draft',
        created_at: now
      },
      message: 'Consent form generated successfully'
    }, 201);
  } catch (error: any) {
    console.error('Form generation error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Generate risk assessment
app.post('/risk-assessment', async (c: any) => {
  try {
    const body = await c.req.json();
    const apiKey = (c.env as Env).ANTHROPIC_API_KEY;

    if (!body.project_title) {
      return c.json({ success: false, error: 'Missing project_title' }, 400);
    }

    const assessment = await generateRiskAssessment(
      body.project_title,
      body.data_types || [],
      body.participant_count || 0,
      apiKey
    );

    return c.json({
      success: true,
      data: assessment
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Approve consent form (with RBAC check)
app.put('/forms/:id/approve', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = (c.env as Env).DB;
    const userRole = body.user_role || 'enumerator';

    // RBAC check
    if (!canApproveConsent(userRole)) {
      return c.json(
        { success: false, error: 'Insufficient permissions to approve consent forms' },
        403
      );
    }

    const now = new Date().toISOString();
    const approvalDate = new Date().toISOString().split('T')[0];

    await db.prepare(
      `UPDATE consent_forms
       SET status = ?1, approval_date = ?2, approved_by = ?3
       WHERE id = ?4`
    ).bind('approved', approvalDate, body.approved_by || 'system', id).run();

    return c.json({ success: true, message: 'Consent form approved' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Record digital signature (audio/thumbprint capable)
app.post('/signatures', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const signatureId = uuidv4();
    const now = new Date().toISOString();

    // Support for different signature methods
    const signatureMethod = body.signature_method || 'digital'; // digital, audio, thumbprint
    const audioPath = body.audio_file_path || null;

    await db.prepare(
      `INSERT INTO consent_signatures
       (id, consent_form_id, household_id, consent_given, signature_method, audio_file_path, signed_at, ip_address, device_id, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    ).bind(
      signatureId,
      body.consent_form_id,
      body.household_id,
      body.consent_given ? 1 : 0,
      signatureMethod,
      audioPath,
      now,
      body.ip_address || '',
      body.device_id || '',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: signatureId, signature_method: signatureMethod },
      message: 'Signature recorded successfully'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get signature statistics for a form
app.get('/forms/:id/signature-stats', async (c: any) => {
  try {
    const id = c.req.param('id');
    const db = (c.env as Env).DB;

    const signatures = await db.prepare(
      'SELECT consent_given, signature_method, COUNT(*) as count FROM consent_signatures WHERE consent_form_id = ?1 GROUP BY consent_given, signature_method'
    ).bind(id).all();

    const total = await db.prepare(
      'SELECT COUNT(*) as total FROM consent_signatures WHERE consent_form_id = ?1'
    ).bind(id).first();

    const consented = await db.prepare(
      'SELECT COUNT(*) as count FROM consent_signatures WHERE consent_form_id = ?1 AND consent_given = 1'
    ).bind(id).first();

    return c.json({
      success: true,
      data: {
        total_signatures: total?.total || 0,
        consented: consented?.count || 0,
        refused: (total?.total || 0) - (consented?.count || 0),
        by_method: signatures.results || [],
        consent_rate: total?.total ? ((consented?.count || 0) / total.total * 100).toFixed(1) : 0
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create signature audit log
app.post('/audit-log', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const logId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO data_access_logs
       (id, project_id, researcher_id, table_accessed, action, record_ids_accessed, pii_exposed, access_time, ip_address, device_id)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    ).bind(
      logId,
      body.project_id || '',
      body.researcher_id || '',
      'consent_signatures',
      body.action || 'read',
      body.record_ids_accessed || 0,
      body.pii_exposed ? 1 : 0,
      now,
      body.ip_address || '',
      body.device_id || ''
    ).run();

    return c.json({
      success: true,
      data: { id: logId },
      message: 'Audit logged'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get multilingual forms for a project
app.get('/project/:projectId/forms', async (c: any) => {
  try {
    const projectId = c.req.param('projectId');
    const db = (c.env as Env).DB;

    const forms = await db.prepare(
      'SELECT id, language, title, status, created_at FROM consent_forms WHERE project_id = ?1 ORDER BY language, created_at'
    ).bind(projectId).all();

    const languages = ['en', 'ta', 'hi', 'ur', 'te', 'ml'];
    const coverage = languages.map(lang => ({
      language: lang,
      available: (forms.results || []).some((f: any) => f.language === lang),
      count: (forms.results || []).filter((f: any) => f.language === lang).length
    }));

    return c.json({
      success: true,
      data: {
        forms: forms.results || [],
        language_coverage: coverage,
        total_languages: coverage.filter((c: any) => c.available).length
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { app as consentManagementRoutes };
