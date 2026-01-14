import { supabase } from '../index.js'

const DEFAULT_ADMIN_EMAIL = 'abhipok4@gmail.com'

const upsertUserAccount = async (user) => {
  // Preserve any admin-assigned role/status; only insert defaults for first-time users.
  const { data: existing, error: fetchError } = await supabase
    .from('user_accounts')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!fetchError && existing) {
    return existing
  }

  const isAdmin = user.email === DEFAULT_ADMIN_EMAIL
  const payload = {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.name || user.email,
    role_code: isAdmin ? 'SystemAdmin' : 'Consultant',
    region_code: user.user_metadata?.region || 'GLOBAL'
  }

  const { data, error } = await supabase
    .from('user_accounts')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.warn('Auth failure:', error?.message || 'no user returned')
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const account = await upsertUserAccount(user)
    req.user = user
    req.userAccount = account
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (user) {
        const account = await upsertUserAccount(user)
        req.user = user
        req.userAccount = account
      } else if (error) {
        // Don't block the request; just log that the token was invalid/expired.
        console.warn('Optional auth ignored invalid token:', error.message)
      }
    }

    next()
  } catch (error) {
    console.warn('Optional auth error, proceeding unauthenticated:', error.message)
    next()
  }
}

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.userAccount || !roles.includes(req.userAccount.role_code)) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' })
  }
  return next()
}
