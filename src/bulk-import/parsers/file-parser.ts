// File Parser Factory - Routes to appropriate parser based on file type

import { CSVParser } from './csv-parser';
import { ExcelParser } from './excel-parser';
import { JSONParser } from './json-parser';
import type { FileParseResult } from '../types';

export class FileParser {
  private csvParser = new CSVParser();
  private excelParser = new ExcelParser();
  private jsonParser = new JSONParser();

  /**
   * Parse file content based on file type
   */
  async parse(
    fileType: 'csv' | 'xlsx' | 'json',
    content: string | Buffer
  ): Promise<FileParseResult> {
    switch (fileType) {
      case 'csv':
        return this.parseCSV(content as string);
      case 'xlsx':
        return this.parseExcel(content as Buffer);
      case 'json':
        return this.parseJSON(content as string);
      default:
        return {
          success: false,
          records: [],
          errors: [{ rowNumber: 0, message: `Unsupported file type: ${fileType}` }],
          totalRows: 0,
          validRows: 0,
        };
    }
  }

  /**
   * Parse CSV content
   */
  private parseCSV(content: string): FileParseResult {
    return this.csvParser.parse(content);
  }

  /**
   * Parse Excel content
   */
  private async parseExcel(content: Buffer): Promise<FileParseResult> {
    return this.excelParser.parseBuffer(content);
  }

  /**
   * Parse JSON content
   */
  private parseJSON(content: string): FileParseResult {
    return this.jsonParser.parse(content);
  }

  /**
   * Detect file type from filename
   */
  static detectFileType(
    filename: string
  ): 'csv' | 'xlsx' | 'json' | null {
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      case 'json':
        return 'json';
      default:
        return null;
    }
  }

  /**
   * Validate file before parsing
   */
  static validateFile(
    filename: string,
    maxSizeMB: number = 50
  ): { valid: boolean; error?: string } {
    const fileType = this.detectFileType(filename);

    if (!fileType) {
      return {
        valid: false,
        error: `Unsupported file type. Supported: CSV, XLSX, JSON`,
      };
    }

    // File size validation would happen at API level with actual file

    return { valid: true };
  }
}

export function createFileParser(): FileParser {
  return new FileParser();
}
