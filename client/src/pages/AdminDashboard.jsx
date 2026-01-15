import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'

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
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user || userAccount?.role_code !== 'SystemAdmin') {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.32))] flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only system administrators can access this page.</CardDescription>
          </CardHeader>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Access Control & Role Management</CardTitle>
            <CardDescription>Update user roles and account status across the organization.</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <tr key={u.id} className={(editingId === u.id ? 'bg-purple-50 ' : '') + 'hover:bg-gray-50 transition-colors'}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{u.username}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{u.region_code}</td>
                        <td className="px-6 py-4 text-sm">
                          {editingId === u.id ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
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
                              <Badge variant="outline">{u.role_code}</Badge>
                              <p className="text-xs text-gray-500 mt-1">{roleDescriptions[u.role_code]}</p>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {editingId === u.id ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          ) : (
                            <Badge
                              variant={u.status === 'active' ? 'success' : u.status === 'inactive' ? 'secondary' : 'destructive'}
                            >
                              {u.status}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          {editingId === u.id ? (
                            <>
                              <Button size="sm" onClick={saveEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              onClick={() => startEdit(u.id, u.role_code, u.status)}
                            >
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Role Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(roleDescriptions).map(([role, desc]) => (
                  <div key={role} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-900">{role}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <p className="text-2xl font-bold text-purple-700">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
