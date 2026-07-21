/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  role: 'user' | 'super_admin'
}

const fetchUserRole = async (userId: string): Promise<'user' | 'super_admin'> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data?.role === 'super_admin') {
      return 'super_admin'
    }
  } catch (err) {
    console.error('Failed to query user_roles table:', err)
  }

  return 'user'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isPasswordRecovery: boolean
  login: (email: string, password: string) => Promise<User | null>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    // 1. Recover session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || ''
        const role = await fetchUserRole(session.user.id)
        setUser({
          id: session.user.id,
          email,
          displayName: session.user.user_metadata?.display_name || email.split('@')[0],
          avatarUrl:
            session.user.user_metadata?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
          role,
        })
      }
      setLoading(false)
    })

    // 2. Setup auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false)
      }

      if (session?.user) {
        const email = session.user.email || ''
        const role = await fetchUserRole(session.user.id)
        setUser({
          id: session.user.id,
          email,
          displayName: session.user.user_metadata?.display_name || email.split('@')[0],
          avatarUrl:
            session.user.user_metadata?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
          role,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setLoading(false)
      throw error
    }
    if (data.user) {
      const userEmail = data.user.email || email
      const role = await fetchUserRole(data.user.id)
      const loggedUser: User = {
        id: data.user.id,
        email: userEmail,
        displayName: data.user.user_metadata?.display_name || userEmail.split('@')[0],
        avatarUrl:
          data.user.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
        role,
      }
      setUser(loggedUser)
      setLoading(false)
      return loggedUser
    }
    setLoading(false)
    return null
  }

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username: email.split('@')[0],
        },
      },
    })
    if (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLoading(false)
      throw error
    }
  }

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
    const updatePayload: Record<string, unknown> = {}
    if (data.displayName !== undefined) updatePayload.display_name = data.displayName
    if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl

    const { error } = await supabase.auth.updateUser({
      data: updatePayload,
    })
    if (error) {
      throw error
    }
    // Optimistic local user update
    setUser((prev) => {
      if (!prev) return null
      return {
        ...prev,
        displayName: data.displayName !== undefined ? data.displayName : prev.displayName,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : prev.avatarUrl,
      }
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isPasswordRecovery,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
