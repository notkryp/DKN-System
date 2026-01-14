import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { hasPermission } from '../utils/rbac'

/**
 * Hook to check if current user has a specific permission
 * @param {string|string[]} requiredPermissions - Permission(s) to check
 * @returns {boolean} - True if user has any of the required permissions
 */
export const usePermission = (requiredPermissions, options = { all: false }) => {
  const { userAccount } = useContext(AuthContext)
  if (!userAccount) return false

  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
  const hasAny = permissions.some((permission) => hasPermission(userAccount.role_code, permission))
  if (!options.all) return hasAny

  const hasAll = permissions.every((permission) => hasPermission(userAccount.role_code, permission))
  return hasAll
}

/**
 * Hook to check if current user has a specific role
 * @param {string|string[]} requiredRoles - Role(s) to check
 * @returns {boolean} - True if user has any of the required roles
 */
export const useRole = (requiredRoles) => {
  const { userAccount } = useContext(AuthContext)
  
  if (!userAccount) return false
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userAccount.role_code)
}

/**
 * Hook to get current user's role code
 * @returns {string|null} - User's role code or null if not authenticated
 */
export const useUserRole = () => {
  const { userAccount } = useContext(AuthContext)
  return userAccount?.role_code || null
}

/**
 * Hook to check if current user is a SystemAdmin
 * @returns {boolean}
 */
export const useIsAdmin = () => {
  return useRole('SystemAdmin')
}
