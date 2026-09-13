// JSON Parser for bulk household data import

import type { FileParseResult, ParsedRecord } from "../types";

export class JSONParser {
  /**
   * Parse JSON file content
   */
  parse(jsonContent: string): FileParseResult {
    const records: ParsedRecord[] = [];
    const errors: { rowNumber: number; message: string }[] = [];

    try {
      const data = JSON.parse(jsonContent);

      if (!Array.isArray(data)) {
        throw new Error("JSON must be an array of household records");
      }

      data.forEach((item, index) => {
        try {
          const record = this.buildRecord(item);
          records.push(record);
        } catch (error) {
          errors.push({
            rowNumber: index + 1,
            message: String(error),
          });
        }
      });

      return {
        success: errors.length === 0,
        records,
        errors,
        totalRows: data.length,
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
   * Build ParsedRecord from JSON object
   */
  private buildRecord(item: any): ParsedRecord {
    if (!item || typeof item !== 'object') {
      throw new Error("Record must be an object");
    }

    const record: ParsedRecord = {
      household_name: item.household_name || item.family_name || item.name,
      address: item.address || item.location,
      phone: item.phone || item.mobile,
      total_members: this.parseNumber(item.total_members),
      muslim_members: this.parseNumber(item.muslim_members),
      members: this.parseMembers(item.members),
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
   * Parse members array
   */
  private parseMembers(members: any): ParsedRecord['members'] {
    if (!Array.isArray(members)) {
      return [];
    }

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
}

export function createJSONParser(): JSONParser {
  return new JSONParser();
}
