import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { auditService } from '../../services/audit'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { Toggle } from '../../components/common/Toggle'
import { Settings, Save } from 'lucide-react'

export const AdminSystemSettingsPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [allowRegistrations, setAllowRegistrations] = useState(true)
  const [defaultStorageGB, setDefaultStorageGB] = useState(5)
  const [maxUploadSizeMB, setMaxUploadSizeMB] = useState(100)
  const [loading, setLoading] = useState(true)

  // Manual payment gateway states
  const [easypaisaNumber, setEasypaisaNumber] = useState('')
  const [easypaisaName, setEasypaisaName] = useState('')
  const [jazzcashNumber, setJazzcashNumber] = useState('')
  const [jazzcashName, setJazzcashName] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [paymentInstructions, setPaymentInstructions] = useState('')

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setMaintenanceMode(data.maintenance_mode)
        setAllowRegistrations(data.allow_registrations)
        setDefaultStorageGB(data.default_storage_gb)
        setMaxUploadSizeMB(data.max_upload_size_mb)
        setEasypaisaNumber(data.easypaisa_number || '')
        setEasypaisaName(data.easypaisa_name || '')
        setJazzcashNumber(data.jazzcash_number || '')
        setJazzcashName(data.jazzcash_name || '')
        setBankName(data.bank_name || '')
        setBankAccountNumber(data.bank_account_number || '')
        setBankAccountName(data.bank_account_name || '')
        setPaymentInstructions(data.payment_instructions || '')
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch settings'
      showError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
  }, [fetchSettings])

  const handleSaveSettings = async () => {
    const payload = {
      id: 1,
      maintenance_mode: maintenanceMode,
      allow_registrations: allowRegistrations,
      default_storage_gb: defaultStorageGB,
      max_upload_size_mb: maxUploadSizeMB,
      easypaisa_number: easypaisaNumber,
      easypaisa_name: easypaisaName,
      jazzcash_number: jazzcashNumber,
      jazzcash_name: jazzcashName,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_account_name: bankAccountName,
      payment_instructions: paymentInstructions,
    }

    try {
      const { error } = await supabase.from('system_settings').upsert(payload, { onConflict: 'id' })
      if (error) throw error

      await auditService.insertLog({
        event: 'System Settings Update',
        category: 'System Config',
        severity: 'Info',
        metadata: {
          maintenanceMode,
          allowRegistrations,
          defaultStorageGB,
          maxUploadSizeMB,
          manualPaymentsUpdated: true,
        },
      })

      showSuccess('System settings updated and saved.')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save settings'
      showError(errMsg)
    }
  }

  if (loading) {
    return (
      <PageWrapper className="flex min-h-screen items-center justify-center">
        <div className="border-purple-650 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <Settings className="h-7 w-7 text-purple-600" />
            System & Infrastructure Settings
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Configure platform maintenance mode, public signup toggles, storage quotas, SMTP,
            Payment Gateway, and AI settings.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Platform Toggles */}
        <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="border-b border-slate-100 pb-3 text-base font-black text-slate-900 dark:border-slate-800 dark:text-white">
            General Controls
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">
                Maintenance Mode
              </span>
              <span className="text-xs text-slate-500">
                Temporarily restrict user access for system updates.
              </span>
            </div>
            <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">
                Allow Public Registrations
              </span>
              <span className="text-xs text-slate-500">
                Enable new user account signups on Register page.
              </span>
            </div>
            <Toggle checked={allowRegistrations} onChange={setAllowRegistrations} />
          </div>
        </div>

        {/* Quotas & Limits */}
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="border-b border-slate-100 pb-3 text-base font-black text-slate-900 dark:border-slate-800 dark:text-white">
            Default Quotas & Limits
          </h3>

          <div className="grid grid-cols-1 gap-4 text-xs font-bold text-slate-700 sm:grid-cols-2 dark:text-slate-300">
            <div>
              <label className="mb-1 block">Default Free Storage (GB)</label>
              <input
                type="number"
                value={defaultStorageGB}
                onChange={(e) => setDefaultStorageGB(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block">Max Upload File Size (MB)</label>
              <input
                type="number"
                value={maxUploadSizeMB}
                onChange={(e) => setMaxUploadSizeMB(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Manual Payment Gateway Credentials */}
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="border-b border-slate-100 pb-3 text-base font-black text-slate-900 dark:border-slate-800 dark:text-white">
            Manual Payment Gateway Details
          </h3>

          <div className="grid grid-cols-1 gap-4 text-xs font-bold text-slate-700 sm:grid-cols-2 dark:text-slate-300">
            <div>
              <label className="mb-1 block">EasyPaisa Account Number</label>
              <input
                type="text"
                value={easypaisaNumber}
                onChange={(e) => setEasypaisaNumber(e.target.value)}
                placeholder="e.g. 03001234567"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block">EasyPaisa Account Name</label>
              <input
                type="text"
                value={easypaisaName}
                onChange={(e) => setEasypaisaName(e.target.value)}
                placeholder="e.g. Librovia EasyPaisa Wallet"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block">JazzCash Account Number</label>
              <input
                type="text"
                value={jazzcashNumber}
                onChange={(e) => setJazzcashNumber(e.target.value)}
                placeholder="e.g. 03007654321"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block">JazzCash Account Name</label>
              <input
                type="text"
                value={jazzcashName}
                onChange={(e) => setJazzcashName(e.target.value)}
                placeholder="e.g. Librovia JazzCash Wallet"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Meezan Bank"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block">Bank Account Number / IBAN</label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="e.g. PK83 MEZN 0000..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block">Bank Account Holder Name</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="e.g. Librovia Private Limited"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block">Payment Instructions for Users</label>
              <textarea
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Provide detailed instructions to users showing how to pay and submit confirmation details..."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-purple-650"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-purple-600/20 hover:bg-purple-700"
        >
          <Save className="h-4 w-4" />
          <span>Save System Settings</span>
        </button>
      </div>
    </PageWrapper>
  )
}
