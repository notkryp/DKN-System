import express from 'express'
import { supabase } from '../index.js'
import { authenticateUser, optionalAuth } from '../middleware/auth.js'
import { authorize } from '../middleware/authorization.js'
import { hasPermission } from '../middleware/rbac.js'

const router = express.Router()

const buildSelect = (tagId, categoryId) => {
  if (tagId && categoryId) return '*, item_tags!inner(tag_id), item_categories!inner(category_id)'
  if (tagId) return '*, item_tags!inner(tag_id), item_categories(category_id)'
  if (categoryId) return '*, item_categories!inner(category_id), item_tags(tag_id)'
  return '*, item_tags(tag_id), item_categories(category_id)'
}

// List knowledge items (public read for authenticated users)
// Consultant: Read only
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, status, region_code, owner_id, tag_id, category_id } = req.query
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100)
    const select = buildSelect(tag_id, category_id)

    let query = supabase
      .from('knowledge_items')
      .select(select)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (q) query = query.ilike('title', `%${q}%`)
    if (status) query = query.eq('status', status)
    if (region_code) query = query.eq('region_code', region_code)
    if (owner_id) query = query.eq('owner_id', owner_id)
    if (tag_id) query = query.eq('item_tags.tag_id', tag_id)
    if (category_id) query = query.eq('item_categories.category_id', category_id)

    const { data, error } = await query
    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching knowledge items:', error)
    res.status(500).json({ error: 'Failed to fetch knowledge items' })
  }
})

// Get single knowledge item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*, item_tags(tag_id), item_categories(category_id)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Not found' })

    res.json(data)
  } catch (error) {
    console.error('Error fetching knowledge item:', error)
    res.status(500).json({ error: 'Failed to fetch knowledge item' })
  }
})

// Create knowledge item
// Only ExpertContributor, KnowledgeSupervisor, SystemAdmin can create
router.post('/', authenticateUser, authorize(['knowledge:create']), async (req, res) => {
  try {
    const { title, summary, item_type, content_uri, region_code, status, categoryIds = [], tagIds = [] } = req.body

    if (!title) return res.status(400).json({ error: 'Title is required' })

    const { data: item, error } = await supabase
      .from('knowledge_items')
      .insert([
        {
          title,
          summary,
          item_type,
          status: status || 'draft',
          content_uri,
          region_code: region_code || req.userAccount.region_code || 'GLOBAL',
          owner_id: req.userAccount.id
        }
      ])
      .select()
      .single()

    if (error) throw error

    if (categoryIds.length) {
      await supabase.from('item_categories').insert(categoryIds.map((categoryId) => ({ item_id: item.id, category_id: categoryId })))
    }
    if (tagIds.length) {
      await supabase.from('item_tags').insert(tagIds.map((tagId) => ({ item_id: item.id, tag_id: tagId })))
    }

    res.status(201).json(item)
  } catch (error) {
    console.error('Error creating knowledge item:', error)
    res.status(500).json({ error: 'Failed to create knowledge item' })
  }
})

// Update knowledge item
// Owner can update own items; supervisors/admins can update any
router.patch('/:id', authenticateUser, authorize(['knowledge:update', 'knowledge:update_own']), async (req, res) => {
  try {
    const { title, summary, item_type, status, content_uri, region_code, categoryIds, tagIds } = req.body

    const canCurateAny = hasPermission(req.userAccount.role_code, 'knowledge:update') || hasPermission(req.userAccount.role_code, 'knowledge:*')

    let query = supabase
      .from('knowledge_items')
      .update({
        title,
        summary,
        item_type,
        status,
        content_uri,
        region_code,
        updated_at: new Date()
      })
      .eq('id', req.params.id)

    if (!canCurateAny) {
      query = query.eq('owner_id', req.userAccount.id)
    }

    const { data: item, error } = await query.select().single()

    if (error) throw error
    if (!item) return res.status(404).json({ error: 'Not found or unauthorized' })

    if (Array.isArray(categoryIds)) {
      await supabase.from('item_categories').delete().eq('item_id', item.id)
      if (categoryIds.length) {
        await supabase.from('item_categories').insert(categoryIds.map((categoryId) => ({ item_id: item.id, category_id: categoryId })))
      }
    }

    if (Array.isArray(tagIds)) {
      await supabase.from('item_tags').delete().eq('item_id', item.id)
      if (tagIds.length) {
        await supabase.from('item_tags').insert(tagIds.map((tagId) => ({ item_id: item.id, tag_id: tagId })))
      }
    }

    res.json(item)
  } catch (error) {
    console.error('Error updating knowledge item:', error)
    res.status(500).json({ error: 'Failed to update knowledge item' })
  }
})

// Delete knowledge item
// Owner can delete own items; SystemAdmin can delete any
router.delete('/:id', authenticateUser, authorize(['knowledge:delete_own', 'knowledge:*']), async (req, res) => {
  try {
    const canDeleteAny = hasPermission(req.userAccount.role_code, 'knowledge:*')

    let query = supabase.from('knowledge_items').delete().eq('id', req.params.id)
    if (!canDeleteAny) {
      query = query.eq('owner_id', req.userAccount.id)
    }

    const { error } = await query

    if (error) throw error
    res.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error deleting knowledge item:', error)
    res.status(500).json({ error: 'Failed to delete knowledge item' })
  }
})

// Bookmark item
router.post('/:id/bookmarks', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ item_id: req.params.id, user_id: req.userAccount.id })

    if (error) throw error
    res.status(201).json({ message: 'Bookmarked' })
  } catch (error) {
    console.error('Error bookmarking item:', error)
    res.status(500).json({ error: 'Failed to bookmark item' })
  }
})

router.delete('/:id/bookmarks', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('item_id', req.params.id)
      .eq('user_id', req.userAccount.id)

    if (error) throw error
    res.json({ message: 'Bookmark removed' })
  } catch (error) {
    console.error('Error removing bookmark:', error)
    res.status(500).json({ error: 'Failed to remove bookmark' })
  }
})

// Flag outdated - any authenticated user can flag
router.post('/:id/flags', authenticateUser, authorize(['flags:create']), async (req, res) => {
  try {
    const { note } = req.body
    if (!note) return res.status(400).json({ error: 'Note is required' })

    const { data, error } = await supabase
      .from('flags_outdated')
      .insert({ item_id: req.params.id, user_id: req.userAccount.id, note })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error flagging item:', error)
    res.status(500).json({ error: 'Failed to flag item' })
  }
})

// Rate item
router.post('/:id/ratings', authenticateUser, async (req, res) => {
  try {
    const { rating, comment } = req.body
    if (!rating) return res.status(400).json({ error: 'Rating is required' })

    const { data, error } = await supabase
      .from('item_ratings')
      .insert({ item_id: req.params.id, user_id: req.userAccount.id, rating, comment })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error rating item:', error)
    res.status(500).json({ error: 'Failed to rate item' })
  }
})

// Governance audits read (governance roles)
router.get('/:id/audits', authenticateUser, authorize(['governance:audit']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('governance_audits')
      .select('*')
      .eq('item_id', req.params.id)
      .order('audit_date', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Error fetching audits:', error)
    res.status(500).json({ error: 'Failed to fetch audits' })
  }
})

export default router
