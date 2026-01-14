import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser } from '../middleware/auth.js'
import { authorize } from '../middleware/authorization.js'

const router = express.Router()

// Create governance audit
// Only GovernanceCouncilMember, KnowledgeSupervisor, TopManager, SystemAdmin
router.post('/audits', authenticateUser, authorize(['governance:audit']), async (req, res) => {
  try {
    const { item_id, decision, notes } = req.body
    if (!item_id || !decision) return res.status(400).json({ error: 'item_id and decision are required' })

    const { data, error } = await supabase
      .from('governance_audits')
      .insert({ item_id, decision, notes, reviewer_id: req.userAccount.id })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating audit:', error)
    res.status(500).json({ error: 'Failed to create audit' })
  }
})

// List flags needing attention
// Governance roles only
router.get('/flags', authenticateUser, authorize(['flags:read']), async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('flags_outdated')
      .select('id,item_id,user_id,note,status,created_at,knowledge_items(title,status)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error fetching flags:', error)
    res.status(500).json({ error: 'Failed to fetch flags' })
  }
})

// Mark flag resolved
// Governance roles only
router.patch('/flags/:id/resolve', authenticateUser, authorize(['flags:resolve']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('flags_outdated')
      .update({ status: 'resolved', resolved_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error resolving flag:', error)
    res.status(500).json({ error: 'Failed to resolve flag' })
  }
})

// Create duplicate cluster
// Governance roles only
router.post('/duplicates', authenticateUser, authorize(['duplicates:create']), async (req, res) => {
  try {
    const { detection_method } = req.body
    const { data, error } = await supabase
      .from('duplicate_clusters')
      .insert({ detection_method })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating duplicate cluster:', error)
    res.status(500).json({ error: 'Failed to create duplicate cluster' })
  }
})

// Add item to cluster
// Governance roles only
router.post('/duplicates/:id/items', authenticateUser, authorize(['duplicates:resolve']), async (req, res) => {
  try {
    const { item_id } = req.body
    if (!item_id) return res.status(400).json({ error: 'item_id is required' })

    const { error } = await supabase
      .from('duplicate_cluster_items')
      .insert({ cluster_id: req.params.id, item_id })

    if (error) throw error

    await supabase
      .from('knowledge_items')
      .update({ duplicate_cluster_id: req.params.id })
      .eq('id', item_id)

    res.status(201).json({ message: 'Linked to cluster' })
  } catch (error) {
    console.error('Error linking duplicate:', error)
    res.status(500).json({ error: 'Failed to link duplicate' })
  }
})

// Get cluster with items
// Governance roles only
router.get('/duplicates/:id', authenticateUser, authorize(['duplicates:read']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('duplicate_clusters')
      .select('*, duplicate_cluster_items(item_id)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching duplicate cluster:', error)
    res.status(500).json({ error: 'Failed to fetch duplicate cluster' })
  }
})

export default router
