// Agent Coordinator - Orchestrates all agents using LangGraph pattern

import type { AgentState, ParsedData, AutoFilledForm, AgentConfig } from "./types";
import { createParserAgent } from "./parser";
import { createValidatorAgent } from "./validator";
import { createEnrichmentAgent } from "./enrichment";
import { createMapperAgent } from "./mapper";

export class AgentCoordinator {
  private apiKey: string;
  private config: AgentConfig;
  private parser = createParserAgent(apiKey);
  private validator = createValidatorAgent();
  private enrichment = createEnrichmentAgent();
  private mapper = createMapperAgent();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.parser = createParserAgent(apiKey);
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
  async orchestrate(input: string, language: string = "en"): Promise<AgentState> {
    const startTime = Date.now();
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
      // Step 1: Parse input using Parser Agent
      console.log("🔵 Parser Agent: Parsing input...");
      state.parsedData = await this.parser.parse(input, language);

      // Step 2: Validate using Validator Agent
      console.log("🟢 Validator Agent: Validating data...");
      state.validationResult = this.validator.validate(state.parsedData);

      // Step 3: Enrich using Enrichment Agent
      console.log("🟡 Enrichment Agent: Enriching data...");
      state.enrichedData = this.enrichment.enrich(state.parsedData);

      // Step 4: Map to form using Mapper Agent
      console.log("🟣 Mapper Agent: Mapping to form...");
      const householdId = `HH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const form: AutoFilledForm = this.mapper.mapToForm(state.enrichedData, householdId);

      state.formData = form.fields.reduce(
        (acc, field) => ({ ...acc, [field.name]: field.value }),
        {}
      );
      state.confidence = form.totalConfidence;

      // Log processing time
      const processingTime = Date.now() - startTime;
      console.log(`✅ All agents completed in ${processingTime}ms`);

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
   * Get form with all agent suggestions
   */
  async getAutoFilledForm(input: string, language: string = "en"): Promise<AutoFilledForm> {
    const state = await this.orchestrate(input, language);
    const householdId = `HH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this.mapper.mapToForm(state.enrichedData, householdId);
  }
}

/**
 * Create coordinator instance
 */
export function createCoordinator(apiKey: string): AgentCoordinator {
  return new AgentCoordinator(apiKey);
}
