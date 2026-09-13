// Mapper Agent - Maps enriched data to survey form fields

import type { ParsedData, AutoFilledForm, FormField } from "./types";

export class MapperAgent {
  /**
   * Map enriched data to survey form fields
   */
  mapToForm(data: ParsedData, householdId: string): AutoFilledForm {
    const fields: FormField[] = [];

    // Household fields
    fields.push({
      name: "household_name",
      value: data.household_name || "",
      confidence: data.household_name ? 1.0 : 0.0,
      suggested: !data.household_name,
      editable: true,
    });

    fields.push({
      name: "address",
      value: data.address || "",
      confidence: data.address ? 1.0 : 0.0,
      suggested: !data.address,
      editable: true,
    });

    fields.push({
      name: "phone",
      value: data.phone || "",
      confidence: data.phone ? 1.0 : 0.0,
      suggested: !data.phone,
      editable: true,
    });

    fields.push({
      name: "total_members",
      value: data.total_members || 0,
      confidence: data.total_members ? 1.0 : 0.5,
      suggested: !data.total_members,
      editable: true,
    });

    fields.push({
      name: "muslim_members",
      value: data.muslim_members || data.total_members || 0,
      confidence: data.muslim_members ? 1.0 : 0.8,
      suggested: !data.muslim_members,
      editable: true,
    });

    // Member fields
    if (data.members && Array.isArray(data.members)) {
      data.members.forEach((member, index) => {
        const prefix = `member_${index + 1}`;

        fields.push({
          name: `${prefix}_name`,
          value: member.name || "",
          confidence: member.name ? 1.0 : 0.0,
          suggested: !member.name,
          editable: true,
        });

        fields.push({
          name: `${prefix}_age`,
          value: member.age || "",
          confidence: member.age ? 1.0 : 0.0,
          suggested: !member.age,
          editable: true,
        });

        fields.push({
          name: `${prefix}_gender`,
          value: member.gender || "Not Specified",
          confidence: member.gender ? 1.0 : 0.3,
          suggested: !member.gender,
          editable: true,
        });

        fields.push({
          name: `${prefix}_education`,
          value: member.education || "Not Available",
          confidence: member.education ? 0.9 : 0.2,
          suggested: !member.education,
          editable: true,
        });

        fields.push({
          name: `${prefix}_occupation`,
          value: member.occupation || "Unspecified",
          confidence: member.occupation ? 0.9 : 0.2,
          suggested: !member.occupation,
          editable: true,
        });

        fields.push({
          name: `${prefix}_income`,
          value: member.income || 0,
          confidence: member.income ? 0.95 : 0.1,
          suggested: !member.income,
          editable: true,
        });

        fields.push({
          name: `${prefix}_relationship`,
          value: member.relationship || "Other",
          confidence: member.relationship ? 0.85 : 0.5,
          suggested: !member.relationship,
          editable: true,
        });
      });
    }

    // Calculate total confidence
    const totalConfidence =
      fields.length > 0
        ? Math.round(
            (fields.reduce((sum, f) => sum + f.confidence, 0) /
              fields.length) *
              100
          )
        : 0;

    return {
      household_id: householdId,
      fields,
      totalConfidence,
      readyForSubmit: totalConfidence > 70,
    };
  }

  /**
   * Get confidence indicators for UI
   */
  getConfidenceLevel(confidence: number): string {
    if (confidence >= 90) return "Very High";
    if (confidence >= 70) return "High";
    if (confidence >= 50) return "Medium";
    if (confidence >= 30) return "Low";
    return "Very Low";
  }
}

export function createMapperAgent(): MapperAgent {
  return new MapperAgent();
}
