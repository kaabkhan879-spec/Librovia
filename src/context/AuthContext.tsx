/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { auditService } from '../services/audit'

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

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-public-key'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  const userRef = useRef<User | null>(null)
  const isLoginFlowRef = useRef(false)

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let isMounted = true
    let isInitial = true

    // 1. Recover session on load first (blocks loading = false until finished)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return

      if (session?.user) {
        const email = session.user.email || ''
        const cacheKey = `librovia_role_${session.user.id}`
        const cachedRole = localStorage.getItem(cacheKey) as 'user' | 'super_admin' | null

        // Optimistically restore user session from cache if available to prevent flash
        if (cachedRole) {
          setUser({
            id: session.user.id,
            email,
            displayName: session.user.user_metadata?.display_name || email.split('@')[0],
            avatarUrl:
              session.user.user_metadata?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
            role: cachedRole,
          })
          setLoading(false)
        }

        try {
          const role = await fetchUserRole(session.user.id)
          if (isMounted) {
            localStorage.setItem(cacheKey, role)
            setUser((prev) => {
              if (prev && prev.id === session.user.id) {
                return { ...prev, role }
              }
              return prev
            })
          }
        } catch (err) {
          console.error('Failed to verify user role on startup:', err)
          if (!cachedRole && isMounted) {
            setUser({
              id: session.user.id,
              email,
              displayName: session.user.user_metadata?.display_name || email.split('@')[0],
              avatarUrl:
                session.user.user_metadata?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
              role: 'user',
            })
          }
        }
      }
      if (isMounted) {
        setLoading(false)
      }
    })

    // 2. Setup auth state change listener (updates state on subsequent lifecycle events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isInitial) {
        isInitial = false
        return // Skip initial trigger on subscription; getSession handles initial startup recovery
      }

      if (!isMounted) return

      if (isLoginFlowRef.current) {
        return // Let login() handle state updates and database fetch during explicit login
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false)
        setUser(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        // If the session user is already the current user in state, do not re-run database query
        if (userRef.current && userRef.current.id === session.user.id) {
          return
        }

        const email = session.user.email || ''
        const cacheKey = `librovia_role_${session.user.id}`
        const cachedRole = localStorage.getItem(cacheKey) as 'user' | 'super_admin' | null

        if (cachedRole) {
          setUser({
            id: session.user.id,
            email,
            displayName: session.user.user_metadata?.display_name || email.split('@')[0],
            avatarUrl:
              session.user.user_metadata?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
            role: cachedRole,
          })
          setLoading(false)
        }

        fetchUserRole(session.user.id)
          .then((role) => {
            if (isMounted) {
              localStorage.setItem(cacheKey, role)
              setUser({
                id: session.user.id,
                email,
                displayName: session.user.user_metadata?.display_name || email.split('@')[0],
                avatarUrl:
                  session.user.user_metadata?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
                role,
              })
              setLoading(false)
            }
          })
          .catch(() => {
            if (!cachedRole && isMounted) {
              setUser({
                id: session.user.id,
                email,
                displayName: session.user.user_metadata?.display_name || email.split('@')[0],
                avatarUrl:
                  session.user.user_metadata?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
                role: 'user',
              })
              setLoading(false)
            }
          })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<User | null> => {
    isLoginFlowRef.current = true
    setLoading(true)
    try {
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
        
        // Cache role on successful login
        localStorage.setItem(`librovia_role_${data.user.id}`, role)
        
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

        auditService.insertLog({
          event: 'User Login',
          category: 'Authentication',
          severity: 'Info',
          actor_email: userEmail,
          actor_role: role,
          metadata: { userId: data.user.id },
        }).catch(err => console.error('Failed to log login audit event:', err))

        return loggedUser
      }
      setLoading(false)
      return null
    } finally {
      isLoginFlowRef.current = false
    }
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

    await auditService.insertLog({
      event: 'User Signup',
      category: 'Authentication',
      severity: 'Info',
      actor_email: email,
      actor_role: 'user',
      metadata: { email, displayName },
    })
    setLoading(false)
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
