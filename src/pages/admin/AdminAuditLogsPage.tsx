import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../services/supabase'
import {
  ClipboardList,
  Search,
  Download,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Code,
} from 'lucide-react'

export interface AuditLogRecord {
  id: string
  event: string
  category:
    'Authentication' | 'RBAC & Roles' | 'Storage & Files' | 'Billing & Payments' | 'System Config'
  severity: 'Info' | 'Warning' | 'Medium' | 'Critical'
  actorEmail: string
  actorRole: string
  ipAddress: string
  deviceInfo: string
  location: string
  timestamp: string
  metadataJson?: Record<string, unknown>
}

export const AdminAuditLogsPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLogRecord[]>([])

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<
    'All' | 'Info' | 'Warning' | 'Medium' | 'Critical'
  >('All')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [actorFilter, setActorFilter] = useState<string>('All')

  // Date, Action, User filters
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [userEmailFilter, setUserEmailFilter] = useState('')

  // Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Right-side Drawer Details
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null)

  // Fetch Logs from Supabase
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const mapped: AuditLogRecord[] = data.map((d) => ({
          id: d.id,
          event: d.event || 'System Action Recorded',
          category: (d.category as AuditLogRecord['category']) || 'System Config',
          severity: (d.severity as AuditLogRecord['severity']) || 'Info',
          actorEmail: d.actor_email || 'System',
          actorRole: d.actor_role || 'Standard User',
          ipAddress: d.ip_address || '127.0.0.1',
          deviceInfo: d.user_agent || 'Browser Client',
          location: d.location || 'Global',
          timestamp: d.created_at || new Date().toISOString(),
          metadataJson: d.metadata || {},
        }))
        setLogs(mapped)
      } else {
        setLogs([])
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch security audit logs'
      showError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAuditLogs()
  }, [fetchAuditLogs])

  // KPI Calculations
  const totalLogsCount = logs.length
  const criticalCount = logs.filter((l) => l.severity === 'Critical').length
  const failedLoginsCount = logs.filter((l) =>
    l.event.toLowerCase().includes('failed login')
  ).length
  const todayCount = logs.filter((l) => {
    const todayStr = new Date().toISOString().split('T')[0]
    return l.timestamp.startsWith(todayStr)
  }).length

  // Filter Pipeline
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        l.event.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q) ||
        l.deviceInfo.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)

      const matchesSeverity = severityFilter === 'All' || l.severity === severityFilter
      const matchesCategory = categoryFilter === 'All' || l.category === categoryFilter
      const matchesActor = actorFilter === 'All' || l.actorRole === actorFilter

      // Date Filter
      let matchesDate = true
      if (startDateFilter) {
        matchesDate = matchesDate && new Date(l.timestamp) >= new Date(startDateFilter)
      }
      if (endDateFilter) {
        const end = new Date(endDateFilter)
        end.setHours(23, 59, 59, 999)
        matchesDate = matchesDate && new Date(l.timestamp) <= end
      }

      // Action Filter
      const matchesAction =
        actionFilter === 'All' || l.event.toLowerCase().includes(actionFilter.toLowerCase())

      // User Filter
      const matchesUser =
        !userEmailFilter || l.actorEmail.toLowerCase().includes(userEmailFilter.toLowerCase())

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesCategory &&
        matchesActor &&
        matchesDate &&
        matchesAction &&
        matchesUser
      )
    })
  }, [
    logs,
    searchQuery,
    severityFilter,
    categoryFilter,
    actorFilter,
    startDateFilter,
    endDateFilter,
    actionFilter,
    userEmailFilter,
  ])

  // Pagination Slice
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Exports
  const handleExport = (format: 'CSV' | 'PDF' | 'JSON') => {
    if (format === 'JSON') {
      const jsonStr = JSON.stringify(filteredLogs, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `librovia_audit_logs_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const rows = [
        [
          'Log ID',
          'Event Detail',
          'Category',
          'Severity',
          'Actor Email',
          'IP Address',
          'Timestamp',
        ],
        ...filteredLogs.map((l) => [
          l.id,
          l.event,
          l.category,
          l.severity,
          l.actorEmail,
          l.ipAddress,
          l.timestamp,
        ]),
      ]
      const csvStr = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
      const blob = new Blob([csvStr], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `librovia_audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    showSuccess(`Exported security audit logs as ${format}!`)
  }

  const getSeverityBadge = (s: AuditLogRecord['severity']) => {
    if (s === 'Info') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Info
        </span>
      )
    }
    if (s === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 text-amber-600" /> Warning
        </span>
      )
    }
    if (s === 'Medium') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
          <Clock className="h-3 w-3 text-orange-600" /> Medium
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
        <ShieldAlert className="h-3 w-3 text-rose-600" /> Critical
      </span>
    )
  }

  if (loading && logs.length === 0) {
    return (
      <PageWrapper className="flex min-h-screen items-center justify-center">
        <div className="border-purple-650 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <ClipboardList className="h-7 w-7 text-purple-600" />
            System Audit Logs & Security Telemetry
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Immutable security audit trails, RBAC privilege verifications, failed login tracking,
            and system events.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAuditLogs}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-xs transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 2. 4 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Total Logs
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {totalLogsCount} Logs
          </h3>
          <span className="text-[10.5px] font-semibold text-purple-600 dark:text-purple-400">
            Telemetry History
          </span>
        </div>

        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-rose-600 uppercase">
            Critical Events
          </span>
          <h3 className="text-2xl font-black text-rose-600">{criticalCount}</h3>
          <span className="text-[10.5px] font-semibold text-slate-500">Security Threats</span>
        </div>

        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-amber-600 uppercase">
            Failed Logins
          </span>
          <h3 className="text-2xl font-black text-amber-600">{failedLoginsCount}</h3>
          <span className="text-[10.5px] font-semibold text-slate-500">Authentication Shields</span>
        </div>

        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-emerald-600 uppercase">
            Today's Events
          </span>
          <h3 className="text-2xl font-black text-emerald-600">{todayCount} Events</h3>
          <span className="text-[10.5px] font-semibold text-slate-500">Active Audit Telemetry</span>
        </div>
      </div>

      {/* 3. STICKY MULTI-FILTER TOOLBAR */}
      <div className="sticky top-0 z-20 space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by Event, Actor, IP Address, Device, or Location..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pr-4 pl-10 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Export Dropdown Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('CSV')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('JSON')}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <Code className="h-3.5 w-3.5 text-purple-600" /> JSON
            </button>
          </div>
        </div>

        {/* Dynamic Action, User Email, Date range filters */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-xs font-bold text-slate-700 dark:border-slate-800/60 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>Start Date:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>End Date:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Actions</option>
              <option value="User Signup">User Signup</option>
              <option value="User Login">User Login</option>
              <option value="Book Upload">Book Upload</option>
              <option value="Book Delete">Book Delete</option>
              <option value="Subscription Plan Change">Subscription Plan Change</option>
              <option value="Storage Limit Change">Storage Limit Change</option>
              <option value="Announcement Create/Edit/Delete">
                Announcement Create/Edit/Delete
              </option>
              <option value="System Settings Update">System Settings Update</option>
              <option value="User Delete">User Delete</option>
              <option value="User Suspend/Activate">User Suspend/Activate</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>User Email:</span>
            <input
              type="text"
              placeholder="Filter by email..."
              value={userEmailFilter}
              onChange={(e) => {
                setUserEmailFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-44 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Filter Selects & Pills */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-1 dark:border-slate-800/60">
          {/* Severity Pills */}
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-extrabold dark:bg-slate-800">
            {(['All', 'Info', 'Warning', 'Medium', 'Critical'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSeverityFilter(s)
                  setCurrentPage(1)
                }}
                className={`rounded-xl px-3 py-1 transition-colors ${
                  severityFilter === s
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="All">All Categories</option>
            <option value="Authentication">Authentication</option>
            <option value="RBAC & Roles">RBAC & Roles</option>
            <option value="Storage & Files">Storage & Files</option>
            <option value="Billing & Payments">Billing & Payments</option>
            <option value="System Config">System Config</option>
          </select>

          {/* Actor Role Dropdown */}
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="All">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="user">Standard User</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>
      </div>

      {/* 4. AUDIT LOG DATA TABLE */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">Event Detail</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Actor Account</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Device & OS</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold dark:divide-slate-800/40">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td
                      className="max-w-[240px] truncate px-6 py-4 font-bold text-slate-900 dark:text-white"
                      title={log.event}
                    >
                      {log.event}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getSeverityBadge(log.severity)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {log.actorEmail}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="max-w-[140px] truncate px-6 py-4 text-slate-500">
                      {log.deviceInfo}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="View Complete Log Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* EMPTY STATE */
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-600 shadow-xs dark:bg-purple-950 dark:text-purple-400">
                        <ShieldCheck className="h-8 w-8" />
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          🛡️ No security audit logs recorded yet
                        </h3>
                        <p className="text-xs leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                          Security telemetry and audit records will automatically stream here as
                          administrators and readers perform actions across the platform.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchAuditLogs}
                        className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-700 active:scale-98"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh Telemetry</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white">
                {(currentPage - 1) * itemsPerPage + 1}
              </strong>
              –
              <strong className="text-slate-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </strong>{' '}
              of <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong>{' '}
              audit log entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-2 font-bold text-slate-900 dark:text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. RIGHT-SIDE SLIDE-OVER AUDIT LOG DETAILS DRAWER */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="flex w-screen max-w-md flex-col justify-between bg-white p-6 text-left shadow-2xl dark:bg-slate-900"
              >
                <div className="space-y-6 overflow-y-auto pr-1">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <h3 className="font-sans text-base font-black text-slate-900 dark:text-white">
                        Audit Log Telemetry
                      </h3>
                      <p className="font-mono text-xs text-purple-600 dark:text-purple-400">
                        {selectedLog.id}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLog(null)}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Title & Badges */}
                  <div className="space-y-2">
                    <h4 className="font-sans text-base leading-snug font-black text-slate-900 dark:text-white">
                      {selectedLog.event}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {selectedLog.category}
                      </span>
                      {getSeverityBadge(selectedLog.severity)}
                    </div>
                  </div>

                  {/* Telemetry Detail Grid */}
                  <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                    <div className="flex justify-between border-b border-slate-200/60 py-1 dark:border-slate-700/60">
                      <span>Actor Email:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedLog.actorEmail}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/60 py-1 dark:border-slate-700/60">
                      <span>Privilege Role:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {selectedLog.actorRole}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/60 py-1 dark:border-slate-700/60">
                      <span>IP Address:</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {selectedLog.ipAddress}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/60 py-1 dark:border-slate-700/60">
                      <span>Device & Client:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {selectedLog.deviceInfo}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/60 py-1 dark:border-slate-700/60">
                      <span>Location:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedLog.location}
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span>Timestamp:</span>
                      <span className="font-mono text-slate-400">
                        {new Date(selectedLog.timestamp).toISOString()}
                      </span>
                    </div>
                  </div>

                  {/* Raw Metadata JSON Payload */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Metadata Payload (JSON)
                    </span>
                    <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-purple-300">
                      {JSON.stringify(
                        selectedLog.metadataJson || { eventId: selectedLog.id },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-md hover:bg-purple-700"
                  >
                    Close Telemetry Details
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
