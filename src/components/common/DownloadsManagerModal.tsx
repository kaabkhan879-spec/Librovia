import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HardDrive,
  Trash2,
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { offlineStorageService, type DownloadedBookMeta } from '../../services/offlineStorage'
import { ROUTES } from '../../constants/routes'
import { Button } from './Button'

interface DownloadsManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DownloadsManagerModal: React.FC<DownloadsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloads, setDownloads] = useState<DownloadedBookMeta[]>([])
  const [totalStorageBytes, setTotalStorageBytes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const loadStorageData = useCallback(async () => {
    setLoading(true)
    try {
      const list = await offlineStorageService.getAllDownloadedBooks()
      const bytes = await offlineStorageService.getTotalOfflineStorageBytes()
      setDownloads(list)
      setTotalStorageBytes(bytes)
    } catch (err) {
      console.error('Failed to load offline storage info:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadStorageData()
    }
  }, [isOpen, loadStorageData])

  const handleDeleteItem = async (bookId: string, title: string) => {
    if (confirm(`Remove local offline copy of "${title}"? (Cloud version will remain safe)`)) {
      await offlineStorageService.deleteOfflineBook(bookId)
      await loadStorageData()
    }
  }

  const handleClearAll = async () => {
    if (
      confirm('Are you sure you want to remove ALL offline downloaded books? (Cloud versions will remain safe)')
    ) {
      await offlineStorageService.clearAllDownloads()
      await loadStorageData()
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/45 p-4 text-left backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Offline Downloads Manager
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Manage books saved locally on your device for offline reading.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Storage Usage Banner */}
            <div className="border-b border-slate-100 bg-purple-50/40 p-4 dark:border-slate-800 dark:bg-purple-950/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Device Storage Used
                  </span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {formatBytes(totalStorageBytes)}
                  </p>
                </div>
                {downloads.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearAll}
                    leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                    className="rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    Clear All Downloads
                  </Button>
                )}
              </div>
            </div>

            {/* Downloads List */}
            <div className="max-h-80 overflow-y-auto p-6">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-xs font-bold text-slate-400">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading offline books...
                </div>
              ) : downloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                  <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No books downloaded yet.
                    </p>
                    <p className="max-w-xs text-[11px] font-semibold text-slate-400">
                      Download books while connected to the internet to read them anytime offline.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloads.map((item) => (
                    <div
                      key={item.bookId}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.coverPath ? (
                          <img
                            src={item.coverPath}
                            alt={item.title}
                            className="h-12 w-9 rounded-lg border border-slate-200/60 object-cover dark:border-slate-800"
                          />
                        ) : (
                          <div className="flex h-12 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </h4>
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          </div>
                          <p className="truncate text-[10.5px] font-semibold text-slate-400">
                            {item.author} • {formatBytes(item.fileSize)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-3">
                        <Link to={ROUTES.READER.replace(':id', item.bookId)} onClick={onClose}>
                          <Button
                            size="sm"
                            className="rounded-xl bg-purple-600 font-bold text-white shadow-2xs hover:bg-purple-700"
                          >
                            Read
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleDeleteItem(item.bookId, item.title)}
                          className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                          title="Delete local copy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
