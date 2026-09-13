// Validator Agent - Validates completeness and data quality

import type { ParsedData, ValidationResult } from "./types";

export class ValidatorAgent {
  /**
   * Validate parsed data
   */
  validate(data: ParsedData): ValidationResult {
    const errors: string[] = [];
    const missingFields: string[] = [];

    // Check required fields
    if (!data.household_name) {
      missingFields.push("household_name");
      errors.push("Household name is required");
    }

    if (!data.address) {
      missingFields.push("address");
      errors.push("Address is required");
    }

    if (!data.phone) {
      missingFields.push("phone");
      errors.push("Phone number is required");
    }

    if (!data.total_members) {
      missingFields.push("total_members");
      errors.push("Total members count is required");
    }

    // Check member data quality
    const memberErrors = this.validateMembers(data.members || []);
    errors.push(...memberErrors);

    // Calculate completeness
    const requiredFields = ["household_name", "address", "phone", "total_members"];
    const completedFields = requiredFields.filter((f) => data[f as keyof ParsedData]);
    const completeness = Math.round(
      (completedFields.length / requiredFields.length) * 100
    );

    return {
      isValid: errors.length === 0,
      completeness,
      missingFields,
      errors,
    };
  }

  /**
   * Validate member data
   */
  private validateMembers(members: (any)[]): string[] {
    const errors: string[] = [];

    if (!Array.isArray(members) || members.length === 0) {
      return ["No member data provided"];
    }

    members.forEach((member, index) => {
      if (!member.name) {
        errors.push(`Member ${index + 1}: Name is missing`);
      }

      if (!member.age) {
        errors.push(`Member ${index + 1}: Age is missing`);
      }

      if (member.age && (member.age < 0 || member.age > 150)) {
        errors.push(`Member ${index + 1}: Age seems invalid (${member.age})`);
      }

      if (!member.gender) {
        errors.push(`Member ${index + 1}: Gender is missing`);
      }
    });

    return errors;
  }

  /**
   * Get data quality score
   */
  getQualityScore(data: ParsedData): number {
    const validation = this.validate(data);
    const errorPenalty = Math.min(validation.errors.length * 5, 30);
    return Math.max(0, 100 - errorPenalty + (validation.completeness - 50) * 0.2);
  }
}

export function createValidatorAgent(): ValidatorAgent {
  return new ValidatorAgent();
}
