import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { PermissionGuard, RoleGuard } from '../components/PermissionGuard'

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
  }, [user])

  useEffect(() => {
    if (!user || !canViewKpi) return
    fetchKpis()
  }, [user, canViewKpi])

  const stats = useMemo(() => {
    const total = knowledge.length
    const published = knowledge.filter((k) => k.status === 'published').length
    const inReview = knowledge.filter((k) => k.status === 'in_review').length
    const drafts = knowledge.filter((k) => k.status === 'draft').length
    return { total, published, inReview, drafts }
  }, [knowledge])

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
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create knowledge item')
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
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create training event')
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
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create KPI snapshot')
    }
  }

  const toggleArrayValue = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value])

  const bookmarkItem = async (id) => {
    try {
      await api.post(`/knowledge/${id}/bookmarks`)
      alert('Bookmarked')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to bookmark')
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
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to resolve flag')
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.32))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary w-full sm:w-auto"
              >
                + Add knowledge
              </button>
            </PermissionGuard>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600">Total items</p>
            <p className="text-3xl font-bold text-primary-700">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.published}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">In review</p>
            <p className="text-3xl font-bold text-amber-600">{stats.inReview}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-3xl font-bold text-slate-700">{stats.drafts}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="card lg:col-span-2">
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500">Search</label>
                <input
                  className="input-field"
                  placeholder="Title contains..."
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <select
                  className="input-field"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All</option>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Region</label>
                <input
                  className="input-field"
                  placeholder="GLOBAL"
                  value={filters.region}
                  onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Category</label>
                <select
                  className="input-field"
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
                  className="input-field"
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
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{item.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.item_type || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.region_code}</td>
                        <td className="px-4 py-3 text-sm space-x-3">
                          <button onClick={() => bookmarkItem(item.id)} className="text-primary-600 hover:text-primary-800">Bookmark</button>
                          <button onClick={() => flagItem(item.id)} className="text-amber-600 hover:text-amber-800">Flag</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RoleGuard require={['KnowledgeSupervisor', 'SystemAdmin']}>
            <div className="card">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Training & adoption</h2>
                  <p className="text-sm text-gray-600">Schedule sessions and track attendance.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full">Supervisor</span>
                  <button onClick={() => setShowTrainingModal(true)} className="btn-primary text-sm">+ Add training</button>
                </div>
              </div>
              {loadingTraining ? (
                <p className="text-gray-500">Loading training events...</p>
              ) : trainingEvents.length === 0 ? (
                <p className="text-gray-500">No training events yet. Use “Add training” to schedule one.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {trainingEvents.map((evt) => (
                    <li key={evt.id} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{evt.topic}</p>
                          <p className="text-sm text-gray-600">{evt.mode || 'N/A'} · {evt.status}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{evt.scheduled_at ? new Date(evt.scheduled_at).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </RoleGuard>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Governance queue</h2>
              <PermissionGuard require={['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin']} fallback={<span className="text-xs text-gray-500">View only</span>}>
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">Council</span>
              </PermissionGuard>
            </div>
            <PermissionGuard
              require={['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin']}
              fallback={<p className="text-gray-500">You can flag items from the table; governance users see the review queue.</p>}
            >
              {loadingFlags ? (
                <p className="text-gray-500">Loading flags...</p>
              ) : flags.length === 0 ? (
                <p className="text-gray-500">No open flags.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {flags.map((flag) => (
                    <li key={flag.id} className="py-3 flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        {(() => {
                          const itemMeta = knowledge.find((k) => k.id === flag.item_id)
                          const itemTitle = flag.knowledge_items?.title || itemMeta?.title || `Item ${flag.item_id.slice(0, 8)}…`
                          const itemStatus = flag.knowledge_items?.status || itemMeta?.status
                          return (
                            <>
                              <p className="font-semibold text-gray-900">{itemTitle}</p>
                              {itemStatus && (
                                <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">{itemStatus}</span>
                              )}
                            </>
                          )
                        })()}
                        <p className="text-sm text-gray-600">{flag.note}</p>
                      </div>
                      <button onClick={() => resolveFlag(flag.id)} className="text-sm text-emerald-600 hover:text-emerald-800">Resolve</button>
                    </li>
                  ))}
                </ul>
              )}
            </PermissionGuard>
          </div>
        </div>

        {canViewKpi && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">KPI snapshots</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">Top management</span>
                <PermissionGuard require={['kpi:create']}>
                  <button onClick={() => setShowKpiModal(true)} className="btn-primary text-sm">+ Add snapshot</button>
                </PermissionGuard>
              </div>
            </div>
            {loadingKpis ? (
              <p className="text-gray-500">Loading KPI snapshots...</p>
            ) : kpis.length === 0 ? (
              <p className="text-gray-500">No KPI snapshots recorded yet. Use “Add snapshot” to record the first period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Duplication</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Onboarding (wks)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Collaboration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kpis.map((kpi) => (
                      <tr key={kpi.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {kpi.period_start} → {kpi.period_end}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{kpi.duplication_rate ?? '—'}%</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{kpi.average_onboarding_weeks ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{kpi.collaboration_index ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Training Modal */}
        {showTrainingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowTrainingModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-auto p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-gray-900">Add training event</h3>
                  <p className="text-sm text-gray-600">Create a session with topic, mode, time, and notes.</p>
                </div>
                <button onClick={() => setShowTrainingModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">×</button>
              </div>

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
                    <textarea
                      className="input-field"
                      rows="3"
                      placeholder="Key outcomes, audience, or materials"
                      value={trainingForm.notes}
                      onChange={(e) => setTrainingForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowTrainingModal(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save event</button>
                  </div>
                </form>
              </PermissionGuard>
            </div>
          </div>
        )}

        {/* KPI Snapshot Modal */}
        {showKpiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowKpiModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-auto p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-gray-900">Add KPI snapshot</h3>
                  <p className="text-sm text-gray-600">Capture period start/end and the three core metrics.</p>
                </div>
                <button onClick={() => setShowKpiModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">×</button>
              </div>

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

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowKpiModal(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save snapshot</button>
                  </div>
                </form>
              </PermissionGuard>
            </div>
          </div>
        )}

        {/* Create Knowledge Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-auto p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-gray-900">Add knowledge item</h3>
                  <p className="text-sm text-gray-600">Capture title, summary, type, link, region, categories, tags, and status.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">×</button>
              </div>

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
                    <textarea
                      className="input-field"
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Tags</p>
                      <p className="text-xs text-gray-500">Add labels like AI, Playbook, Compliance</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setForm((f) => ({ ...f, tagIds: toggleArrayValue(f.tagIds, t.id) }))}
                          className={`px-3 py-1 rounded-full text-xs border transition ${form.tagIds.includes(t.id) ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'border-gray-200 text-gray-700 hover:border-emerald-200'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save item</button>
                  </div>
                </form>
              </PermissionGuard>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
