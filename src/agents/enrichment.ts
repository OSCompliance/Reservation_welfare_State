// Enrichment Agent - Fills gaps and enriches data with intelligent defaults

import type { ParsedData, MemberData } from "./types";

export class EnrichmentAgent {
  private defaults = {
    gender: "Not Specified",
    education: "Not Available",
    occupation: "Unspecified",
    relationship: "Other",
  };

  /**
   * Enrich parsed data with defaults and inferences
   */
  enrich(data: ParsedData): ParsedData {
    const enriched = { ...data };

    // Infer muslim_members if not provided
    if (!enriched.muslim_members && enriched.total_members) {
      enriched.muslim_members = enriched.total_members;
    }

    // Ensure phone is present
    if (!enriched.phone) {
      enriched.phone = "Not Provided";
    }

    // Enrich members
    if (enriched.members && Array.isArray(enriched.members)) {
      enriched.members = enriched.members.map((member) =>
        this.enrichMember(member)
      );

      // Infer relationships if missing
      enriched.members = this.inferRelationships(enriched.members);
    }

    return enriched;
  }

  /**
   * Enrich individual member
   */
  private enrichMember(member: MemberData): MemberData {
    const enriched = { ...member };

    // Fill missing fields with defaults
    if (!enriched.gender) {
      enriched.gender = this.defaults.gender;
    }

    if (!enriched.education) {
      enriched.education = this.defaults.education;
    }

    if (!enriched.occupation) {
      enriched.occupation = this.defaults.occupation;
    }

    if (!enriched.relationship) {
      enriched.relationship = this.defaults.relationship;
    }

    // Ensure ration_card is boolean
    if (enriched.ration_card === undefined || enriched.ration_card === null) {
      enriched.ration_card = false;
    }

    // Validate and clean income
    if (enriched.income && enriched.income < 0) {
      enriched.income = 0;
    }

    return enriched;
  }

  /**
   * Infer member relationships based on position and data
   */
  private inferRelationships(members: MemberData[]): MemberData[] {
    if (members.length === 0) return members;

    const enriched = members.map((m, index) => ({
      ...m,
      relationship: m.relationship || this.inferRelationship(m, index, members),
    }));

    return enriched;
  }

  /**
   * Infer relationship based on age and position
   */
  private inferRelationship(
    member: MemberData,
    index: number,
    members: MemberData[]
  ): string {
    // First member is usually head
    if (index === 0) {
      return "Head";
    }

    // Based on age relative to head
    const headAge = members[0].age;
    const currentAge = member.age;

    if (headAge && currentAge) {
      const ageDiff = headAge - currentAge;

      if (ageDiff > 15 && ageDiff < 40) {
        return "Child";
      } else if (ageDiff >= -10 && ageDiff <= 10) {
        return "Spouse";
      } else if (ageDiff < 0) {
        return "Child";
      }
    }

    return "Other";
  }

  /**
   * Calculate data completeness after enrichment
   */
  getCompleteness(data: ParsedData): number {
    let completedFields = 0;
    const totalFields = 4; // household_name, address, phone, total_members

    if (data.household_name) completedFields++;
    if (data.address) completedFields++;
    if (data.phone) completedFields++;
    if (data.total_members) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }
}

export function createEnrichmentAgent(): EnrichmentAgent {
  return new EnrichmentAgent();
}
