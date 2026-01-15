import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import { Button } from '../components/ui/button'
import { TrendingUp, BookOpen, Users, Flag, Target, Share2, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

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
  const [statusData, setStatusData] = useState([])
  const [regionData, setRegionData] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
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

        const statusBreakdown = {}
        knowledge.forEach(item => {
          statusBreakdown[item.status] = (statusBreakdown[item.status] || 0) + 1
        })

        const statusArray = Object.entries(statusBreakdown).map(([name, value]) => ({
          name: name.replace(/_/g, ' ').charAt(0).toUpperCase() + name.replace(/_/g, ' ').slice(1),
          value
        }))
        setStatusData(statusArray)

        const regionBreakdown = {}
        knowledge.forEach(item => {
          const region = item.region_code || 'Unknown'
          regionBreakdown[region] = (regionBreakdown[region] || 0) + 1
        })

        const regionArray = Object.entries(regionBreakdown).map(([name, value]) => ({
          name,
          value
        }))
        setRegionData(regionArray)

        let flagsCount = 0
        if (['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)) {
          const flagsRes = await api.get('/governance/flags').catch(() => ({ data: [] }))
          flagsCount = flagsRes.data?.length || 0
        }

        let kpisCount = 0
        if (['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)) {
          const kpisRes = await api.get('/kpi').catch(() => ({ data: [] }))
          kpisCount = kpisRes.data?.length || 0
        }

        setStats({
          totalKnowledge: knowledge.length,
          publishedKnowledge: statusBreakdown['published'] || 0,
          inReviewKnowledge: statusBreakdown['in_review'] || 0,
          draftKnowledge: statusBreakdown['draft'] || 0,
          totalTraining: training.length,
          totalBookmarks: bookmarks.length,
          totalFlags: flagsCount,
          totalKpis: kpisCount
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [user, userAccount?.role_code])

  if (loading || loadingStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ icon: Icon, label, value, color = 'purple' }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-100">
            <Icon className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.email?.split('@')[0]}! 👋</h2>
        <p className="text-gray-500 mt-2">Here's your knowledge management dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Knowledge Items" value={stats.totalKnowledge} />
        <StatCard icon={Users} label="Training Events" value={stats.totalTraining} />
        <StatCard icon={Target} label="My Bookmarks" value={stats.totalBookmarks} />
        {userAccount?.role_code && ['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount.role_code) && (
          <StatCard icon={Flag} label="Flagged Items" value={stats.totalFlags} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Status</CardTitle>
            <CardDescription>Distribution of knowledge items by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey="value" fill="#9333ea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Published</span>
                  <Badge variant="success">{stats.publishedKnowledge}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">In Review</span>
                  <Badge variant="default">{stats.inReviewKnowledge}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Draft</span>
                  <Badge variant="warning">{stats.draftKnowledge}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {regionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Distribution by Region</CardTitle>
            <CardDescription>Geographic spread of content items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" onClick={() => navigate('/knowledge')}>
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Knowledge
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/training')}>
              <Share2 className="w-4 h-4 mr-2" />
              View Training
            </Button>
            <Button className="justify-start" onClick={() => navigate('/kpi')}>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
