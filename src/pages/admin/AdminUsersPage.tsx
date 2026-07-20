import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Eye,
  X,
} from 'lucide-react'

interface UserRecord {
  id: string
  name: string
  email: string
  avatar: string
  currentPlan: 'Free' | 'Pro' | 'Family'
  storageUsed: string
  role: 'user' | 'super_admin'
  status: 'Active' | 'Suspended' | 'Pending'
}

export const AdminUsersPage: React.FC = () => {
  const { showSuccess } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<'All' | 'Free' | 'Pro' | 'Family'>('All')

  // Sample production users list
  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: 'usr-01',
      name: 'Kaab Khan',
      email: 'kaabkhan879@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
      currentPlan: 'Family',
      storageUsed: '1.38 MB / 1 TB',
      role: 'super_admin',
      status: 'Active',
    },
    {
      id: 'usr-02',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
      currentPlan: 'Pro',
      storageUsed: '42.5 GB / 300 GB',
      role: 'user',
      status: 'Active',
    },
    {
      id: 'usr-03',
      name: 'Michael Chen',
      email: 'm.chen@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
      currentPlan: 'Free',
      storageUsed: '3.1 GB / 5 GB',
      role: 'user',
      status: 'Active',
    },
    {
      id: 'usr-04',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80',
      currentPlan: 'Pro',
      storageUsed: '118.2 GB / 300 GB',
      role: 'user',
      status: 'Suspended',
    },
  ])

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [modalType, setModalType] = useState<'view' | 'edit' | 'suspend' | 'delete' | 'upgrade' | 'role' | null>(null)

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = planFilter === 'All' || u.currentPlan === planFilter
    return matchesSearch && matchesPlan
  })

  const handleAction = (user: UserRecord, type: 'view' | 'edit' | 'suspend' | 'delete' | 'upgrade' | 'role') => {
    setSelectedUser(user)
    setModalType(type)
  }

  const handleToggleSuspend = () => {
    if (!selectedUser) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' }
          : u
      )
    )
    showSuccess(`User ${selectedUser.email} status updated.`)
    setModalType(null)
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
    showSuccess(`User ${selectedUser.email} deleted successfully.`)
    setModalType(null)
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-purple-600" />
            User Account Management
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            View, edit, suspend, upgrade plans, or assign user roles across the platform.
          </p>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Plan Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Plan Filter:</span>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['All', 'Free', 'Pro', 'Family'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlanFilter(p)}
                className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-colors ${
                  planFilter === p
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold tracking-wider uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Storage Used</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredUsers.map((u) => {
                const isSuperAdmin = u.role === 'super_admin'
                return (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover shadow-xs" />
                        <div>
                          <span className="block font-bold text-slate-900 dark:text-white">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-400">
                      {u.currentPlan}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {u.storageUsed}
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          <ShieldCheck className="h-3 w-3 text-purple-600" />
                          super_admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <UserCheck className="h-3 w-3 text-slate-400" />
                          user
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAction(u, 'view')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(u, 'edit')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(u, 'suspend')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
                          title="Suspend/Activate"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleAction(u, 'delete')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      <AnimatePresence>
        {selectedUser && modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize">
                  {modalType} User Account
                </h3>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p><span className="font-bold text-slate-900 dark:text-white">Name:</span> {selectedUser.name}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Email:</span> {selectedUser.email}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Role:</span> {selectedUser.role}</p>
                  <p><span className="font-bold text-slate-900 dark:text-white">Plan:</span> {selectedUser.currentPlan}</p>
                </div>

                {modalType === 'suspend' && (
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalType(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleSuspend}
                      className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-700 shadow-md"
                    >
                      {selectedUser.status === 'Active' ? 'Suspend User' : 'Reactivate User'}
                    </button>
                  </div>
                )}

                {modalType === 'delete' && (
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalType(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-black text-white hover:bg-rose-700 shadow-md"
                    >
                      Confirm Delete
                    </button>
                  </div>
                )}

                {(modalType === 'view' || modalType === 'edit' || modalType === 'upgrade' || modalType === 'role') && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        showSuccess(`Account settings saved for ${selectedUser.email}`)
                        setModalType(null)
                      }}
                      className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-black text-white hover:bg-purple-700 shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
