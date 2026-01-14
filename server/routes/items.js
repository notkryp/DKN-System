import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all items (public or filtered by user)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let query = supabase.from('items').select('*')

    // If user is authenticated, filter by user_id
    if (req.user) {
      query = query.eq('user_id', req.user.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching items:', error)
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching item:', error)
    res.status(500).json({ error: 'Failed to fetch item' })
  }
})

// Create new item (requires authentication)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, description, status } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          name,
          description,
          status: status || 'pending',
          user_id: req.user.id
        }
      ])
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating item:', error)
    res.status(500).json({ error: 'Failed to create item' })
  }
})

// Update item (requires authentication)
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { name, description, status } = req.body

    const { data, error } = await supabase
      .from('items')
      .update({ name, description, status, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Item not found or unauthorized' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating item:', error)
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// Delete item (requires authentication)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

export default router
