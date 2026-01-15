import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser } from '../middleware/auth.js'

const router = express.Router()

// Get all feedback (admin only can see all, users see their own)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role_code

    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    // Non-admins only see their own feedback
    if (!['SystemAdmin', 'TopManager'].includes(userRole)) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    res.status(500).json({ error: error.message })
  }
})

// Submit new feedback
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { feedback_type, message } = req.body
    const userId = req.user.id

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        feedback_type: feedback_type || 'general',
        message: message.trim(),
        status: 'submitted'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error submitting feedback:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update feedback status (admin only)
router.patch('/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userRole = req.user.role_code

    if (!['SystemAdmin', 'TopManager'].includes(userRole)) {
      return res.status(403).json({ error: 'Only admins can update feedback status' })
    }

    const validStatuses = ['submitted', 'in_progress', 'under_review', 'acknowledged', 'resolved']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating feedback status:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
