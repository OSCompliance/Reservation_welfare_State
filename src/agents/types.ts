// Agent type definitions for LangGraph orchestration

export interface AgentState {
  input: string;
  language: string;
  parsedData: Record<string, any>;
  validationResult: ValidationResult;
  enrichedData: Record<string, any>;
  formData: Record<string, any>;
  confidence: number;
  errors: AgentError[];
}

export interface ParsedData {
  total_members?: number;
  muslim_members?: number;
  household_name?: string;
  address?: string;
  phone?: string;
  members?: MemberData[];
  [key: string]: any;
}

export interface MemberData {
  name?: string;
  age?: number;
  gender?: string;
  education?: string;
  occupation?: string;
  income?: number;
  relationship?: string;
  ration_card?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  completeness: number; // 0-100
  missingFields: string[];
  errors: string[];
}

export interface AgentError {
  agent: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
}

export interface FormField {
  name: string;
  value: any;
  confidence: number;
  suggested: boolean;
  editable: boolean;
}

export interface AutoFilledForm {
  household_id: string;
  fields: FormField[];
  totalConfidence: number;
  readyForSubmit: boolean;
}

export interface AgentConfig {
  apiKey: string;
  model: string;
  timeout: number;
  maxRetries: number;
}
