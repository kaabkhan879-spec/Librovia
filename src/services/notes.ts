import { supabase } from './supabase'
import { booksService } from './books'
import { auditService } from './audit'

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
  bookTitle?: string
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

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    if (!isOnline) {
      return this.getLocalNotes(bookId, user.id)
    }

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
    note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
      id?: string
      bookTitle?: string
    }
  ): Promise<Note> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let resolvedBookTitle = note.bookTitle || ''
    if (!resolvedBookTitle) {
      try {
        const book = await booksService.getBookById(note.bookId)
        if (book) {
          resolvedBookTitle = book.title
        }
      } catch (err) {
        console.error('Failed to resolve book title during note save:', err)
      }
    }

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    const now = new Date().toISOString()

    // If offline, save locally and push to offline queue
    if (!isOnline) {
      const saved = this.saveLocalNote({ ...note, bookTitle: resolvedBookTitle }, user.id)
      const queue = JSON.parse(localStorage.getItem('librovia-notes-queue') || '[]') as {
        type: 'save' | 'delete'
        noteId: string
        payload?: Note
        timestamp?: string
      }[]
      const filtered = queue.filter((q) => q.noteId !== saved.id)
      filtered.push({
        type: 'save',
        noteId: saved.id,
        payload: saved,
        timestamp: now,
      })
      localStorage.setItem('librovia-notes-queue', JSON.stringify(filtered))
      return saved
    }

    const isLive = await this.isSupabaseAvailable()
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
        let prevBookmarked = false
        if (note.id) {
          const { data: oldNote } = await supabase
            .from('notes')
            .select('is_bookmarked')
            .eq('id', note.id)
            .maybeSingle()
          prevBookmarked = oldNote?.is_bookmarked || false

          // Update
          const { data, error } = await supabase
            .from('notes')
            .update(payload)
            .eq('id', note.id)
            .select()
            .single()
          if (error) throw error
          result = data

          if (result.is_bookmarked !== prevBookmarked) {
            await auditService.insertLog({
              event: result.is_bookmarked ? 'Bookmark Create' : 'Bookmark Delete',
              category: 'Storage & Files',
              severity: 'Info',
              metadata: {
                noteId: result.id,
                bookId: result.book_id,
                pageNumber: result.page_number,
              },
            })
          }
        } else {
          // Insert
          const { data, error } = await supabase
            .from('notes')
            .insert({ ...payload, created_at: now })
            .select()
            .single()
          if (error) throw error
          result = data

          if (result.is_bookmarked) {
            await auditService.insertLog({
              event: 'Bookmark Create',
              category: 'Storage & Files',
              severity: 'Info',
              metadata: {
                noteId: result.id,
                bookId: result.book_id,
                pageNumber: result.page_number,
              },
            })
          }
          if (result.note_text) {
            await auditService.insertLog({
              event: 'Note Create',
              category: 'Storage & Files',
              severity: 'Info',
              metadata: {
                noteId: result.id,
                bookId: result.book_id,
                pageNumber: result.page_number,
              },
            })
          }
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
          bookTitle: resolvedBookTitle,
        }
      } catch (err) {
        console.error('Failed to save to Supabase, falling back to local and queuing:', err)
        const saved = this.saveLocalNote({ ...note, bookTitle: resolvedBookTitle }, user.id)
        const queue = JSON.parse(localStorage.getItem('librovia-notes-queue') || '[]') as {
          type: 'save' | 'delete'
          noteId: string
          payload?: Note
          timestamp?: string
        }[]
        const filtered = queue.filter((q) => q.noteId !== saved.id)
        filtered.push({
          type: 'save',
          noteId: saved.id,
          payload: saved,
          timestamp: now,
        })
        localStorage.setItem('librovia-notes-queue', JSON.stringify(filtered))
        return saved
      }
    } else {
      const saved = this.saveLocalNote({ ...note, bookTitle: resolvedBookTitle }, user.id)
      return saved
    }
  },

  async deleteNote(id: string): Promise<void> {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    const now = new Date().toISOString()

    // If offline, delete locally and push delete to offline queue
    if (!isOnline) {
      this.deleteLocalNote(id)
      const queue = JSON.parse(localStorage.getItem('librovia-notes-queue') || '[]') as {
        type: 'save' | 'delete'
        noteId: string
        payload?: Note
        timestamp?: string
      }[]
      const filtered = queue.filter((q) => q.noteId !== id)
      filtered.push({
        type: 'delete',
        noteId: id,
        timestamp: now,
      })
      localStorage.setItem('librovia-notes-queue', JSON.stringify(filtered))
      return
    }

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      try {
        const { data: existing } = await supabase
          .from('notes')
          .select('is_bookmarked, note_text, book_id, page_number, user_id')
          .eq('id', id)
          .maybeSingle()

        if (!existing) throw new Error('Note not found')

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        const isSuperAdmin = roleData?.role === 'super_admin'

        if (existing.user_id !== user.id && !isSuperAdmin) {
          throw new Error('Permission denied. You do not own this note.')
        }

        const { error } = await supabase.from('notes').delete().eq('id', id)
        if (error) throw error

        if (existing) {
          if (existing.is_bookmarked) {
            await auditService.insertLog({
              event: 'Bookmark Delete',
              category: 'Storage & Files',
              severity: 'Warning',
              metadata: { noteId: id, bookId: existing.book_id, pageNumber: existing.page_number },
            })
          }
          if (existing.note_text) {
            await auditService.insertLog({
              event: 'Note Delete',
              category: 'Storage & Files',
              severity: 'Warning',
              metadata: { noteId: id, bookId: existing.book_id, pageNumber: existing.page_number },
            })
          }
        }
      } catch (err) {
        console.error('Failed to delete from Supabase, falling back to local and queuing:', err)
        this.deleteLocalNote(id)
        const queue = JSON.parse(localStorage.getItem('librovia-notes-queue') || '[]') as {
          type: 'save' | 'delete'
          noteId: string
          payload?: Note
          timestamp?: string
        }[]
        const filtered = queue.filter((q) => q.noteId !== id)
        filtered.push({
          type: 'delete',
          noteId: id,
          timestamp: now,
        })
        localStorage.setItem('librovia-notes-queue', JSON.stringify(filtered))
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
    note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
      id?: string
      bookTitle?: string
    },
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
          bookTitle: note.bookTitle || allNotes[idx].bookTitle,
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
          bookTitle: note.bookTitle,
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
        bookTitle: note.bookTitle,
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

  async syncOfflineNotes(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const queueStr = localStorage.getItem('librovia-notes-queue') || '[]'
    let queue: {
      type: 'save' | 'delete'
      noteId: string
      payload?: Note
      timestamp?: string
    }[]
    try {
      queue = JSON.parse(queueStr)
    } catch {
      return
    }

    if (queue.length === 0) return

    for (const item of queue) {
      try {
        if (item.type === 'save') {
          const noteData = item.payload
          if (!noteData) continue
          // Check if it already exists in Supabase
          const { data: existing } = await supabase
            .from('notes')
            .select('id, updated_at')
            .eq('id', item.noteId)
            .maybeSingle()

          const payload = {
            user_id: user.id,
            book_id: noteData.bookId,
            page_number: noteData.pageNumber,
            note_text: noteData.noteText,
            rating: noteData.rating || null,
            highlighted_text: noteData.highlightedText || null,
            is_bookmarked: noteData.isBookmarked,
            tags: noteData.tags,
            updated_at: noteData.updatedAt || new Date().toISOString(),
            x_position: noteData.xPosition !== undefined ? noteData.xPosition : null,
            y_position: noteData.yPosition !== undefined ? noteData.yPosition : null,
            note_title: noteData.noteTitle || null,
          }

          if (existing) {
            // Compare timestamps: only overwrite if local version is newer
            const existingTime = new Date(existing.updated_at).getTime()
            const localTime = new Date(noteData.updatedAt || 0).getTime()
            if (localTime > existingTime) {
              await supabase.from('notes').update(payload).eq('id', item.noteId)
            }
          } else {
            // Insert
            await supabase.from('notes').insert({
              ...payload,
              id: item.noteId,
              created_at: noteData.createdAt || new Date().toISOString(),
            })
          }
        } else if (item.type === 'delete') {
          await supabase.from('notes').delete().eq('id', item.noteId)
        }
      } catch (err) {
        console.error('Failed to sync offline note item:', item, err)
      }
    }

    // Clear queue after sync
    localStorage.removeItem('librovia-notes-queue')
  },
}
