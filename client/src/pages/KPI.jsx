import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { BarChart3, TrendingUp, TrendingDown, Activity, Plus } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function KPI() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState([])
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ period_start: '', period_end: '', duplication_rate: '', average_onboarding_weeks: '', collaboration_index: '' })
  const [submitting, setSubmitting] = useState(false)

  const canView = userAccount && ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)

  useEffect(() => {
    if (!loading && (!user || !canView)) {
      navigate('/dashboard')
    }
  }, [user, userAccount, loading, navigate, canView])

  useEffect(() => {
    if (!user || !canView) return
    fetchKpis()
  }, [user, canView])

  const fetchKpis = async () => {
    setLoadingKpis(true)
    try {
      const { data } = await api.get('/kpi/snapshots')
      setKpis(data || [])
    } catch (error) {
      console.error('Error loading KPIs', error)
    } finally {
      setLoadingKpis(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/kpi/snapshots', {
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        duplication_rate: form.duplication_rate ? parseFloat(form.duplication_rate) : null,
        average_onboarding_weeks: form.average_onboarding_weeks ? parseFloat(form.average_onboarding_weeks) : null,
        collaboration_index: form.collaboration_index ? parseFloat(form.collaboration_index) : null
      })
      setShowModal(false)
      setForm({ period_start: '', period_end: '', duplication_rate: '', average_onboarding_weeks: '', collaboration_index: '' })
      fetchKpis()
      alert('KPI snapshot created successfully')
    } catch (error) {
      console.error('Failed to create KPI:', error)
      alert('Failed to create KPI snapshot')
    } finally {
      setSubmitting(false)
    }
  }

  const canCreate = userAccount && ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)

  if (loading || loadingKpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-gray-500">Loading KPI data...</p>
        </div>
      </div>
    )
  }

  const mockChartData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 61 },
    { month: 'Apr', value: 58 },
    { month: 'May', value: 70 },
    { month: 'Jun', value: 75 }
  ]

  const latestKpi = kpis[0] || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & KPIs</h1>
            <p className="text-gray-500 mt-1">Track performance metrics and insights</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add KPI
          </Button>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add KPI Snapshot</DialogTitle>
            <DialogDescription>Record performance metrics for a specific period</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Period Start</label>
                <Input
                  type="date"
                  required
                  value={form.period_start}
                  onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Period End</label>
                <Input
                  type="date"
                  required
                  value={form.period_end}
                  onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Duplication Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="3.2"
                  value={form.duplication_rate}
                  onChange={(e) => setForm((f) => ({ ...f, duplication_rate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Avg Onboarding (weeks)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="2.4"
                  value={form.average_onboarding_weeks}
                  onChange={(e) => setForm((f) => ({ ...f, average_onboarding_weeks: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Collaboration Index</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="78"
                  value={form.collaboration_index}
                  onChange={(e) => setForm((f) => ({ ...f, collaboration_index: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Snapshot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Duplication Rate</p>
                <p className="text-3xl font-bold text-gray-900">{latestKpi.duplication_rate || 0}%</p>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span>-2.5%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Onboarding (weeks)</p>
                <p className="text-3xl font-bold text-gray-900">{latestKpi.average_onboarding_weeks || 0}</p>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span>-0.5 weeks</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Collaboration Index</p>
                <p className="text-3xl font-bold text-gray-900">{latestKpi.collaboration_index || 0}</p>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+8.2%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Monthly collaboration index over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Metrics</CardTitle>
            <CardDescription>Key performance indicators comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical KPI Records</CardTitle>
          <CardDescription>All recorded KPI measurements</CardDescription>
        </CardHeader>
        <CardContent>
          {kpis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No KPI records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(kpi.period_start).toLocaleDateString()} - {new Date(kpi.period_end).toLocaleDateString()}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>Duplication: {kpi.duplication_rate}%</span>
                      <span>Onboarding: {kpi.average_onboarding_weeks}w</span>
                      <span>Collaboration: {kpi.collaboration_index}</span>
                    </div>
                  </div>
                  <Badge variant="outline">Period #{kpi.id}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
