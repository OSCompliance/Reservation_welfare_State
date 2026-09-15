import { Anthropic } from '@anthropic-ai/sdk';

interface ConsentFormRequest {
  project_title: string;
  project_type: string;
  risk_level: 'low' | 'medium' | 'high';
  language: 'en' | 'ta' | 'hi' | 'ur' | 'te' | 'ml';
  duration_months?: number;
  data_types?: string[];
}

interface GeneratedConsentForm {
  title: string;
  content: string;
  sections: string[];
  key_points: string[];
}

const languageGuides = {
  en: 'English, clear and simple language for Indian context',
  ta: 'Tamil, using formal register appropriate for legal documents',
  hi: 'Hindi, using formal register for government context',
  ur: 'Urdu, respecting Islamic principles and cultural context',
  te: 'Telugu, clear formal language for legal documents',
  ml: 'Malayalam, formal legal document language'
};

const riskAssessments = {
  low: 'minimal data collection, non-invasive, standard data protection',
  medium: 'moderate data collection, some sensitive information, enhanced protection',
  high: 'extensive data collection, highly sensitive information, maximum protection and oversight'
};

export async function generateConsentForm(
  request: ConsentFormRequest,
  apiKey: string
): Promise<GeneratedConsentForm> {
  const client = new Anthropic({
    apiKey
  });

  const systemPrompt = `You are an expert legal and ethics specialist for research governance in India.
You create clear, fair, and compliant informed consent forms that respect participant rights while enabling ethical research.
Your forms must be:
- Clear and understandable to participants with varying education levels
- Compliant with Indian research ethics standards
- Culturally sensitive and respectful
- Legally sound and enforceable
- Inclusive and non-discriminatory

Generate forms in ${languageGuides[request.language]} that protect vulnerable populations while enabling valuable research.`;

  const userPrompt = `Generate a comprehensive informed consent form for this research project:

Project: ${request.project_title}
Type: ${request.project_type}
Risk Level: ${request.risk_level} (${riskAssessments[request.risk_level]})
Language: ${request.language}
Duration: ${request.duration_months || 12} months
Data Types: ${(request.data_types || ['demographics', 'household information']).join(', ')}

Create a structured consent form with these sections:
1. Project Overview (what, why, how)
2. Participant Rights (right to withdraw, privacy, confidentiality)
3. Data Protection (how data is used, stored, protected)
4. Risk Assessment (risks and mitigation)
5. Benefits & Incentives (if any)
6. Researcher Contact Information
7. Ethics Approval Details
8. Participant Declaration

Format the response as JSON with:
{
  "title": "form title",
  "content": "full form text",
  "sections": ["section names"],
  "key_points": ["main points for participant understanding"]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
    system: systemPrompt
  });

  let result: GeneratedConsentForm;

  try {
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    result = JSON.parse(responseText);
  } catch (parseError) {
    // Fallback structure
    result = {
      title: `Informed Consent Form - ${request.project_title}`,
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      sections: ['Project Overview', 'Participant Rights', 'Data Protection', 'Risks', 'Benefits', 'Declaration'],
      key_points: ['You can withdraw anytime', 'Your data is confidential', 'This has ethical approval']
    };
  }

  return result;
}

export async function generateRiskAssessment(
  project_title: string,
  data_types: string[],
  participant_count: number,
  apiKey: string
): Promise<{
  risk_level: string;
  assessment: string;
  mitigations: string[];
}> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `As a research ethics expert, assess the risk level for this study:
Project: ${project_title}
Data Types: ${data_types.join(', ')}
Participants: ${participant_count}

Respond in JSON:
{
  "risk_level": "low|medium|high",
  "assessment": "brief risk assessment",
  "mitigations": ["mitigation strategy 1", "mitigation strategy 2"]
}`
      }
    ]
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text);
  } catch {
    return {
      risk_level: 'medium',
      assessment: 'Standard research risk',
      mitigations: ['Standard data protection', 'Informed consent', 'Ethics review']
    };
  }
}
