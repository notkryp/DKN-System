import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { BookOpen, Calendar, Users, Clock, Plus } from 'lucide-react'

export default function Training() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ topic: '', mode: '', scheduled_at: '', duration_minutes: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/training/events')
        setEvents(res.data || [])
      } catch (error) {
        console.error('Failed to fetch training events:', error)
      } finally {
        setLoadingEvents(false)
      }
    }

    if (user) fetchEvents()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/training/events', {
        topic: form.topic,
        mode: form.mode,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        notes: form.notes
      })
      setShowModal(false)
      setForm({ topic: '', mode: '', scheduled_at: '', duration_minutes: '', notes: '' })
      const res = await api.get('/training/events')
      setEvents(res.data || [])
    } catch (error) {
      console.error('Failed to create training event:', error)
      alert('Failed to create training event')
    } finally {
      setSubmitting(false)
    }
  }

  const canCreate = userAccount && ['KnowledgeSupervisor', 'SystemAdmin'].includes(userAccount?.role_code)

  if (loadingEvents) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training & Development</h1>
          <p className="text-gray-500 mt-2">Discover and participate in training events</p>
        </div>
        {canCreate && (
          <Button className="gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Schedule Training
          </Button>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Training Event</DialogTitle>
            <DialogDescription>Create a new training session for the team</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Topic</label>
              <Input
                placeholder="e.g., Knowledge Management Best Practices"
                required
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Mode</label>
                <Input
                  placeholder="virtual or onsite"
                  value={form.mode}
                  onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Scheduled Date</label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Duration (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="60"
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Notes</label>
              <Textarea
                rows="3"
                placeholder="Key outcomes, target audience, or required materials"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length > 0 ? events.map(event => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{event.topic}</CardTitle>
                  <CardDescription>{event.mode}</CardDescription>
                </div>
                <Badge variant="default">{event.status || 'Scheduled'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {event.scheduled_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.scheduled_at).toLocaleDateString()}
                  </div>
                )}
                {event.duration_minutes && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    {event.duration_minutes} minutes
                  </div>
                )}
              </div>
              {event.notes && <p className="text-sm text-gray-600">{event.notes}</p>}
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        )) : (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No training events yet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
