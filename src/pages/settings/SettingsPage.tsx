import React, { useState } from 'react'
import { Eye, Sliders, HardDrive, CheckCircle } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [defaultZoom, setDefaultZoom] = useState('100')
  const [readerTheme, setReaderTheme] = useState('paper')
  const [alert, setAlert] = useState<string | null>(null)

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setAlert('Configuration options saved successfully!')
    setTimeout(() => setAlert(null), 3000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-left">
      {alert && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-600">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p>{alert}</p>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Appearance Section */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
            <Eye className="h-5 w-5 text-slate-500" />
            Appearance Preferences
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="dark-mode" className="text-sm font-semibold text-slate-800">
                Simulate Dark Mode
              </label>
              <p className="mt-0.5 text-xs text-slate-400">Toggle system theme styles visually.</p>
            </div>
            <button
              id="dark-mode"
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${darkMode ? 'bg-brand-600' : 'bg-slate-200'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Reader Customizer */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
            <Sliders className="h-5 w-5 text-slate-500" />
            PDF Reader Defaults
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="zoom" className="text-sm font-semibold text-slate-800">
                Default Reader Zoom
              </label>
              <select
                id="zoom"
                value={defaultZoom}
                onChange={(e) => setDefaultZoom(e.target.value)}
                className="focus:border-brand-500 focus:ring-brand-500/10 mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:outline-none"
              >
                <option value="75">75% Zoom</option>
                <option value="100">100% Zoom (Fit Page)</option>
                <option value="125">125% Zoom</option>
                <option value="150">150% Zoom (Fit Width)</option>
              </select>
            </div>

            <div>
              <label htmlFor="theme" className="text-sm font-semibold text-slate-800">
                Reader Theme Canvas
              </label>
              <select
                id="theme"
                value={readerTheme}
                onChange={(e) => setReaderTheme(e.target.value)}
                className="focus:border-brand-500 focus:ring-brand-500/10 mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:outline-none"
              >
                <option value="paper">Classic Paper (Warm Cream)</option>
                <option value="light">Pure White (High Contrast)</option>
                <option value="dark">Charcoal (Night Reading)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database Configuration indicators */}
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
            <HardDrive className="h-5 w-5 text-slate-500" />
            Backend Storage Policies
          </h3>
          <p className="text-xs leading-relaxed text-slate-500">
            Librovia's cloud database endpoints map to local dev databases. Supabase Storage client
            connects to secure sub-buckets with a file upload payload limit set to 50MB. API
            connections are read-only until the database parameters are initialized.
          </p>
        </div>

        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 cursor-pointer rounded-xl px-5 py-3 text-xs font-bold text-white shadow-sm"
        >
          Save All Configuration
        </button>
      </form>
    </div>
  )
}
