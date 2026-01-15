import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function KPI() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState([])
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    period_start: '',
    period_end: '',
    duplication_rate: '',
    average_onboarding_weeks: '',
    collaboration_index: ''
  })

  const canViewKpi = userAccount && ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)

  useEffect(() => {
    if (!loading && (!user || !canViewKpi)) {
      navigate('/dashboard')
    }
  }, [user, userAccount, loading, navigate, canViewKpi])

  useEffect(() => {
    if (!user || !canViewKpi) return
    fetchKpis()
  }, [user, canViewKpi])

  const fetchKpis = async () => {
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

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/kpi/snapshots', {
        period_start: form.period_start ? new Date(form.period_start).toISOString() : null,
        period_end: form.period_end ? new Date(form.period_end).toISOString() : null,
        duplication_rate: parseFloat(form.duplication_rate) || null,
        average_onboarding_weeks: parseFloat(form.average_onboarding_weeks) || null,
        collaboration_index: parseFloat(form.collaboration_index) || null
      })
      setForm({ period_start: '', period_end: '', duplication_rate: '', average_onboarding_weeks: '', collaboration_index: '' })
      setShowModal(false)
      fetchKpis()
    } catch (error) {
      console.error('Error creating KPI snapshot', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & KPI Snapshots</h1>
          <p className="text-gray-600 mt-1">Track key performance indicators over time</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
        >
          Create KPI Snapshot
        </button>
      </div>

      {loadingKpis ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : kpis.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No KPI snapshots yet</h3>
          <p className="text-gray-500 mb-4">Start tracking your organizational performance metrics</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Snapshot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    KPI Snapshot - {new Date(kpi.period_start).toLocaleDateString()} to {new Date(kpi.period_end).toLocaleDateString()}
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  Created: {new Date(kpi.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Duplication Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {kpi.duplication_rate ? `${kpi.duplication_rate}%` : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Avg. Onboarding</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {kpi.average_onboarding_weeks ? `${kpi.average_onboarding_weeks} weeks` : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Collaboration Index</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {kpi.collaboration_index || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create KPI Snapshot</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                <input
                  type="date"
                  required
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                <input
                  type="date"
                  required
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duplication Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.duplication_rate}
                  onChange={(e) => setForm({ ...form, duplication_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="3.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Average Onboarding (weeks)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.average_onboarding_weeks}
                  onChange={(e) => setForm({ ...form, average_onboarding_weeks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="4.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collaboration Index</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.collaboration_index}
                  onChange={(e) => setForm({ ...form, collaboration_index: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="87.5"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
