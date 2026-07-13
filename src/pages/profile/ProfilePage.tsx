import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, ShieldAlert, CheckCircle } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setAlertMessage('Profile updated successfully! (Simulated)')
    setTimeout(() => setAlertMessage(null), 3000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col items-start gap-8 md:flex-row">
        {/* Profile Card */}
        <div className="flex w-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm md:w-1/3">
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="ring-brand-500/10 h-24 w-24 rounded-full object-cover ring-4"
              />
            ) : (
              <div className="bg-brand-100 text-brand-600 ring-brand-500/10 flex h-24 w-24 items-center justify-center rounded-full ring-4">
                <User className="h-12 w-12" />
              </div>
            )}
            <span className="absolute right-0 bottom-0 rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase ring-2 ring-white select-none">
              Online
            </span>
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">{user?.displayName || 'Reader'}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{user?.email}</p>

          <div className="mt-6 flex w-full justify-around border-t border-slate-100 pt-4 text-center select-none">
            <div>
              <p className="text-xs text-slate-400">Books</p>
              <p className="mt-0.5 text-base font-bold text-slate-800">3</p>
            </div>
            <div className="border-r border-slate-100" />
            <div>
              <p className="text-xs text-slate-400">Plan</p>
              <p className="text-brand-600 bg-brand-50 mt-1.5 rounded px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
                Free
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form & Details */}
        <div className="w-full flex-1 space-y-6">
          {alertMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-600">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p>{alertMessage}</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-sm">
            <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
              Account Details
            </h3>
            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="focus:border-brand-500 focus:ring-brand-500/10 block w-full rounded-xl border border-slate-200 py-3 pr-4 pl-9 text-sm text-slate-900 focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:border-brand-500 focus:ring-brand-500/10 block w-full rounded-xl border border-slate-200 py-3 pr-4 pl-9 text-sm text-slate-900 focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                Save Profile
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-sm">
            <h3 className="flex items-center gap-1.5 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Security Information
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Your Librovia account utilizes encrypted JWT session cookies synced with Supabase
              authentication servers. Personal metadata and book files are isolated at the database
              schema layer and locked behind multi-factor authentication triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
