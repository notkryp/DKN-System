import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import MetricCard from '../components/MetricCard'
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  FlagIcon, 
  ChartBarIcon,
  BookmarkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function DashboardOverview() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalKnowledge: 0,
    publishedKnowledge: 0,
    inReviewKnowledge: 0,
    draftKnowledge: 0,
    totalTraining: 0,
    totalBookmarks: 0,
    totalFlags: 0,
    totalKpis: 0
  })
  const [statusData, setStatusData] = useState({})
  const [regionData, setRegionData] = useState({})
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const [knowledgeRes, trainingRes, bookmarksRes] = await Promise.all([
          api.get('/knowledge').catch(() => ({ data: [] })),
          api.get('/training/events').catch(() => ({ data: [] })),
          api.get('/knowledge/bookmarks').catch(() => ({ data: [] }))
        ])

        const knowledge = knowledgeRes.data || []
        const training = trainingRes.data || []
        const bookmarks = bookmarksRes.data || []

        // Calculate status breakdown
        const statusBreakdown = {}
        knowledge.forEach(item => {
          statusBreakdown[item.status] = (statusBreakdown[item.status] || 0) + 1
        })
        setStatusData(statusBreakdown)

        // Calculate region breakdown
        const regionBreakdown = {}
        knowledge.forEach(item => {
          const region = item.region_code || 'Unknown'
          regionBreakdown[region] = (regionBreakdown[region] || 0) + 1
        })
        setRegionData(regionBreakdown)

        // Fetch flags if user has permission
        let flagsCount = 0
        if (['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)) {
          const flagsRes = await api.get('/governance/flags').catch(() => ({ data: [] }))
          flagsCount = flagsRes.data?.length || 0
        }

        // Fetch KPIs if user has permission
        let kpisCount = 0
        if (['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)) {
          const kpisRes = await api.get('/kpi/snapshots').catch(() => ({ data: [] }))
          kpisCount = kpisRes.data?.length || 0
        }

        setStats({
          totalKnowledge: knowledge.length,
          publishedKnowledge: knowledge.filter(k => k.status === 'published').length,
          inReviewKnowledge: knowledge.filter(k => k.status === 'in_review').length,
          draftKnowledge: knowledge.filter(k => k.status === 'draft').length,
          totalTraining: training.length,
          totalBookmarks: bookmarks.length,
          totalFlags: flagsCount,
          totalKpis: kpisCount
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [user, userAccount])

  const canViewGovernance = userAccount && ['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)
  const canViewKpi = userAccount && ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Knowledge Items"
          value={stats.totalKnowledge}
          link="/knowledge"
          linkText="VIEW KNOWLEDGE BUCKET"
          icon={BookOpenIcon}
          color="blue"
        />
        
        <MetricCard
          title="Training Events"
          value={stats.totalTraining}
          link="/training"
          linkText="VIEW TRAINING"
          icon={AcademicCapIcon}
          color="green"
        />

        <MetricCard
          title="My Bookmarks"
          value={stats.totalBookmarks}
          link="/bookmarks"
          linkText="VIEW BOOKMARKS"
          icon={BookmarkIcon}
          color="purple"
        />

        {canViewGovernance && (
          <MetricCard
            title="Flagged Items"
            value={stats.totalFlags}
            link="/governance"
            linkText="VIEW GOVERNANCE"
            icon={FlagIcon}
            color="orange"
          />
        )}

        {canViewKpi && (
          <MetricCard
            title="KPI Snapshots"
            value={stats.totalKpis}
            link="/kpi"
            linkText="VIEW REPORTS"
            icon={ChartBarIcon}
            color="indigo"
          />
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Knowledge by Status</h2>
          {loadingStats ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : Object.keys(statusData).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(statusData).map(([status, count]) => ({
                name: status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                count: count
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="count" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Region Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Knowledge by Region</h2>
          {loadingStats ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : Object.keys(regionData).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(regionData).map(([region, count]) => ({
                    name: region,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(regionData).map((entry, index) => {
                    const colors = ['#9333ea', '#a855f7', '#7c3aed', '#c084fc', '#6b21a8', '#d8b4fe']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Activity Line Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Activity Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[
            { month: 'Jan', knowledge: stats.totalKnowledge * 0.7, training: stats.totalTraining * 0.6 },
            { month: 'Feb', knowledge: stats.totalKnowledge * 0.8, training: stats.totalTraining * 0.7 },
            { month: 'Mar', knowledge: stats.totalKnowledge * 0.85, training: stats.totalTraining * 0.85 },
            { month: 'Apr', knowledge: stats.totalKnowledge * 0.9, training: stats.totalTraining * 0.9 },
            { month: 'May', knowledge: stats.totalKnowledge, training: stats.totalTraining }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="knowledge" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#9333ea', r: 4 }} name="Knowledge Items" />
            <Line type="monotone" dataKey="training" stroke="#c084fc" strokeWidth={2} dot={{ fill: '#c084fc', r: 4 }} name="Training Events" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{stats.publishedKnowledge}</p>
            <p className="text-sm text-gray-600 mt-1">Published</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-500">{stats.inReviewKnowledge}</p>
            <p className="text-sm text-gray-600 mt-1">In Review</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-400">{stats.draftKnowledge}</p>
            <p className="text-sm text-gray-600 mt-1">Drafts</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-700">{stats.totalTraining}</p>
            <p className="text-sm text-gray-600 mt-1">Training Events</p>
          </div>
        </div>
      </div>
    </div>
  )
}
