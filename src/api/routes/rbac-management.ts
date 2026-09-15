import { Hono } from 'hono';
import { getAllRoles, getRolePermissions, hasPermission, UserRole } from '../../services/rbac';

const uuidv4 = () => {
  const chars = '0123456789abcdef'.split('');
  const uuid = [];
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid[i] = '-';
    } else {
      uuid[i] = chars[Math.floor(Math.random() * 16)];
    }
  }
  return uuid.join('');
};

interface Env {
  DB: any;
}

const app = new Hono();

// Get all available roles
app.get('/roles', async (c: any) => {
  try {
    const roles = getAllRoles();
    return c.json({
      success: true,
      data: roles.map(r => ({
        role: r.role,
        description: r.description,
        permission_count: r.permissions.length
      })),
      count: roles.length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get role details with permissions
app.get('/roles/:role', async (c: any) => {
  try {
    const role = c.req.param('role') as UserRole;
    const permissions = getRolePermissions(role);

    if (permissions.length === 0) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        role,
        permissions,
        resource_count: new Set(permissions.map(p => p.resource)).size,
        action_count: permissions.length
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Assign role to user
app.post('/users/:userId/roles', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const db = (c.env as Env).DB;

    const role = body.role as UserRole;
    if (!role) {
      return c.json({ success: false, error: 'Missing role' }, 400);
    }

    // Verify role exists
    const permissions = getRolePermissions(role);
    if (permissions.length === 0) {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }

    const assignmentId = uuidv4();
    const now = new Date().toISOString();

    // Note: In production, would have a user_roles table
    // For now, storing in audit log
    await db.prepare(
      `INSERT INTO data_access_logs (id, researcher_id, table_accessed, action, access_time)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(
      assignmentId,
      userId,
      'user_roles',
      `assigned_${role}`,
      now
    ).run();

    return c.json({
      success: true,
      data: { assignment_id: assignmentId, user_id: userId, role },
      message: `User assigned role: ${role}`
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Check user permission
app.post('/check-permission', async (c: any) => {
  try {
    const body = await c.req.json();
    const userRole = body.user_role as UserRole;
    const resource = body.resource as string;
    const action = body.action as 'read' | 'create' | 'update' | 'delete' | 'approve';

    if (!userRole || !resource || !action) {
      return c.json(
        { success: false, error: 'Missing required fields (user_role, resource, action)' },
        400
      );
    }

    const allowed = hasPermission(userRole, resource, action);

    return c.json({
      success: true,
      data: {
        user_role: userRole,
        resource,
        action,
        allowed,
        message: allowed ? 'Permission granted' : 'Permission denied'
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get user permissions
app.get('/users/:userId/permissions', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const role = c.req.query('role') as UserRole;

    if (!role) {
      return c.json({ success: false, error: 'Role parameter required' }, 400);
    }

    const permissions = getRolePermissions(role);

    return c.json({
      success: true,
      data: {
        user_id: userId,
        role,
        permissions,
        by_resource: groupByResource(permissions)
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Audit role changes
app.get('/audit-log', async (c: any) => {
  try {
    const db = (c.env as Env).DB;
    const limit = c.req.query('limit') || '100';

    const logs = await db.prepare(
      `SELECT id, researcher_id as user_id, action, access_time
       FROM data_access_logs
       WHERE table_accessed = 'user_roles'
       ORDER BY access_time DESC
       LIMIT ?1`
    ).bind(parseInt(limit)).all();

    return c.json({
      success: true,
      data: logs.results || [],
      count: (logs.results || []).length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get access control matrix
app.get('/access-matrix', async (c: any) => {
  try {
    const roles = getAllRoles();
    const matrix: Record<string, any> = {};

    roles.forEach(roleObj => {
      const permissions = getRolePermissions(roleObj.role);
      const resourceActions: Record<string, string[]> = {};

      permissions.forEach(perm => {
        if (!resourceActions[perm.resource]) {
          resourceActions[perm.resource] = [];
        }
        resourceActions[perm.resource].push(perm.action);
      });

      matrix[roleObj.role] = {
        description: roleObj.description,
        resources: resourceActions
      };
    });

    return c.json({
      success: true,
      data: matrix
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper function
function groupByResource(permissions: any[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  permissions.forEach(perm => {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    grouped[perm.resource].push(perm.action);
  });
  return grouped;
}

export { app as rbacManagementRoutes };
