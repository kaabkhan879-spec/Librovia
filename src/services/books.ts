import { supabase } from './supabase'

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

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      description: row.description,
      filePath: row.file_url,
      coverPath: row.cover_url,
      categoryId: row.category,
      isFavorite: row.is_favorite,
      tags: row.tags || [],
      fileSize: row.file_size || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      progress: row.progress || 0,
      currentPage: row.current_page || 1,
      totalPages: row.pages || 320,
    }))
  },

  async getBookById(id: string): Promise<Book | null> {
    const { data, error } = await supabase.from('books').select('*').eq('id', id).single()

    if (error || !data) {
      console.error('Error fetching book by id:', error)
      return null
    }

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

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    // 1. Upload Book File to Supabase Storage private bucket
    const { error: uploadError } = await supabase.storage.from('books').upload(filePath, file)

    if (uploadError) throw uploadError

    // Retrieve signed link or public url (since books is a private shelf, we will retrieve public link or custom link)
    const { data: fileData } = supabase.storage.from('books').getPublicUrl(filePath)
    const fileUrl = fileData.publicUrl

    // 2. Upload Cover file to covers public bucket
    let coverUrl = ''
    if (coverFile) {
      const coverExt = coverFile.name.split('.').pop()
      const coverPath = `${user.id}/${Date.now()}.${coverExt}`
      const { error: coverUploadError } = await supabase.storage
        .from('covers')
        .upload(coverPath, coverFile)
      if (!coverUploadError) {
        const { data: coverData } = supabase.storage.from('covers').getPublicUrl(coverPath)
        coverUrl = coverData.publicUrl
      }
    } else {
      // Fallback default cover placeholder
      coverUrl =
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
    }

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
