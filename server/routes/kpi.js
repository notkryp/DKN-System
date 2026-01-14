import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser } from '../middleware/auth.js'
import { authorize } from '../middleware/authorization.js'

const router = express.Router()

// List KPI snapshots
// TopManager, KnowledgeSupervisor, SystemAdmin
router.get('/snapshots', authenticateUser, authorize(['kpi:read']), async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('kpi_report_snapshots')
      .select('*')
      .order('period_start', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error fetching KPI snapshots:', error)
    res.status(500).json({ error: 'Failed to fetch KPI snapshots' })
  }
})

// Create KPI snapshot
// TopManager, SystemAdmin
router.post('/snapshots', authenticateUser, authorize(['kpi:create']), async (req, res) => {
  try {
    const { period_start, period_end, duplication_rate, average_onboarding_weeks, collaboration_index } = req.body

    const { data, error } = await supabase
      .from('kpi_report_snapshots')
      .insert({
        period_start,
        period_end,
        duplication_rate,
        average_onboarding_weeks,
        collaboration_index,
        created_by: req.userAccount.id
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating KPI snapshot:', error)
    res.status(500).json({ error: 'Failed to create KPI snapshot' })
  }
})

export default router
