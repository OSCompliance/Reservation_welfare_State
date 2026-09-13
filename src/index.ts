import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Anthropic } from '@anthropic-ai/sdk';

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first(): Promise<any>;
  all(): Promise<D1Result>;
  run(): Promise<D1ExecResult>;
}

interface D1Result {
  results: any[];
  success: boolean;
}

interface D1ExecResult {
  success: boolean;
  results: D1Result[];
}

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - handle all OPTIONS requests
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check - simple endpoint
app.get('/health', (c) => {
  try {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      worker: 'muslim-welfare-api'
    });
  } catch (error) {
    return c.json({ error: 'Health check failed', message: String(error) }, 500);
  }
});

// Start survey - get first question
app.post('/api/survey/start', async (c) => {
  try {
    const { householdId, enumeratorId, language } = await c.req.json();

    // Validate input
    if (!householdId || !enumeratorId || !language) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create household record
    await c.env.DB.prepare(
      'INSERT INTO households (id, enumerator_id, survey_language, status) VALUES (?, ?, ?, ?)'
    ).bind(householdId, enumeratorId, language, 'started').run();

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(
      'INSERT INTO sessions (id, household_id, enumerator_id, current_question_number, total_questions, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, householdId, enumeratorId, 0, 20, 'active').run();

    // Generate first question using Claude AI
    const client = new Anthropic({
      apiKey: c.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `You are an AI agent helping conduct a household survey for the Muslim Welfare System in Tamil Nadu, India.
Focus on the 3.5% Muslim reservation impact study.
Generate ONE clear, simple question in ${language} language.
Response format: {"question": "question text", "inputType": "text|number|select", "options": ["option1", "option2"] if select}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'Generate the first question about household basic information (name, address, phone number). Ask about household name.',
        },
      ],
    });

    const questionText = response.content[0].type === 'text' ? response.content[0].text : '';
    let questionData = { question: 'What is your household name?', inputType: 'text', options: [] };

    try {
      questionData = JSON.parse(questionText);
    } catch {
      // Use default if parsing fails
    }

    return c.json({
      sessionId,
      questionNumber: 1,
      totalQuestions: 20,
      question: questionData.question,
      inputType: questionData.inputType,
      options: questionData.options,
      language,
    });
  } catch (error) {
    console.error('Survey start error:', error);
    return c.json({ error: 'Failed to start survey' }, 500);
  }
});

// Submit answer and get next question
app.post('/api/survey/answer', async (c) => {
  try {
    const { householdId, sessionId, answer, questionNumber, language } = await c.req.json();

    if (!householdId || !answer || !sessionId) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Save response
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(
      'INSERT INTO survey_responses (id, household_id, question_id, answer_text, question_number, language) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(responseId, householdId, `q_${questionNumber}`, answer, questionNumber, language).run();

    // Update session
    const nextQuestion = (questionNumber || 1) + 1;
    await c.env.DB.prepare(
      'UPDATE sessions SET current_question_number = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(nextQuestion, sessionId).run();

    // Check if survey complete (20 questions)
    if (nextQuestion > 20) {
      await c.env.DB.prepare(
        'UPDATE households SET status = ? WHERE id = ?'
      ).bind('completed', householdId).run();

      return c.json({
        complete: true,
        message: 'Survey completed! Thank you for your participation.',
        totalResponses: nextQuestion - 1,
      });
    }

    // Generate next question
    const client = new Anthropic({
      apiKey: c.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `You are an AI agent conducting a household survey for Muslim Welfare System in Tamil Nadu.
Previous answer: "${answer}"
Generate the NEXT clear question in ${language} language based on the survey flow (question ${nextQuestion} of 20).
Response format: {"question": "question text", "inputType": "text|number|select", "options": ["option1", "option2"] if select}`;

    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Continue the survey. Previous question was about household details. Now ask about family members and demographics.`,
        },
      ],
    });

    const questionText = response.content[0].type === 'text' ? response.content[0].text : '';
    let questionData = { question: 'How many family members do you have?', inputType: 'number', options: [] };

    try {
      questionData = JSON.parse(questionText);
    } catch {
      // Use default
    }

    return c.json({
      sessionId,
      questionNumber: nextQuestion,
      totalQuestions: 20,
      question: questionData.question,
      inputType: questionData.inputType,
      options: questionData.options,
      language,
    });
  } catch (error) {
    console.error('Answer processing error:', error);
    return c.json({ error: 'Failed to process answer' }, 500);
  }
});

// Get household data
app.get('/api/household/:householdId', async (c) => {
  try {
    const { householdId } = c.req.param();

    const household = await c.env.DB.prepare(
      'SELECT * FROM households WHERE id = ?'
    ).bind(householdId).first();

    if (!household) {
      return c.json({ error: 'Household not found' }, 404);
    }

    const responses = await c.env.DB.prepare(
      'SELECT * FROM survey_responses WHERE household_id = ? ORDER BY question_number'
    ).bind(householdId).all();

    return c.json({
      household,
      responses: responses.results || [],
    });
  } catch (error) {
    console.error('Get household error:', error);
    return c.json({ error: 'Failed to retrieve household data' }, 500);
  }
});

// Save household data (update after survey)
app.post('/api/household', async (c) => {
  try {
    const data = await c.req.json();
    const { householdId, totalMembers, muslimMembers, ...otherData } = data;

    if (!householdId) {
      return c.json({ error: 'Missing household ID' }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE households SET total_members = ?, muslim_members = ?, household_name = ?, address = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(
      totalMembers,
      muslimMembers,
      otherData.householdName,
      otherData.address,
      otherData.phone,
      householdId
    ).run();

    return c.json({ success: true, householdId });
  } catch (error) {
    console.error('Save household error:', error);
    return c.json({ error: 'Failed to save household data' }, 500);
  }
});

// Agent auto-fill endpoint
app.post('/api/agents/parse', async (c) => {
  try {
    const { input, language = 'en' } = await c.req.json();

    if (!input) {
      return c.json({ error: 'input is required' }, 400);
    }

    // Import coordinator dynamically
    const { createCoordinator } = await import('./agents/coordinator');
    const coordinator = createCoordinator(c.env.ANTHROPIC_API_KEY);

    const state = await coordinator.orchestrate(input, language);

    return c.json({
      success: true,
      parsed_data: state.parsedData,
      confidence: state.confidence,
      completeness: state.validationResult.completeness,
      missing_fields: state.validationResult.missingFields,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return c.json({ error: 'Failed to parse input', message: String(error) }, 500);
  }
});

// Agent auto-fill form endpoint
app.post('/api/agents/auto-fill', async (c) => {
  try {
    const { input, language = 'en' } = await c.req.json();

    const { createCoordinator } = await import('./agents/coordinator');
    const coordinator = createCoordinator(c.env.ANTHROPIC_API_KEY);

    const state = await coordinator.orchestrate(input, language);

    // Save to database
    const householdId = `HH-${Date.now()}`;
    await c.env.DB.prepare(
      'INSERT INTO households (id, enumerator_id, survey_language, household_name, address, phone, total_members, muslim_members, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      householdId,
      'agent',
      language,
      state.formData.household_name,
      state.formData.address,
      state.formData.phone,
      state.formData.total_members,
      state.formData.muslim_members,
      'agent_filled'
    ).run();

    return c.json({
      success: true,
      household_id: householdId,
      form_data: state.formData,
      confidence: state.confidence,
      ready_for_review: state.confidence > 70,
    });
  } catch (error) {
    console.error('Auto-fill error:', error);
    return c.json({ error: 'Failed to auto-fill', message: String(error) }, 500);
  }
});

// Export API
export default app;
