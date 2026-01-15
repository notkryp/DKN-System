import { Link } from 'react-router-dom'

export default function MetricCard({ title, value, link, linkText = "VIEW DETAILS", icon: Icon, color = "blue" }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {Icon && <Icon className="w-10 h-10 text-purple-600" />}
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-800">{value}</p>
          </div>
        </div>
        <h3 className="text-gray-600 font-semibold text-sm uppercase tracking-wide mb-3">
          {title}
        </h3>
        {link && (
          <Link 
            to={link} 
            className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1"
          >
            <span>{linkText}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
