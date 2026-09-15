export type UserRole =
  | 'super_admin'
  | 'research_admin'
  | 'principal_investigator'
  | 'co_investigator'
  | 'data_analyst'
  | 'enumerator'
  | 'respondent'
  | 'auditor';

export interface Permission {
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'approve';
}

export interface RoleDefinition {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

const rolePermissions: Record<UserRole, RoleDefinition> = {
  super_admin: {
    role: 'super_admin',
    description: 'Full system access and administration',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'projects', action: 'create' },
      { resource: 'projects', action: 'update' },
      { resource: 'projects', action: 'delete' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'consent_forms', action: 'read' },
      { resource: 'consent_forms', action: 'approve' },
      { resource: 'irb_submissions', action: 'read' },
      { resource: 'irb_submissions', action: 'approve' },
      { resource: 'access_logs', action: 'read' },
      { resource: 'audit_logs', action: 'read' }
    ]
  },
  research_admin: {
    role: 'research_admin',
    description: 'Research project administration and governance',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'projects', action: 'create' },
      { resource: 'projects', action: 'update' },
      { resource: 'consent_forms', action: 'read' },
      { resource: 'consent_forms', action: 'create' },
      { resource: 'consent_forms', action: 'update' },
      { resource: 'irb_submissions', action: 'read' },
      { resource: 'irb_submissions', action: 'create' },
      { resource: 'irb_submissions', action: 'update' },
      { resource: 'researchers', action: 'read' },
      { resource: 'researchers', action: 'create' },
      { resource: 'access_logs', action: 'read' }
    ]
  },
  principal_investigator: {
    role: 'principal_investigator',
    description: 'Lead researcher with project oversight',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'projects', action: 'update' },
      { resource: 'study_phases', action: 'read' },
      { resource: 'study_phases', action: 'update' },
      { resource: 'consent_forms', action: 'read' },
      { resource: 'irb_submissions', action: 'read' },
      { resource: 'households', action: 'read' },
      { resource: 'data_export', action: 'read' }
    ]
  },
  co_investigator: {
    role: 'co_investigator',
    description: 'Co-researcher with limited project access',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'study_phases', action: 'read' },
      { resource: 'households', action: 'read' },
      { resource: 'survey_data', action: 'read' },
      { resource: 'data_export', action: 'read' }
    ]
  },
  data_analyst: {
    role: 'data_analyst',
    description: 'Data analysis and reporting access',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'households', action: 'read' },
      { resource: 'survey_data', action: 'read' },
      { resource: 'analytics', action: 'read' },
      { resource: 'reports', action: 'create' },
      { resource: 'data_export', action: 'read' }
    ]
  },
  enumerator: {
    role: 'enumerator',
    description: 'Field enumerator with survey data entry',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'households', action: 'read' },
      { resource: 'households', action: 'create' },
      { resource: 'households', action: 'update' },
      { resource: 'survey_data', action: 'create' },
      { resource: 'survey_data', action: 'update' }
    ]
  },
  respondent: {
    role: 'respondent',
    description: 'Survey respondent with limited access',
    permissions: [
      { resource: 'consent_forms', action: 'read' },
      { resource: 'survey_data', action: 'read' },
      { resource: 'my_data', action: 'read' }
    ]
  },
  auditor: {
    role: 'auditor',
    description: 'Compliance and audit oversight',
    permissions: [
      { resource: 'projects', action: 'read' },
      { resource: 'access_logs', action: 'read' },
      { resource: 'audit_logs', action: 'read' },
      { resource: 'consent_forms', action: 'read' },
      { resource: 'irb_submissions', action: 'read' },
      { resource: 'households', action: 'read' }
    ]
  }
};

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role]?.permissions || [];
}

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete' | 'approve'
): boolean {
  const permissions = getRolePermissions(userRole);
  return permissions.some(p => p.resource === resource && p.action === action);
}

export function canApproveConsent(userRole: UserRole): boolean {
  return hasPermission(userRole, 'consent_forms', 'approve');
}

export function canApproveIRB(userRole: UserRole): boolean {
  return hasPermission(userRole, 'irb_submissions', 'approve');
}

export function getAllRoles(): RoleDefinition[] {
  return Object.values(rolePermissions);
}

export function getRoleDescription(role: UserRole): string {
  return rolePermissions[role]?.description || 'Unknown role';
}
