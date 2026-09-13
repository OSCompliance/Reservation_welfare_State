// Agent Coordinator - Orchestrates all agents using LangGraph pattern

import { Anthropic } from "@anthropic-ai/sdk";
import type {
  AgentState,
  ParsedData,
  ValidationResult,
  AutoFilledForm,
  AgentConfig,
} from "./types";

export class AgentCoordinator {
  private client: Anthropic;
  private config: AgentConfig;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
    this.config = {
      apiKey,
      model: "claude-opus-4-1-20250805",
      timeout: 30000,
      maxRetries: 3,
    };
  }

  /**
   * Orchestrate all agents in sequence
   */
  async orchestrate(
    input: string,
    language: string = "en"
  ): Promise<AgentState> {
    const state: AgentState = {
      input,
      language,
      parsedData: {},
      validationResult: {
        isValid: false,
        completeness: 0,
        missingFields: [],
        errors: [],
      },
      enrichedData: {},
      formData: {},
      confidence: 0,
      errors: [],
    };

    try {
      // Step 1: Parse input using Claude
      state.parsedData = await this.parseInput(input, language);

      // Step 2: Validate parsed data
      state.validationResult = await this.validateData(state.parsedData);

      // Step 3: Enrich missing data
      state.enrichedData = await this.enrichData(state.parsedData);

      // Step 4: Map to form fields
      state.formData = await this.mapToFormFields(state.enrichedData);

      // Step 5: Calculate confidence
      state.confidence = this.calculateConfidence(
        state.parsedData,
        state.formData
      );

      return state;
    } catch (error) {
      state.errors.push({
        agent: "coordinator",
        message: String(error),
        severity: "error",
      });
      throw error;
    }
  }

  /**
   * Parse text input into structured data
   */
  private async parseInput(
    text: string,
    language: string
  ): Promise<ParsedData> {
    const prompt = `Parse the following household information into structured JSON format.
    Language: ${language}
    Input: "${text}"

    Return ONLY valid JSON with fields like:
    - total_members (number)
    - muslim_members (number)
    - household_name (string)
    - address (string)
    - phone (string)
    - members (array of objects with name, age, gender, education, occupation, income)

    Extract only information that is explicitly provided. Use null for missing values.`;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  }

  /**
   * Validate parsed data for completeness
   */
  private async validateData(data: ParsedData): Promise<ValidationResult> {
    const requiredFields = [
      "total_members",
      "household_name",
      "address",
      "phone",
    ];
    const missingFields = requiredFields.filter((f) => !data[f]);
    const completeness = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) *
        100
    );

    return {
      isValid: missingFields.length === 0,
      completeness,
      missingFields,
      errors: missingFields.map((f) => `Missing required field: ${f}`),
    };
  }

  /**
   * Enrich data with intelligent defaults and inferences
   */
  private async enrichData(data: ParsedData): Promise<Record<string, any>> {
    const enriched = { ...data };

    // Infer muslim_members if not provided
    if (!enriched.muslim_members && enriched.total_members) {
      enriched.muslim_members = enriched.total_members;
    }

    // Add default contact info if missing
    if (!enriched.phone) {
      enriched.phone = "not_provided";
    }

    // Process members array
    if (enriched.members && Array.isArray(enriched.members)) {
      enriched.members = enriched.members.map((m: any) => ({
        ...m,
        gender: m.gender || "not_specified",
        education: m.education || "not_specified",
        occupation: m.occupation || "not_specified",
        ration_card: m.ration_card || false,
      }));
    }

    return enriched;
  }

  /**
   * Map enriched data to survey form fields
   */
  private async mapToFormFields(data: Record<string, any>) {
    return {
      household_id: `HH-${Date.now()}`,
      household_name: data.household_name || "",
      address: data.address || "",
      phone: data.phone || "",
      total_members: data.total_members || 0,
      muslim_members: data.muslim_members || 0,
      members: data.members || [],
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    parsed: ParsedData,
    form: Record<string, any>
  ): number {
    const filledFields = Object.values(form).filter((v) => v && v !== "").length;
    const totalFields = Object.keys(form).length;
    return Math.round((filledFields / totalFields) * 100);
  }
}

/**
 * Create coordinator instance
 */
export function createCoordinator(apiKey: string): AgentCoordinator {
  return new AgentCoordinator(apiKey);
}
