import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Shield, Flag, CheckCircle, AlertTriangle } from 'lucide-react'

export default function Governance() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()
  const [flags, setFlags] = useState([])
  const [loadingFlags, setLoadingFlags] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [flagNote, setFlagNote] = useState('')
  const [knowledge, setKnowledge] = useState([])

  const canGovern = userAccount && ['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)

  useEffect(() => {
    if (!loading && (!user || !canGovern)) {
      navigate('/dashboard')
    }
  }, [user, userAccount, loading, navigate, canGovern])

  useEffect(() => {
    if (!user || !canGovern) return
    fetchFlags()
    fetchKnowledge()
  }, [user, canGovern])

  const fetchFlags = async () => {
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

  const fetchKnowledge = async () => {
    try {
      const { data } = await api.get('/knowledge')
      setKnowledge(data || [])
    } catch (error) {
      console.error('Error loading knowledge', error)
    }
  }

  const handleFlagItem = async (e) => {
    e.preventDefault()
    if (!selectedItem) return
    try {
      await api.post(`/knowledge/${selectedItem}/flags`, {
        note: flagNote
      })
      setShowModal(false)
      setFlagNote('')
      setSelectedItem(null)
      fetchFlags()
      alert('Item flagged successfully')
    } catch (error) {
      console.error('Error flagging item', error)
      alert('Failed to flag item: ' + (error.response?.data?.error || error.message))
    }
  }

  const resolveFlag = async (flagId) => {
    try {
      await api.patch(`/governance/flags/${flagId}/resolve`)
      fetchFlags()
      alert('Flag resolved successfully')
    } catch (error) {
      console.error('Error resolving flag', error)
      alert('Failed to resolve flag')
    }
  }

  if (loading || loadingFlags) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-gray-500">Loading governance data...</p>
        </div>
      </div>
    )
  }

  const activeFlags = flags.filter(f => f.status === 'open')
  const resolvedFlags = flags.filter(f => f.status === 'resolved')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Governance</h1>
            <p className="text-gray-500 mt-1">Manage content quality and compliance</p>
          </div>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button>
              <Flag className="w-4 h-4 mr-2" />
              Flag Content
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Flag Knowledge Item</DialogTitle>
              <DialogDescription>Select an item and provide a reason for flagging</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFlagItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Item
                </label>
                <select
                  value={selectedItem || ''}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  required
                >
                  <option value="">Choose an item...</option>
                  {knowledge.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  placeholder="Explain why this content needs review..."
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[100px]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Flag</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Flags</p>
                <p className="text-3xl font-bold text-gray-900">{activeFlags.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-3xl font-bold text-gray-900">{resolvedFlags.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-3xl font-bold text-gray-900">{knowledge.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Flags</CardTitle>
          <CardDescription>Items requiring governance review</CardDescription>
        </CardHeader>
        <CardContent>
          {activeFlags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No active flags</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeFlags.map((flag) => (
                <div key={flag.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-gray-900">
                        {flag.knowledge_items?.title || `Item #${flag.item_id}`}
                      </span>
                      <Badge variant="destructive">Open</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{flag.note}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Flagged on {new Date(flag.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveFlag(flag.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
