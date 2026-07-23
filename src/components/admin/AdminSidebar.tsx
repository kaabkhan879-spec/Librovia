import React, { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { supabase } from '../../services/supabase'
import {
  LayoutDashboard,
  Users,
  PackageCheck,
  CreditCard,
  HardDrive,
  BookOpen,
  LineChart,
  Megaphone,
  Settings,
  ClipboardList,
  ShieldCheck,
  LogOut,
} from 'lucide-react'

interface AdminSidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [pendingCount, setPendingCount] = useState<number>(0)

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending Verification')

      if (!error && count !== null) {
        setPendingCount(count)
      }
    } catch (err) {
      console.error('Error fetching pending payments count:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPendingCount()
    }, 0)

    const channel = supabase
      .channel('admin-pending-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
        },
        () => {
          fetchPendingCount()
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LANDING)
  }

  const adminNavigation = [
    { name: 'Dashboard', to: ROUTES.ADMIN, icon: LayoutDashboard },
    { name: 'Users', to: ROUTES.ADMIN_USERS, icon: Users },
    { name: 'Subscription Plans', to: ROUTES.ADMIN_SUBSCRIPTIONS, icon: PackageCheck },
    { name: 'Payments', to: ROUTES.ADMIN_PAYMENTS, icon: CreditCard },
    { name: 'Storage Manager', to: ROUTES.ADMIN_STORAGE, icon: HardDrive },
    { name: 'Library Management', to: ROUTES.ADMIN_LIBRARY, icon: BookOpen },
    { name: 'Reports & Analytics', to: ROUTES.ADMIN_REPORTS, icon: LineChart },
    { name: 'Announcements', to: ROUTES.ADMIN_ANNOUNCEMENTS, icon: Megaphone },
    { name: 'System Settings', to: ROUTES.ADMIN_SETTINGS, icon: Settings },
    { name: 'Audit Logs', to: ROUTES.ADMIN_AUDIT_LOGS, icon: ClipboardList },
  ]

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col border-r border-admin-border bg-admin-sidebar transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isCollapsed ? 'w-20' : 'w-64'}
    md:static md:translate-x-0
  `

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          className="bg-admin-bg/70 fixed inset-0 z-40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand Header */}
        <div className="border-admin-border flex h-16 items-center justify-between border-b px-4">
          <Link to={ROUTES.ADMIN} className="flex w-full items-center gap-2.5 overflow-hidden">
            <div className="from-purple-650 to-indigo-650 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md shadow-purple-600/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate text-left">
                <span className="text-admin-text-main block font-sans text-sm font-black tracking-tight">
                  Librovia Admin
                </span>
                <span className="block text-[10px] font-extrabold tracking-widest text-purple-600 uppercase dark:text-purple-400">
                  Super Admin SaaS
                </span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="border-admin-border bg-admin-card text-admin-text-muted hover:text-admin-text-main hidden h-6 w-6 cursor-pointer items-center justify-center rounded-md border md:flex"
            >
              ←
            </button>
          )}
        </div>

        {/* 10 Super Admin Modules Navigation */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          <div className="text-admin-text-muted px-3 pb-2 text-[10px] font-black tracking-widest uppercase">
            {!isCollapsed && 'Platform Management'}
          </div>

          {adminNavigation.map((item) => {
            const Icon = item.icon
            const isPayments = item.name === 'Payments'
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === ROUTES.ADMIN}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-2xl border border-transparent px-3.5 py-2.5 text-xs font-extrabold transition-all duration-200 select-none ${
                    isActive
                      ? 'from-purple-650 to-indigo-650 shadow-purple-650/30 border border-purple-500/20 bg-gradient-to-r text-[#FFFFFF] shadow-lg'
                      : 'text-admin-text-sub hover:bg-admin-hover hover:text-admin-text-main'
                  } `
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Real-time Pending Payments Notification Badge */}
                {isPayments && pendingCount > 0 && (
                  <>
                    {isCollapsed ? (
                      <span
                        className="ring-admin-sidebar absolute top-2 right-2 flex h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 ring-2"
                        title={`${pendingCount} pending payment request(s)`}
                      />
                    ) : (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shadow-sm">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="border-admin-border space-y-2.5 border-t p-3">
          {/* Version Info & Badges */}
          {!isCollapsed && (
            <div className="border-admin-border bg-admin-card/40 space-y-1 rounded-xl border p-2 text-center text-[10px]">
              <div className="text-admin-text-sub flex items-center justify-between font-bold">
                <span>Platform Version:</span>
                <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                  v2.4.0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded border border-purple-500/20 bg-purple-900/10 px-1.5 py-0.5 text-[9px] font-black text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                  PROD
                </span>
                <span className="text-admin-text-muted text-[9.5px] font-semibold">
                  Supabase • Edge
                </span>
              </div>
            </div>
          )}

          {/* User Logout Footer Box */}
          <div className="flex items-center justify-between pt-1">
            {!isCollapsed ? (
              <>
                <div className="text-admin-text-sub max-w-[120px] truncate text-left text-[11px] font-semibold">
                  <span className="text-admin-text-main block truncate font-bold">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <span className="block text-[10px] text-purple-600 dark:text-purple-400">
                    Super Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="border-admin-border bg-admin-card text-admin-text-sub dark:hover:text-rose-450 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors hover:bg-rose-900/10 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="border-admin-border bg-admin-card text-admin-text-sub dark:hover:text-rose-450 mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors hover:bg-rose-900/10 hover:text-rose-600 dark:hover:bg-rose-950/40"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
export default AdminSidebar
