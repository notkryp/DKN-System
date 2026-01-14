import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser } from '../middleware/auth.js'
import { authorize } from '../middleware/authorization.js'

const router = express.Router()

// List training events
router.get('/events', authenticateUser, async (req, res) => {
  try {
    const { status } = req.query
    let query = supabase
      .from('training_events')
      .select('*, training_participants(user_id, attendance_status)')
      .order('scheduled_at', { ascending: true })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching training events:', error)
    res.status(500).json({ error: 'Failed to fetch training events' })
  }
})

// Create training event
// Only KnowledgeSupervisor and SystemAdmin
router.post('/events', authenticateUser, authorize(['training:create']), async (req, res) => {
  try {
    const { topic, mode, scheduled_at, duration_minutes, notes } = req.body
    if (!topic) return res.status(400).json({ error: 'Topic is required' })

    const { data, error } = await supabase
      .from('training_events')
      .insert({ topic, mode, scheduled_at, duration_minutes, notes, trainer_id: req.userAccount.id })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating training event:', error)
    res.status(500).json({ error: 'Failed to create training event' })
  }
})

// Update training event
// Only KnowledgeSupervisor and SystemAdmin
router.patch('/events/:id', authenticateUser, authorize(['training:update']), async (req, res) => {
  try {
    const { topic, mode, scheduled_at, duration_minutes, status, notes } = req.body
    const { data, error } = await supabase
      .from('training_events')
      .update({ topic, mode, scheduled_at, duration_minutes, status, notes, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating training event:', error)
    res.status(500).json({ error: 'Failed to update training event' })
  }
})

// Add participant
// Any authenticated user can add themselves, KnowledgeSupervisor can add others
router.post('/events/:id/participants', authenticateUser, authorize(['training:participate']), async (req, res) => {
  try {
    const { user_id, attendance_status } = req.body
    const participantId = user_id || req.userAccount.id

    const { data, error } = await supabase
      .from('training_participants')
      .insert({ event_id: req.params.id, user_id: participantId, attendance_status: attendance_status || 'invited' })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error adding participant:', error)
    res.status(500).json({ error: 'Failed to add participant' })
  }
})

// Update participant status (supervisors/admins)
router.patch('/events/:id/participants/:userId', authenticateUser, authorize(['training:update']), async (req, res) => {
  try {
    const { attendance_status } = req.body
    const { data, error } = await supabase
      .from('training_participants')
      .update({ attendance_status })
      .eq('event_id', req.params.id)
      .eq('user_id', req.params.userId)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating participant:', error)
    res.status(500).json({ error: 'Failed to update participant' })
  }
})

export default router
