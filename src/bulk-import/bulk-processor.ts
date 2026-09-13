// Bulk Processor - Orchestrates bulk import with agent integration

import type { ParsedRecord, BulkImportJob, BulkImportRecord, BulkImportOptions, ImportError } from './types';
import { AgentCoordinator } from '../agents/coordinator';

export class BulkProcessor {
  private coordinator: AgentCoordinator;
  private batchSize: number;

  constructor(apiKey: string, batchSize: number = 10) {
    this.coordinator = new AgentCoordinator(apiKey);
    this.batchSize = batchSize;
  }

  /**
   * Process parsed records through agent system
   */
  async processRecords(
    records: ParsedRecord[],
    options: BulkImportOptions
  ): Promise<{
    processedRecords: BulkImportRecord[];
    stats: {
      total: number;
      success: number;
      failed: number;
      avgConfidence: number;
    };
  }> {
    const processedRecords: BulkImportRecord[] = [];
    let successCount = 0;
    let confidenceSum = 0;

    // Process in batches
    for (let i = 0; i < records.length; i += this.batchSize) {
      const batch = records.slice(i, i + this.batchSize);
      const batchResults = await this.processBatch(batch, options);
      processedRecords.push(...batchResults);

      // Count successes and confidence
      batchResults.forEach((record) => {
        if (record.status === 'success') {
          successCount++;
        }
      });
    }

    // Calculate average confidence from processed data
    processedRecords.forEach((record) => {
      if (record.processed_data?.confidence) {
        confidenceSum += record.processed_data.confidence;
      }
    });

    return {
      processedRecords,
      stats: {
        total: records.length,
        success: successCount,
        failed: records.length - successCount,
        avgConfidence: records.length > 0 ? Math.round(confidenceSum / records.length) : 0,
      },
    };
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    batch: ParsedRecord[],
    options: BulkImportOptions
  ): Promise<BulkImportRecord[]> {
    return Promise.all(
      batch.map((record, index) =>
        this.processRecord(record, options, index)
      )
    );
  }

  /**
   * Process single record through agents
   */
  private async processRecord(
    record: ParsedRecord,
    options: BulkImportOptions,
    batchIndex: number
  ): Promise<BulkImportRecord> {
    const errors: ImportError[] = [];

    try {
      // Convert record to text for agent processing
      const text = this.recordToText(record);

      if (options.validateOnly) {
        return this.createValidationRecord(record, options, batchIndex);
      }

      // Process through agent coordinator
      const agentResult = await this.coordinator.orchestrate(text, options.language || 'en');

      if (agentResult.errors.length > 0) {
        agentResult.errors.forEach((err) => {
          errors.push({
            field: err.field || 'unknown',
            message: err.message,
            severity: err.severity,
          });
        });
      }

      return {
        record_id: `REC-${options.jobId}-${batchIndex}`,
        job_id: options.jobId,
        row_number: batchIndex + 1,
        status: errors.length === 0 ? 'success' : 'failed',
        raw_data: record,
        processed_data: {
          ...agentResult.enrichedData,
          confidence: agentResult.confidence,
          agent_result: agentResult,
        },
        errors,
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      };
    } catch (error) {
      errors.push({
        field: 'processing',
        message: `Agent processing failed: ${String(error)}`,
        severity: 'error',
      });

      return {
        record_id: `REC-${options.jobId}-${batchIndex}`,
        job_id: options.jobId,
        row_number: batchIndex + 1,
        status: 'failed',
        raw_data: record,
        errors,
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Create validation-only record (without agent processing)
   */
  private createValidationRecord(
    record: ParsedRecord,
    options: BulkImportOptions,
    batchIndex: number
  ): BulkImportRecord {
    const errors = this.validateRecord(record);

    return {
      record_id: `REC-${options.jobId}-${batchIndex}`,
      job_id: options.jobId,
      row_number: batchIndex + 1,
      status: errors.length === 0 ? 'success' : 'failed',
      raw_data: record,
      errors,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    };
  }

  /**
   * Validate single record for required fields
   */
  private validateRecord(record: ParsedRecord): ImportError[] {
    const errors: ImportError[] = [];

    if (!record.household_name?.trim()) {
      errors.push({
        field: 'household_name',
        message: 'Household name is required',
        severity: 'error',
      });
    }

    if (!record.address?.trim()) {
      errors.push({
        field: 'address',
        message: 'Address is required',
        severity: 'error',
      });
    }

    if (!record.phone?.trim()) {
      errors.push({
        field: 'phone',
        message: 'Phone number is required',
        severity: 'error',
      });
    }

    if (!record.total_members || record.total_members <= 0) {
      errors.push({
        field: 'total_members',
        message: 'Valid total members count is required',
        severity: 'error',
      });
    }

    if (!record.members || record.members.length === 0) {
      errors.push({
        field: 'members',
        message: 'At least one member record is required',
        severity: 'warning',
      });
    }

    return errors;
  }

  /**
   * Convert ParsedRecord to text for agent processing
   */
  private recordToText(record: ParsedRecord): string {
    const parts: string[] = [];

    if (record.total_members) {
      parts.push(`${record.total_members} family members`);
    }

    if (record.muslim_members) {
      parts.push(`${record.muslim_members} Muslim members`);
    }

    if (record.household_name) {
      parts.push(`Household: ${record.household_name}`);
    }

    if (record.address) {
      parts.push(`Address: ${record.address}`);
    }

    if (record.phone) {
      parts.push(`Phone: ${record.phone}`);
    }

    if (record.members && record.members.length > 0) {
      record.members.forEach((member) => {
        const details: string[] = [];
        if (member.name) details.push(member.name);
        if (member.age) details.push(`age ${member.age}`);
        if (member.gender) details.push(member.gender);
        if (member.occupation) details.push(`${member.occupation}`);
        if (member.income) details.push(`income ${member.income}`);

        if (details.length > 0) {
          parts.push(details.join(', '));
        }
      });
    }

    return parts.join('. ');
  }
}

export function createBulkProcessor(apiKey: string, batchSize?: number): BulkProcessor {
  return new BulkProcessor(apiKey, batchSize);
}
