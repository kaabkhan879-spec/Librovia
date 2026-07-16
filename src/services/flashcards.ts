import { supabase } from './supabase'

export interface Flashcard {
  id: string
  userId: string
  bookId: string
  pageNumber: number
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  isLearned: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

const LOCAL_FLASHCARDS_KEY = 'librovia-fallback-flashcards'
const FLASHCARDS_QUEUE_KEY = 'librovia-flashcards-queue'

export const flashcardsService = {
  // Test if Supabase flashcards table is available
  async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('flashcards').select('id').limit(1)
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  async getFlashcards(): Promise<Flashcard[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    if (!isOnline) {
      return this.getLocalFlashcards(user.id)
    }

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching flashcards from Supabase:', error)
        return this.getLocalFlashcards(user.id)
      }

      const cards: Flashcard[] = (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        bookId: row.book_id,
        pageNumber: row.page_number,
        question: row.question,
        answer: row.answer,
        difficulty: row.difficulty,
        topic: row.topic,
        isLearned: row.is_learned,
        isFavorite: row.is_favorite,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      // Overwrite local storage cache with latest from server
      localStorage.setItem(LOCAL_FLASHCARDS_KEY, JSON.stringify(cards))
      return cards
    } else {
      return this.getLocalFlashcards(user.id)
    }
  },

  async generateFlashcards(
    bookId: string,
    pageNumber: number,
    text: string
  ): Promise<Flashcard[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to generate flashcards via AI')
    }

    const data = await response.json()
    const rawCards = data.flashcards || []

    const now = new Date().toISOString()
    const newCards: Flashcard[] = rawCards.map((rc: any) => ({
      id: crypto.randomUUID(),
      userId: user.id,
      bookId,
      pageNumber,
      question: rc.question || 'Review Question',
      answer: rc.answer || 'Review Answer',
      difficulty: rc.difficulty || 'medium',
      topic: rc.topic || 'General',
      isLearned: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    }))

    // Save newly generated cards
    for (const card of newCards) {
      await this.saveFlashcard(card)
    }

    return newCards
  },

  async saveFlashcard(card: Flashcard): Promise<Flashcard> {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine

    if (isOnline) {
      const isLive = await this.isSupabaseAvailable()
      if (isLive) {
        try {
          const payload = {
            id: card.id,
            user_id: card.userId,
            book_id: card.bookId,
            page_number: card.pageNumber,
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty,
            topic: card.topic,
            is_learned: card.isLearned,
            is_favorite: card.isFavorite,
            updated_at: card.updatedAt || new Date().toISOString(),
          }

          const { error } = await supabase
            .from('flashcards')
            .upsert(payload, { onConflict: 'id' })

          if (error) throw error

          this.saveLocalFlashcard(card)
          return card
        } catch (err) {
          console.error('Failed to save flashcard to Supabase, queueing:', err)
        }
      }
    }

    // Save locally & queue offline
    this.saveLocalFlashcard(card)
    this.queueOfflineAction({
      type: 'save',
      cardId: card.id,
      payload: card,
      timestamp: new Date().toISOString(),
    })

    return card
  },

  async deleteFlashcard(id: string): Promise<void> {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine

    if (isOnline) {
      const isLive = await this.isSupabaseAvailable()
      if (isLive) {
        try {
          const { error } = await supabase.from('flashcards').delete().eq('id', id)
          if (error) throw error

          this.deleteLocalFlashcard(id)
          return
        } catch (err) {
          console.error('Failed to delete flashcard from Supabase, queueing:', err)
        }
      }
    }

    // Delete locally & queue offline
    this.deleteLocalFlashcard(id)
    this.queueOfflineAction({
      type: 'delete',
      cardId: id,
      timestamp: new Date().toISOString(),
    })
  },

  // --- Local Fallback Implementations ---

  getLocalFlashcards(userId: string): Flashcard[] {
    const cardsStr = localStorage.getItem(LOCAL_FLASHCARDS_KEY) || '[]'
    try {
      const cards: Flashcard[] = JSON.parse(cardsStr)
      return cards.filter((c) => c.userId === userId)
    } catch {
      return []
    }
  },

  saveLocalFlashcard(card: Flashcard): void {
    const cardsStr = localStorage.getItem(LOCAL_FLASHCARDS_KEY) || '[]'
    let cards: Flashcard[] = []
    try {
      cards = JSON.parse(cardsStr)
    } catch {
      cards = []
    }

    const idx = cards.findIndex((c) => c.id === card.id)
    if (idx !== -1) {
      cards[idx] = card
    } else {
      cards.push(card)
    }

    localStorage.setItem(LOCAL_FLASHCARDS_KEY, JSON.stringify(cards))
  },

  deleteLocalFlashcard(id: string): void {
    const cardsStr = localStorage.getItem(LOCAL_FLASHCARDS_KEY) || '[]'
    try {
      const cards: Flashcard[] = JSON.parse(cardsStr)
      const filtered = cards.filter((c) => c.id !== id)
      localStorage.setItem(LOCAL_FLASHCARDS_KEY, JSON.stringify(filtered))
    } catch {
      // Do nothing
    }
  },

  // --- Offline Synchronization Queue ---

  queueOfflineAction(action: {
    type: 'save' | 'delete'
    cardId: string
    payload?: Flashcard
    timestamp: string
  }): void {
    const queueStr = localStorage.getItem(FLASHCARDS_QUEUE_KEY) || '[]'
    let queue: any[] = []
    try {
      queue = JSON.parse(queueStr)
    } catch {
      queue = []
    }

    // Deduplicate queue
    const filtered = queue.filter((q) => q.cardId !== action.cardId)
    filtered.push(action)
    localStorage.setItem(FLASHCARDS_QUEUE_KEY, JSON.stringify(filtered))
  },

  async syncOfflineFlashcards(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const queueStr = localStorage.getItem(FLASHCARDS_QUEUE_KEY) || '[]'
    let queue: any[] = []
    try {
      queue = JSON.parse(queueStr)
    } catch {
      return
    }

    if (queue.length === 0) return

    const isLive = await this.isSupabaseAvailable()
    if (!isLive) return

    for (const item of queue) {
      try {
        if (item.type === 'save') {
          const card = item.payload as Flashcard
          const payload = {
            id: card.id,
            user_id: card.userId,
            book_id: card.bookId,
            page_number: card.pageNumber,
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty,
            topic: card.topic,
            is_learned: card.isLearned,
            is_favorite: card.isFavorite,
            updated_at: card.updatedAt || new Date().toISOString(),
          }

          await supabase.from('flashcards').upsert(payload, { onConflict: 'id' })
        } else if (item.type === 'delete') {
          await supabase.from('flashcards').delete().eq('id', item.cardId)
        }
      } catch (err) {
        console.error('Failed to sync offline flashcard item:', item, err)
      }
    }

    localStorage.removeItem(FLASHCARDS_QUEUE_KEY)
  },
}
