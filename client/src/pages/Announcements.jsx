import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Bell, Calendar } from 'lucide-react'

export default function Announcements() {
  const announcements = [
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      date: '2026-01-20',
      message: 'The system will undergo maintenance on January 20th from 2:00 AM to 4:00 AM UTC.',
      priority: 'high'
    },
    {
      id: 2,
      title: 'New Features Released',
      date: '2026-01-15',
      message: 'We have added new dashboard visualizations and improved the search functionality.',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Training Session: Knowledge Management Best Practices',
      date: '2026-01-25',
      message: 'Join us for an interactive training session on effective knowledge management strategies.',
      priority: 'medium'
    }
  ]

  const priorityColors = {
    high: 'destructive',
    medium: 'warning',
    low: 'secondary'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Stay updated with the latest news and updates</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No announcements</h3>
              <p className="text-gray-500">There are no announcements at this time</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-purple-600" />
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(announcement.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={priorityColors[announcement.priority]}>
                    {announcement.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{announcement.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
