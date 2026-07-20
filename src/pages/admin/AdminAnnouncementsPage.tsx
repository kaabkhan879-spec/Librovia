import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { Megaphone, Send, CheckCircle2 } from 'lucide-react'

export const AdminAnnouncementsPage: React.FC = () => {
  const { showSuccess } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetAudience, setTargetAudience] = useState<'All' | 'Free' | 'Pro' | 'Family'>('All')

  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'Welcome to Librovia v2.0!', target: 'All Users', date: '2026-07-20', status: 'Sent' },
    { id: 2, title: 'Exclusive AI Feature Upgrade for Pro Users', target: 'Pro Users', date: '2026-07-18', status: 'Sent' },
  ])

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return
    setAnnouncements((prev) => [
      { id: Date.now(), title, target: `${targetAudience} Users`, date: new Date().toISOString().split('T')[0], status: 'Sent' },
      ...prev,
    ])
    showSuccess(`Announcement broadcast to ${targetAudience} Users!`)
    setTitle('')
    setContent('')
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <Megaphone className="h-7 w-7 text-purple-600" />
            Broadcast Announcements
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Create, schedule, and send announcements targeted to All Users, Free Users, Pro Users, or Family Users.
          </p>
        </div>
      </div>

      {/* Creation Form */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">Create New Broadcast Announcement</h3>
        <form onSubmit={handleSendAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Announcement Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Platform Maintenance Notice or New Feature Update"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="All">All Users</option>
                <option value="Free">Free Users Only</option>
                <option value="Pro">Pro Users Only</option>
                <option value="Family">Family Users Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write broadcast message content..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
          >
            <Send className="h-4 w-4" />
            <span>Send Announcement Now</span>
          </button>
        </form>
      </div>

      {/* History */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase text-slate-400">Broadcast History</div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
          {announcements.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{a.title}</span>
                <span className="text-slate-400">Target: {a.target} • {a.date}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
