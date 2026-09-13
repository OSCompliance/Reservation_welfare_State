// Report generation types

export interface HouseholdReport {
  household_id: string;
  household_name: string;
  address: string;
  phone: string;
  total_members: number;
  muslim_members: number;
  generated_at: string;
  generated_by: string;
}

export interface MemberReport {
  name: string;
  age: number;
  gender: string;
  education: string;
  occupation: string;
  income: number;
  relationship: string;
  ration_card: boolean;
}

export interface AnalyticsReport {
  total_households: number;
  total_members: number;
  total_muslim_members: number;
  average_household_size: number;
  average_members_per_household: number;
  gender_distribution: {
    male: number;
    female: number;
    other: number;
  };
  age_distribution: {
    under_18: number;
    between_18_60: number;
    over_60: number;
  };
  education_distribution: {
    [key: string]: number;
  };
  occupation_distribution: {
    [key: string]: number;
  };
  income_statistics: {
    average: number;
    min: number;
    max: number;
    median: number;
  };
  ration_card_holders: number;
  generated_at: string;
}

export interface ReportOptions {
  format: 'pdf' | 'json' | 'csv';
  include_charts?: boolean;
  include_summary?: boolean;
  include_analytics?: boolean;
}

export interface PDFContent {
  title: string;
  sections: PDFSection[];
  metadata: {
    generated_at: string;
    generated_by: string;
  };
}

export interface PDFSection {
  title: string;
  content: string;
  data?: any;
}
