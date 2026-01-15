import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  HomeIcon, 
  ChartBarIcon, 
  BookOpenIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  TrophyIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { to: '/knowledge', label: 'Knowledge Bucket', icon: BookOpenIcon },
  { to: '/training', label: 'Training', icon: UserGroupIcon },
  { to: '/governance', label: 'Governance', icon: ShieldCheckIcon, requireRole: ['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'] },
  { to: '/kpi', label: 'Reports & KPIs', icon: DocumentTextIcon, requireRole: ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'] },
  { to: '/bookmarks', label: 'My Bookmarks', icon: TrophyIcon },
  { to: '/announcements', label: 'Announcements', icon: BellIcon },
  { to: '/feedback', label: 'Feedbacks', icon: ChatBubbleLeftRightIcon }
]

export default function Sidebar() {
  const { user, userAccount, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const roleCode = userAccount?.role_code || ''
  const hasRole = (...roles) => {
    const current = roleCode.toLowerCase()
    return roles.some((r) => r.toLowerCase() === current)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const canAccessItem = (item) => {
    if (!item.requireRole) return true
    return hasRole(...item.requireRole)
  }

  if (!user) return null

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 shadow-2xl border-r border-slate-700">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700">
        <Link to="/" className="text-2xl font-bold tracking-tight flex items-center space-x-2">
          <span className="text-3xl">📚</span>
          <span className="text-white">DKN</span>
        </Link>
        <p className="text-xs text-slate-400 mt-1">Knowledge Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (!canAccessItem(item)) return null
          
          const Icon = item.icon
          const isActive = location.pathname === item.to

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}

        {hasRole('SystemAdmin') && (
          <Link
            to="/admin"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              location.pathname === '/admin'
                ? 'bg-purple-600 text-white' 
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="px-3">
          <p className="text-sm font-semibold truncate">{user.email}</p>
          {userAccount?.role_code && (
            <p className="text-xs text-slate-400">
              {userAccount.role_code}
              {userAccount.region_code && ` · ${userAccount.region_code}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
