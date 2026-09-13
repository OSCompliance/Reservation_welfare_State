// Agent Tests - Unit and Integration Tests

import { createParserAgent } from "./parser";
import { createValidatorAgent } from "./validator";
import { createEnrichmentAgent } from "./enrichment";
import { createMapperAgent } from "./mapper";
import { createCoordinator } from "./coordinator";

describe("Parser Agent", () => {
  const parser = createParserAgent(process.env.ANTHROPIC_API_KEY || "");

  test("should parse household information", async () => {
    const input = "5 family members, Muslim household, Tamil Nadu, two children";
    const result = await parser.parse(input, "en");

    expect(result).toBeDefined();
    expect(result.total_members).toBeGreaterThan(0);
  });

  test("should handle incomplete input", async () => {
    const input = "5 members";
    const result = await parser.parse(input, "en");

    expect(result.total_members).toBe(5);
    expect(result.household_name).toBeUndefined();
  });

  test("should support multilingual input", async () => {
    const input = "5 தமிழ் குடும்பம்";
    const result = await parser.parse(input, "ta");

    expect(result).toBeDefined();
  });
});

describe("Validator Agent", () => {
  const validator = createValidatorAgent();

  test("should validate complete data", () => {
    const data = {
      household_name: "Smith Family",
      address: "123 Main St",
      phone: "555-1234",
      total_members: 5,
      members: [
        {
          name: "John",
          age: 45,
          gender: "Male",
          education: "12th pass",
          occupation: "Teacher",
        },
      ],
    };

    const result = validator.validate(data);

    expect(result.isValid).toBe(true);
    expect(result.completeness).toBe(100);
    expect(result.errors.length).toBe(0);
  });

  test("should flag missing required fields", () => {
    const data = {
      household_name: "Smith Family",
      // Missing address, phone, total_members
      members: [],
    };

    const result = validator.validate(data);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("address");
    expect(result.missingFields).toContain("phone");
  });

  test("should validate member data quality", () => {
    const data = {
      household_name: "Family",
      address: "Address",
      phone: "123",
      total_members: 1,
      members: [
        {
          name: "Person",
          age: 200, // Invalid age
          gender: "Unknown",
        },
      ],
    };

    const result = validator.validate(data);

    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("Enrichment Agent", () => {
  const enrichment = createEnrichmentAgent();

  test("should enrich data with defaults", () => {
    const data = {
      household_name: "Family",
      address: "Address",
      phone: "123",
      total_members: 5,
      members: [
        {
          name: "John",
          age: 40,
          // Missing gender, education, occupation
        },
      ],
    };

    const result = enrichment.enrich(data);

    expect(result.members[0].gender).toBeDefined();
    expect(result.members[0].education).toBeDefined();
    expect(result.members[0].occupation).toBeDefined();
  });

  test("should infer muslim_members if missing", () => {
    const data = {
      household_name: "Family",
      address: "Address",
      phone: "123",
      total_members: 5,
      members: [],
    };

    const result = enrichment.enrich(data);

    expect(result.muslim_members).toBe(5);
  });

  test("should infer relationships based on age", () => {
    const data = {
      household_name: "Family",
      address: "Address",
      phone: "123",
      total_members: 3,
      members: [
        { name: "Parent", age: 50 },
        { name: "Child", age: 20 },
        { name: "Grandchild", age: 2 },
      ],
    };

    const result = enrichment.enrich(data);

    expect(result.members[0].relationship).toBe("Head");
    expect(result.members[1].relationship).toBe("Child");
  });
});

describe("Mapper Agent", () => {
  const mapper = createMapperAgent();

  test("should map data to form fields", () => {
    const data = {
      household_name: "Smith",
      address: "123 Main",
      phone: "555-1234",
      total_members: 2,
      muslim_members: 2,
      members: [
        {
          name: "John",
          age: 45,
          gender: "Male",
          education: "12th",
          occupation: "Teacher",
          income: 50000,
          relationship: "Head",
        },
      ],
    };

    const form = mapper.mapToForm(data, "HH-001");

    expect(form.fields.length).toBeGreaterThan(0);
    expect(form.totalConfidence).toBeGreaterThan(70);
    expect(form.readyForSubmit).toBe(true);
  });

  test("should set low confidence for missing fields", () => {
    const data = {
      household_name: "Family",
      address: "Address",
      phone: undefined,
      total_members: undefined,
      members: [],
    };

    const form = mapper.mapToForm(data, "HH-001");

    const phoneField = form.fields.find((f) => f.name === "phone");
    expect(phoneField?.confidence).toBeLessThan(0.5);
  });
});

describe("Agent Coordinator", () => {
  const coordinator = createCoordinator(process.env.ANTHROPIC_API_KEY || "");

  test("should orchestrate all agents successfully", async () => {
    const input =
      "5 family members, Muslim household, Ahmed is 45 years old, Fatima is 42, three children";
    const result = await coordinator.orchestrate(input, "en");

    expect(result.parsedData).toBeDefined();
    expect(result.validationResult).toBeDefined();
    expect(result.enrichedData).toBeDefined();
    expect(result.formData).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test("should handle errors gracefully", async () => {
    const input = "";
    const result = await coordinator.orchestrate(input, "en");

    expect(result.errors.length).toBe(0); // Should not throw
  });

  test("should get auto-filled form", async () => {
    const input = "3 members, Muslim family, Tamil Nadu";
    const form = await coordinator.getAutoFilledForm(input, "en");

    expect(form.household_id).toBeDefined();
    expect(form.fields.length).toBeGreaterThan(0);
  });
});

// Example test data for manual testing
export const TEST_INPUTS = {
  complete: "5 family members, Muslim household, Ahmed (45M, Teacher, 50k), Fatima (42F, Homemaker), 3 children in Tamil Nadu",
  incomplete: "3 family members",
  multilingual_ta: "5 குடும்ப உறுப்பினர்கள், முஸ்லிம் குடும்பம்",
  multilingual_hi: "4 परिवार के सदस्य, मुस्लिम परिवार",
};

console.log("✅ Agent Tests Defined - Run with: npm test");
