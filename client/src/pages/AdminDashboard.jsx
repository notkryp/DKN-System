import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const roleDescriptions = {
  Consultant: 'Daily user searching and consuming content',
  ExpertContributor: 'Creates and validates content',
  KnowledgeSupervisor: 'Runs training and adoption',
  SystemAdmin: 'Manages infrastructure and access',
  GovernanceCouncilMember: 'Audits and curates content',
  TopManager: 'Reviews KPIs'
}

export default function AdminDashboard() {
  const { user, userAccount, loading } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!loading && (!user || userAccount?.role_code !== 'SystemAdmin')) {
      navigate('/dashboard')
    }
  }, [user, userAccount, loading, navigate])

  useEffect(() => {
    if (!user || userAccount?.role_code !== 'SystemAdmin') return

    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const { data } = await api.get('/users')
        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [user, userAccount])

  const startEdit = (userId, role, status) => {
    setEditingId(userId)
    setEditRole(role)
    setEditStatus(status)
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditRole('')
    setEditStatus('')
  }

  const saveEdit = async () => {
    try {
      await api.patch(`/users/${editingId}/role`, {
        role_code: editRole,
        status: editStatus
      })
      const { data } = await api.get('/users')
      setUsers(data || [])
      setMessage('User updated successfully')
      setTimeout(() => setMessage(''), 3000)
      cancelEdit()
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || 'Failed to update user'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.32))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user || userAccount?.role_code !== 'SystemAdmin') {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.32))] flex items-center justify-center">
        <div className="card text-center">
          <p className="text-red-600 font-semibold">Access Denied</p>
          <p className="text-gray-600 mt-2">Only system administrators can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.32))] py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600">Manage users, roles, regions, and system access control.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'}`}>
            {message}
          </div>
        )}

        <div className="card">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Access Control & Role Management</h2>
            <p className="text-sm text-gray-600 mt-2">Update user roles and account status across the organization.</p>
          </div>

          {loadingUsers ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Current Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className={editingId === u.id ? 'bg-purple-50' : ''}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.region_code}</td>
                      <td className="px-6 py-4 text-sm">
                        {editingId === u.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="input-field text-sm"
                          >
                            <option value="Consultant">Consultant</option>
                            <option value="ExpertContributor">ExpertContributor</option>
                            <option value="KnowledgeSupervisor">KnowledgeSupervisor</option>
                            <option value="GovernanceCouncilMember">GovernanceCouncilMember</option>
                            <option value="SystemAdmin">SystemAdmin</option>
                            <option value="TopManager">TopManager</option>
                          </select>
                        ) : (
                          <span>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{u.role_code}</span>
                            <p className="text-xs text-gray-500 mt-1">{roleDescriptions[u.role_code]}</p>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingId === u.id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="input-field text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'active' ? 'bg-purple-100 text-purple-700' :
                            u.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {u.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {editingId === u.id ? (
                          <>
                            <button onClick={saveEdit} className="text-purple-600 hover:text-purple-800 font-medium">Save</button>
                            <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(u.id, u.role_code, u.status)}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Role Definitions</h3>
            <div className="space-y-4">
              {Object.entries(roleDescriptions).map(([role, desc]) => (
                <div key={role} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <p className="font-semibold text-sm text-gray-900">{role}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">System Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Default Admin</p>
                <p className="font-semibold text-gray-900">abhipok4@gmail.com</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">You</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
                <p className="text-sm text-gray-600">{userAccount?.role_code} in {userAccount?.region_code}</p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase">Total Users</p>
                <p className="text-2xl font-bold text-primary-700">{users.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
