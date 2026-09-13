// Report API Routes

import { Hono } from 'hono';
import { createReportGenerator } from './report-generator';
import type { D1Database } from '../bulk-import/bulk-import-manager';

interface Env {
  DB: D1Database;
}

export function createReportRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const generator = createReportGenerator();

  /**
   * GET /api/reports/analytics
   * Generate analytics report for all households
   */
  router.get('/analytics', async (c) => {
    try {
      const format = c.req.query('format') || 'json';

      const result = await c.env.DB
        .prepare('SELECT * FROM households WHERE status = ?')
        .bind('completed')
        .all();

      const households = result?.results || [];

      const analyticsReport = generator.generateAnalyticsReport(households);

      if (format === 'csv') {
        const csv = generator.generateCSVReport(analyticsReport);
        return c.text(csv);
      }

      if (format === 'html') {
        return c.html(generator.generateHTMLReport(analyticsReport));
      }

      return c.json(analyticsReport);
    } catch (error) {
      return c.json(
        { error: `Failed to generate analytics report: ${String(error)}` },
        500
      );
    }
  });

  /**
   * GET /api/reports/household/:householdId
   * Generate report for specific household
   */
  router.get('/household/:householdId', async (c) => {
    try {
      const householdId = c.req.param('householdId');
      const format = c.req.query('format') || 'json';

      const result = await c.env.DB
        .prepare('SELECT * FROM households WHERE id = ?')
        .bind(householdId)
        .first();

      if (!result) {
        return c.json({ error: 'Household not found' }, 404);
      }

      const householdReport = generator.generateHouseholdReport(
        result.id,
        result.household_name || '',
        result.address || '',
        result.phone || '',
        result.total_members || 0,
        result.muslim_members || 0,
        [] // Members would be fetched separately
      );

      if (format === 'csv') {
        const csv = [
          'Household Report',
          `Household ID,${householdReport.household_id}`,
          `Name,${householdReport.household_name}`,
          `Address,${householdReport.address}`,
          `Phone,${householdReport.phone}`,
          `Total Members,${householdReport.total_members}`,
          `Muslim Members,${householdReport.muslim_members}`,
          `Generated,${householdReport.generated_at}`,
        ].join('\n');

        return c.text(csv);
      }

      return c.json(householdReport);
    } catch (error) {
      return c.json(
        { error: `Failed to generate household report: ${String(error)}` },
        500
      );
    }
  });

  /**
   * GET /api/reports/export
   * Export all data in requested format
   */
  router.get('/export', async (c) => {
    try {
      const format = c.req.query('format') || 'json';

      const result = await c.env.DB
        .prepare('SELECT * FROM households')
        .all();

      const households = result?.results || [];

      if (format === 'csv') {
        const headers = ['ID', 'Name', 'Address', 'Phone', 'Total Members', 'Muslim Members', 'Status'];
        const rows = households.map((h: any) => [
          h.id,
          h.household_name,
          h.address,
          h.phone,
          h.total_members,
          h.muslim_members,
          h.status,
        ]);

        const csv = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map((cell: any) => `"${cell || ''}"`).join(',')),
        ].join('\n');

        return c.text(csv);
      }

      return c.json({
        format,
        total_records: households.length,
        data: households,
        exported_at: new Date().toISOString(),
      });
    } catch (error) {
      return c.json(
        { error: `Failed to export data: ${String(error)}` },
        500
      );
    }
  });

  /**
   * GET /api/reports/summary
   * Quick summary statistics
   */
  router.get('/summary', async (c) => {
    try {
      const result = await c.env.DB
        .prepare(`
          SELECT
            COUNT(*) as total_households,
            SUM(total_members) as total_members,
            SUM(muslim_members) as total_muslim_members,
            AVG(total_members) as avg_household_size
          FROM households
          WHERE status IN ('completed', 'agent_filled')
        `)
        .first();

      return c.json({
        summary: result || {
          total_households: 0,
          total_members: 0,
          total_muslim_members: 0,
          avg_household_size: 0,
        },
        generated_at: new Date().toISOString(),
      });
    } catch (error) {
      return c.json(
        { error: `Failed to generate summary: ${String(error)}` },
        500
      );
    }
  });

  return router;
}
