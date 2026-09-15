import { Hono } from 'hono';

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
}

const app = new Hono();

// CONSENT FORMS ENDPOINTS
app.get('/consent-forms', async (c: any) => {
  try {
    const db = (c.env as Env).DB;
    const projectId = c.req.query('project_id');

    let query = 'SELECT * FROM consent_forms';
    const params: any[] = [];

    if (projectId) {
      query += ' WHERE project_id = ?1';
      params.push(projectId);
    }

    query += ' ORDER BY created_at DESC';

    const result = params.length > 0
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/consent-forms/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const db = (c.env as Env).DB;

    const form = await db.prepare(
      'SELECT * FROM consent_forms WHERE id = ?1'
    ).bind(id).first();

    if (!form) {
      return c.json({ success: false, error: 'Consent form not found' }, 404);
    }

    const signatures = await db.prepare(
      'SELECT * FROM consent_signatures WHERE consent_form_id = ?1'
    ).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...form,
        signatures: signatures.results || [],
        signature_count: (signatures.results || []).length
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/consent-forms', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const formId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO consent_forms
       (id, project_id, version, language, title, content, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    ).bind(
      formId,
      body.project_id,
      body.version || '1.0',
      body.language || 'en',
      body.title,
      body.content,
      body.status || 'draft',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: formId },
      message: 'Consent form created'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.put('/consent-forms/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const updates = [];
    const values = [];

    if (body.status) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.content) {
      updates.push('content = ?');
      values.push(body.content);
    }
    if (body.approval_date) {
      updates.push('approval_date = ?');
      values.push(body.approval_date);
    }
    if (body.approved_by) {
      updates.push('approved_by = ?');
      values.push(body.approved_by);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    values.push(id);

    await db.prepare(
      `UPDATE consent_forms SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return c.json({ success: true, message: 'Consent form updated' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// CONSENT SIGNATURES ENDPOINTS
app.post('/consent-signatures', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const signatureId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO consent_signatures
       (id, consent_form_id, household_id, consent_given, signature_method, signed_at, ip_address, device_id, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(
      signatureId,
      body.consent_form_id,
      body.household_id,
      body.consent_given ? 1 : 0,
      body.signature_method || 'digital',
      now,
      body.ip_address || '',
      body.device_id || '',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: signatureId },
      message: 'Consent signature recorded'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// IRB SUBMISSIONS ENDPOINTS
app.get('/irb-submissions', async (c: any) => {
  try {
    const db = (c.env as Env).DB;
    const projectId = c.req.query('project_id');

    let query = 'SELECT * FROM irb_submissions';
    const params: any[] = [];

    if (projectId) {
      query += ' WHERE project_id = ?1';
      params.push(projectId);
    }

    query += ' ORDER BY created_at DESC';

    const result = params.length > 0
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/irb-submissions', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const submissionId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO irb_submissions
       (id, project_id, submission_date, status, protocol_document, risk_level, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(
      submissionId,
      body.project_id,
      body.submission_date || now.split('T')[0],
      body.status || 'pending',
      body.protocol_document || '',
      body.risk_level || 'low',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: submissionId },
      message: 'IRB submission created'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.put('/irb-submissions/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const updates = [];
    const values = [];

    if (body.status) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.review_notes) {
      updates.push('review_notes = ?');
      values.push(body.review_notes);
    }
    if (body.approved_date) {
      updates.push('approved_date = ?');
      values.push(body.approved_date);
    }
    if (body.approved_by) {
      updates.push('approved_by = ?');
      values.push(body.approved_by);
    }
    if (body.validity_end_date) {
      updates.push('validity_end_date = ?');
      values.push(body.validity_end_date);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    values.push(id);

    await db.prepare(
      `UPDATE irb_submissions SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return c.json({ success: true, message: 'IRB submission updated' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DATA ACCESS LOGS ENDPOINTS
app.get('/access-logs', async (c: any) => {
  try {
    const db = (c.env as Env).DB;
    const limit = c.req.query('limit') || '100';

    const logs = await db.prepare(
      'SELECT * FROM data_access_logs ORDER BY access_time DESC LIMIT ?1'
    ).bind(parseInt(limit)).all();

    return c.json({
      success: true,
      data: logs.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/access-logs', async (c: any) => {
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
      body.table_accessed || '',
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
      message: 'Access logged'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { app as governanceRoutes };
