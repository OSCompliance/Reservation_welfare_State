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

const app = new Hono();

interface ResearchProject {
  id: string;
  title: string;
  description?: string;
  budget_amount: number;
  status: 'planning' | 'active' | 'completed' | 'archived';
  project_type?: string;
  lead_researcher_id?: string;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: string;
  phase_type?: string;
  status: 'pending' | 'active' | 'completed';
  completion_percentage: number;
  target_start_date?: string;
  target_end_date?: string;
  created_at: string;
}

interface ProjectBudget {
  id: string;
  project_id: string;
  category: string;
  description?: string;
  amount: number;
  status: 'allocated' | 'spent' | 'pending';
  created_at: string;
}

interface Env {
  DB: any;
}

// Get all projects
app.get('/', async (c: any) => {
  try {
    const db = (c.env as Env).DB;
    const projects = await db.prepare(
      'SELECT * FROM research_projects ORDER BY created_at DESC'
    ).all();

    return c.json({
      success: true,
      data: projects.results || [],
      count: (projects.results || []).length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get single project
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = (c.env as Env).DB;

    const project = await db.prepare(
      'SELECT * FROM research_projects WHERE id = ?1'
    ).bind(id).first();

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    // Get phases
    const phases = await db.prepare(
      'SELECT * FROM study_phases WHERE project_id = ?1 ORDER BY created_at'
    ).bind(id).all();

    // Get budgets
    const budgets = await db.prepare(
      'SELECT * FROM project_budgets WHERE project_id = ?1 ORDER BY created_at'
    ).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...project,
        phases: phases.results || [],
        budgets: budgets.results || []
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create project
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const projectId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO research_projects
       (id, title, description, budget_amount, status, project_type, lead_researcher_id, created_by, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    ).bind(
      projectId,
      body.title,
      body.description || '',
      body.budget_amount || 0,
      body.status || 'planning',
      body.project_type || 'primary_survey',
      body.lead_researcher_id || '',
      body.created_by || '',
      now,
      now
    ).run();

    return c.json({
      success: true,
      data: { id: projectId },
      message: 'Project created successfully'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update project
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const now = new Date().toISOString();

    const updates = [];
    const values = [];

    if (body.title) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.status) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.budget_amount !== undefined) {
      updates.push('budget_amount = ?');
      values.push(body.budget_amount);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.prepare(
      `UPDATE research_projects SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return c.json({ success: true, message: 'Project updated' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete project
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = (c.env as Env).DB;

    // Delete related records first
    await db.prepare('DELETE FROM study_phases WHERE project_id = ?1').bind(id).run();
    await db.prepare('DELETE FROM project_budgets WHERE project_id = ?1').bind(id).run();
    await db.prepare('DELETE FROM project_researchers WHERE project_id = ?1').bind(id).run();

    // Delete project
    await db.prepare('DELETE FROM research_projects WHERE id = ?1').bind(id).run();

    return c.json({ success: true, message: 'Project deleted' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PROJECT PHASES ENDPOINTS
app.get('/:projectId/phases', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const db = (c.env as Env).DB;

    const phases = await db.prepare(
      'SELECT * FROM study_phases WHERE project_id = ?1 ORDER BY created_at'
    ).bind(projectId).all();

    return c.json({
      success: true,
      data: phases.results || []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/:projectId/phases', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const phaseId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO study_phases
       (id, project_id, phase_name, phase_type, status, completion_percentage, target_start_date, target_end_date, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(
      phaseId,
      projectId,
      body.phase_name,
      body.phase_type || '',
      body.status || 'pending',
      body.completion_percentage || 0,
      body.target_start_date || '',
      body.target_end_date || '',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: phaseId },
      message: 'Phase created'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PROJECT BUDGETS ENDPOINTS
app.get('/:projectId/budgets', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const db = (c.env as Env).DB;

    const budgets = await db.prepare(
      'SELECT * FROM project_budgets WHERE project_id = ?1 ORDER BY created_at'
    ).bind(projectId).all();

    const total = budgets.results?.reduce((sum: number, b: any) => sum + (b.amount || 0), 0) || 0;

    return c.json({
      success: true,
      data: budgets.results || [],
      total
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/:projectId/budgets', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const budgetId = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
      `INSERT INTO project_budgets
       (id, project_id, category, description, amount, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(
      budgetId,
      projectId,
      body.category,
      body.description || '',
      body.amount || 0,
      body.status || 'allocated',
      now
    ).run();

    return c.json({
      success: true,
      data: { id: budgetId },
      message: 'Budget added'
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { app as researchProjectsRoutes };
