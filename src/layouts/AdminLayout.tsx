import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { AdminHeader } from '../components/admin/AdminHeader'
import { useLocalStorage } from '../hooks/useLocalStorage'

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>(
    'admin-sidebar-collapsed',
    false
  )
  const location = useLocation()

  const getAdminPageTitle = (pathname: string): string => {
    if (pathname === '/admin' || pathname === '/admin/dashboard') return 'Platform Overview'
    if (pathname.startsWith('/admin/users')) return 'User Account Management'
    if (pathname.startsWith('/admin/subscriptions')) return 'Subscription Plans'
    if (pathname.startsWith('/admin/payments')) return 'Payment Management'
    if (pathname.startsWith('/admin/storage')) return 'Storage Quotas'
    if (pathname.startsWith('/admin/library')) return 'Library Catalog'
    if (pathname.startsWith('/admin/reports')) return 'Reports & Analytics'
    if (pathname.startsWith('/admin/announcements')) return 'Broadcast Announcements'
    if (pathname.startsWith('/admin/settings')) return 'System Settings'
    if (pathname.startsWith('/admin/audit-logs')) return 'Audit Logs'
    return 'Super Admin Panel'
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Super Admin Dedicated Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Admin Content Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(true)}
          pageTitle={getAdminPageTitle(location.pathname)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
