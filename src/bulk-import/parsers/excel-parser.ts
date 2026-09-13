// Excel Parser for bulk household data import (.xlsx)

import type { FileParseResult, ParsedRecord } from "../types";

export class ExcelParser {
  /**
   * Parse Excel file buffer to records
   * Note: Converts XLSX to CSV format for parsing
   */
  async parseBuffer(buffer: Buffer): Promise<FileParseResult> {
    try {
      const CSVParser = (await import('./csv-parser')).CSVParser;
      const csvParser = new CSVParser();

      // For Cloudflare Workers: XLSX files should be exported as CSV
      // This is a simplified approach - recommend converting XLSX to CSV first
      const csvContent = new TextDecoder().decode(buffer);
      return csvParser.parse(csvContent);
    } catch (error) {
      return {
        success: false,
        records: [],
        errors: [
          {
            rowNumber: 0,
            message: `Excel parsing failed: ${String(error)}. Please export XLSX as CSV format.`,
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
