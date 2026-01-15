import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function Layout({ children }) {
  const { user, userAccount, signOut } = useAuth()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Public pages without sidebar
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname)

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="text-xl font-bold text-purple-600 tracking-tight">
                Digital Knowledge Network
              </Link>

              <div className="flex items-center space-x-3">
                {user ? (
                  <Link to="/dashboard" className="bg-purple-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-purple-700 transition">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-purple-600">
                      Login
                    </Link>
                    <Link to="/register" className="bg-purple-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-purple-700 transition">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
            <p className="text-lg font-semibold">Digital Knowledge Network</p>
            <p className="text-sm text-gray-300">Designed for contributors, governance, and leadership across regions.</p>
            <p className="text-xs text-gray-500">© 2026 Knowledge Network. All rights reserved.</p>
          </div>
        </footer>
      </div>
    )
  }

  // Authenticated pages with sidebar
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
          <div className="px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-slate-800">Digital Knowledge Network</h1>
            <div className="flex items-center space-x-6">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition relative">
                <BellIcon className="w-6 h-6 text-slate-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:bg-slate-100 px-3 py-2 rounded-lg transition"
                >
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
                    <p className="text-xs text-slate-500">{userAccount?.role_code}</p>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-slate-600 transition ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                      {userAccount?.region_code && (
                        <p className="text-xs text-slate-500 mt-1">Region: {userAccount.region_code}</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        await signOut()
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
