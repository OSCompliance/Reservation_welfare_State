import { Hono } from 'hono';
import { randomUUID } from 'crypto';

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

interface SurveyRequest {
  householdName: string;
  address: string;
  phone: string;
  district: string;
  religion: string;
  subCommunity?: string;
  reservationCategory: string;
  members: Array<{
    name: string;
    age: number;
    gender: string;
    occupation: string;
  }>;
  welfareSchemes?: string[]; // scheme IDs
  womenWorkersCount?: number;
  womenWorkTypes?: string[]; // work type IDs
}

// Save complete survey with all demographic data
router.post('/save-complete', async (c) => {
  try {
    const body = await c.req.json() as SurveyRequest;

    // Validate required fields
    if (!body.householdName || !body.address || !body.phone || !body.district || !body.religion) {
      return c.json({
        success: false,
        error: 'Missing required fields: householdName, address, phone, district, religion'
      }, 400);
    }

    const householdId = `HH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Start transaction: Insert household
    const householdResult = await c.env.DB.prepare(`
      INSERT INTO households (
        id, enumerator_id, survey_language, household_name, address, phone,
        total_members, muslim_members, district, religion, sub_community,
        reservation_category, women_workers_count, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      householdId,
      'enum_001', // placeholder
      'en',
      body.householdName,
      body.address,
      body.phone,
      body.members.length,
      body.religion === 'Muslim' ? body.members.length : 0,
      body.district,
      body.religion,
      body.subCommunity || null,
      body.reservationCategory,
      body.womenWorkersCount || 0,
      'completed'
    ).run();

    if (!householdResult.success) {
      throw new Error('Failed to insert household');
    }

    // Insert members
    const memberPromises = body.members.map(member =>
      c.env.DB.prepare(`
        INSERT INTO members (
          id, household_id, name, age, gender, occupation, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        `MEM-${householdId}-${Math.random().toString(36).substr(2, 9)}`,
        householdId,
        member.name,
        member.age,
        member.gender,
        member.occupation
      ).run()
    );

    const memberResults = await Promise.all(memberPromises);
    const memberSuccess = memberResults.every(r => r.success);

    if (!memberSuccess) {
      throw new Error('Failed to insert some members');
    }

    // Insert welfare schemes if provided
    if (body.welfareSchemes && body.welfareSchemes.length > 0) {
      const schemePromises = body.welfareSchemes.map(schemeId =>
        c.env.DB.prepare(`
          INSERT INTO household_welfare_schemes (
            id, household_id, scheme_id, status, created_at
          ) VALUES (?, ?, ?, 'unknown', CURRENT_TIMESTAMP)
        `).bind(
          `WS-${householdId}-${Math.random().toString(36).substr(2, 9)}`,
          householdId,
          schemeId
        ).run()
      );

      await Promise.all(schemePromises);
    }

    // Insert women employment data if provided
    if (body.womenWorkersCount !== undefined && body.womenWorkersCount > 0) {
      const empId = `EMP-${householdId}`;

      const empResult = await c.env.DB.prepare(`
        INSERT INTO household_women_employment (
          id, household_id, women_workers_count, created_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(empId, householdId, body.womenWorkersCount).run();

      if (empResult.success && body.womenWorkTypes && body.womenWorkTypes.length > 0) {
        const workTypePromises = body.womenWorkTypes.map(workTypeId =>
          c.env.DB.prepare(`
            INSERT INTO household_women_work_types (
              id, employment_id, work_type_id, created_at
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(
            `WT-${householdId}-${Math.random().toString(36).substr(2, 9)}`,
            empId,
            workTypeId
          ).run()
        );

        await Promise.all(workTypePromises);
      }
    }

    return c.json({
      success: true,
      message: 'Survey data saved successfully',
      householdId,
      memberCount: body.members.length,
      demographics: {
        district: body.district,
        religion: body.religion,
        subCommunity: body.subCommunity,
        reservationCategory: body.reservationCategory
      },
      welfareSchemes: body.welfareSchemes?.length || 0,
      womenData: body.womenWorkersCount ? {
        workersCount: body.womenWorkersCount,
        workTypes: body.womenWorkTypes?.length || 0
      } : null
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get household summary with all data
router.get('/household/:householdId', async (c) => {
  try {
    const householdId = c.req.param('householdId');

    const household = await c.env.DB.prepare(
      `SELECT * FROM households WHERE id = ?`
    ).bind(householdId).first();

    if (!household) {
      return c.json({
        success: false,
        error: 'Household not found'
      }, 404);
    }

    const members = await c.env.DB.prepare(
      `SELECT id, name, age, gender, occupation FROM members WHERE household_id = ? ORDER BY name`
    ).bind(householdId).all();

    const schemes = await c.env.DB.prepare(
      `SELECT ws.name, hws.status, hws.applied_date, hws.approved_date
       FROM household_welfare_schemes hws
       JOIN welfare_schemes ws ON hws.scheme_id = ws.id
       WHERE hws.household_id = ?`
    ).bind(householdId).all();

    const women = await c.env.DB.prepare(
      `SELECT hwe.women_workers_count, hwwt.work_type_id, wwt.name as work_type
       FROM household_women_employment hwe
       LEFT JOIN household_women_work_types hwwt ON hwe.id = hwwt.employment_id
       LEFT JOIN women_work_types wwt ON hwwt.work_type_id = wwt.id
       WHERE hwe.household_id = ?`
    ).bind(householdId).all();

    return c.json({
      success: true,
      household,
      members: members.results,
      welfareSchemes: schemes.results,
      womenEmployment: women.results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

// Get statistics with demographic breakdown
router.get('/statistics', async (c) => {
  try {
    const totalHouseholds = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM households`
    ).first();

    const byDistrict = await c.env.DB.prepare(
      `SELECT district, COUNT(*) as count FROM households GROUP BY district ORDER BY count DESC`
    ).all();

    const byReligion = await c.env.DB.prepare(
      `SELECT religion, COUNT(*) as count FROM households GROUP BY religion`
    ).all();

    const bySubCommunity = await c.env.DB.prepare(
      `SELECT sub_community, COUNT(*) as count FROM households
       WHERE sub_community IS NOT NULL
       GROUP BY sub_community ORDER BY count DESC`
    ).all();

    const byReservation = await c.env.DB.prepare(
      `SELECT reservation_category, COUNT(*) as count FROM households
       GROUP BY reservation_category`
    ).all();

    const schemeAdoption = await c.env.DB.prepare(
      `SELECT ws.name, COUNT(DISTINCT hws.household_id) as households
       FROM welfare_schemes ws
       LEFT JOIN household_welfare_schemes hws ON ws.id = hws.scheme_id
       GROUP BY ws.name ORDER BY households DESC`
    ).all();

    const womenEmployment = await c.env.DB.prepare(
      `SELECT
        COUNT(DISTINCT household_id) as households_with_data,
        AVG(women_workers_count) as avg_workers,
        MAX(women_workers_count) as max_workers
       FROM household_women_employment`
    ).first();

    return c.json({
      success: true,
      statistics: {
        totalHouseholds: totalHouseholds.count,
        byDistrict: byDistrict.results,
        byReligion: byReligion.results,
        bySubCommunity: bySubCommunity.results,
        byReservation: byReservation.results,
        schemeAdoption: schemeAdoption.results,
        womenEmployment
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    }, 500);
  }
});

export { router as surveyEnhancedRoutes };
