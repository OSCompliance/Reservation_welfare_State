import { Hono } from 'hono';

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
}

const router = new Hono<{ Bindings: Env }>();

// Get all districts
router.get('/districts', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, name, region FROM districts ORDER BY name'
    ).all();

    return c.json({
      success: true,
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get all religions
router.get('/religions', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, name, description FROM religions ORDER BY name'
    ).all();

    return c.json({
      success: true,
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get sub-communities for a religion (or all Muslim sub-communities)
router.get('/sub-communities', async (c) => {
  try {
    const religionId = c.req.query('religionId') || 'rel_001'; // Default to Muslim

    const result = await c.env.DB.prepare(
      `SELECT id, name, description FROM sub_communities
       WHERE religion_id = ?
       ORDER BY name`
    ).bind(religionId).all();

    return c.json({
      success: true,
      data: result.results,
      count: result.results.length,
      religionId
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get all reservation categories
router.get('/reservation-categories', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, name, abbreviation, description, percentage_reserved FROM reservation_categories ORDER BY name'
    ).all();

    return c.json({
      success: true,
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get all welfare schemes
router.get('/welfare-schemes', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, name, scheme_code, description, ministry, target_group
       FROM welfare_schemes
       ORDER BY name`
    ).all();

    return c.json({
      success: true,
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get all women's work types
router.get('/work-types', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, name, category, description
       FROM women_work_types
       ORDER BY name`
    ).all();

    return c.json({
      success: true,
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get all lookups at once (for form initialization)
router.get('/all', async (c) => {
  try {
    const [districts, religions, subCommunities, reservations, schemes, workTypes] = await Promise.all([
      c.env.DB.prepare('SELECT id, name, region FROM districts ORDER BY name').all(),
      c.env.DB.prepare('SELECT id, name, description FROM religions ORDER BY name').all(),
      c.env.DB.prepare(`SELECT id, name, description FROM sub_communities
                        WHERE religion_id = 'rel_001' ORDER BY name`).all(),
      c.env.DB.prepare('SELECT id, name, abbreviation, percentage_reserved FROM reservation_categories ORDER BY name').all(),
      c.env.DB.prepare('SELECT id, name, scheme_code, description FROM welfare_schemes ORDER BY name').all(),
      c.env.DB.prepare('SELECT id, name, category FROM women_work_types ORDER BY name').all(),
    ]);

    return c.json({
      success: true,
      data: {
        districts: districts.results,
        religions: religions.results,
        subCommunities: subCommunities.results,
        reservationCategories: reservations.results,
        welfareSchemes: schemes.results,
        workTypes: workTypes.results
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

export { router as lookupsRoutes };
