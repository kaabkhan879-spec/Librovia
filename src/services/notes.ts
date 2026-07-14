import { supabase } from './supabase'

export interface Note {
  id: string
  userId: string
  bookId: string
  pageNumber: number
  noteText: string
  rating?: number
  highlightedText?: string
  isBookmarked: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  xPosition?: number
  yPosition?: number
  noteTitle?: string
}

const LOCAL_NOTES_KEY = 'librovia-fallback-notes'

export const notesService = {
  // Test if Supabase notes table is available
  async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('notes').select('id').limit(1)
      if (error && error.code === 'PGRST205') {
        return false
      }
      if (error && error.code === '42P01') {
        // Table doesn't exist yet
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  async getNotesForBook(bookId: string): Promise<Note[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .order('page_number', { ascending: true })

      if (error) {
        console.error('Error fetching notes from Supabase:', error)
        return this.getLocalNotes(bookId, user.id)
      }

      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        bookId: row.book_id,
        pageNumber: row.page_number,
        noteText: row.note_text,
        rating: row.rating,
        highlightedText: row.highlighted_text,
        isBookmarked: row.is_bookmarked,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        xPosition: row.x_position !== null ? Number(row.x_position) : undefined,
        yPosition: row.y_position !== null ? Number(row.y_position) : undefined,
        noteTitle: row.note_title || undefined,
      }))
    } else {
      return this.getLocalNotes(bookId, user.id)
    }
  },

  async saveNote(
    note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<Note> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    const now = new Date().toISOString()

    if (isLive) {
      try {
        const payload = {
          user_id: user.id,
          book_id: note.bookId,
          page_number: note.pageNumber,
          note_text: note.noteText,
          rating: note.rating || null,
          highlighted_text: note.highlightedText || null,
          is_bookmarked: note.isBookmarked,
          tags: note.tags,
          updated_at: now,
          x_position: note.xPosition !== undefined ? note.xPosition : null,
          y_position: note.yPosition !== undefined ? note.yPosition : null,
          note_title: note.noteTitle || null,
        }

        let result
        if (note.id) {
          // Update
          const { data, error } = await supabase
            .from('notes')
            .update(payload)
            .eq('id', note.id)
            .select()
            .single()
          if (error) throw error
          result = data
        } else {
          // Insert
          const { data, error } = await supabase
            .from('notes')
            .insert({ ...payload, created_at: now })
            .select()
            .single()
          if (error) throw error
          result = data
        }

        return {
          id: result.id,
          userId: result.user_id,
          bookId: result.book_id,
          pageNumber: result.page_number,
          noteText: result.note_text,
          rating: result.rating,
          highlightedText: result.highlighted_text,
          isBookmarked: result.is_bookmarked,
          tags: result.tags || [],
          createdAt: result.created_at,
          updatedAt: result.updated_at,
          xPosition: result.x_position !== null ? Number(result.x_position) : undefined,
          yPosition: result.y_position !== null ? Number(result.y_position) : undefined,
          noteTitle: result.note_title || undefined,
        }
      } catch (err) {
        console.error('Failed to save to Supabase, falling back to local:', err)
        return this.saveLocalNote(note, user.id)
      }
    } else {
      return this.saveLocalNote(note, user.id)
    }
  },

  async deleteNote(id: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id)
        if (error) throw error
      } catch (err) {
        console.error('Failed to delete from Supabase, falling back to local:', err)
        this.deleteLocalNote(id)
      }
    } else {
      this.deleteLocalNote(id)
    }
  },

  async getAllNotes(): Promise<Note[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all notes:', error)
        return this.getAllLocalNotes(user.id)
      }

      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        bookId: row.book_id,
        pageNumber: row.page_number,
        noteText: row.note_text,
        rating: row.rating,
        highlightedText: row.highlighted_text,
        isBookmarked: row.is_bookmarked,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        xPosition: row.x_position !== null ? Number(row.x_position) : undefined,
        yPosition: row.y_position !== null ? Number(row.y_position) : undefined,
        noteTitle: row.note_title || undefined,
      }))
    } else {
      return this.getAllLocalNotes(user.id)
    }
  },

  // --- Local Fallback Implementation ---

  getLocalNotes(bookId: string, userId: string): Note[] {
    const allNotes = this.getAllLocalNotes(userId)
    return allNotes.filter((n) => n.bookId === bookId).sort((a, b) => a.pageNumber - b.pageNumber)
  },

  getAllLocalNotes(userId: string): Note[] {
    const notesStr = localStorage.getItem(LOCAL_NOTES_KEY) || '[]'
    try {
      const parsed: Note[] = JSON.parse(notesStr)
      return parsed.filter((n) => n.userId === userId)
    } catch {
      return []
    }
  },

  saveLocalNote(
    note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
    userId: string
  ): Note {
    const allNotesStr = localStorage.getItem(LOCAL_NOTES_KEY) || '[]'
    let allNotes: Note[]
    try {
      allNotes = JSON.parse(allNotesStr)
    } catch {
      allNotes = []
    }

    const now = new Date().toISOString()
    let saved: Note

    if (note.id) {
      // Update
      const idx = allNotes.findIndex((n) => n.id === note.id)
      if (idx !== -1) {
        saved = {
          ...allNotes[idx],
          pageNumber: note.pageNumber,
          noteText: note.noteText,
          rating: note.rating,
          highlightedText: note.highlightedText,
          isBookmarked: note.isBookmarked,
          tags: note.tags,
          updatedAt: now,
          xPosition: note.xPosition,
          yPosition: note.yPosition,
          noteTitle: note.noteTitle,
        }
        allNotes[idx] = saved
      } else {
        // Fallback to create if not found
        saved = {
          id: note.id,
          userId,
          bookId: note.bookId,
          pageNumber: note.pageNumber,
          noteText: note.noteText,
          rating: note.rating,
          highlightedText: note.highlightedText,
          isBookmarked: note.isBookmarked,
          tags: note.tags,
          createdAt: now,
          updatedAt: now,
          xPosition: note.xPosition,
          yPosition: note.yPosition,
          noteTitle: note.noteTitle,
        }
        allNotes.push(saved)
      }
    } else {
      // Insert new
      saved = {
        id: crypto.randomUUID(),
        userId,
        bookId: note.bookId,
        pageNumber: note.pageNumber,
        noteText: note.noteText,
        rating: note.rating,
        highlightedText: note.highlightedText,
        isBookmarked: note.isBookmarked,
        tags: note.tags,
        createdAt: now,
        updatedAt: now,
        xPosition: note.xPosition,
        yPosition: note.yPosition,
        noteTitle: note.noteTitle,
      }
      allNotes.push(saved)
    }

    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(allNotes))
    return saved
  },

  deleteLocalNote(id: string): void {
    const allNotesStr = localStorage.getItem(LOCAL_NOTES_KEY) || '[]'
    try {
      const allNotes: Note[] = JSON.parse(allNotesStr)
      const filtered = allNotes.filter((n) => n.id !== id)
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(filtered))
    } catch {
      // Do nothing
    }
  },
}
