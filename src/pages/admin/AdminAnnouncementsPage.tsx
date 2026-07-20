import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import {
  Megaphone,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Paperclip,
  Save,
  Eye,
  Calendar,
  Search,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Activity,
  Smartphone,
} from 'lucide-react'

export interface BroadcastAnnouncement {
  id: string
  title: string
  content: string
  targetAudience: 'All Readers' | 'Free Tier' | 'Pro Subscribers' | 'Family Members' | 'Admins Only'
  type: 'Information' | 'Maintenance' | 'Feature Update' | 'Promotion' | 'Security Alert'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  scheduleMode: 'Send Now' | 'Schedule Later'
  scheduledDateTime?: string
  status: 'Sent' | 'Scheduled' | 'Draft' | 'Failed'
  deliveryRatePct: number
  openRatePct: number
  createdAt: string
  attachmentName?: string
}

export const AdminAnnouncementsPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  // Form Creation State
  const [title, setTitle] = useState('Welcome to Librovia v2.4 Release!')
  const [content, setContent] = useState('We have upgraded our Reader App with faster cloud sync, AI book summarizer speed improvements, and full dark mode themes. Enjoy reading!')
  const [targetAudience, setTargetAudience] = useState<BroadcastAnnouncement['targetAudience']>('All Readers')
  const [type, setType] = useState<BroadcastAnnouncement['type']>('Feature Update')
  const [priority, setPriority] = useState<BroadcastAnnouncement['priority']>('High')
  const [scheduleMode, setScheduleMode] = useState<'Send Now' | 'Schedule Later'>('Send Now')
  const [scheduledDateTime, setScheduledDateTime] = useState('')
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined)

  // Broadcast History Dataset
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([
    {
      id: 'ann-01',
      title: 'Welcome to Librovia v2.4 Release!',
      content: 'We have upgraded our Reader App with faster cloud sync, AI book summarizer speed improvements, and full dark mode themes.',
      targetAudience: 'All Readers',
      type: 'Feature Update',
      priority: 'High',
      scheduleMode: 'Send Now',
      status: 'Sent',
      deliveryRatePct: 99.8,
      openRatePct: 68.4,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ann-02',
      title: 'Scheduled Cloud Maintenance Notice',
      content: 'Our database and storage services will undergo 15 minutes of routine maintenance tonight at 02:00 UTC.',
      targetAudience: 'All Readers',
      type: 'Maintenance',
      priority: 'Medium',
      scheduleMode: 'Schedule Later',
      scheduledDateTime: '2026-07-25 02:00',
      status: 'Scheduled',
      deliveryRatePct: 0,
      openRatePct: 0,
      createdAt: '2026-07-19T14:30:00Z',
    },
  ])

  // Table Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Sent' | 'Scheduled' | 'Draft' | 'Failed'>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Calculations
  const totalBroadcasts = announcements.length
  const sentTodayCount = announcements.filter((a) => a.status === 'Sent').length
  const scheduledCount = announcements.filter((a) => a.status === 'Scheduled').length
  const draftsCount = announcements.filter((a) => a.status === 'Draft').length

  // Handlers
  const handleFormSubmit = (actionType: 'send' | 'schedule' | 'draft') => {
    if (!title.trim()) {
      showError('Please enter an announcement title.')
      return
    }
    if (!content.trim()) {
      showError('Please enter message content.')
      return
    }

    let statusVal: BroadcastAnnouncement['status'] = 'Sent'
    if (actionType === 'draft') statusVal = 'Draft'
    else if (actionType === 'schedule' || scheduleMode === 'Schedule Later') statusVal = 'Scheduled'

    const newBroadcast: BroadcastAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      targetAudience,
      type,
      priority,
      scheduleMode,
      scheduledDateTime: scheduleMode === 'Schedule Later' ? scheduledDateTime || '2026-08-01 10:00' : undefined,
      status: statusVal,
      deliveryRatePct: statusVal === 'Sent' ? 99.9 : 0,
      openRatePct: statusVal === 'Sent' ? 72.1 : 0,
      createdAt: new Date().toISOString(),
      attachmentName,
    }

    setAnnouncements((prev) => [newBroadcast, ...prev])

    if (actionType === 'draft') {
      showSuccess(`Saved draft "${title}".`)
    } else if (statusVal === 'Scheduled') {
      showSuccess(`Scheduled broadcast for ${targetAudience}!`)
    } else {
      showSuccess(`Broadcast sent to ${targetAudience}!`)
    }

    // Reset Form
    setTitle('')
    setContent('')
    setAttachmentName(undefined)
  }

  const handleDuplicate = (b: BroadcastAnnouncement) => {
    const copy: BroadcastAnnouncement = {
      ...b,
      id: `ann-${Date.now()}`,
      title: `${b.title} (Copy)`,
      status: 'Draft',
      deliveryRatePct: 0,
      openRatePct: 0,
      createdAt: new Date().toISOString(),
    }
    setAnnouncements((prev) => [copy, ...prev])
    showSuccess(`Duplicated broadcast into Draft status.`)
  }

  const handleDelete = (id: string, titleStr: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    showSuccess(`Deleted broadcast "${titleStr}".`)
  }

  // Filter Pipeline
  const filteredAnnouncements = announcements.filter((a) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.targetAudience.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'All' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage) || 1
  const paginatedAnnouncements = filteredAnnouncements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getTypeBadge = (t: BroadcastAnnouncement['type']) => {
    if (t === 'Feature Update') return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
    if (t === 'Maintenance') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
    if (t === 'Promotion') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
    if (t === 'Security Alert') return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }

  const getStatusBadge = (s: BroadcastAnnouncement['status']) => {
    if (s === 'Sent')
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Sent
        </span>
      )
    if (s === 'Scheduled')
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
          <Clock className="h-3 w-3 text-sky-600" /> Scheduled
        </span>
      )
    if (s === 'Draft')
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Save className="h-3 w-3 text-slate-500" /> Draft
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
        <ShieldAlert className="h-3 w-3 text-rose-600" /> Failed
      </span>
    )
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* 1. HEADER & ANALYTICS CARDS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <Megaphone className="h-7 w-7 text-purple-600" />
            Broadcast Announcements Studio
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Publish system updates, feature releases, maintenance notices, and audience broadcasts.
          </p>
        </div>
      </div>

      {/* 4 Header Analytics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Broadcasts</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalBroadcasts} Published</h3>
          <span className="text-[10.5px] font-semibold text-purple-600 dark:text-purple-400">System Logs</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Sent Today</span>
          <h3 className="text-2xl font-black text-emerald-600">{sentTodayCount} Sent</h3>
          <span className="text-[10.5px] font-semibold text-slate-500">Live Delivery</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
          <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block">Scheduled</span>
          <h3 className="text-2xl font-black text-sky-600">{scheduledCount} Upcoming</h3>
          <span className="text-[10.5px] font-semibold text-slate-500">Automated Dispatch</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Drafts</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{draftsCount} Saved</h3>
          <span className="text-[10.5px] font-semibold text-slate-500">Unpublished Items</span>
        </div>
      </div>

      {/* 2. MAIN RESPONSIVE TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: CREATE ANNOUNCEMENT STUDIO CARD (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Compose Broadcast Announcement
            </h3>
            <span className="text-xs font-mono text-slate-400">Studio Editor</span>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance or New Feature Release"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            {/* Target Audience & Type Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="All Readers">All Readers (Global)</option>
                  <option value="Free Tier">Free Tier Readers</option>
                  <option value="Pro Subscribers">Pro Subscribers Only</option>
                  <option value="Family Members">Family Plan Accounts</option>
                  <option value="Admins Only">Admins & Staff Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Announcement Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Information">ℹ️ Information</option>
                  <option value="Feature Update">✨ Feature Update</option>
                  <option value="Maintenance">🛠️ Maintenance</option>
                  <option value="Promotion">🎁 Promotion</option>
                  <option value="Security Alert">🚨 Security Alert</option>
                </select>
              </div>
            </div>

            {/* Priority & Schedule Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Schedule Mode</label>
                <select
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value as any)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Send Now">🚀 Dispatch Immediately</option>
                  <option value="Schedule Later">📅 Schedule for Later Date</option>
                </select>
              </div>
            </div>

            {/* Scheduled Date/Time if Schedule Later */}
            {scheduleMode === 'Schedule Later' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {/* Rich Text Editor / Content Area */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Message Content</label>
                <span className="text-[11px] font-mono text-slate-400">{content.length} / 500 characters</span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your broadcast message content..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white leading-relaxed"
                required
              />
            </div>

            {/* Attachment Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setAttachmentName(attachmentName ? undefined : 'release_notes_v2.4.pdf')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                <Paperclip className="h-3.5 w-3.5 text-purple-600" />
                <span>{attachmentName ? `Attached: ${attachmentName}` : 'Attach File (Optional)'}</span>
              </button>

              <button
                type="button"
                onClick={() => showSuccess('Live Reader App simulation preview is active in the right column!')}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-purple-600 hover:underline"
              >
                <Eye className="h-3.5 w-3.5" /> Live Reader App Preview
              </button>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFormSubmit('draft')}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <Save className="h-4 w-4" /> Save Draft
              </button>

              {scheduleMode === 'Schedule Later' ? (
                <button
                  type="button"
                  onClick={() => handleFormSubmit('schedule')}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-black text-white hover:bg-sky-700 shadow-md shadow-sky-600/20"
                >
                  <Calendar className="h-4 w-4" /> Schedule Broadcast
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFormSubmit('send')}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
                >
                  <Send className="h-4 w-4" /> Send Announcement Now
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE READER APP SIMULATION PREVIEW CARD (5 cols) */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-sans text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-purple-600" />
                Live Reader App Simulation
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
              </span>
            </div>

            {/* Mobile Reader App Notification Box Frame */}
            <div className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-slate-900 p-4 shadow-xl text-white space-y-3 dark:border-slate-700">
              {/* App Status Header */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-extrabold text-purple-400">LIBROVIA READER</span>
                <span>Just Now</span>
              </div>

              {/* Dynamic Notification Card Component */}
              <div className="rounded-2xl bg-slate-800/90 p-4 border border-purple-500/30 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase ${getTypeBadge(type)}`}>
                    {type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{priority} Priority</span>
                </div>

                <h4 className="font-sans text-sm font-black text-white leading-snug">
                  {title || 'Announcement Title Preview'}
                </h4>

                <p className="text-xs font-medium text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                  {content || 'Your message content preview will render here in real-time as you type in the creation studio editor.'}
                </p>

                {attachmentName && (
                  <div className="rounded-xl bg-slate-900/60 p-2 text-[10.5px] font-mono text-purple-300 flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate">{attachmentName}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Target: {targetAudience}</span>
                  <button type="button" className="rounded-xl bg-purple-600 px-3 py-1 text-white hover:bg-purple-700">
                    Got It
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-400 text-center">
              Real-time rendering of reader app in-app notification popup.
            </p>
          </div>

          {/* RECENT ACTIVITY TIMELINE */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="font-sans text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" /> Recent Broadcast Timeline
            </h3>

            <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white">Announcement Sent to All Readers</span>
                  <span className="text-[11px] text-slate-400 font-mono">Welcome to Librovia v2.4 Release • Just Now</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-sky-500 mt-1.5" />
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white">Schedule Updated</span>
                  <span className="text-[11px] text-slate-400 font-mono">Cloud Maintenance Notice • 1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BROADCAST HISTORY DATA TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Broadcast History Directory
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search history by title, audience, or type..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-extrabold">
              {(['All', 'Sent', 'Scheduled', 'Draft', 'Failed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s)
                    setCurrentPage(1)
                  }}
                  className={`rounded-xl px-3 py-1.5 transition-colors ${
                    statusFilter === s
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
                <tr>
                  <th className="px-6 py-4">Announcement Title</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Delivery Rate</th>
                  <th className="px-6 py-4">Open Rate</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-semibold">
                {paginatedAnnouncements.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white max-w-[220px] truncate" title={a.title}>
                      {a.title}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">{a.targetAudience}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-extrabold ${getTypeBadge(a.type)}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(a.status)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {a.status === 'Sent' ? `${a.deliveryRatePct}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {a.status === 'Sent' ? `${a.openRatePct}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(a)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Duplicate Broadcast"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id, a.title)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Delete Broadcast"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 p-4 text-xs font-semibold text-slate-500 dark:border-slate-800">
            <div>
              Showing <strong className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</strong>–<strong className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredAnnouncements.length)}</strong> of <strong className="text-slate-900 dark:text-white">{filteredAnnouncements.length}</strong> broadcasts
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
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
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
