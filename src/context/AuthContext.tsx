import React, { createContext, useContext, useState } from 'react'

export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  toggleDemoAuth: () => void // Helper for manual UI review to switch states
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo-user-uuid-12345',
    email: 'reader@librovia.com',
    displayName: 'Demo Reader',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
  })
  const [loading, setLoading] = useState(false)

  // Quick helper to allow toggling authenticated state in preview mode
  const toggleDemoAuth = () => {
    if (user) {
      setUser(null)
    } else {
      setUser({
        id: 'demo-user-uuid-12345',
        email: 'reader@librovia.com',
        displayName: 'Demo Reader',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
      })
    }
  }

  const login = async (email: string) => {
    setLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({
      id: 'demo-user-uuid-12345',
      email,
      displayName: email.split('@')[0],
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    })
    setLoading(false)
  }

  const register = async (email: string, _password: string, displayName: string) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({
      id: 'demo-user-uuid-12345',
      email,
      displayName,
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    })
    setLoading(false)
  }

  const logout = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        toggleDemoAuth,
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
