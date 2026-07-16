import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import {
  User,
  Shield,
  Sliders,
  Bell,
  Globe,
  Settings,
  Download,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'language' | 'security' | 'account'

export const SettingsPage: React.FC = () => {
  const { showSuccess } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Profile details states
  const [name, setName] = useState('Kaab Khan')
  const [email, setEmail] = useState('kaab@librovia.com')
  const [username, setUsername] = useState('kaabkhan')

  // Password / Security states
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Reading / Appearance states
  const [defaultTheme, setDefaultTheme] = useState<'sepia' | 'dark' | 'light'>('sepia')
  const [fontSize, setFontSize] = useState('base')
  const [readingMode, setReadingMode] = useState('Continuous Scroll')
  const [pageWidth, setPageWidth] = useState('medium')
  const [autoBookmark, setAutoBookmark] = useState(true)

  // Notifications states
  const [emailNotify, setEmailNotify] = useState(true)
  const [streakAlerts, setStreakAlerts] = useState(true)
  const [goalAlerts, setGoalAlerts] = useState(false)

  // Language states
  const [locale, setLocale] = useState('en-US')

  const triggerAlert = (message: string) => {
    showSuccess(message)
  }

  const handleExportData = () => {
    // Mock export
    const data = {
      profile: { name, email, username, locale },
      preferences: { defaultTheme, fontSize, readingMode, pageWidth, autoBookmark },
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `librovia_profile_backup_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    triggerAlert('Profile backup JSON downloaded!')
  }

  // Sidebar items mapping
  const sidebarGroups: {
    title: string
    items: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
  }[] = [
    {
      title: 'Personal',
      items: [
        { id: 'profile', label: 'User Profile', icon: User },
        { id: 'security', label: 'Security & Sign In', icon: Shield },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'appearance', label: 'Appearance defaults', icon: Sliders },
        { id: 'language', label: 'Language & Region', icon: Globe },
      ],
    },
    {
      title: 'Alerts & System',
      items: [
        { id: 'notifications', label: 'Alerts & Reminders', icon: Bell },
        { id: 'account', label: 'Workspace Account', icon: Settings },
      ],
    },
  ]

  return (
    <PageWrapper className="relative min-h-screen space-y-8 pb-20 text-left select-none">

      {/* Settings Grid */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Left sidebar navigation panel */}
        <div className="bg-bg-surface border-border-base space-y-5 rounded-3xl border p-5 text-left shadow-sm lg:col-span-1">
          {sidebarGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-text-muted mb-1.5 block px-2.5 text-[8px] font-extrabold tracking-widest uppercase">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-2.5 text-left text-xs font-bold tracking-wider uppercase transition-all ${
                      activeTab === item.id
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                        : 'text-text-sub hover:bg-bg-app hover:text-text-main'
                    } `}
                  >
                    <item.icon
                      className={`h-4.5 w-4.5 ${activeTab === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted group-hover:text-text-main'}`}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Settings Detail pane */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-bg-surface border-border-base space-y-6 rounded-3xl border p-6 text-left shadow-sm sm:p-8"
            >
              {/* 1. PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="border-border-light border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                      User Profile Settings
                    </h3>
                    <p className="text-text-muted text-[10px]">
                      Configure details for display names and primary contact emails.
                    </p>
                  </div>

                  <div className="border-border-base bg-bg-app/40 flex flex-col items-center gap-6 rounded-2xl border p-4 sm:flex-row">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80"
                      alt="Kaab Avatar"
                      className="ring-primary-500 h-16 w-16 rounded-full object-cover shadow ring-2"
                    />
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-text-main text-xs font-bold">Profile Photo</p>
                      <p className="text-text-muted text-[10px]">
                        JPG or PNG format with max size limits of 2MB.
                      </p>
                      <button 
                        type="button"
                        onClick={() => triggerAlert('Avatar photo upload is mocked.')}
                        className="text-primary-600 hover:text-primary-700 mt-1 cursor-pointer text-[10px] font-bold tracking-wider uppercase"
                      >
                        Upload New Photo
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      triggerAlert('Profile settings updated successfully!')
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Username Handle
                        </label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        Primary Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="py-2.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      Save Profile Settings
                    </Button>
                  </form>
                </div>
              )}

              {/* 2. APPEARANCE & PREFERENCES TAB */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="border-border-light border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                      Appearance & Reader defaults
                    </h3>
                    <p className="text-text-muted text-[10px]">
                      Customize reading themes and canvas styles.
                    </p>
                  </div>

                  {/* Themes section */}
                  <div className="space-y-3">
                    <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase block text-left">
                      Default Reader Theme
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {(
                        [
                          {
                            id: 'light',
                            label: 'Classic Light',
                            bg: 'bg-white',
                            text: 'text-slate-900 border-slate-200',
                          },
                          {
                            id: 'dark',
                            label: 'Midnight Dark',
                            bg: 'bg-neutral-900',
                            text: 'text-neutral-100 border-neutral-800',
                          },
                          {
                            id: 'sepia',
                            label: 'Warm Sepia',
                            bg: 'bg-[#f4ecd8]',
                            text: 'text-[#5b4636] border-[#e4dcc4]',
                          },
                        ] as const
                      ).map((themeOpt) => (
                        <button
                          key={themeOpt.id}
                          onClick={() => setDefaultTheme(themeOpt.id)}
                          className={`flex aspect-[1.3/1] cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:scale-101 ${defaultTheme === themeOpt.id ? 'ring-primary-500 border-primary-500 ring-2' : 'border-border-base'} `}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                              {themeOpt.label}
                            </span>
                            {defaultTheme === themeOpt.id && (
                              <CheckCircle className="text-primary-500 fill-primary-500/10 h-4.5 w-4.5" />
                            )}
                          </div>
                          <div
                            className={`mt-4 h-10 w-full rounded border p-2 text-[10px] leading-tight font-serif ${themeOpt.bg} ${themeOpt.text}`}
                          >
                            Aa
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reading Preferences */}
                  <div className="space-y-4 pt-4 border-t border-border-light font-sans text-xs">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 text-left">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Default Layout Mode
                        </label>
                        <select
                          value={readingMode}
                          onChange={(e) => setReadingMode(e.target.value)}
                          className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-xl border px-3 py-2.5 focus:outline-none"
                        >
                          <option>Continuous Scroll</option>
                          <option>Single Page View</option>
                          <option>Double Page Spread</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Default Font Size
                        </label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(e.target.value)}
                          className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-xl border px-3 py-2.5 focus:outline-none"
                        >
                          <option value="sm">Small text (12px)</option>
                          <option value="base">Medium standard (14px)</option>
                          <option value="lg">Large comfort (16px)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        Default Page Width Margins
                      </label>
                      <select
                        value={pageWidth}
                        onChange={(e) => setPageWidth(e.target.value)}
                        className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-xl border px-3 py-2.5 focus:outline-none"
                      >
                        <option value="narrow">Narrow Margins</option>
                        <option value="medium">Medium standard</option>
                        <option value="wide">Wide Layout</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-light pt-4">
                      <div>
                        <p className="text-text-main font-bold">Auto Bookmark on Exit</p>
                        <p className="text-text-muted text-[10px]">
                          Save current page coordinate parameters automatically.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoBookmark(!autoBookmark)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoBookmark ? 'bg-primary-650' : 'bg-slate-200'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoBookmark ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="border-border-light border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                      Alerts & Reminders
                    </h3>
                    <p className="text-text-muted text-[10px]">Configure email notification preferences.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-text-main text-xs font-bold">Weekly Digests</p>
                        <p className="text-text-muted text-[10px]">
                          Receive progress summary emails.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmailNotify(!emailNotify)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailNotify ? 'bg-primary-650' : 'bg-slate-200'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotify ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className="border-border-light flex items-center justify-between border-t pt-4">
                      <div>
                        <p className="text-text-main text-xs font-bold">Streak Alerts</p>
                        <p className="text-text-muted text-[10px]">
                          Notify me before my daily streak expires.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStreakAlerts(!streakAlerts)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${streakAlerts ? 'bg-primary-650' : 'bg-slate-200'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${streakAlerts ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className="border-border-light flex items-center justify-between border-t pt-4">
                      <div>
                        <p className="text-text-main text-xs font-bold">Reading Goals Alerts</p>
                        <p className="text-text-muted text-[10px]">
                          Send updates when achieving weekly milestones.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGoalAlerts(!goalAlerts)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${goalAlerts ? 'bg-primary-650' : 'bg-slate-200'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${goalAlerts ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. LANGUAGE TAB */}
              {activeTab === 'language' && (
                <div className="space-y-6">
                  <div className="border-border-light border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                      Language & Region
                    </h3>
                    <p className="text-text-muted text-[10px]">
                      Configure localized translations formats.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        Application Language
                      </label>
                      <select
                        value={locale}
                        onChange={(e) => {
                          setLocale(e.target.value)
                          triggerAlert(`Language configured to ${e.target.value === 'en-US' ? 'English' : e.target.value === 'es-ES' ? 'Spanish' : 'Urdu'}`)
                        }}
                        className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-xl border px-3 py-2.5 focus:outline-none"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español (ES)</option>
                        <option value="ur-PK">اردو (PK)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="border-border-light border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                      Security & Password reset
                    </h3>
                    <p className="text-text-muted text-[10px]">
                      Update secure authentication keys credentials.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!oldPassword || !newPassword) {
                        triggerAlert('Please complete all password fields.')
                        return
                      }
                      triggerAlert('Security configurations updated successfully!')
                      setOldPassword('')
                      setNewPassword('')
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="py-2.5 text-[10px] font-bold tracking-wider uppercase"
                    >
                      Update Password
                    </Button>
                  </form>
                </div>
              )}

              {/* 6. ACCOUNT WORKSPACE TAB */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div className="border-border-light border-b pb-3">
                    <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                      Workspace Account Details
                    </h3>
                    <p className="text-text-muted text-[10px]">
                      Manage data migrations, backups, exports, and profiles.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Backup & Portability */}
                    <div className="rounded-2xl border border-border-base bg-bg-app/20 p-4 text-left space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Download className="h-4 w-4 text-purple-650" />
                        Data Portability Backup
                      </h4>
                      <p className="text-[10.5px] text-text-sub leading-relaxed">
                        Download a complete JSON database dump of your reader profiles settings, category shelf references, bookmarks, page highlights, and annotations list.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleExportData}
                        className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export Profile Metadata</span>
                      </Button>
                    </div>

                    {/* Danger zone */}
                    <div className="rounded-2xl border border-red-200/50 bg-red-500/5 p-4 text-left space-y-3">
                      <h4 className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                        <Trash2 className="h-4 w-4" />
                        Danger Zone
                      </h4>
                      <p className="text-[10.5px] text-text-sub leading-relaxed">
                        Permanently close your Librovia account, delete files metadata index records, and wipe out cloud data references. This is irreversible.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('WARNING: Are you absolutely sure you want to terminate your account? This is permanent.')) {
                            triggerAlert('Account termination sequence is mock disabled.')
                          }
                        }}
                        className="rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 dark:hover:bg-red-950/20 px-3.5 py-1.5 text-[10.5px] font-bold uppercase transition-colors"
                      >
                        Delete Workspace Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  )
}
