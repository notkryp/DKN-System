import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { Bookmark, BookmarkCheck, ExternalLink, Trash2 } from 'lucide-react'

export default function Bookmarks() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    fetchBookmarks()
  }, [user])

  const fetchBookmarks = async () => {
    setLoadingBookmarks(true)
    try {
      const { data } = await api.get('/knowledge/bookmarks')
      const normalized = (data || []).map((b) => ({
        ...b.knowledge_items,
        bookmarkId: b.id,
        item_id: b.item_id
      }))
      setBookmarks(normalized)
    } catch (error) {
      console.error('Error loading bookmarks', error)
    } finally {
      setLoadingBookmarks(false)
    }
  }

  const removeBookmark = async (itemId) => {
    try {
      await api.delete(`/knowledge/${itemId}/bookmarks`)
      setBookmarks((prev) => prev.filter((b) => b.item_id !== itemId))
    } catch (error) {
      console.error('Error removing bookmark', error)
    }
  }

  const statusColors = {
    draft: 'secondary',
    in_review: 'default',
    published: 'success',
    rejected: 'destructive',
    needs_changes: 'warning'
  }

  if (loading || loadingBookmarks) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-gray-500">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookmarkCheck className="w-8 h-8 text-purple-600" />
            My Bookmarks
          </h1>
          <p className="text-gray-500 mt-2">Knowledge items you've saved for quick access</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookmarks yet</h3>
              <p className="text-gray-500 mb-6">Start bookmarking knowledge items to access them quickly</p>
              <Button onClick={() => navigate('/knowledge')}>
                Browse Knowledge
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookmarks.map((item) => (
            <Card key={item.bookmarkId || item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                    <CardDescription>{item.summary}</CardDescription>
                  </div>
                  <Badge variant={statusColors[item.status] || 'secondary'}>
                    {item.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {item.item_type && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                        {item.item_type}
                      </span>
                    )}
                    {item.region_code && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {item.region_code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.content_uri && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.content_uri, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBookmark(item.item_id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
