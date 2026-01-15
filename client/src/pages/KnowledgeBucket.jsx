import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { PermissionGuard, RoleGuard } from '../components/PermissionGuard'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { usePermission } from '../hooks/usePermission'

const statusOptions = ['draft', 'in_review', 'published', 'rejected', 'needs_changes']

export default function Dashboard() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()

  const [knowledge, setKnowledge] = useState([])
  const [knowledgeLoading, setKnowledgeLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [filters, setFilters] = useState({ q: '', status: '', region: '', tag: '', category: '' })
  const [form, setForm] = useState({ title: '', summary: '', item_type: '', content_uri: '', status: 'draft', categoryIds: [], tagIds: [], region_code: '' })

  const [flags, setFlags] = useState([])
  const [trainingEvents, setTrainingEvents] = useState([])
  const [kpis, setKpis] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [loadingFlags, setLoadingFlags] = useState(false)
  const [loadingTraining, setLoadingTraining] = useState(false)
  const [loadingKpis, setLoadingKpis] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [showKpiModal, setShowKpiModal] = useState(false)
  const [trainingForm, setTrainingForm] = useState({ topic: '', mode: '', scheduled_at: '', duration_minutes: '', notes: '' })
  const [kpiForm, setKpiForm] = useState({ period_start: '', period_end: '', duplication_rate: '', average_onboarding_weeks: '', collaboration_index: '' })
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [flagNote, setFlagNote] = useState('')
  const [flagItemId, setFlagItemId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', summary: '', item_type: '', content_uri: '', status: 'draft', categoryIds: [], tagIds: [], region_code: '' })
  const [toast, setToast] = useState(null)
  const [creatingLookup, setCreatingLookup] = useState({ category: false, tag: false })
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const canGovern = userAccount && ['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)
  const canViewKpi = userAccount && ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)
  const canUpdateAny = usePermission(['knowledge:update', 'knowledge:*'])
  const canUpdateOwn = usePermission('knowledge:update_own')
  const canDeleteAny = usePermission('knowledge:*')
  const canDeleteOwn = usePermission('knowledge:delete_own')

  const fetchTraining = async () => {
    if (!user) return
    setLoadingTraining(true)
    try {
      const { data } = await api.get('/training/events')
      setTrainingEvents(data || [])
    } catch (error) {
      console.error('Error loading training', error)
    } finally {
      setLoadingTraining(false)
    }
  }

  const fetchKpis = async () => {
    if (!user || !canViewKpi) return
    setLoadingKpis(true)
    try {
      const { data } = await api.get('/kpi/snapshots')
      setKpis(data || [])
    } catch (error) {
      console.error('Error loading KPI snapshots', error)
    } finally {
      setLoadingKpis(false)
    }
  }

  const fetchBookmarks = async () => {
    try {
      const { data } = await api.get('/knowledge/bookmarks')
      setBookmarks(data || [])
    } catch (error) {
      console.error('Error loading bookmarks', error)
    }
  }

  useEffect(() => {
    if (!user) return

    const loadLookups = async () => {
      try {
        const [cats, tgs] = await Promise.all([
          api.get('/lookups/categories'),
          api.get('/lookups/tags')
        ])
        setCategories(cats.data || [])
        setTags(tgs.data || [])
      } catch (error) {
        console.error('Error loading lookups', error)
      }
    }

    loadLookups()
  }, [user])

  useEffect(() => {
    if (!user) return
    const fetchKnowledge = async () => {
      setKnowledgeLoading(true)
      try {
        const { data } = await api.get('/knowledge', {
          params: {
            q: filters.q || undefined,
            status: filters.status || undefined,
            region_code: filters.region || undefined,
            tag_id: filters.tag || undefined,
            category_id: filters.category || undefined
          }
        })
        setKnowledge(data || [])
      } catch (error) {
        console.error('Error fetching knowledge', error)
      } finally {
        setKnowledgeLoading(false)
      }
    }

    fetchKnowledge()
  }, [user, filters])

  useEffect(() => {
    if (!user || !canGovern) return
    const loadFlags = async () => {
      setLoadingFlags(true)
      try {
        const { data } = await api.get('/governance/flags')
        setFlags(data || [])
      } catch (error) {
        console.error('Error loading flags', error)
      } finally {
        setLoadingFlags(false)
      }
    }
    loadFlags()
  }, [user, canGovern])

  useEffect(() => {
    if (!user) return
    fetchTraining()
    fetchBookmarks()
  }, [user])

  useEffect(() => {
    if (!user || !canViewKpi) return
    fetchKpis()
  }, [user, canViewKpi])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/knowledge', {
        title: form.title,
        summary: form.summary,
        item_type: form.item_type,
        content_uri: form.content_uri,
        status: form.status,
        region_code: form.region_code || userAccount?.region_code,
        categoryIds: form.categoryIds,
        tagIds: form.tagIds
      })
      setForm({ title: '', summary: '', item_type: '', content_uri: '', status: 'draft', categoryIds: [], tagIds: [], region_code: '' })
      setShowCreateModal(false)
      const { data } = await api.get('/knowledge')
      setKnowledge(data || [])
      setToast({ type: 'success', message: 'Knowledge item created.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to create knowledge item' })
    }
  }

  const handleCreateTraining = async (e) => {
    e.preventDefault()
    try {
      await api.post('/training/events', {
        topic: trainingForm.topic,
        mode: trainingForm.mode,
        scheduled_at: trainingForm.scheduled_at ? new Date(trainingForm.scheduled_at).toISOString() : null,
        duration_minutes: trainingForm.duration_minutes ? Number(trainingForm.duration_minutes) : null,
        notes: trainingForm.notes
      })
      setTrainingForm({ topic: '', mode: '', scheduled_at: '', duration_minutes: '', notes: '' })
      setShowTrainingModal(false)
      fetchTraining()
      setToast({ type: 'success', message: 'Training event created.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to create training event' })
    }
  }

  const handleCreateKpi = async (e) => {
    e.preventDefault()
    try {
      await api.post('/kpi/snapshots', {
        period_start: kpiForm.period_start || null,
        period_end: kpiForm.period_end || null,
        duplication_rate: kpiForm.duplication_rate ? parseFloat(kpiForm.duplication_rate) : null,
        average_onboarding_weeks: kpiForm.average_onboarding_weeks ? parseFloat(kpiForm.average_onboarding_weeks) : null,
        collaboration_index: kpiForm.collaboration_index ? parseFloat(kpiForm.collaboration_index) : null
      })
      setKpiForm({ period_start: '', period_end: '', duplication_rate: '', average_onboarding_weeks: '', collaboration_index: '' })
      setShowKpiModal(false)
      fetchKpis()
      setToast({ type: 'success', message: 'KPI snapshot recorded.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to create KPI snapshot' })
    }
  }

  const statusPills = {
    draft: 'bg-purple-50 text-purple-700',
    in_review: 'bg-purple-100 text-purple-700',
    published: 'bg-purple-200 text-purple-800',
    rejected: 'bg-purple-50 text-purple-600',
    needs_changes: 'bg-purple-50 text-purple-600'
  }

  const statusClass = (status) => statusPills[status] || 'bg-purple-50 text-purple-700'

  const requestTrainingParticipation = async (eventId) => {
    try {
      await api.post(`/training/events/${eventId}/participants`, {})
      setToast({ type: 'success', message: 'Participation requested.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to request participation' })
    }
  }

  const openFlagModal = (id) => {
    setFlagItemId(id)
    setFlagNote('')
    setFlagModalOpen(true)
  }

  const submitFlag = async (e) => {
    e.preventDefault()
    if (!flagItemId) return
    try {
      await api.post(`/knowledge/${flagItemId}/flags`, { note: flagNote })
      setFlagModalOpen(false)
      setFlagNote('')
      setToast({ type: 'success', message: 'Flag submitted.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to flag item' })
    }
  }

  const createCategory = async () => {
    if (!newCategory.trim()) return
    setCreatingLookup((s) => ({ ...s, category: true }))
    try {
      const { data } = await api.post('/lookups/categories', { name: newCategory.trim() })
      setCategories((prev) => [...prev, data])
      setNewCategory('')
      setToast({ type: 'success', message: 'Category added.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to add category' })
    } finally {
      setCreatingLookup((s) => ({ ...s, category: false }))
    }
  }

  const createTag = async () => {
    if (!newTag.trim()) return
    setCreatingLookup((s) => ({ ...s, tag: true }))
    try {
      const { data } = await api.post('/lookups/tags', { label: newTag.trim(), tag_type: 'custom' })
      setTags((prev) => [...prev, data])
      setNewTag('')
      setToast({ type: 'success', message: 'Tag added.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to add tag' })
    } finally {
      setCreatingLookup((s) => ({ ...s, tag: false }))
    }
  }

  const toggleArrayValue = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value])

  const bookmarkItem = async (id) => {
    try {
      await api.post(`/knowledge/${id}/bookmarks`)
      fetchBookmarks()
      setToast({ type: 'success', message: 'Bookmarked' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to bookmark' })
    }
  }

  const removeBookmark = async (id) => {
    try {
      await api.delete(`/knowledge/${id}/bookmarks`)
      setBookmarks((prev) => prev.filter((b) => b.item_id !== id))
      setToast({ type: 'success', message: 'Bookmark removed.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to remove bookmark' })
    }
  }

  const openEditModal = (item) => {
    setEditingItemId(item.id)
    setEditForm({
      title: item.title || '',
      summary: item.summary || '',
      item_type: item.item_type || '',
      content_uri: item.content_uri || '',
      status: item.status || 'draft',
      region_code: item.region_code || '',
      categoryIds: (item.item_categories || []).map((c) => c.category_id),
      tagIds: (item.item_tags || []).map((t) => t.tag_id)
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingItemId) return
    try {
      await api.patch(`/knowledge/${editingItemId}`, {
        title: editForm.title,
        summary: editForm.summary,
        item_type: editForm.item_type,
        content_uri: editForm.content_uri,
        status: editForm.status,
        region_code: editForm.region_code || userAccount?.region_code,
        categoryIds: editForm.categoryIds,
        tagIds: editForm.tagIds
      })
      setShowEditModal(false)
      setEditingItemId(null)
      const { data } = await api.get('/knowledge', {
        params: {
          q: filters.q || undefined,
          status: filters.status || undefined,
          region_code: filters.region || undefined,
          tag_id: filters.tag || undefined,
          category_id: filters.category || undefined
        }
      })
      setKnowledge(data || [])
      setToast({ type: 'success', message: 'Knowledge item updated.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to update item' })
    }
  }

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm('Delete this knowledge item?')
    if (!confirmDelete) return
    try {
      await api.delete(`/knowledge/${item.id}`)
      setKnowledge((prev) => prev.filter((k) => k.id !== item.id))
      setToast({ type: 'success', message: 'Knowledge item deleted.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to delete item' })
    }
  }

  const flagItem = async (id) => {
    const note = window.prompt('Enter why this item is outdated or incorrect:')
    if (!note) return
    try {
      await api.post(`/knowledge/${id}/flags`, { note })
      alert('Flag submitted')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to flag')
    }
  }

  const resolveFlag = async (id) => {
    try {
      await api.patch(`/governance/flags/${id}/resolve`)
      setFlags((prev) => prev.filter((f) => f.id !== id))
      setToast({ type: 'success', message: 'Flag resolved.' })
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.error || 'Failed to resolve flag' })
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.32))] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.32))] py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Workspace</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-gray-600">Create, govern, and measure knowledge items as outlined in the PDF use cases.</p>
            <PermissionGuard require={['knowledge:create']}>
              <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
                + Add knowledge
              </Button>
            </PermissionGuard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="lg:col-span-2">
            <CardContent>
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500">Search</label>
                <Input
                  placeholder="Title contains..."
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <select
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All</option>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Region</label>
                <Input
                  placeholder="GLOBAL"
                  value={filters.region}
                  onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Category</label>
                <select
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Any</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tag</label>
                <select
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  value={filters.tag}
                  onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
                >
                  <option value="">Any</option>
                  {tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {knowledgeLoading ? (
              <div className="text-center py-8 text-gray-500">Loading knowledge items...</div>
            ) : knowledge.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No items match the filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Region</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                    {knowledge.map((item) => (
                     <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={
                            item.status === 'published' ? 'success' :
                            item.status === 'rejected' ? 'destructive' :
                            item.status === 'in_review' || item.status === 'needs_changes' ? 'warning' :
                            'secondary'
                          }>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.item_type || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.region_code}</td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => bookmarkItem(item.id)}>Bookmark</Button>
                          <Button size="sm" variant="ghost" onClick={() => openFlagModal(item.id)}>Flag</Button>
                          {((canUpdateAny || (canUpdateOwn && item.owner_id === userAccount?.id)) || (canDeleteAny || (canDeleteOwn && item.owner_id === userAccount?.id))) && (
                            <>
                              {(canUpdateAny || (canUpdateOwn && item.owner_id === userAccount?.id)) && (
                                <Button size="sm" variant="ghost" onClick={() => openEditModal(item)}>Edit</Button>
                              )}
                              {(canDeleteAny || (canDeleteOwn && item.owner_id === userAccount?.id)) && (
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>Delete</Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Flag Modal */}
        <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Flag item</DialogTitle>
              <DialogDescription>Describe what’s outdated or incorrect. Governance will review.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitFlag} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Flag note</label>
                <Textarea
                  rows="4"
                  required
                  placeholder="Explain what needs attention"
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setFlagModalOpen(false)}>Cancel</Button>
                <Button type="submit">Submit flag</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Training Modal */}
        <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add training event</DialogTitle>
              <DialogDescription>Create a session with topic, mode, time, and notes.</DialogDescription>
            </DialogHeader>
            <PermissionGuard require={['training:create']} fallback={<p className="text-red-600">You do not have permission to create training events.</p>}>
              <form onSubmit={handleCreateTraining} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">Topic</label>
                  <input
                    className="input-field"
                    placeholder="e.g., Onboarding 101"
                    required
                    value={trainingForm.topic}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, topic: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Mode</label>
                    <input
                      className="input-field"
                      placeholder="virtual or onsite"
                      value={trainingForm.mode}
                      onChange={(e) => setTrainingForm((f) => ({ ...f, mode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Scheduled at</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={trainingForm.scheduled_at}
                      onChange={(e) => setTrainingForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Duration (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="60"
                      value={trainingForm.duration_minutes}
                      onChange={(e) => setTrainingForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">Notes</label>
                  <Textarea
                    rows="3"
                    placeholder="Key outcomes, audience, or materials"
                    value={trainingForm.notes}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowTrainingModal(false)}>Cancel</Button>
                  <Button type="submit">Save event</Button>
                </DialogFooter>
              </form>
            </PermissionGuard>
          </DialogContent>
        </Dialog>

        {/* KPI Snapshot Modal */}
        <Dialog open={showKpiModal} onOpenChange={setShowKpiModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add KPI snapshot</DialogTitle>
              <DialogDescription>Capture period start/end and the three core metrics.</DialogDescription>
            </DialogHeader>
            <PermissionGuard require={['kpi:create']} fallback={<p className="text-red-600">You do not have permission to create KPI snapshots.</p>}>
              <form onSubmit={handleCreateKpi} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Period start</label>
                    <input
                      type="date"
                      className="input-field"
                      required
                      value={kpiForm.period_start}
                      onChange={(e) => setKpiForm((f) => ({ ...f, period_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Period end</label>
                    <input
                      type="date"
                      className="input-field"
                      required
                      value={kpiForm.period_end}
                      onChange={(e) => setKpiForm((f) => ({ ...f, period_end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Duplication rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      placeholder="12.5"
                      value={kpiForm.duplication_rate}
                      onChange={(e) => setKpiForm((f) => ({ ...f, duplication_rate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Avg onboarding (weeks)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      placeholder="3.2"
                      value={kpiForm.average_onboarding_weeks}
                      onChange={(e) => setKpiForm((f) => ({ ...f, average_onboarding_weeks: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Collaboration index</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      placeholder="78"
                      value={kpiForm.collaboration_index}
                      onChange={(e) => setKpiForm((f) => ({ ...f, collaboration_index: e.target.value }))}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowKpiModal(false)}>Cancel</Button>
                  <Button type="submit">Save snapshot</Button>
                </DialogFooter>
              </form>
            </PermissionGuard>
          </DialogContent>
        </Dialog>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-primary-700'}`}>
            <div className="flex items-center gap-3">
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">×</button>
            </div>
          </div>
        )}

        {/* Edit Knowledge Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit knowledge item</DialogTitle>
              <DialogDescription>Update title, summary, link, region, categories, tags, and status.</DialogDescription>
            </DialogHeader>
            <PermissionGuard require={['knowledge:update', 'knowledge:update_own', 'knowledge:*']} fallback={<p className="text-red-600">You do not have permission to edit knowledge items.</p>}>
              <form onSubmit={handleUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Title</label>
                      <input
                        className="input-field"
                        placeholder="e.g., DKN Playbook for Onboarding"
                        required
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Content link</label>
                      <input
                        className="input-field"
                        placeholder="https://..."
                        value={editForm.content_uri}
                        onChange={(e) => setEditForm((f) => ({ ...f, content_uri: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Summary</label>
                    <Textarea
                      placeholder="Brief synopsis that matches the PDF guidance."
                      rows="3"
                      value={editForm.summary}
                      onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Type</label>
                      <input
                        className="input-field"
                        placeholder="Playbook, SOP, Template"
                        value={editForm.item_type}
                        onChange={(e) => setEditForm((f) => ({ ...f, item_type: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Status</label>
                      <select
                        className="input-field"
                        value={editForm.status}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Region</label>
                      <input
                        className="input-field"
                        placeholder="GLOBAL or region code"
                        value={editForm.region_code}
                        onChange={(e) => setEditForm((f) => ({ ...f, region_code: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Categories</p>
                      <p className="text-xs text-gray-500">Pick themes like Onboarding, SOPs, Templates</p>
                    </div>
                    {categories.length === 0 ? (
                      <p className="text-xs text-gray-500">No categories yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => setEditForm((f) => ({ ...f, categoryIds: toggleArrayValue(f.categoryIds, c.id) }))}
                            className={`px-3 py-1 rounded-full text-xs border transition ${editForm.categoryIds.includes(c.id) ? 'bg-primary-100 border-primary-300 text-primary-800' : 'border-gray-200 text-gray-700 hover:border-primary-200'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Tags</p>
                      <p className="text-xs text-gray-500">Add labels like AI, Playbook, Compliance</p>
                    </div>
                    {tags.length === 0 ? (
                      <p className="text-xs text-gray-500">No tags yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setEditForm((f) => ({ ...f, tagIds: toggleArrayValue(f.tagIds, t.id) }))}
                            className={`px-3 py-1 rounded-full text-xs border transition ${editForm.tagIds.includes(t.id) ? 'bg-primary-100 border-primary-300 text-primary-800' : 'border-gray-200 text-gray-700 hover:border-primary-200'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </PermissionGuard>
          </DialogContent>
        </Dialog>

        {/* Create Knowledge Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add knowledge item</DialogTitle>
              <DialogDescription>Capture title, summary, type, link, region, categories, tags, and status.</DialogDescription>
            </DialogHeader>
            <PermissionGuard require={['knowledge:create']} fallback={<p className="text-red-600">You do not have permission to create knowledge items.</p>}>
              <form onSubmit={handleCreate} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Title</label>
                      <input
                        className="input-field"
                        placeholder="e.g., DKN Playbook for Onboarding"
                        required
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Content link</label>
                      <input
                        className="input-field"
                        placeholder="https://..."
                        value={form.content_uri}
                        onChange={(e) => setForm((f) => ({ ...f, content_uri: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Summary</label>
                    <Textarea
                      placeholder="Brief synopsis that matches the PDF guidance."
                      rows="3"
                      value={form.summary}
                      onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Type</label>
                      <input
                        className="input-field"
                        placeholder="Playbook, SOP, Template"
                        value={form.item_type}
                        onChange={(e) => setForm((f) => ({ ...f, item_type: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Status</label>
                      <select
                        className="input-field"
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-800">Region</label>
                      <input
                        className="input-field"
                        placeholder="GLOBAL or region code"
                        value={form.region_code}
                        onChange={(e) => setForm((f) => ({ ...f, region_code: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Categories</p>
                      <p className="text-xs text-gray-500">Pick themes like Onboarding, SOPs, Templates</p>
                    </div>
                    {categories.length === 0 ? (
                      <p className="text-xs text-gray-500">No categories yet. {userAccount?.role_code === 'SystemAdmin' || userAccount?.role_code === 'KnowledgeSupervisor' ? 'Add one below.' : 'Ask a supervisor/admin to add.'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => setForm((f) => ({ ...f, categoryIds: toggleArrayValue(f.categoryIds, c.id) }))}
                            className={`px-3 py-1 rounded-full text-xs border transition ${form.categoryIds.includes(c.id) ? 'bg-primary-100 border-primary-300 text-primary-800' : 'border-gray-200 text-gray-700 hover:border-primary-200'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <PermissionGuard require={['lookups:create']}>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          className="input-field flex-1"
                          placeholder="Add new category"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button type="button" onClick={createCategory} className="btn-secondary text-sm" disabled={creatingLookup.category}>Add</button>
                      </div>
                    </PermissionGuard>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Tags</p>
                      <p className="text-xs text-gray-500">Add labels like AI, Playbook, Compliance</p>
                    </div>
                    {tags.length === 0 ? (
                      <p className="text-xs text-gray-500">No tags yet. {userAccount?.role_code === 'SystemAdmin' || userAccount?.role_code === 'KnowledgeSupervisor' ? 'Add one below.' : 'Ask a supervisor/admin to add.'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setForm((f) => ({ ...f, tagIds: toggleArrayValue(f.tagIds, t.id) }))}
                            className={`px-3 py-1 rounded-full text-xs border transition ${form.tagIds.includes(t.id) ? 'bg-primary-100 border-primary-300 text-primary-800' : 'border-gray-200 text-gray-700 hover:border-primary-200'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <PermissionGuard require={['lookups:create']}>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          className="input-field flex-1"
                          placeholder="Add new tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                        />
                        <button type="button" onClick={createTag} className="btn-secondary text-sm" disabled={creatingLookup.tag}>Add</button>
                      </div>
                    </PermissionGuard>
                  </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit">Save item</Button>
                </DialogFooter>
              </form>
            </PermissionGuard>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
