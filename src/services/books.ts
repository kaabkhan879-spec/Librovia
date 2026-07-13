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
}

export interface ReadingProgress {
  id: string
  bookId: string
  currentPage: number
  totalPages: number
  lastReadAt: string
  isCompleted: boolean
}

// In the future, import supabase client here to make actual database calls.
// import { supabase } from './supabase'

export const booksService = {
  async getBooks(): Promise<Book[]> {
    // Return mock data for UI visual check
    return [
      {
        id: 'book-1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A classic novel set in the Roaring Twenties on Long Island, NY.',
        filePath: 'books/gatsby.pdf',
        coverPath:
          'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
        categoryId: 'cat-1',
        isFavorite: true,
        tags: ['Classic', 'Fiction'],
        fileSize: 1024 * 1024 * 3.5, // 3.5MB
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'book-2',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        description: 'A must-read book for software developers to write better and cleaner code.',
        filePath: 'books/clean-code.pdf',
        coverPath:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80',
        categoryId: 'cat-2',
        isFavorite: false,
        tags: ['Programming', 'Technical'],
        fileSize: 1024 * 1024 * 8.2, // 8.2MB
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'book-3',
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'An easy and proven way to build good habits and break bad ones.',
        filePath: 'books/habits.pdf',
        coverPath:
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
        categoryId: 'cat-3',
        isFavorite: true,
        tags: ['Self-Help', 'Productivity'],
        fileSize: 1024 * 1024 * 4.1, // 4.1MB
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
  },

  async getBookById(id: string): Promise<Book | null> {
    const books = await this.getBooks()
    return books.find((b) => b.id === id) || null
  },

  async uploadBook(
    file: File,
    metadata: {
      title: string
      author: string
      description: string
      categoryId?: string
      tags: string[]
    }
  ): Promise<Book> {
    console.log('Uploading file to Supabase Storage...', file.name)
    console.log('Saving book metadata in database...', metadata)

    return {
      id: `book-${Math.random().toString(36).substr(2, 9)}`,
      title: metadata.title,
      author: metadata.author,
      description: metadata.description,
      filePath: `books/${file.name}`,
      coverPath:
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
      categoryId: metadata.categoryId,
      isFavorite: false,
      tags: metadata.tags,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  async deleteBook(id: string): Promise<void> {
    console.log('Deleting book from database and storage...', id)
  },

  async toggleFavorite(id: string): Promise<boolean> {
    console.log('Toggling favorite status for book...', id)
    return true
  },

  async updateReadingProgress(
    bookId: string,
    page: number,
    totalPages: number
  ): Promise<ReadingProgress> {
    console.log('Updating reading progress in database...', { bookId, page, totalPages })
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
    return {
      id: `progress-${bookId}`,
      bookId,
      currentPage: 15,
      totalPages: 320,
      lastReadAt: new Date().toISOString(),
      isCompleted: false,
    }
  },
}
