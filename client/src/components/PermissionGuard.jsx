import { usePermission, useRole, useIsAdmin } from '../hooks/usePermission'

/**
 * Component to render content only if user has specific permission
 * @param {Object} props
 * @param {string|string[]} props.require - Permission(s) required
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.fallback - Optional fallback if no permission
 * @param {boolean} props.all - If true, requires ALL permissions (default: ANY)
 */
export const PermissionGuard = ({ require, children, fallback = null, all = false }) => {
  const hasAccess = usePermission(require, { all })
  return hasAccess ? children : fallback
}

/**
 * Component to render content only if user has specific role
 * @param {Object} props
 * @param {string|string[]} props.require - Role(s) required
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.fallback - Optional fallback if no role
 */
export const RoleGuard = ({ require, children, fallback = null }) => {
  const requiredRoles = Array.isArray(require) ? require : [require]
  const hasRole = useRole(requiredRoles)
  return hasRole ? children : fallback
}

/**
 * Component to render content only for SystemAdmin
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.fallback - Optional fallback
 */
export const AdminGuard = ({ children, fallback = null }) => {
  const isAdmin = useIsAdmin()
  return isAdmin ? children : fallback
}

/**
 * Component to render content only if NOT authorized
 * @param {Object} props
 * @param {string|string[]} props.require - Permission(s) to NOT have
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.fallback - Optional fallback
 */
export const PermissionDeniedGuard = ({ require, children, fallback = null }) => {
  const requiredPerms = Array.isArray(require) ? require : [require]
  const hasPermission = usePermission(requiredPerms)
  return !hasPermission ? children : fallback
}
