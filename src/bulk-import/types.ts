// Bulk import type definitions

export interface BulkImportJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  file_type: 'csv' | 'xlsx' | 'json';
  total_records: number;
  processed_records: number;
  success_count: number;
  error_count: number;
  created_at: string;
  completed_at?: string;
}

export interface BulkImportRecord {
  record_id: string;
  job_id: string;
  row_number: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  raw_data: Record<string, any>;
  processed_data?: Record<string, any>;
  errors: ImportError[];
  created_at: string;
  processed_at?: string;
}

export interface ImportError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedRecord {
  household_name?: string;
  address?: string;
  phone?: string;
  total_members?: number;
  muslim_members?: number;
  members: Array<{
    name?: string;
    age?: number;
    gender?: string;
    education?: string;
    occupation?: string;
    income?: number;
    relationship?: string;
    ration_card?: boolean;
  }>;
}

export interface FileParseResult {
  success: boolean;
  records: ParsedRecord[];
  errors: {
    rowNumber: number;
    message: string;
  }[];
  totalRows: number;
  validRows: number;
}

export interface BulkImportOptions {
  jobId: string;
  fileType: 'csv' | 'xlsx' | 'json';
  batchSize?: number;
  validateOnly?: boolean;
  language?: string;
}
