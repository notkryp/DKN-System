        import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'

export default function Bookmarks() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">My Bookmarks</h1>
        <p className="text-gray-600 mt-1">Knowledge items you've saved for later</p>
      </div>

      {loadingBookmarks ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BookmarkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookmarks yet</h3>
          <p className="text-gray-500">Start bookmarking knowledge items to access them quickly</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookmarks.map((item) => (
            <div key={item.bookmarkId || item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-3">{item.summary}</p>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'published' ? 'bg-green-100 text-green-700' :
                      item.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                    {item.item_type && (
                      <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                        {item.item_type}
                      </span>
                    )}
                    {item.region_code && (
                      <span className="text-gray-500">Region: {item.region_code}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeBookmark(item.item_id || item.id)}
                  className="ml-4 text-purple-600 hover:text-purple-700 transition"
                  title="Remove bookmark"
                >
                  <BookmarkSolidIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
