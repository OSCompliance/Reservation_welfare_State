# Agent Testing Guide - Phase 2

## Quick Manual Tests

### Test 1: Parser Agent
**Input:**
```
5 family members, Muslim household, Ahmed is 45 years old teacher earning 50000, 
Fatima is 42, they have 3 children ages 18, 15, and 12 in Tamil Nadu
```

**Expected Output:**
- total_members: 5
- muslim_members: 5
- Members array with parsed data
- household_name: (may be inferred)
- phone: (will be null)

---

### Test 2: Validator Agent
**Input:** Parsed data from Test 1

**Expected Output:**
- completeness: ~80-90% (missing phone, some member details)
- missingFields: ["phone"]
- errors: List of missing/invalid fields
- isValid: false (due to missing phone)

---

### Test 3: Enrichment Agent
**Input:** Parsed data from Test 1

**Expected Output:**
- All members have gender, education, occupation
- Relationships inferred (Head, Spouse, Child)
- All null values replaced with defaults
- ration_card: false for all members

---

### Test 4: Mapper Agent
**Input:** Enriched data from Test 3

**Expected Output:**
- Form fields for each household + member attribute
- Confidence scores (90%+ for provided data, 30-50% for defaults)
- totalConfidence: ~80-85%
- readyForSubmit: true (confidence > 70)

---

### Test 5: Full Orchestration
**Input:** Raw text
```
3 members, Muslim family, Tamil Nadu, Raj is 40, Asha is 38, one child age 10
```

**Expected Flow:**
1. Parser extracts: total_members: 3, members: [Raj, Asha, Child]
2. Validator checks: Missing phone, some member details
3. Enrichment fills: Defaults for missing fields
4. Mapper creates: Form with confidence scores
5. Coordinator returns: Complete AutoFilledForm with ~75% confidence

---

## Running Tests

### Unit Tests (Jest)
```bash
npm test src/agents/agents.test.ts
```

### Manual Testing via API
```bash
# Start server
npm run dev

# Test Parse Endpoint
curl -X POST http://localhost:9200/api/agents/parse \
  -H "Content-Type: application/json" \
  -d '{
    "input": "5 family members, Muslim household",
    "language": "en"
  }'

# Test Auto-Fill Endpoint
curl -X POST http://localhost:9200/api/agents/auto-fill \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Ahmed is 45, Fatima is 42, 3 children ages 18, 15, 10 in Tamil Nadu",
    "language": "en"
  }'
```

---

## Test Cases

| Case | Input | Expected | Status |
|------|-------|----------|--------|
| Complete data | "5 members, Ahmed 45, Fatima 42, 3 kids" | ~90% confidence | ⏳ |
| Incomplete data | "3 members" | ~50% confidence | ⏳ |
| Tamil input | "5 குடும்பம், முஸ்லிம்" | Parsed correctly | ⏳ |
| Hindi input | "4 परिवार, मुस्लिम" | Parsed correctly | ⏳ |
| Invalid age | "Person age 200" | Validation error | ⏳ |
| Missing members | "5 total members, no member details" | Filled with defaults | ⏳ |

---

## Success Criteria

✅ Parser correctly extracts structured data from text  
✅ Validator identifies missing required fields  
✅ Enrichment fills gaps with intelligent defaults  
✅ Mapper creates form with accurate confidence scores  
✅ Coordinator orchestrates all agents successfully  
✅ All agents handle errors gracefully  
✅ Multilingual support works (Ta, Hi, Urdu, Telugu, Malayalam)  
✅ API endpoints return correct JSON responses  

---

## Known Limitations

- Parser depends on Claude API quality (may miss some details)
- Relationships inferred from age (not always accurate)
- Phone number validation is basic
- Member count must be explicitly stated for accuracy

---

## Next Steps

After testing:
1. ✅ Fix any bugs identified
2. ✅ Optimize confidence scoring
3. ✅ Deploy to Cloudflare Workers
4. ✅ Build Phase 3: Bulk Import

