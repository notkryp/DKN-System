import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { AcademicCapIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function Training() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [trainingEvents, setTrainingEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ 
    topic: '', 
    mode: 'virtual', 
    scheduled_at: '', 
    duration_minutes: '', 
    notes: '' 
  })

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    fetchTraining()
  }, [user])

  const fetchTraining = async () => {
    setLoadingEvents(true)
    try {
      const { data } = await api.get('/training/events')
      setTrainingEvents(data || [])
    } catch (error) {
      console.error('Error loading training', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/training/events', {
        topic: form.topic,
        mode: form.mode,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        duration_minutes: parseInt(form.duration_minutes) || null,
        notes: form.notes
      })
      setForm({ topic: '', mode: 'virtual', scheduled_at: '', duration_minutes: '', notes: '' })
      setShowModal(false)
      fetchTraining()
    } catch (error) {
      console.error('Error creating training', error)
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
          <h1 className="text-3xl font-bold text-gray-800">Training Events</h1>
          <p className="text-gray-600 mt-1">Manage and schedule training sessions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
        >
          Schedule New Training
        </button>
      </div>

      {loadingEvents ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : trainingEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No training events yet</h3>
          <p className="text-gray-500 mb-4">Get started by scheduling your first training event</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Schedule Training
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainingEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{event.topic}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    event.mode === 'virtual' ? 'bg-purple-100 text-purple-700' : 'bg-purple-200 text-purple-800'
                  }`}>
                    {event.mode}
                  </span>
                </div>
                
                {event.scheduled_at && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {new Date(event.scheduled_at).toLocaleDateString()}
                  </div>
                )}
                
                {event.duration_minutes && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    {event.duration_minutes} minutes
                  </div>
                )}

                {event.notes && (
                  <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    {event.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Schedule Training Event</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Training topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="virtual">Virtual</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional information..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Schedule
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
