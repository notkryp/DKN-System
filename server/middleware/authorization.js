import { hasPermission } from './rbac.js'

/**
 * Middleware to check if user has a specific permission
 * @param {string|string[]} requiredPermissions - Permission(s) required to access
 */
export const authorize = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

  return (req, res, next) => {
    if (!req.userAccount) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userRole = req.userAccount.role_code
    const hasAccess = permissions.some((permission) => hasPermission(userRole, permission))

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your role (${userRole}) does not have permission for this action`,
        required: permissions,
        current_role: userRole
      })
    }

    next()
  }
}

/**
 * Middleware to check if user has any of the specified roles
 * @param {string|string[]} requiredRoles - Role(s) allowed to access
 */
export const requireRole = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

  return (req, res, next) => {
    if (!req.userAccount) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!roles.includes(req.userAccount.role_code)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Your role (${req.userAccount.role_code}) is not authorized for this action`,
        required_roles: roles,
        current_role: req.userAccount.role_code
      })
    }

    next()
  }
}

/**
 * Check ownership for update/delete operations
 */
export const checkOwnership = (resourceOwnerId) => {
  return (req, res, next) => {
    if (!req.userAccount) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (req.userAccount.id !== resourceOwnerId && req.userAccount.role_code !== 'SystemAdmin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only modify your own resources'
      })
    }

    next()
  }
}
