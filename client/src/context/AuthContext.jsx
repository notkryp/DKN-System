import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

export const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userAccount, setUserAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  const syncSession = async (session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)

    if (session?.access_token) {
      localStorage.setItem('token', session.access_token)
      try {
        const { data } = await api.get('/users/me')
        setUserAccount(data)
      } catch (error) {
        console.error('Error fetching user account:', error)
        setUserAccount(null)
      }
    } else {
      localStorage.removeItem('token')
      setUserAccount(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    await syncSession(data.session)
    return data
  }

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    if (error) throw error
    await syncSession(data.session)
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    localStorage.removeItem('token')
    setUser(null)
    setUserAccount(null)
  }

  const value = {
    user,
    userAccount,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
