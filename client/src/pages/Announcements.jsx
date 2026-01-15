import { BellIcon } from '@heroicons/react/24/outline'

export default function Announcements() {
  const announcements = [
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      date: '2026-01-10',
      message: 'The system will undergo maintenance on January 20th from 2:00 AM to 4:00 AM UTC.'
    },
    {
      id: 2,
      title: 'New Features Released',
      date: '2026-01-05',
      message: 'We have added new dashboard visualizations and improved the search functionality.'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
        <p className="text-gray-600 mt-1">Stay updated with the latest news and updates</p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No announcements</h3>
          <p className="text-gray-500">There are no announcements at this time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <BellIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{announcement.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{new Date(announcement.date).toLocaleDateString()}</p>
                  <p className="text-gray-600">{announcement.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
