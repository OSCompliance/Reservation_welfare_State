// CSV Parser for bulk household data import

import type { FileParseResult, ParsedRecord } from "../types";

export class CSVParser {
  /**
   * Parse CSV file content
   */
  parse(csvContent: string): FileParseResult {
    const records: ParsedRecord[] = [];
    const errors: { rowNumber: number; message: string }[] = [];

    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("CSV must have header and at least one data row");
      }

      const headers = this.parseCSVLine(lines[0]);
      const headerMap = this.createHeaderMap(headers);

      for (let i = 1; i < lines.length; i++) {
        try {
          const line = lines[i].trim();
          if (!line) continue;

          const values = this.parseCSVLine(line);
          const row = this.mapValuesToObject(values, headerMap);
          const record = this.buildRecord(row);
          records.push(record);
        } catch (error) {
          errors.push({
            rowNumber: i + 1,
            message: String(error),
          });
        }
      }

      return {
        success: errors.length === 0,
        records,
        errors,
        totalRows: lines.length - 1,
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
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Create mapping from header names to column indices
   */
  private createHeaderMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    headers.forEach((header, index) => {
      map[header.toLowerCase().trim()] = index;
    });
    return map;
  }

  /**
   * Map values to object using header map
   */
  private mapValuesToObject(
    values: string[],
    headerMap: Record<string, number>
  ): Record<string, any> {
    const obj: Record<string, any> = {};

    Object.entries(headerMap).forEach(([key, index]) => {
      if (index < values.length) {
        obj[key] = values[index] || null;
      }
    });

    return obj;
  }

  /**
   * Build ParsedRecord from row data
   */
  private buildRecord(row: Record<string, any>): ParsedRecord {
    const record: ParsedRecord = {
      household_name: row['household_name'] || row['family_name'],
      address: row['address'] || row['location'],
      phone: row['phone'] || row['mobile'],
      total_members: this.parseNumber(row['total_members']),
      muslim_members: this.parseNumber(row['muslim_members']),
      members: [],
    };

    // Parse member data if present
    if (row['members']) {
      record.members = this.parseMembersString(row['members']);
    }

    return record;
  }

  /**
   * Parse number safely
   */
  private parseNumber(value: any): number | undefined {
    if (!value) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse members string (JSON format expected)
   */
  private parseMembersString(membersStr: string): ParsedRecord['members'] {
    try {
      if (typeof membersStr === 'string') {
        return JSON.parse(membersStr);
      }
      return [];
    } catch {
      return [];
    }
  }
}

export function createCSVParser(): CSVParser {
  return new CSVParser();
}
