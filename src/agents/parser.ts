// Parser Agent - Extracts structured data from text input

import { Anthropic } from "@anthropic-ai/sdk";
import type { ParsedData, MemberData } from "./types";

export class ParserAgent {
  private client: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
    this.apiKey = apiKey;
  }

  /**
   * Parse household information from text
   */
  async parse(text: string, language: string = "en"): Promise<ParsedData> {
    const systemPrompt = `You are an expert data extraction agent. Extract household and member information from text input.

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "household_name": "string or null",
  "address": "string or null",
  "phone": "string or null",
  "total_members": number or null,
  "muslim_members": number or null,
  "members": [
    {
      "name": "string or null",
      "age": number or null,
      "gender": "Male/Female/Other or null",
      "education": "string or null",
      "occupation": "string or null",
      "income": number or null,
      "relationship": "string or null",
      "ration_card": boolean or null
    }
  ]
}

Rules:
1. Extract ONLY information explicitly stated in the text
2. Use null for missing values, NOT empty strings or "N/A"
3. For income, convert to numbers (e.g., "10k" → 10000)
4. Keep occupation/education concise
5. Relationships: "Head", "Spouse", "Child", "Parent", "Other"`;

    const userPrompt = `Extract household information from this text (Language: ${language}):

"${text}"`;

    try {
      const response = await this.client.messages.create({
        model: "claude-opus-4-1-20250805",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const content =
        response.content[0].type === "text" ? response.content[0].text : "{}";

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.validateAndClean(parsed);
    } catch (error) {
      console.error("Parser error:", error);
      return {
        household_name: undefined,
        address: undefined,
        phone: undefined,
        total_members: undefined,
        muslim_members: undefined,
        members: [],
      };
    }
  }

  /**
   * Validate and clean parsed data
   */
  private validateAndClean(data: any): ParsedData {
    return {
      household_name:
        typeof data.household_name === "string"
          ? data.household_name
          : undefined,
      address:
        typeof data.address === "string" ? data.address : undefined,
      phone:
        typeof data.phone === "string" ? data.phone : undefined,
      total_members:
        typeof data.total_members === "number"
          ? data.total_members
          : undefined,
      muslim_members:
        typeof data.muslim_members === "number"
          ? data.muslim_members
          : undefined,
      members: Array.isArray(data.members)
        ? data.members.map((m: any) => this.cleanMember(m))
        : [],
    };
  }

  /**
   * Clean member data
   */
  private cleanMember(member: any): MemberData {
    return {
      name:
        typeof member.name === "string" ? member.name : undefined,
      age:
        typeof member.age === "number" ? member.age : undefined,
      gender:
        typeof member.gender === "string" ? member.gender : undefined,
      education:
        typeof member.education === "string" ? member.education : undefined,
      occupation:
        typeof member.occupation === "string"
          ? member.occupation
          : undefined,
      income:
        typeof member.income === "number" ? member.income : undefined,
      relationship:
        typeof member.relationship === "string"
          ? member.relationship
          : undefined,
      ration_card:
        typeof member.ration_card === "boolean"
          ? member.ration_card
          : undefined,
    };
  }
}

export function createParserAgent(apiKey: string): ParserAgent {
  return new ParserAgent(apiKey);
}
