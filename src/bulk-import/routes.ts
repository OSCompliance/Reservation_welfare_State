// Bulk Import API Routes

import { Hono } from 'hono';
import { FileParser } from './parsers/file-parser';
import { createBulkProcessor } from './bulk-processor';
import { createBulkImportManager } from './bulk-import-manager';
import type { D1Database } from './bulk-import-manager';

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export function createBulkImportRoutes(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  /**
   * POST /api/bulk-import/upload
   * Upload file and start import job
   */
  router.post('/upload', async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as any;

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      // Validate file
      const validation = FileParser.validateFile(file.name);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Detect file type
      const fileType = FileParser.detectFileType(file.name);
      if (!fileType) {
        return c.json({ error: 'Unsupported file type' }, 400);
      }

      // Generate job ID
      const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Read file content
      const buffer = await file.arrayBuffer();
      const content = fileType === 'xlsx'
        ? buffer
        : new TextDecoder().decode(buffer);

      // Parse file
      const fileParser = new FileParser();
      const parseResult = await fileParser.parse(fileType, content as any);

      if (!parseResult.success && parseResult.errors.length > 0) {
        return c.json({
          error: 'File parsing failed',
          details: parseResult.errors.slice(0, 5),
        }, 400);
      }

      // Create import job in database
      const manager = createBulkImportManager(c.env.DB);
      const job = await manager.createJob(
        jobId,
        file.name,
        fileType,
        parseResult.validRows
      );

      return c.json({
        success: true,
        job_id: jobId,
        file_name: file.name,
        file_type: fileType,
        total_records: parseResult.validRows,
        message: 'File uploaded successfully. Processing will start shortly.',
      });
    } catch (error) {
      return c.json(
        { error: `Upload failed: ${String(error)}` },
        500
      );
    }
  });

  /**
   * POST /api/bulk-import/process/:jobId
   * Process uploaded file through agents
   */
  router.post('/process/:jobId', async (c) => {
    try {
      const jobId = c.req.param('jobId');
      const manager = createBulkImportManager(c.env.DB);

      // Get job
      const job = await manager.getJob(jobId);
      if (!job) {
        return c.json({ error: 'Job not found' }, 404);
      }

      if (job.status !== 'pending') {
        return c.json({
          error: `Job already ${job.status}`,
        }, 400);
      }

      // Update job status to processing
      await manager.updateJobProgress(jobId, 0, 0, 0, 'processing');

      // Get records from database
      const records = await manager.getJobRecords(jobId, 1000);
      if (records.length === 0) {
        return c.json({ error: 'No records found to process' }, 400);
      }

      // Convert DB records back to ParsedRecord format
      const parsedRecords = records.map((r) => r.raw_data) as any[];

      // Process records
      const processor = createBulkProcessor(c.env.ANTHROPIC_API_KEY, 10);
      const result = await processor.processRecords(parsedRecords, {
        jobId,
        fileType: job.file_type,
        language: 'en',
      });

      // Save processed records
      await manager.saveRecords(result.processedRecords);

      // Update job status
      await manager.updateJobProgress(
        jobId,
        result.stats.total,
        result.stats.success,
        result.stats.failed,
        'completed'
      );

      return c.json({
        success: true,
        job_id: jobId,
        stats: result.stats,
        message: 'Processing completed',
      });
    } catch (error) {
      const jobId = c.req.param('jobId');
      const manager = createBulkImportManager(c.env.DB);

      try {
        await manager.updateJobProgress(jobId, 0, 0, 0, 'failed');
      } catch {
        // Ignore error updating job status
      }

      return c.json(
        { error: `Processing failed: ${String(error)}` },
        500
      );
    }
  });

  /**
   * GET /api/bulk-import/status/:jobId
   * Get job status and progress
   */
  router.get('/status/:jobId', async (c) => {
    try {
      const jobId = c.req.param('jobId');
      const manager = createBulkImportManager(c.env.DB);

      const job = await manager.getJob(jobId);
      if (!job) {
        return c.json({ error: 'Job not found' }, 404);
      }

      const stats = await manager.getJobStats(jobId);

      return c.json({
        job_id: jobId,
        status: job.status,
        file_name: job.file_name,
        file_type: job.file_type,
        total_records: job.total_records,
        processed_records: job.processed_records,
        stats,
        created_at: job.created_at,
        completed_at: job.completed_at,
      });
    } catch (error) {
      return c.json(
        { error: `Status check failed: ${String(error)}` },
        500
      );
    }
  });

  /**
   * GET /api/bulk-import/results/:jobId
   * Get import results and errors
   */
  router.get('/results/:jobId', async (c) => {
    try {
      const jobId = c.req.param('jobId');
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = parseInt(c.req.query('offset') || '0');

      const manager = createBulkImportManager(c.env.DB);
      const records = await manager.getJobRecords(jobId, limit, offset);

      const errorRecords = records.filter((r) => r.status === 'failed');
      const successRecords = records.filter((r) => r.status === 'success');

      return c.json({
        job_id: jobId,
        total_records: records.length,
        success_records: successRecords.length,
        error_records: errorRecords.length,
        errors: errorRecords.map((r) => ({
          row_number: r.row_number,
          record_id: r.record_id,
          errors: r.errors,
        })),
        successful: successRecords.map((r) => ({
          row_number: r.row_number,
          record_id: r.record_id,
          confidence: r.processed_data?.confidence || 0,
        })),
      });
    } catch (error) {
      return c.json(
        { error: `Results fetch failed: ${String(error)}` },
        500
      );
    }
  });

  /**
   * GET /api/bulk-import/jobs
   * List all import jobs
   */
  router.get('/jobs', async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = parseInt(c.req.query('offset') || '0');

      const manager = createBulkImportManager(c.env.DB);
      const jobs = await manager.listJobs(limit, offset);

      return c.json({
        total: jobs.length,
        jobs: jobs.map((job) => ({
          job_id: job.job_id,
          status: job.status,
          file_name: job.file_name,
          file_type: job.file_type,
          total_records: job.total_records,
          success_count: job.success_count,
          error_count: job.error_count,
          created_at: job.created_at,
          completed_at: job.completed_at,
        })),
      });
    } catch (error) {
      return c.json(
        { error: `Jobs list failed: ${String(error)}` },
        500
      );
    }
  });

  return router;
}
