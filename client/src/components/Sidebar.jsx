import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home,
  BookOpen,
  Users,
  Shield,
  BarChart3,
  Bookmark,
  Bell,
  MessageSquare,
  LogOut,
  Settings
} from 'lucide-react'

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/knowledge', label: 'Knowledge Bucket', icon: BookOpen },
  { to: '/training', label: 'Training', icon: Users },
  { to: '/governance', label: 'Governance', icon: Shield, requireRole: ['GovernanceCouncilMember', 'KnowledgeSupervisor', 'SystemAdmin'] },
  { to: '/kpi', label: 'Reports & KPIs', icon: BarChart3, requireRole: ['TopManager', 'KnowledgeSupervisor', 'SystemAdmin'] },
  { to: '/bookmarks', label: 'My Bookmarks', icon: Bookmark },
  { to: '/announcements', label: 'Announcements', icon: Bell },
  { to: '/feedback', label: 'Feedbacks', icon: MessageSquare }
]

export default function Sidebar({ onClose }) {
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

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col shadow-2xl border-r border-slate-700">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700/50">
        <Link to="/" className="text-2xl font-bold tracking-tight flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-white">DKN</span>
        </Link>
        <p className="text-xs text-slate-400 mt-2">Collaborative Knowledge Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          {menuItems.map((item) => {
            if (!canAccessItem(item)) return null
            
            const Icon = item.icon
            const isActive = location.pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-purple-600/20 text-purple-300 border-l-2 border-purple-500 pl-3' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}

          {hasRole('SystemAdmin') && (
            <div className="my-4 pt-4 border-t border-slate-700/50">
              <p className="px-4 text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Administration
              </p>
              <Link
                to="/admin"
                onClick={handleNavClick}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === '/admin'
                    ? 'bg-purple-600/20 text-purple-300 border-l-2 border-purple-500 pl-3' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">Admin Panel</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-slate-700/50 space-y-4">
        <div className="px-4 py-3 rounded-lg bg-slate-700/30 border border-slate-700">
          <p className="text-sm font-semibold text-white truncate">{user.email}</p>
          {userAccount?.role_code && (
            <p className="text-xs text-slate-400 mt-1">
              {userAccount.role_code}
              {userAccount.region_code && ` • ${userAccount.region_code}`}
            </p>
          )}
        </div>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
