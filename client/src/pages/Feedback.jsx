import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { MessageSquare, Send, ThumbsUp, Clock } from 'lucide-react'

export default function Feedback() {
  const { user, userAccount } = useAuth()
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackType, setFeedbackType] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [feedbackList, setFeedbackList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const { data } = await api.get('/feedback')
      setFeedbackList(data || [])
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/feedback', {
        feedback_type: feedbackType,
        message: feedbackText
      })
      setFeedbackText('')
      await fetchFeedback()
      alert('Thank you for your feedback!')
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors = {
    'In Progress': 'default',
    'Under Review': 'warning',
    'Acknowledged': 'success',
    'Resolved': 'secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-500 mt-1">Share your thoughts and help us improve</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Tell us what you think or report an issue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={feedbackType === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('general')}
              >
                General
              </Button>
              <Button
                type="button"
                variant={feedbackType === 'bug' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('bug')}
              >
                Bug Report
              </Button>
              <Button
                type="button"
                variant={feedbackType === 'feature' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('feature')}
              >
                Feature Request
              </Button>
            </div>
            <div>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your feedback..."
                className="min-h-[120px]"
                required
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Feedback</h2>
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-gray-500">Loading feedback...</p>
            </CardContent>
          </Card>
        ) : feedbackList.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No feedback yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedbackList.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{item.feedback_type || 'General'}</Badge>
                        <Badge variant={statusColors[item.status] || 'secondary'}>{item.status || 'Submitted'}</Badge>
                      </div>
                      <CardDescription className="text-base text-gray-900 mt-2">
                        {item.message}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
