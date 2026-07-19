import { storageService } from './storage'
import { type Book } from './books'

export interface DownloadedBookMeta {
  bookId: string
  title: string
  author: string
  coverPath?: string
  downloadedAt: string
  fileSize: number // size in bytes
  status: 'not_downloaded' | 'downloading' | 'downloaded' | 'failed'
  progress: number // 0 to 100
  error?: string
}

const DB_NAME = 'librovia_offline_db'
const DB_VERSION = 1
const STORE_BLOBS = 'books_blobs'
const STORE_META = 'downloads_meta'

// Open IndexedDB Connection
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this browser.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'bookId' })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'bookId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'))
  })
}

export const offlineStorageService = {
  // Check if book is available offline
  async isBookDownloaded(bookId: string): Promise<boolean> {
    try {
      const db = await openOfflineDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_META, 'readonly')
        const store = tx.objectStore(STORE_META)
        const req = store.get(bookId)
        req.onsuccess = () => {
          const meta: DownloadedBookMeta | undefined = req.result
          resolve(meta?.status === 'downloaded')
        }
        req.onerror = () => resolve(false)
      })
    } catch {
      return false
    }
  },

  // Get metadata for a specific book
  async getDownloadMeta(bookId: string): Promise<DownloadedBookMeta | null> {
    try {
      const db = await openOfflineDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_META, 'readonly')
        const store = tx.objectStore(STORE_META)
        const req = store.get(bookId)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  },

  // Get all downloaded books metadata
  async getAllDownloadedBooks(): Promise<DownloadedBookMeta[]> {
    try {
      const db = await openOfflineDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_META, 'readonly')
        const store = tx.objectStore(STORE_META)
        const req = store.getAll()
        req.onsuccess = () => {
          const list: DownloadedBookMeta[] = req.result || []
          resolve(list.filter((item) => item.status === 'downloaded'))
        }
        req.onerror = () => resolve([])
      })
    } catch {
      return []
    }
  },

  // Save metadata
  async saveDownloadMeta(meta: DownloadedBookMeta): Promise<void> {
    const db = await openOfflineDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, 'readwrite')
      const store = tx.objectStore(STORE_META)
      const req = store.put(meta)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  },

  // Download PDF Blob for offline reading with progress callback
  async downloadBookForOffline(
    book: Book,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const meta: DownloadedBookMeta = {
      bookId: book.id,
      title: book.title,
      author: book.author || 'Unknown Author',
      coverPath: book.coverPath,
      downloadedAt: new Date().toISOString(),
      fileSize: 0,
      status: 'downloading',
      progress: 0,
    }

    await this.saveDownloadMeta(meta)

    try {
      // Get secure signed URL for the book
      let fileUrl = book.filePath
      if (!fileUrl.startsWith('blob:') && !fileUrl.startsWith('http')) {
        fileUrl = await storageService.getBookURL(book.filePath)
      }

      // Download file using XMLHttpRequest to track progress
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', fileUrl, true)
        xhr.responseType = 'blob'

        xhr.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.round((event.loaded / event.total) * 100)
            meta.progress = percent
            meta.fileSize = event.total
            this.saveDownloadMeta(meta).catch(() => {})
            if (onProgress) onProgress(percent)
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200 && xhr.response) {
            resolve(xhr.response as Blob)
          } else {
            reject(new Error(`Download failed with HTTP status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Network error during download.'))
        xhr.ontimeout = () => reject(new Error('Download timed out.'))

        xhr.send()
      })

      // Store blob in IndexedDB
      const db = await openOfflineDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_BLOBS, 'readwrite')
        const store = tx.objectStore(STORE_BLOBS)
        const req = store.put({
          bookId: book.id,
          blob,
          downloadedAt: new Date().toISOString(),
          fileSize: blob.size,
          mimeType: blob.type || 'application/pdf',
        })
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })

      // Update metadata status to downloaded
      meta.status = 'downloaded'
      meta.progress = 100
      meta.fileSize = blob.size
      await this.saveDownloadMeta(meta)

      return blob
    } catch (err: any) {
      meta.status = 'failed'
      meta.error = err.message || 'Download failed'
      await this.saveDownloadMeta(meta)
      throw err
    }
  },

  // Retrieve cached Blob from IndexedDB
  async getOfflineBookBlob(bookId: string): Promise<Blob | null> {
    try {
      const db = await openOfflineDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_BLOBS, 'readonly')
        const store = tx.objectStore(STORE_BLOBS)
        const req = store.get(bookId)
        req.onsuccess = () => {
          const res = req.result
          if (res && res.blob) {
            resolve(res.blob as Blob)
          } else {
            resolve(null)
          }
        }
        req.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  },

  // Get Object URL for PDF viewer
  async getOfflineBookUrl(bookId: string): Promise<string | null> {
    const blob = await this.getOfflineBookBlob(bookId)
    if (!blob) return null
    return URL.createObjectURL(blob)
  },

  // Delete local offline copy (cloud storage remains primary source)
  async deleteOfflineBook(bookId: string): Promise<void> {
    try {
      const db = await openOfflineDB()

      // Remove Blob
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_BLOBS, 'readwrite')
        const store = tx.objectStore(STORE_BLOBS)
        const req = store.delete(bookId)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      })

      // Remove Metadata
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_META, 'readwrite')
        const store = tx.objectStore(STORE_META)
        const req = store.delete(bookId)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      })
    } catch (err) {
      console.error('Failed to delete offline book:', err)
    }
  },

  // Calculate total device storage used by offline books
  async getTotalOfflineStorageBytes(): Promise<number> {
    const downloads = await this.getAllDownloadedBooks()
    return downloads.reduce((acc, item) => acc + (item.fileSize || 0), 0)
  },

  // Clear all downloaded books from device
  async clearAllDownloads(): Promise<void> {
    try {
      const db = await openOfflineDB()
      await new Promise<void>((resolve) => {
        const tx = db.transaction([STORE_BLOBS, STORE_META], 'readwrite')
        tx.objectStore(STORE_BLOBS).clear()
        tx.objectStore(STORE_META).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      })
    } catch (err) {
      console.error('Failed to clear offline downloads:', err)
    }
  },
}
