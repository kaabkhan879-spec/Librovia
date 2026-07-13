import { supabase } from './supabase'
import { storageService } from './storage'

export interface Book {
  id: string
  title: string
  author: string
  description?: string
  filePath: string
  coverPath?: string
  categoryId?: string
  isFavorite: boolean
  tags: string[]
  fileSize: number
  createdAt: string
  updatedAt: string
  progress: number
  currentPage: number
  totalPages: number
}

export interface ReadingProgress {
  id: string
  bookId: string
  currentPage: number
  totalPages: number
  lastReadAt: string
  isCompleted: boolean
}

// Local helper to extract relative storage paths from public or authenticated URLs
function getPathFromUrl(url: string | undefined | null, bucket: string): string {
  if (!url) return ''
  if (!url.startsWith('http')) return url
  const parts = url.split(`/${bucket}/`)
  return parts.length > 1 ? parts[1] : ''
}

export const booksService = {
  async getBooks(): Promise<Book[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching books:', error)
      return []
    }

    const rows = data || []
    if (rows.length === 0) return []

    // Extract paths for bulk signed URL generation
    const bookPaths = rows.map((r) => getPathFromUrl(r.file_url, 'books')).filter(Boolean)
    const coverPaths = rows.map((r) => getPathFromUrl(r.cover_url, 'covers')).filter(Boolean)

    const signedBookUrls: Record<string, string> = {}
    const signedCoverUrls: Record<string, string> = {}

    // Bulk sign book URLs (1 hour expiration)
    if (bookPaths.length > 0) {
      const { data: signedBooks, error: err1 } = await supabase.storage
        .from('books')
        .createSignedUrls(bookPaths, 3600)
      if (!err1 && signedBooks) {
        signedBooks.forEach((s) => {
          if (s.signedUrl && s.path) signedBookUrls[s.path] = s.signedUrl
        })
      }
    }

    // Bulk sign cover URLs (1 hour expiration)
    if (coverPaths.length > 0) {
      const { data: signedCovers, error: err2 } = await supabase.storage
        .from('covers')
        .createSignedUrls(coverPaths, 3600)
      if (!err2 && signedCovers) {
        signedCovers.forEach((s) => {
          if (s.signedUrl && s.path) signedCoverUrls[s.path] = s.signedUrl
        })
      }
    }

    return rows.map((row) => {
      const bookPath = getPathFromUrl(row.file_url, 'books')
      const coverPath = getPathFromUrl(row.cover_url, 'covers')
      return {
        id: row.id,
        title: row.title,
        author: row.author,
        description: row.description,
        filePath: signedBookUrls[bookPath] || row.file_url,
        coverPath: signedCoverUrls[coverPath] || row.cover_url,
        categoryId: row.category,
        isFavorite: row.is_favorite,
        tags: row.tags || [],
        fileSize: row.file_size || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        progress: row.progress || 0,
        currentPage: row.current_page || 1,
        totalPages: row.pages || 320,
      }
    })
  },

  async getBookById(id: string): Promise<Book | null> {
    const { data, error } = await supabase.from('books').select('*').eq('id', id).single()

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

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      description: data.description,
      filePath: fileUrl,
      coverPath: coverUrl,
      categoryId: data.category,
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

  async uploadBook(
    file: File,
    metadata: {
      title: string
      author: string
      description: string
      categoryId?: string
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

    // 1. Upload Book file to storage using storageService helper
    const bookPath = await storageService.uploadBook(file)

    // 2. Upload Cover file to storage using storageService helper
    let coverPath = ''
    if (coverFile) {
      coverPath = await storageService.uploadCover(coverFile)
    }

    // Resolve storage public/authenticated URLs for insert reference
    const fileUrl = supabase.storage.from('books').getPublicUrl(bookPath).data.publicUrl

    const coverUrl = coverPath
      ? supabase.storage.from('covers').getPublicUrl(coverPath).data.publicUrl
      : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'

    // 3. Save Book record in database table
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: metadata.title,
        author: metadata.author,
        publisher: metadata.publisher,
        category: metadata.categoryId,
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

    return {
      id: data.id,
      title: data.title,
      author: data.author,
      description: data.description,
      filePath: data.file_url,
      coverPath: data.cover_url,
      categoryId: data.category,
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
    // 1. Fetch book first to extract exact bucket file paths
    const { data: book } = await supabase
      .from('books')
      .select('file_url, cover_url')
      .eq('id', id)
      .single()

    if (book) {
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
    }

    // 2. Delete database record
    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) throw error
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const { data: book } = await supabase.from('books').select('is_favorite').eq('id', id).single()

    const newFavorite = !book?.is_favorite

    const { error } = await supabase.from('books').update({ is_favorite: newFavorite }).eq('id', id)

    if (error) throw error
    return newFavorite
  },

  async updateReadingProgress(
    bookId: string,
    page: number,
    totalPages: number
  ): Promise<ReadingProgress> {
    const progressPct = Math.round((page / totalPages) * 100)

    const { error } = await supabase
      .from('books')
      .update({
        current_page: page,
        pages: totalPages,
        progress: progressPct,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)

    if (error) throw error

    return {
      id: `progress-${bookId}`,
      bookId,
      currentPage: page,
      totalPages,
      lastReadAt: new Date().toISOString(),
      isCompleted: page === totalPages,
    }
  },

  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    const { data, error } = await supabase
      .from('books')
      .select('current_page, pages')
      .eq('id', bookId)
      .single()

    if (error || !data) return null

    return {
      id: `progress-${bookId}`,
      bookId,
      currentPage: data.current_page || 1,
      totalPages: data.pages || 320,
      lastReadAt: new Date().toISOString(),
      isCompleted: data.current_page === data.pages,
    }
  },
}
