// Client-side RBAC mirror of server RBAC definitions
// This is used for UI-level permission checking (not for security decisions)

export const CLIENT_RBAC = {
  Consultant: {
    name: 'Consultant',
    description: 'Daily user searching and consuming content',
    permissions: [
      'knowledge:read',
      'knowledge:browse',
      'knowledge:details',
      'bookmark:create',
      'bookmark:read',
      'rating:create',
      'flags:create',
      'training:participate',
      'user:read_own'
    ]
  },

  ExpertContributor: {
    name: 'Expert Contributor',
    description: 'Creates and validates content',
    permissions: [
      'knowledge:read',
      'knowledge:browse',
      'knowledge:details',
      'knowledge:create',
      'knowledge:update_own',
      'knowledge:delete_own',
      'tags:read',
      'categories:read',
      'bookmark:create',
      'bookmark:read',
      'rating:create',
      'rating:read',
      'flags:create',
      'training:participate',
      'user:read_own'
    ]
  },

  KnowledgeSupervisor: {
    name: 'Knowledge Supervisor',
    description: 'Runs training and adoption',
    permissions: [
      'knowledge:read',
      'knowledge:browse',
      'knowledge:details',
      'knowledge:read_all',
      'knowledge:create',
      'knowledge:update_own',
      'knowledge:update',
      'knowledge:delete_own',
      'training:create',
      'training:update',
      'training:read',
      'training:read_all',
      'training:participate',
      'adoption_metrics:read',
      'tags:read',
      'tags:assign',
      'categories:read',
      'lookups:create',
      'governance:audit',
      'flags:read',
      'flags:create',
      'flags:resolve',
      'duplicates:detect',
      'duplicates:read',
      'duplicates:create',
      'duplicates:resolve',
      'kpi:read',
      'bookmark:create',
      'rating:create',
      'user:read_own'
    ]
  },

  SystemAdmin: {
    name: 'System Admin',
    description: 'Manages infrastructure and access',
    permissions: [
      'users:read',
      'users:read_all',
      'users:manage',
      'users:update_role',
      'users:update_status',
      'system:manage',
      'system:performance',
      'knowledge:*',
      'training:*',
      'governance:*',
      'flags:*',
      'duplicates:*',
      'kpi:*',
      'categories:*',
      'tags:*',
      'lookups:*',
      'bookmark:*',
      'rating:*'
    ]
  },

  TopManager: {
    name: 'Top Manager',
    description: 'Reviews KPIs and governance',
    permissions: [
      'governance:audit',
      'flags:read',
      'duplicates:detect',
      'kpi:read',
      'kpi:create',
      'knowledge:read',
      'knowledge:browse',
      'user:read_own'
    ]
  },

  GovernanceCouncilMember: {
    name: 'Governance Council Member',
    description: 'Audits and curates content',
    permissions: [
      'governance:audit',
      'flags:read',
      'flags:resolve',
      'duplicates:detect',
      'duplicates:read',
      'duplicates:resolve',
      'knowledge:read',
      'knowledge:browse',
      'bookmark:create',
      'user:read_own'
    ]
  }
}

/**
 * Check if a role has a specific permission
 * @param {string} roleCode - User's role code
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (roleCode, permission) => {
  const role = CLIENT_RBAC[roleCode]
  if (!role) return false

  // Check for wildcard permissions
  if (role.permissions.includes('*')) return true

  // Check for specific permission or wildcard prefix
  if (role.permissions.includes(permission)) return true

  const prefix = permission.split(':')[0]
  if (role.permissions.includes(`${prefix}:*`)) return true

  return false
}

/**
 * Get all permissions for a role
 * @param {string} roleCode
 * @returns {string[]}
 */
export const getPermissions = (roleCode) => {
  return CLIENT_RBAC[roleCode]?.permissions || []
}

/**
 * Get role information
 * @param {string} roleCode
 * @returns {Object|null} - Role info or null if not found
 */
export const getRoleInfo = (roleCode) => {
  const role = CLIENT_RBAC[roleCode]
  return role ? { name: role.name, description: role.description } : null
}

/**
 * Check if role has any of the given permissions
 * @param {string} roleCode
 * @param {string[]} permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (roleCode, permissions) => {
  return permissions.some((permission) => hasPermission(roleCode, permission))
}

/**
 * Check if role has all of the given permissions
 * @param {string} roleCode
 * @param {string[]} permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (roleCode, permissions) => {
  return permissions.every((permission) => hasPermission(roleCode, permission))
}
