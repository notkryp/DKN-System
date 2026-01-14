import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser } from '../middleware/auth.js'
import { authorize } from '../middleware/authorization.js'

const router = express.Router()

// Get current user account
router.get('/me', authenticateUser, async (req, res) => {
  try {
    res.json(req.userAccount)
  } catch (error) {
    console.error('Error fetching user account:', error)
    res.status(500).json({ error: 'Failed to fetch user account' })
  }
})

// Update own account (username, region)
router.put('/me', authenticateUser, async (req, res) => {
  try {
    const { username, region_code } = req.body
    const { data, error } = await supabase
      .from('user_accounts')
      .update({
        username: username || req.userAccount.username,
        region_code: region_code || req.userAccount.region_code,
        updated_at: new Date()
      })
      .eq('id', req.userAccount.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating user account:', error)
    res.status(500).json({ error: 'Failed to update user account' })
  }
})

// Admin: list users
// SystemAdmin only
router.get('/', authenticateUser, authorize(['users:read']), async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error listing users:', error)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

// Admin: update role or status
// SystemAdmin only
router.patch('/:id/role', authenticateUser, authorize(['users:manage']), async (req, res) => {
  try {
    const { role_code, status } = req.body
    const { data, error } = await supabase
      .from('user_accounts')
      .update({ role_code, status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating role:', error)
    res.status(500).json({ error: 'Failed to update role' })
  }
})

export default router
