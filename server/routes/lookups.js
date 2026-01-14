import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser } from '../middleware/auth.js'
import { authorize } from '../middleware/authorization.js'

const router = express.Router()

// Categories
router.get('/categories', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('knowledge_categories')
      .select('*')
      .order('name')

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

router.post('/categories', authenticateUser, authorize(['lookups:create']), async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const { data, error } = await supabase
      .from('knowledge_categories')
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Tags
router.get('/tags', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('tag_values')
      .select('*')
      .order('label')

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ error: 'Failed to fetch tags' })
  }
})

router.post('/tags', authenticateUser, authorize(['lookups:create']), async (req, res) => {
  try {
    const { label, tag_type } = req.body
    if (!label) return res.status(400).json({ error: 'Label is required' })

    const { data, error } = await supabase
      .from('tag_values')
      .insert({ label, tag_type })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating tag:', error)
    res.status(500).json({ error: 'Failed to create tag' })
  }
})

export default router
