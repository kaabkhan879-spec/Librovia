import { supabase } from './supabase'
import { storageService } from './storage'
import { auditService } from './audit'

export interface Book {
  id: string
  title: string
  author: string
  description?: string
  filePath: string
  coverPath?: string
  collectionId?: string
  isFavorite: boolean
  tags: string[]
  fileSize: number
  createdAt: string
  updatedAt: string
  progress: number
  currentPage: number
  totalPages: number
  lastReadAt?: string
  startedAt?: string
  readingTime?: number
}

export interface ReadingProgress {
  id: string
  bookId: string
  currentPage: number
  totalPages: number
  lastReadAt: string
  isCompleted: boolean
  startedAt?: string
  readingTime?: number // total elapsed time in seconds
}

// Local helper to extract relative storage paths from public or authenticated URLs
function getPathFromUrl(url: string | undefined | null, bucket: string): string {
  if (!url) return ''
  if (!url.startsWith('http')) return url
  const parts = url.split(`/${bucket}/`)
  return parts.length > 1 ? parts[1] : ''
}

export const booksService = {
  // Test if Supabase reading_progress table is available
  async isProgressAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('reading_progress').select('id').limit(1)
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  getLocalProgressList(userId: string): ReadingProgress[] {
    const str = localStorage.getItem('librovia-fallback-progress') || '[]'
    try {
      const parsed = JSON.parse(str) as Array<ReadingProgress & { userId: string }>
      return parsed.filter((p) => p.userId === userId)
    } catch {
      return []
    }
  },

  saveLocalProgress(progress: ReadingProgress & { userId: string }) {
    const str = localStorage.getItem('librovia-fallback-progress') || '[]'
    const all = (() => {
      try {
        return JSON.parse(str) as Array<ReadingProgress & { userId: string }>
      } catch {
        return []
      }
    })()
    const idx = all.findIndex((x) => x.bookId === progress.bookId && x.userId === progress.userId)
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...progress }
    } else {
      all.push(progress)
    }
    localStorage.setItem('librovia-fallback-progress', JSON.stringify(all))
  },

  async getBooks(): Promise<Book[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const rpAvailable = await this.isProgressAvailable()

    const { data: rows, error } = rpAvailable
      ? await supabase
          .from('books')
          .select(
            '*, reading_progress(current_page, total_pages, last_read_at, is_completed, started_at, reading_time)'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      : await supabase
          .from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching books:', error)
      return []
    }

    const booksList = rows || []
    if (booksList.length === 0) return []

    // Extract paths for bulk signed URL generation
    const bookPaths = booksList.map((r) => getPathFromUrl(r.file_url, 'books')).filter(Boolean)
    const coverPaths = booksList.map((r) => getPathFromUrl(r.cover_url, 'covers')).filter(Boolean)

    const signedBookUrls: Record<string, string> = {}
    const signedCoverUrls: Record<string, string> = {}

    // Bulk sign book URLs (1 hour expiration)
    if (bookPaths.length > 0) {
      const { data: signedBooks } = await supabase.storage
        .from('books')
        .createSignedUrls(bookPaths, 3600)
      if (signedBooks) {
        signedBooks.forEach((s) => {
          if (s.signedUrl && s.path) signedBookUrls[s.path] = s.signedUrl
        })
      }
    }

    // Bulk sign cover URLs (1 hour expiration)
    if (coverPaths.length > 0) {
      const { data: signedCovers } = await supabase.storage
        .from('covers')
        .createSignedUrls(coverPaths, 3600)
      if (signedCovers) {
        signedCovers.forEach((s) => {
          if (s.signedUrl && s.path) signedCoverUrls[s.path] = s.signedUrl
        })
      }
    }

    // Fetch favorites if table exists
    let favBookIds: string[] = []
    let hasFavsTable = true
    try {
      const { data: favsData, error: favsError } = await supabase
        .from('favorites')
        .select('book_id')
      if (favsError && favsError.code === 'PGRST205') {
        hasFavsTable = false
      } else if (!favsError && favsData) {
        favBookIds = favsData.map((f) => f.book_id)
      }
    } catch {
      hasFavsTable = false
    }

    // Retrieve local progress fallback list if not live
    const localList = !rpAvailable ? this.getLocalProgressList(user.id) : []

    const books = booksList.map((row) => {
      const bookPath = getPathFromUrl(row.file_url, 'books')
      const coverPath = getPathFromUrl(row.cover_url, 'covers')

      let rp:
        | Partial<
            ReadingProgress & {
              current_page?: number
              total_pages?: number
              started_at?: string
              reading_time?: number
              last_read_at?: string
            }
          >
        | null
        | undefined
      if (rpAvailable) {
        const rpArray = row.reading_progress
        rp = Array.isArray(rpArray) ? rpArray[0] : rpArray
      } else {
        rp = localList.find((p) => p.bookId === row.id)
      }

      const currentPage = rp?.currentPage !== undefined ? rp.currentPage : rp?.current_page || 1
      const totalPages =
        rp?.totalPages !== undefined ? rp.totalPages : rp?.total_pages || row.pages || 320
      const progressPct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

      const isFav = hasFavsTable ? favBookIds.includes(row.id) : row.is_favorite

      return {
        id: row.id,
        title: row.title,
        author: row.author,
        description: row.description,
        filePath: signedBookUrls[bookPath] || row.file_url,
        coverPath: signedCoverUrls[coverPath] || row.cover_url,
        collectionId: row.category,
        isFavorite: isFav,
        tags: row.tags || [],
        fileSize: row.file_size || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        progress: progressPct,
        currentPage: currentPage,
        totalPages: totalPages,
        lastReadAt: rp?.lastReadAt || rp?.last_read_at,
        startedAt: rp?.startedAt || rp?.started_at,
        readingTime: rp?.readingTime !== undefined ? rp.readingTime : rp?.reading_time,
      }
    })

    const hasLegacy = books.some(
      (b) =>
        b.collectionId &&
        (b.collectionId === 'cat-1' || b.collectionId === 'cat-2' || b.collectionId === 'cat-3')
    )
    if (hasLegacy) {
      await this.migrateLegacyBooks(books)
    }

    return books
  },

  async getBookById(id: string): Promise<Book | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const rpAvailable = await this.isProgressAvailable()

    const { data, error } = rpAvailable
      ? await supabase
          .from('books')
          .select(
            '*, reading_progress(current_page, total_pages, last_read_at, is_completed, started_at, reading_time)'
          )
          .eq('id', id)
          .single()
      : await supabase.from('books').select('*').eq('id', id).single()

    if (error || !data) {
      console.error('Error fetching book by id:', error)
      return null
    }

    let fileUrl = data.file_url
    let coverUrl = data.cover_url

    const bookPath = getPathFromUrl(data.file_url, 'books')
    const coverPath = getPathFromUrl(data.cover_url, 'covers')

    if (bookPath) {
      const { data: signedBook } = await supabase.storage
        .from('books')
        .createSignedUrl(bookPath, 3600)
      if (signedBook?.signedUrl) fileUrl = signedBook.signedUrl
    }

    if (coverPath) {
      const { data: signedCover } = await supabase.storage
        .from('covers')
        .createSignedUrl(coverPath, 3600)
      if (signedCover?.signedUrl) coverUrl = signedCover.signedUrl
    }

    let rp:
      | Partial<
          ReadingProgress & {
            current_page?: number
            total_pages?: number
            started_at?: string
            reading_time?: number
            last_read_at?: string
          }
        >
      | null
      | undefined
    if (rpAvailable) {
      const rpArray = data.reading_progress
      rp = Array.isArray(rpArray) ? rpArray[0] : rpArray
    } else {
      rp = this.getLocalProgressList(user.id).find((p) => p.bookId === id)
    }

    const currentPage = rp?.currentPage !== undefined ? rp.currentPage : rp?.current_page || 1
    const totalPages =
      rp?.totalPages !== undefined ? rp.totalPages : rp?.total_pages || data.pages || 320
    const progressPct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

    let isFav = data.is_favorite
    try {
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('id')
        .eq('book_id', id)
      if (!favError && favData && favData.length > 0) {
        isFav = true
      } else if (!favError && favData && favData.length === 0) {
        isFav = false
      }
    } catch {
      // Ignore
    }

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      description: data.description,
      filePath: fileUrl,
      coverPath: coverUrl,
      collectionId: data.category,
      isFavorite: isFav,
      tags: data.tags || [],
      fileSize: data.file_size || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: progressPct,
      currentPage: currentPage,
      totalPages: totalPages,
      lastReadAt: rp?.lastReadAt || rp?.last_read_at,
      startedAt: rp?.startedAt || rp?.started_at,
      readingTime: rp?.readingTime !== undefined ? rp.readingTime : rp?.reading_time,
    }
  },

  async uploadBook(
    file: File,
    metadata: {
      title: string
      author: string
      description: string
      collectionId?: string
      tags: string[]
      pages?: number
      publisher?: string
      language?: string
      isbn?: string
      edition?: string
    },
    coverFile?: File
  ): Promise<Book> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const bookPath = await storageService.uploadBook(file)

    let coverPath = ''
    if (coverFile) {
      coverPath = await storageService.uploadCover(coverFile)
    }

    const fileUrl = supabase.storage.from('books').getPublicUrl(bookPath).data.publicUrl

    const coverUrl = coverPath
      ? supabase.storage.from('covers').getPublicUrl(coverPath).data.publicUrl
      : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'

    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: metadata.title,
        author: metadata.author,
        publisher: metadata.publisher,
        category: metadata.collectionId,
        language: metadata.language,
        isbn: metadata.isbn,
        pages: metadata.pages || 320,
        edition: metadata.edition,
        description: metadata.description,
        tags: metadata.tags,
        file_url: fileUrl,
        cover_url: coverUrl,
        file_size: file.size,
      })
      .select()
      .single()

    if (error || !data) throw error || new Error('Failed to create book record')

    await auditService.insertLog({
      event: 'Book Upload',
      category: 'Storage & Files',
      severity: 'Info',
      metadata: { bookId: data.id, title: data.title, fileSize: file.size },
    })

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      description: data.description,
      filePath: data.file_url,
      coverPath: data.cover_url,
      collectionId: data.category,
      isFavorite: data.is_favorite,
      tags: data.tags || [],
      fileSize: data.file_size || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: data.progress || 0,
      currentPage: data.current_page || 1,
      totalPages: data.pages || 320,
    }
  },

  async deleteBook(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: book } = await supabase
      .from('books')
      .select('file_url, cover_url, title, user_id')
      .eq('id', id)
      .maybeSingle()

    if (!book) throw new Error('Book not found')

    // Validate ownership / permissions (Must be owner or super admin)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    const isSuperAdmin = roleData?.role === 'super_admin'

    if (book.user_id !== user.id && !isSuperAdmin) {
      throw new Error('Permission denied. You do not own this book.')
    }

    // 1. Delete from database first to avoid orphaned records if delete fails
    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete book record from database:', error)
      throw error
    }

    // 2. Delete Supabase Storage files only after DB record deletion succeeded
    const bookPath = getPathFromUrl(book.file_url, 'books')
    const coverPath = getPathFromUrl(book.cover_url, 'covers')

    if (bookPath) {
      await storageService.deleteBook(bookPath).catch((err) => {
        console.error('Failed to delete book file from storage:', err)
      })
    }

    if (coverPath && !book.cover_url.includes('unsplash.com')) {
      await storageService.deleteCover(coverPath).catch((err) => {
        console.error('Failed to delete cover file from storage:', err)
      })
    }

    await auditService.insertLog({
      event: 'Book Delete',
      category: 'Storage & Files',
      severity: 'Warning',
      metadata: { bookId: id, title: book.title },
    })
  },

  async renameBook(id: string, newTitle: string): Promise<void> {
    const { error } = await supabase.from('books').update({ title: newTitle }).eq('id', id)
    if (error) throw error
  },

  async updateBookCollection(bookId: string, collectionId: string | null): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ category: collectionId })
      .eq('id', bookId)
    if (error) throw error
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    try {
      const { data: currentFavs, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', id)

      if (checkError && checkError.code === 'PGRST205') throw checkError

      const isFav = currentFavs && currentFavs.length > 0
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('favorites').insert({
          user_id: user.id,
          book_id: id,
        })
        if (error) throw error
      }

      const { data: book } = await supabase
        .from('books')
        .select('is_favorite')
        .eq('id', id)
        .single()
      const newFav = !book?.is_favorite
      await supabase.from('books').update({ is_favorite: newFav }).eq('id', id)
      return newFav
    } catch (err) {
      console.error('Favorites database check failed, falling back to books table:', err)
      const { data: book } = await supabase
        .from('books')
        .select('is_favorite')
        .eq('id', id)
        .single()
      const newFavorite = !book?.is_favorite
      const { error } = await supabase
        .from('books')
        .update({ is_favorite: newFavorite })
        .eq('id', id)
      if (error) throw error
      return newFavorite
    }
  },

  async updateReadingProgress(
    bookId: string,
    page: number,
    totalPages: number,
    additionalSeconds?: number
  ): Promise<ReadingProgress> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isCompleted = page === totalPages
    const now = new Date().toISOString()

    const currentProgress = await this.getReadingProgress(bookId)
    const startedAt = currentProgress?.startedAt || now
    const currentReadingTime = currentProgress?.readingTime || 0
    const newReadingTime = currentReadingTime + (additionalSeconds || 0)

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine

    if (isOnline) {
      const rpAvailable = await this.isProgressAvailable()
      if (rpAvailable) {
        try {
          const payload = {
            user_id: user.id,
            book_id: bookId,
            current_page: page,
            total_pages: totalPages,
            is_completed: isCompleted,
            last_read_at: now,
            started_at: startedAt,
            reading_time: newReadingTime,
          }

          const { data, error } = await supabase
            .from('reading_progress')
            .upsert(payload, { onConflict: 'user_id,book_id' })
            .select()
            .single()

          if (error) throw error

          await supabase
            .from('books')
            .update({
              updated_at: now,
            })
            .eq('id', bookId)

          return {
            id: data.id,
            bookId: data.book_id,
            currentPage: data.current_page,
            totalPages: data.total_pages || totalPages,
            lastReadAt: data.last_read_at,
            isCompleted: data.is_completed,
            startedAt: data.started_at,
            readingTime: data.reading_time,
          }
        } catch (err) {
          console.error('Error upserting progress in Supabase, saving locally and queuing:', err)
        }
      }
    }

    // Queue updates when offline
    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('librovia-progress-queue') || '[]') as {
        bookId: string
        page: number
        totalPages: number
        additionalSeconds: number
        timestamp: string
      }[]
      const filtered = queue.filter((q) => q.bookId !== bookId)
      filtered.push({
        bookId,
        page,
        totalPages,
        additionalSeconds: additionalSeconds || 0,
        timestamp: now,
      })
      localStorage.setItem('librovia-progress-queue', JSON.stringify(filtered))
    }

    // Local Storage Fallback
    const localPayload = {
      id: currentProgress?.id || crypto.randomUUID(),
      userId: user.id,
      bookId: bookId,
      currentPage: page,
      totalPages: totalPages,
      lastReadAt: now,
      isCompleted: isCompleted,
      startedAt: startedAt,
      readingTime: newReadingTime,
    }
    this.saveLocalProgress(localPayload)

    return {
      id: localPayload.id,
      bookId: localPayload.bookId,
      currentPage: localPayload.currentPage,
      totalPages: localPayload.totalPages,
      lastReadAt: localPayload.lastReadAt,
      isCompleted: localPayload.isCompleted,
      startedAt: localPayload.startedAt,
      readingTime: localPayload.readingTime,
    }
  },

  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const rpAvailable = await this.isProgressAvailable()
    if (rpAvailable) {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        return {
          id: data.id,
          bookId: data.book_id,
          currentPage: data.current_page || 1,
          totalPages: data.total_pages || 320,
          lastReadAt: data.last_read_at,
          isCompleted: data.is_completed,
          startedAt: data.started_at,
          readingTime: data.reading_time || 0,
        }
      }
    }

    // Fallback to local storage
    const local = this.getLocalProgressList(user.id).find((x) => x.bookId === bookId)
    return local || null
  },

  async migrateLegacyBooks(books: Book[]): Promise<void> {
    const legacyMap: Record<string, string> = {
      'cat-1': 'Classics',
      'cat-2': 'Programming',
      'cat-3': 'Self-Help',
    }

    try {
      const { collectionsService } = await import('./collections')
      const collections = await collectionsService.getCollections()

      for (const book of books) {
        const legacyId = book.collectionId
        if (legacyId && legacyMap[legacyId]) {
          const targetName = legacyMap[legacyId]
          let col = collections.find((c) => c.name.toLowerCase() === targetName.toLowerCase())
          if (!col) {
            try {
              col = await collectionsService.createCollection(targetName)
              collections.push(col)
            } catch (err) {
              console.error('Failed to create collection for migration:', err)
              continue
            }
          }

          try {
            await supabase.from('books').update({ category: col.id }).eq('id', book.id)
            await collectionsService.addBookToCollection(col.id, book.id).catch(() => {})
            book.collectionId = col.id
          } catch (err) {
            console.error('Failed to migrate book category in database:', err)
          }
        }
      }
    } catch (err) {
      console.error('Failed to run migration:', err)
    }
  },

  async syncOfflineProgress(): Promise<void> {
    const queueStr = localStorage.getItem('librovia-progress-queue') || '[]'
    let queue: {
      bookId: string
      page: number
      totalPages: number
      additionalSeconds: number
      timestamp: string
    }[]
    try {
      queue = JSON.parse(queueStr) as {
        bookId: string
        page: number
        totalPages: number
        additionalSeconds: number
        timestamp: string
      }[]
    } catch {
      return
    }

    if (queue.length === 0) return

    for (const item of queue) {
      try {
        await this.updateReadingProgress(
          item.bookId,
          item.page,
          item.totalPages,
          item.additionalSeconds
        )
      } catch (err) {
        console.error('Failed to sync offline progress for book:', item.bookId, err)
      }
    }

    localStorage.removeItem('librovia-progress-queue')
  },

  async getUserStorageUsed(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.from('books').select('file_size').eq('user_id', userId)

      if (error || !data) {
        return 0
      }

      return data.reduce((sum, r) => sum + (r.file_size || 0), 0)
    } catch (err) {
      console.error('Error calculating storage used:', err)
      return 0
    }
  },
}
