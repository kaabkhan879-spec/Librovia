import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { Toggle } from '../../components/common/Toggle'
import { Settings, Save } from 'lucide-react'

export const AdminSystemSettingsPage: React.FC = () => {
  const { showSuccess } = useToast()

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [allowRegistrations, setAllowRegistrations] = useState(true)
  const [defaultStorageGB, setDefaultStorageGB] = useState(5)
  const [maxUploadSizeMB, setMaxUploadSizeMB] = useState(100)

  const handleSaveSettings = () => {
    showSuccess('System settings updated and saved.')
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-purple-600" />
            System & Infrastructure Settings
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Configure platform maintenance mode, public signup toggles, storage quotas, SMTP, Payment Gateway, and AI settings.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Platform Toggles */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
            General Controls
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">Maintenance Mode</span>
              <span className="text-xs text-slate-500">Temporarily restrict user access for system updates.</span>
            </div>
            <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">Allow Public Registrations</span>
              <span className="text-xs text-slate-500">Enable new user account signups on Register page.</span>
            </div>
            <Toggle checked={allowRegistrations} onChange={setAllowRegistrations} />
          </div>
        </div>

        {/* Quotas & Limits */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
            Default Quotas & Limits
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div>
              <label className="block mb-1">Default Free Storage (GB)</label>
              <input
                type="number"
                value={defaultStorageGB}
                onChange={(e) => setDefaultStorageGB(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block mb-1">Max Upload File Size (MB)</label>
              <input
                type="number"
                value={maxUploadSizeMB}
                onChange={(e) => setMaxUploadSizeMB(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
        >
          <Save className="h-4 w-4" />
          <span>Save System Settings</span>
        </button>
      </div>
    </PageWrapper>
  )
}
