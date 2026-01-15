import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export default function Layout({ children }) {
  const { user, userAccount, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Public pages without sidebar
  const isPublicPage = ['/', '/login', '/register'].includes(location.pathname)

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent tracking-tight">
                DKN
              </Link>

              <div className="flex items-center space-x-3">
                {user ? (
                  <Link to="/dashboard">
                    <Button>Go to Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline">Login</Button>
                    </Link>
                    <Link to="/register">
                      <Button>Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </main>

        <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-2">Digital Knowledge Network</h3>
                <p className="text-gray-400 text-sm">Empowering organizations with collaborative knowledge management.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Quick Links</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition">Training</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition">Governance</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition">Documentation</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition">Terms</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-gray-400 text-sm">
              <p>© 2026 Digital Knowledge Network. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Authenticated pages with sidebar
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 w-64 z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-8 py-4 flex justify-between items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>

            <h1 className="text-xl font-bold text-gray-900 hidden md:block">
              Digital Knowledge Network
            </h1>

            <div className="flex items-center space-x-4 ml-auto">
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="flex flex-col items-end text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-500">{userAccount?.role_code}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{user?.email}</span>
                    {userAccount?.region_code && (
                      <span className="text-xs text-gray-500 font-normal">
                        Region: {userAccount.region_code}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
