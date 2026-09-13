// Excel Parser for bulk household data import (.xlsx)

import type { FileParseResult, ParsedRecord } from "../types";

export class ExcelParser {
  /**
   * Parse Excel file buffer to records
   * Note: For actual XLSX parsing, install 'xlsx' library
   * npm install xlsx
   */
  async parseBuffer(buffer: Buffer): Promise<FileParseResult> {
    try {
      // Dynamic import to avoid dependency on xlsx if not needed
      const XLSX = await this.loadXLSXLibrary();
      return this.parseWithXLSX(buffer, XLSX);
    } catch (error) {
      return {
        success: false,
        records: [],
        errors: [
          {
            rowNumber: 0,
            message: `Excel parsing failed: ${String(error)}. Install 'xlsx' library: npm install xlsx`,
          },
        ],
        totalRows: 0,
        validRows: 0,
      };
    }
  }

  /**
   * Parse CSV-formatted Excel export (fallback method)
   */
  parseCSVFallback(csvContent: string): FileParseResult {
    const CSVParser = require('./csv-parser').createCSVParser;
    return CSVParser().parse(csvContent);
  }

  /**
   * Load xlsx library dynamically
   */
  private async loadXLSXLibrary(): Promise<any> {
    try {
      return await import('xlsx');
    } catch {
      throw new Error(
        "XLSX library not found. Install with: npm install xlsx"
      );
    }
  }

  /**
   * Parse buffer using xlsx library
   */
  private parseWithXLSX(buffer: Buffer, XLSX: any): FileParseResult {
    const records: ParsedRecord[] = [];
    const errors: { rowNumber: number; message: string }[] = [];

    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("No sheets found in Excel file");
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      rows.forEach((row, index) => {
        try {
          const record = this.buildRecord(row);
          records.push(record);
        } catch (error) {
          errors.push({
            rowNumber: index + 2, // +2 for header and 1-based indexing
            message: String(error),
          });
        }
      });

      return {
        success: errors.length === 0,
        records,
        errors,
        totalRows: rows.length,
        validRows: records.length,
      };
    } catch (error) {
      return {
        success: false,
        records: [],
        errors: [{ rowNumber: 0, message: String(error) }],
        totalRows: 0,
        validRows: 0,
      };
    }
  }

  /**
   * Build ParsedRecord from row data
   */
  private buildRecord(row: any): ParsedRecord {
    const record: ParsedRecord = {
      household_name: row.household_name || row.family_name || row.name,
      address: row.address || row.location,
      phone: row.phone || row.mobile,
      total_members: this.parseNumber(row.total_members),
      muslim_members: this.parseNumber(row.muslim_members),
      members: this.parseMembers(row.members),
    };

    return record;
  }

  /**
   * Parse number safely
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse members array/string
   */
  private parseMembers(members: any): ParsedRecord['members'] {
    if (!members) return [];

    if (Array.isArray(members)) {
      return members.map((member) => ({
        name: member.name,
        age: this.parseNumber(member.age),
        gender: member.gender,
        education: member.education,
        occupation: member.occupation,
        income: this.parseNumber(member.income),
        relationship: member.relationship,
        ration_card: member.ration_card === true,
      }));
    }

    if (typeof members === 'string') {
      try {
        const parsed = JSON.parse(members);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }
}

export function createExcelParser(): ExcelParser {
  return new ExcelParser();
}
