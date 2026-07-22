import { supabase } from './supabase'
import { booksService } from './books'
import { auditService } from './audit'

export interface Collection {
  id: string
  name: string
  createdAt: string
  bookCount?: number
}

export interface CollectionBook {
  id: string
  collectionId: string
  bookId: string
}

const LOCAL_COLLECTIONS_KEY = 'librovia-fallback-collections'
const LOCAL_COLLECTION_BOOKS_KEY = 'librovia-fallback-collection-books'

export const favoritesService = {
  async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('favorites').select('id').limit(1)
      if (error && error.code === 'PGRST205') {
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  async getFavoriteBookIds(): Promise<string[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('favorites')
        .select('book_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching favorites:', error)
        return []
      }
      return (data || []).map((row) => row.book_id)
    } else {
      // Use local storage / books table fallback
      return []
    }
  },

  async addFavorite(bookId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase.from('favorites').upsert(
        {
          user_id: user.id,
          book_id: bookId,
        },
        { onConflict: 'user_id,book_id' }
      )

      if (error) throw error
    } else {
      // Fallback
      await booksService.toggleFavorite(bookId)
    }
  },

  async removeFavorite(bookId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)

      if (error) throw error
    } else {
      // Fallback
      await booksService.toggleFavorite(bookId)
    }
  },
}

export const collectionsService = {
  async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('collections').select('id').limit(1)
      if (error && error.code === 'PGRST205') {
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  async getCollections(): Promise<Collection[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('collections')
        .select('*, collection_books(book_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting collections:', error)
        return []
      }

      return (
        (data as {
          id: string
          name: string
          created_at: string
          collection_books?: { book_id: string }[]
        }[]) || []
      ).map((col) => ({
        id: col.id,
        name: col.name,
        createdAt: col.created_at,
        bookCount: col.collection_books?.length || 0,
      }))
    } else {
      const collectionsStr = localStorage.getItem(LOCAL_COLLECTIONS_KEY) || '[]'
      const collections: Collection[] = JSON.parse(collectionsStr)
      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      const collBooks: CollectionBook[] = JSON.parse(collBooksStr)

      return collections.map((col) => ({
        ...col,
        bookCount: collBooks.filter((cb) => cb.collectionId === col.id).length,
      }))
    }
  },

  async createCollection(name: string): Promise<Collection> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('collections')
        .insert({ user_id: user.id, name })
        .select()
        .single()

      if (error) throw error

      await auditService.insertLog({
        event: 'Collection Create',
        category: 'Storage & Files',
        severity: 'Info',
        metadata: { collectionId: data.id, name: data.name },
      })

      return {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
        bookCount: 0,
      }
    } else {
      const collectionsStr = localStorage.getItem(LOCAL_COLLECTIONS_KEY) || '[]'
      const collections: Collection[] = JSON.parse(collectionsStr)
      if (collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Collection name must be unique')
      }
      const newCol: Collection = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        bookCount: 0,
      }
      collections.push(newCol)
      localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(collections))
      return newCol
    }
  },

  async renameCollection(id: string, newName: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase.from('collections').update({ name: newName }).eq('id', id)

      if (error) throw error
    } else {
      const collectionsStr = localStorage.getItem(LOCAL_COLLECTIONS_KEY) || '[]'
      const collections: Collection[] = JSON.parse(collectionsStr)
      const index = collections.findIndex((c) => c.id === id)
      if (index !== -1) {
        collections[index].name = newName
        localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(collections))
      }
    }
  },

  async deleteCollection(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data: col } = await supabase
        .from('collections')
        .select('name, user_id')
        .eq('id', id)
        .maybeSingle()

      if (!col) throw new Error('Collection not found')

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      const isSuperAdmin = roleData?.role === 'super_admin'

      if (col.user_id !== user.id && !isSuperAdmin) {
        throw new Error('Permission denied. You do not own this collection.')
      }

      const { error } = await supabase.from('collections').delete().eq('id', id)
      if (error) throw error

      await auditService.insertLog({
        event: 'Collection Delete',
        category: 'Storage & Files',
        severity: 'Warning',
        metadata: { collectionId: id, name: col.name },
      })
    } else {
      const collectionsStr = localStorage.getItem(LOCAL_COLLECTIONS_KEY) || '[]'
      let collections: Collection[] = JSON.parse(collectionsStr)
      collections = collections.filter((c) => c.id !== id)
      localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(collections))

      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      let collBooks: CollectionBook[] = JSON.parse(collBooksStr)
      collBooks = collBooks.filter((cb) => cb.collectionId !== id)
      localStorage.setItem(LOCAL_COLLECTION_BOOKS_KEY, JSON.stringify(collBooks))
    }
  },

  async addBookToCollection(collectionId: string, bookId: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase
        .from('collection_books')
        .insert({ collection_id: collectionId, book_id: bookId })

      if (error) throw error
    } else {
      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      const collBooks: CollectionBook[] = JSON.parse(collBooksStr)
      if (!collBooks.some((cb) => cb.collectionId === collectionId && cb.bookId === bookId)) {
        collBooks.push({
          id: crypto.randomUUID(),
          collectionId,
          bookId,
        })
        localStorage.setItem(LOCAL_COLLECTION_BOOKS_KEY, JSON.stringify(collBooks))
      }
    }
  },

  async removeBookFromCollection(collectionId: string, bookId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data: col } = await supabase
        .from('collections')
        .select('user_id')
        .eq('id', collectionId)
        .maybeSingle()

      if (!col) throw new Error('Collection not found')

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      const isSuperAdmin = roleData?.role === 'super_admin'

      if (col.user_id !== user.id && !isSuperAdmin) {
        throw new Error('Permission denied. You do not own this collection.')
      }

      const { error } = await supabase
        .from('collection_books')
        .delete()
        .eq('collection_id', collectionId)
        .eq('book_id', bookId)

      if (error) throw error
    } else {
      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      let collBooks: CollectionBook[] = JSON.parse(collBooksStr)
      collBooks = collBooks.filter(
        (cb) => !(cb.collectionId === collectionId && cb.bookId === bookId)
      )
      localStorage.setItem(LOCAL_COLLECTION_BOOKS_KEY, JSON.stringify(collBooks))
    }
  },

  async getCollectionBooks(collectionId: string): Promise<string[]> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('collection_books')
        .select('book_id')
        .eq('collection_id', collectionId)

      if (error) {
        console.error('Error fetching collection books:', error)
        return []
      }
      return (data || []).map((row) => row.book_id)
    } else {
      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      const collBooks: CollectionBook[] = JSON.parse(collBooksStr)
      return collBooks.filter((cb) => cb.collectionId === collectionId).map((cb) => cb.bookId)
    }
  },

  async getBookCollections(bookId: string): Promise<string[]> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('collection_books')
        .select('collection_id')
        .eq('book_id', bookId)

      if (error) {
        console.error('Error fetching book collections:', error)
        return []
      }
      return (data || []).map((row) => row.collection_id)
    } else {
      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      const collBooks: CollectionBook[] = JSON.parse(collBooksStr)
      return collBooks.filter((cb) => cb.bookId === bookId).map((cb) => cb.collectionId)
    }
  },

  async getBookCollectionsMap(): Promise<Record<string, string[]>> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('collection_books')
        .select('collection_id, book_id')

      if (error) {
        console.error('Error fetching collection book associations:', error)
        return {}
      }

      const map: Record<string, string[]> = {}
      ;(data || []).forEach((row) => {
        if (!map[row.book_id]) map[row.book_id] = []
        map[row.book_id].push(row.collection_id)
      })
      return map
    } else {
      const collBooksStr = localStorage.getItem(LOCAL_COLLECTION_BOOKS_KEY) || '[]'
      const collBooks: CollectionBook[] = JSON.parse(collBooksStr)
      const map: Record<string, string[]> = {}
      collBooks.forEach((cb) => {
        if (!map[cb.bookId]) map[cb.bookId] = []
        map[cb.bookId].push(cb.collectionId)
      })
      return map
    }
  },
}
