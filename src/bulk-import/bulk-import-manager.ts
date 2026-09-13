// Bulk Import Manager - Manages import jobs and database persistence

import type { BulkImportJob, BulkImportRecord } from './types';

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first(): Promise<any>;
  all(): Promise<D1Result>;
  run(): Promise<D1ExecResult>;
}

export interface D1Result {
  results: any[];
  success: boolean;
}

export interface D1ExecResult {
  success: boolean;
  results: D1Result[];
}

export class BulkImportManager {
  constructor(private db: D1Database) {}

  /**
   * Create new import job
   */
  async createJob(
    jobId: string,
    fileName: string,
    fileType: 'csv' | 'xlsx' | 'json',
    totalRecords: number
  ): Promise<BulkImportJob> {
    const job: BulkImportJob = {
      job_id: jobId,
      status: 'pending',
      file_name: fileName,
      file_type: fileType,
      total_records: totalRecords,
      processed_records: 0,
      success_count: 0,
      error_count: 0,
      created_at: new Date().toISOString(),
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO bulk_import_jobs
        (job_id, status, file_name, file_type, total_records, processed_records, success_count, error_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt
        .bind(
          job.job_id,
          job.status,
          job.file_name,
          job.file_type,
          job.total_records,
          job.processed_records,
          job.success_count,
          job.error_count,
          job.created_at
        )
        .run();

      return job;
    } catch (error) {
      throw new Error(`Failed to create import job: ${String(error)}`);
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    processedCount: number,
    successCount: number,
    errorCount: number,
    status?: 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    try {
      const updateFields: string[] = [
        'processed_records = ?',
        'success_count = ?',
        'error_count = ?',
      ];
      const params: any[] = [processedCount, successCount, errorCount];

      if (status) {
        updateFields.push('status = ?');
        params.push(status);

        if (status === 'completed') {
          updateFields.push('completed_at = ?');
          params.push(new Date().toISOString());
        }
      }

      params.push(jobId);

      const query = `
        UPDATE bulk_import_jobs
        SET ${updateFields.join(', ')}
        WHERE job_id = ?
      `;

      await this.db.prepare(query).bind(...params).run();
    } catch (error) {
      throw new Error(`Failed to update job progress: ${String(error)}`);
    }
  }

  /**
   * Save import records
   */
  async saveRecords(records: BulkImportRecord[]): Promise<void> {
    try {
      for (const record of records) {
        const stmt = this.db.prepare(`
          INSERT INTO bulk_import_records
          (record_id, job_id, row_number, status, raw_data, processed_data, errors, created_at, processed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await stmt
          .bind(
            record.record_id,
            record.job_id,
            record.row_number,
            record.status,
            JSON.stringify(record.raw_data),
            record.processed_data ? JSON.stringify(record.processed_data) : null,
            JSON.stringify(record.errors),
            record.created_at,
            record.processed_at
          )
          .run();
      }
    } catch (error) {
      throw new Error(`Failed to save import records: ${String(error)}`);
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<BulkImportJob | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM bulk_import_jobs WHERE job_id = ?')
        .bind(jobId)
        .first();

      return result || null;
    } catch (error) {
      throw new Error(`Failed to get job: ${String(error)}`);
    }
  }

  /**
   * Get job records
   */
  async getJobRecords(jobId: string, limit: number = 100, offset: number = 0): Promise<BulkImportRecord[]> {
    try {
      const result = await this.db
        .prepare(`
          SELECT * FROM bulk_import_records
          WHERE job_id = ?
          ORDER BY row_number
          LIMIT ? OFFSET ?
        `)
        .bind(jobId, limit, offset)
        .all();

      return (result?.results || []).map((row: any) => ({
        ...row,
        raw_data: JSON.parse(row.raw_data),
        processed_data: row.processed_data ? JSON.parse(row.processed_data) : undefined,
        errors: JSON.parse(row.errors),
      }));
    } catch (error) {
      throw new Error(`Failed to get job records: ${String(error)}`);
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(jobId: string): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
  } | null> {
    try {
      const result = await this.db
        .prepare(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
          FROM bulk_import_records
          WHERE job_id = ?
        `)
        .bind(jobId)
        .first();

      if (!result) return null;

      return {
        total: result.total || 0,
        success: result.success || 0,
        failed: result.failed || 0,
        pending: result.pending || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get job stats: ${String(error)}`);
    }
  }

  /**
   * List import jobs
   */
  async listJobs(limit: number = 50, offset: number = 0): Promise<BulkImportJob[]> {
    try {
      const result = await this.db
        .prepare(`
          SELECT * FROM bulk_import_jobs
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
        .bind(limit, offset)
        .all();

      return result?.results || [];
    } catch (error) {
      throw new Error(`Failed to list jobs: ${String(error)}`);
    }
  }
}

export function createBulkImportManager(db: D1Database): BulkImportManager {
  return new BulkImportManager(db);
}
