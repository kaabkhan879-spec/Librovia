import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextProps {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }, [removeToast])

  const showSuccess = useCallback((msg: string) => addToast(msg, 'success'), [addToast])
  const showError = useCallback((msg: string) => addToast(msg, 'error'), [addToast])
  const showInfo = useCallback((msg: string) => addToast(msg, 'info'), [addToast])

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-9999 space-y-3 w-full max-w-sm pointer-events-none select-none font-sans text-left">
        <AnimatePresence>
          {toasts.map((toast) => {
            const config = {
              success: {
                icon: CheckCircle,
                classes: 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-400',
                timeline: 'bg-emerald-500'
              },
              error: {
                icon: AlertCircle,
                classes: 'border-red-100 bg-red-50 text-red-800 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400',
                timeline: 'bg-red-500'
              },
              info: {
                icon: Info,
                classes: 'border-purple-100 bg-purple-50 text-purple-800 dark:border-purple-950/20 dark:bg-purple-950/20 dark:text-purple-400',
                timeline: 'bg-purple-500'
              }
            }[toast.type]

            const Icon = config.icon

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`relative flex items-center justify-between gap-3 border rounded-2xl p-4 shadow-lg pointer-events-auto backdrop-blur-md ${config.classes}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <p className="text-xs font-bold leading-normal">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-current/60 hover:text-current"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Shimmering closing progress line animation */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full origin-left ${config.timeline}`}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
