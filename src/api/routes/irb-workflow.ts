import { Hono } from 'hono';
import { canApproveIRB } from '../../services/rbac';

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

// Create IRB submission
app.post('/submissions', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    if (!body.project_id) {
      return c.json({ success: false, error: 'Missing project_id' }, 400);
    }

    const submissionId = uuidv4();
    const now = new Date().toISOString();
    const submissionDate = now.split('T')[0];

    await db.prepare(
      `INSERT INTO irb_submissions
       (id, project_id, submission_date, status, protocol_document, risk_level, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(
      submissionId,
      body.project_id,
      body.submission_date || submissionDate,
      'pending',
      body.protocol_document || '',
      body.risk_level || 'medium',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: submissionId, status: 'pending' },
      message: 'IRB submission created - awaiting board review'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get submission with full workflow
app.get('/submissions/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const db = (c.env as Env).DB;

    const submission = await db.prepare(
      'SELECT * FROM irb_submissions WHERE id = ?1'
    ).bind(id).first();

    if (!submission) {
      return c.json({ success: false, error: 'Submission not found' }, 404);
    }

    // Get project details
    const project = await db.prepare(
      'SELECT title FROM research_projects WHERE id = ?1'
    ).bind(submission.project_id).first();

    // Determine workflow status
    const workflowStatus = getWorkflowStatus(submission.status);

    return c.json({
      success: true,
      data: {
        ...submission,
        project_title: project?.title,
        workflow_status: workflowStatus,
        timeline: generateTimeline(submission)
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Schedule IRB board meeting
app.post('/board-meetings', async (c: any) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const meetingId = uuidv4();
    const now = new Date().toISOString();

    if (!body.scheduled_date) {
      return c.json({ success: false, error: 'Missing scheduled_date' }, 400);
    }

    // Create a custom table entry for board meetings
    const summary = body.summary || `IRB Board Meeting for ${body.project_id}`;

    // For now, we'll store this in a note field - in production, would have dedicated table
    await db.prepare(
      `INSERT INTO irb_submissions (id, project_id, submission_date, status, protocol_document, risk_level, review_notes, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    ).bind(
      meetingId,
      body.project_id || 'system',
      body.scheduled_date,
      'board_scheduled',
      `Board Meeting: ${summary}`,
      body.risk_level || 'medium',
      `Scheduled: ${now}, Board Members: ${(body.board_members || []).join(', ')}`,
      now
    ).run();

    return c.json({
      success: true,
      data: {
        id: meetingId,
        meeting_date: body.scheduled_date,
        board_members: body.board_members || [],
        status: 'scheduled'
      },
      message: 'Board meeting scheduled'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Record IRB decision
app.put('/submissions/:id/decision', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = (c.env as Env).DB;
    const userRole = body.user_role || 'enumerator';

    // RBAC check
    if (!canApproveIRB(userRole)) {
      return c.json(
        { success: false, error: 'Insufficient permissions to approve IRB submissions' },
        403
      );
    }

    const now = new Date().toISOString();
    const approvalDate = now.split('T')[0];

    // Calculate validity period (typically 1 year from approval)
    const validityDate = new Date(now);
    validityDate.setFullYear(validityDate.getFullYear() + 1);
    const validityEndDate = validityDate.toISOString().split('T')[0];

    const decision = body.decision || 'approved'; // approved, conditional, rejected
    const status = decision === 'approved' ? 'approved' : decision === 'conditional' ? 'conditional_approval' : 'rejected';

    await db.prepare(
      `UPDATE irb_submissions
       SET status = ?1, approved_date = ?2, approved_by = ?3, validity_end_date = ?4, review_notes = ?5
       WHERE id = ?6`
    ).bind(
      status,
      approvalDate,
      body.approved_by || 'system',
      decision === 'approved' ? validityEndDate : null,
      body.review_notes || '',
      id
    ).run();

    // Log the decision
    const logId = uuidv4();
    await db.prepare(
      `INSERT INTO data_access_logs (id, project_id, researcher_id, table_accessed, action, access_time)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    ).bind(
      logId,
      body.project_id || '',
      body.approved_by || 'system',
      'irb_submissions',
      `decision_${decision}`,
      now
    ).run();

    return c.json({
      success: true,
      data: {
        decision,
        status,
        approved_date: approvalDate,
        validity_until: decision === 'approved' ? validityEndDate : null
      },
      message: `IRB ${decision} - ${decision === 'approved' ? 'valid until ' + validityEndDate : 'see review notes'}`
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get IRB dashboard stats
app.get('/dashboard/stats', async (c: any) => {
  try {
    const db = (c.env as Env).DB;

    const pending = await db.prepare(
      'SELECT COUNT(*) as count FROM irb_submissions WHERE status = ?1'
    ).bind('pending').first();

    const approved = await db.prepare(
      'SELECT COUNT(*) as count FROM irb_submissions WHERE status = ?1'
    ).bind('approved').first();

    const conditional = await db.prepare(
      'SELECT COUNT(*) as count FROM irb_submissions WHERE status = ?1'
    ).bind('conditional_approval').first();

    const rejected = await db.prepare(
      'SELECT COUNT(*) as count FROM irb_submissions WHERE status = ?1'
    ).bind('rejected').first();

    const avgReviewTime = await db.prepare(
      'SELECT AVG(JULIANDAY(approved_date) - JULIANDAY(submission_date)) as avg_days FROM irb_submissions WHERE approved_date IS NOT NULL'
    ).first();

    return c.json({
      success: true,
      data: {
        submissions: {
          pending: pending?.count || 0,
          approved: approved?.count || 0,
          conditional: conditional?.count || 0,
          rejected: rejected?.count || 0
        },
        performance: {
          average_review_days: Math.round(avgReviewTime?.avg_days || 0),
          approval_rate: `${((approved?.count || 0) / (pending?.count + approved?.count + conditional?.count + rejected?.count || 1) * 100).toFixed(1)}%`
        }
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get submissions by status
app.get('/submissions', async (c: any) => {
  try {
    const db = (c.env as Env).DB;
    const status = c.req.query('status');

    let query = 'SELECT id, project_id, submission_date, status, risk_level, created_at FROM irb_submissions';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = params.length > 0
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return c.json({
      success: true,
      data: result.results || [],
      count: (result.results || []).length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper functions
function getWorkflowStatus(status: string) {
  const statusMap: Record<string, any> = {
    pending: { stage: 1, label: 'Submitted - Awaiting Review', color: 'warning' },
    board_scheduled: { stage: 2, label: 'Board Meeting Scheduled', color: 'info' },
    approved: { stage: 3, label: 'Approved', color: 'success' },
    conditional_approval: { stage: 3, label: 'Approved with Conditions', color: 'success' },
    rejected: { stage: 4, label: 'Rejected - Resubmission Required', color: 'danger' }
  };
  return statusMap[status] || { stage: 0, label: 'Unknown', color: 'secondary' };
}

function generateTimeline(submission: any): any[] {
  const timeline = [];

  timeline.push({
    stage: 'Submitted',
    date: submission.submission_date,
    status: 'complete'
  });

  if (submission.status === 'board_scheduled' || submission.status === 'approved' || submission.status === 'rejected') {
    timeline.push({
      stage: 'Board Review',
      date: 'Scheduled',
      status: submission.status === 'approved' || submission.status === 'rejected' ? 'complete' : 'pending'
    });
  }

  if (submission.approved_date) {
    const decision = submission.status === 'approved' ? 'Approved' : submission.status === 'conditional_approval' ? 'Approved with Conditions' : 'Rejected';
    timeline.push({
      stage: decision,
      date: submission.approved_date,
      status: 'complete'
    });
  }

  if (submission.validity_end_date) {
    timeline.push({
      stage: 'Certificate Valid Until',
      date: submission.validity_end_date,
      status: 'pending'
    });
  }

  return timeline;
}

export { app as irbWorkflowRoutes };
