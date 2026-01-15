import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { FlagIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

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
      await api.post('/governance/flags', {
        item_id: selectedItem,
        note: flagNote
      })
      setShowModal(false)
      setFlagNote('')
      setSelectedItem(null)
      fetchFlags()
    } catch (error) {
      console.error('Error flagging item', error)
    }
  }

  const resolveFlag = async (flagId) => {
    try {
      await api.patch(`/governance/flags/${flagId}`, { status: 'resolved' })
      fetchFlags()
    } catch (error) {
      console.error('Error resolving flag', error)
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
          <h1 className="text-3xl font-bold text-gray-800">Governance & Flags</h1>
          <p className="text-gray-600 mt-1">Review and manage flagged knowledge items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
        >
          Flag an Item
        </button>
      </div>

      {loadingFlags ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : flags.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No flagged items</h3>
          <p className="text-gray-500">All knowledge items are in good standing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white rounded-lg shadow-md border border-orange-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <FlagIcon className="w-5 h-5 text-purple-600" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      flag.status === 'open' ? 'bg-purple-100 text-purple-700' : 'bg-purple-200 text-purple-800'
                    }`}>
                      {flag.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Item ID: {flag.item_id}
                  </h3>
                  <p className="text-gray-600 mb-3">{flag.note}</p>
                  <p className="text-sm text-gray-500">
                    Flagged on {new Date(flag.created_at).toLocaleDateString()}
                  </p>
                </div>
                {flag.status === 'open' && (
                  <button
                    onClick={() => resolveFlag(flag.id)}
                    className="ml-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flag Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Flag Knowledge Item</h2>
            <form onSubmit={handleFlagItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
                <select
                  required
                  value={selectedItem || ''}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for flagging</label>
                <textarea
                  required
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="4"
                  placeholder="Explain why this item needs attention..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Flag Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFlagNote('')
                    setSelectedItem(null)
                  }}
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
