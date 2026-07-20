import React, { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../constants/routes'

interface AdminRouteProps {
  children?: React.ReactNode
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const { showError } = useToast()

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role !== 'super_admin') {
      showError('Access Denied: Super Admin privileges required.')
    }
  }, [loading, isAuthenticated, user, showError])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
