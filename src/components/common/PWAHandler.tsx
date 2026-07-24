import React, { useState, useEffect } from 'react'
import { WifiOff, Download, RefreshCw, X } from 'lucide-react'

// Define custom BeforeInstallPromptEvent interface for TypeScript linter compliance
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export const PWAHandler: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // 1. Monitor network online/offline events
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 2. Register Service Worker and listen for updates (Only in Production)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setRegistration(reg)

          // Check if there's an update waiting
          if (reg.waiting) {
            setShowUpdateBanner(true)
          }

          // Listen for new service worker installs
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowUpdateBanner(true)
                }
              })
            }
          })
        })
        .catch((err) => console.error('[PWA] Service Worker registration failed:', err))
    }

    // 3. Catch browser install prompts
    const handleInstallPrompt = (e: Event) => {
      // Don't trigger if already launched in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) return
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  // Execute SW Skip Waiting to activate immediately
  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdateBanner(false)
    window.location.reload()
  }

  // Trigger browser install overlay prompt
  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`[PWA] Install prompt outcome: ${outcome}`)
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  return (
    <>
      {/* UPDATE BANNER */}
      {showUpdateBanner && (
        <div className="fixed right-4 bottom-4 left-4 z-50 flex max-w-sm items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-slate-900 p-4 text-white shadow-2xl backdrop-blur-md sm:right-4 sm:left-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Update Available</p>
              <p className="text-[10px] text-slate-400">A new version of Librovia is available.</p>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="cursor-pointer rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-black whitespace-nowrap text-white transition-colors hover:bg-purple-500"
          >
            Update Now
          </button>
        </div>
      )}

      {/* INSTALL PROMPT BANNER */}
      {showInstallBanner && (
        <div className="fixed top-4 right-4 left-4 z-50 flex max-w-sm items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:right-4 sm:left-auto dark:border-slate-800 dark:bg-slate-900 dark:text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
              <Download className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-black">Install Librovia</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Add to your home screen for offline reading.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstall}
              className="cursor-pointer rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-black whitespace-nowrap text-white transition-colors hover:bg-purple-500"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE FULL SCREEN OVERLAY FALLBACK */}
      {isOffline && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0F19] p-6 text-center font-sans text-white select-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.12),transparent_70%)]" />

          <div className="relative flex max-w-sm flex-col items-center space-y-6">
            {/* Pulsing offline icon */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-purple-500/20 bg-purple-950/30 text-purple-400 shadow-xl shadow-purple-600/5">
              <WifiOff className="h-10 w-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center justify-center gap-2 text-xl font-black tracking-tight text-white">
                📡 You're offline
              </h3>
              <p className="text-xs leading-relaxed font-bold text-indigo-200/80">
                Reconnect to continue syncing your library. Previously cached pages should still
                open.
              </p>
            </div>

            {/* Simulated reconnect spinner */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-800/40 px-3 py-1.5 text-[10px] font-black text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
              <span>Waiting for network...</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default PWAHandler
