import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' }
]

export default function Layout({ children }) {
  const { user, userAccount, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-xl font-bold text-primary-700 tracking-tight">
              Digital Knowledge Network
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium ${location.pathname === link.to ? 'text-primary-700' : 'text-gray-700 hover:text-primary-600'}`}
                >
                  {link.label}
                </Link>
              ))}
              {userAccount?.role_code === 'SystemAdmin' && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium ${location.pathname === '/admin' ? 'text-primary-700' : 'text-gray-700 hover:text-primary-600'}`}
                >
                  Admin Panel
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-gray-900">{user.email}</span>
                    {userAccount?.role_code && (
                      <span className="text-xs text-gray-500">{userAccount.role_code} · {userAccount.region_code}</span>
                    )}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">
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
