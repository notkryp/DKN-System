// Role-Based Access Control (RBAC) definitions per DKN PDF
// Maps roles to their allowed operations and use cases

export const RBAC = {
  Consultant: {
    name: 'Consultant',
    description: 'Daily user searching and consuming content',
    permissions: [
      'knowledge:read',        // Use case 1: Search Knowledge Resources
      'knowledge:browse',      // Use case 1: Browse by category & AI Recommendations
      'knowledge:details',     // Use case 1: View Resource Details and Meta Data
      'bookmark:create',
      'bookmark:read',
      'rating:create',
      'flags:create',          // Can flag outdated content
      'training:participate',  // Can participate in training
      'user:read_own'
    ]
  },

  ExpertContributor: {
    name: 'Expert Contributor',
    description: 'Creates and validates content',
    permissions: [
      'knowledge:read',        // Use case 1: Search Knowledge Resources
      'knowledge:browse',
      'knowledge:details',
      'knowledge:create',      // Use case 3: Upload Content about Templates
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
      // Use case 1: Knowledge Consumption
      'knowledge:read',
      'knowledge:browse',
      'knowledge:details',
      'knowledge:read_all',
      'knowledge:create',
      'knowledge:update_own',
      'knowledge:update',
      'knowledge:delete_own',
      
      // Use case 2: Training and Change Management
      'training:create',                // Request Training Session
      'training:update',                // Delivery training and Mentoring
      'training:read',
      'training:read_all',
      'training:participate',
      'adoption_metrics:read',          // Monitor DKN Adoption Metrics
      
      // Use case 3: Content Creation and Validation
      'tags:read',
      'tags:assign',
      'categories:read',
      'lookups:create',
      
      // Use case 4: Governance and Content Curation
      'governance:audit',               // Audit and Curate Resources
      'flags:read',                     // Flag Outdated Content
      'flags:create',
      'flags:resolve',
      'duplicates:detect',              // Detect and Resolve Duplicates
      'duplicates:read',
      'duplicates:create',
      'duplicates:resolve',
      
      // Use case 6: KPI Reporting and Monitoring
      'kpi:read',                       // Monitor and Report Organizational KPIs
      
      'bookmark:create',
      'rating:create',
      'user:read_own'
    ]
  },

  SystemAdmin: {
    name: 'System Admin',
    description: 'Manages infrastructure and access',
    permissions: [
      // Use case 5: System Administration
      'users:read',                     // Configure User admin and Permission
      'users:read_all',
      'users:manage',
      'users:update_role',              // Update User Permissions
      'users:update_status',
      'system:manage',                  // Manage System Performance and Infrastructure
      'system:performance',
      
      // Full access to everything
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
      // Use case 4: Governance and Content Curation
      'governance:audit',               // Audit and Curate Resources
      'flags:read',                     // Flag Outdated Content
      'duplicates:detect',              // Detect and Resolve Duplicates
      
      // Use case 6: KPI Reporting and Monitoring
      'kpi:read',                       // Monitor and Report Organizational KPIs
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
      // Use case 4: Governance and Content Curation
      'governance:audit',               // Audit and Curate Resources
      'flags:read',                     // Flag Outdated Content
      'flags:resolve',
      'duplicates:detect',              // Detect and Resolve Duplicates
      'duplicates:read',
      'duplicates:resolve',
      
      'knowledge:read',
      'knowledge:browse',
      'bookmark:create',
      'user:read_own'
    ]
  }
}

// Helper function to check if a role has a specific permission
export const hasPermission = (roleCode, permission) => {
  const role = RBAC[roleCode]
  if (!role) return false
  
  // Check for wildcard permissions
  if (role.permissions.includes('*')) return true
  
  // Check for specific permission or wildcard prefix
  if (role.permissions.includes(permission)) return true
  
  const prefix = permission.split(':')[0]
  if (role.permissions.includes(`${prefix}:*`)) return true
  
  return false
}

// Helper function to get all permissions for a role
export const getPermissions = (roleCode) => {
  return RBAC[roleCode]?.permissions || []
}

// Helper function to get role info
export const getRoleInfo = (roleCode) => {
  const role = RBAC[roleCode]
  return role ? { name: role.name, description: role.description } : null
}
