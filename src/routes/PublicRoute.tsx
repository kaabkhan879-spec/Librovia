import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../constants/routes'

interface PublicRouteProps {
  children?: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="border-t-brand-600 h-8 w-8 animate-spin rounded-full border-4 border-slate-200" />
      </div>
    )
  }

  // Redirect based on database role if user is already authenticated
  if (isAuthenticated) {
    if (user?.role === 'super_admin') {
      return <Navigate to={ROUTES.ADMIN} replace />
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
