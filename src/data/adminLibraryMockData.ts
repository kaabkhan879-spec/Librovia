/**
 * TEMPORARY DEVELOPMENT MOCK DATASET FOR SUPER ADMIN LIBRARY MANAGEMENT
 * 
 * NOTE FOR PRODUCTION INTEGRATION:
 * This file contains temporary, realistic mock data to evaluate and polish the
 * Super Admin Library Management UI/UX. When ready for production, replace
 * the fetch/read functions in this file or swap imports with live Supabase queries
 * (`supabase.from('books').select('*')`) without altering any UI components.
 */

export interface AdminBookRecord {
  id: string
  title: string
  author: string
  category: 'Software Engineering' | 'Self-Improvement' | 'Classic Literature' | 'Sci-Fi' | 'History' | 'Business' | 'Fantasy'
  fileSizeStr: string
  fileSizeBytes: number
  format: 'PDF' | 'EPUB'
  status: 'Published' | 'Featured' | 'Pending Review' | 'Flagged'
  coverUrl: string
  uploaderName: string
  uploaderEmail: string
  downloadsCount: number
  rating: number
  uploadedAt: string
  description: string
}

export const TEMPORARY_DEV_BOOKS: AdminBookRecord[] = [
  {
    id: 'bk-01',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    fileSizeStr: '14.8 MB',
    fileSizeBytes: 14800000,
    format: 'PDF',
    status: 'Published',
    coverUrl: 'https://images.unsplash.com/photo-1532012164546-f43209b19906?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Kaab Khan',
    uploaderEmail: 'kaabkhan879@gmail.com',
    downloadsCount: 1240,
    rating: 4.9,
    uploadedAt: '2026-07-15T10:30:00Z',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
  },
  {
    id: 'bk-02',
    title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
    author: 'James Clear',
    category: 'Self-Improvement',
    fileSizeStr: '4.2 MB',
    fileSizeBytes: 4200000,
    format: 'EPUB',
    status: 'Featured',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Sarah Jenkins',
    uploaderEmail: 'sarah.j@example.com',
    downloadsCount: 3820,
    rating: 4.9,
    uploadedAt: '2026-07-18T14:20:00Z',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day.',
  },
  {
    id: 'bk-03',
    title: '1984 (Nineteen Eighty-Four)',
    author: 'George Orwell',
    category: 'Sci-Fi',
    fileSizeStr: '2.1 MB',
    fileSizeBytes: 2100000,
    format: 'EPUB',
    status: 'Published',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Michael Chen',
    uploaderEmail: 'm.chen@example.com',
    downloadsCount: 940,
    rating: 4.8,
    uploadedAt: '2026-07-10T09:15:00Z',
    description: 'A dystopian social science fiction novel and cautionary tale about totalitarianism.',
  },
  {
    id: 'bk-04',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Classic Literature',
    fileSizeStr: '1.8 MB',
    fileSizeBytes: 1800000,
    format: 'PDF',
    status: 'Published',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Elena Rostova',
    uploaderEmail: 'elena.rostova@example.com',
    downloadsCount: 650,
    rating: 4.6,
    uploadedAt: '2026-07-08T16:45:00Z',
    description: 'A 1925 novel set on Long Island near New York City during the Roaring Twenties.',
  },
  {
    id: 'bk-05',
    title: 'Dune (Dune Chronicles, Book 1)',
    author: 'Frank Herbert',
    category: 'Sci-Fi',
    fileSizeStr: '18.5 MB',
    fileSizeBytes: 18500000,
    format: 'PDF',
    status: 'Featured',
    coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Alex Rivera',
    uploaderEmail: 'alex.rivera@example.com',
    downloadsCount: 2150,
    rating: 5.0,
    uploadedAt: '2026-07-19T11:00:00Z',
    description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.',
  },
  {
    id: 'bk-06',
    title: 'The Pragmatic Programmer: Your Journey to Mastery',
    author: 'Andrew Hunt & David Thomas',
    category: 'Software Engineering',
    fileSizeStr: '12.3 MB',
    fileSizeBytes: 12300000,
    format: 'PDF',
    status: 'Pending Review',
    coverUrl: 'https://images.unsplash.com/photo-1532012164546-f43209b19906?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'David Vance',
    uploaderEmail: 'david.v@example.com',
    downloadsCount: 120,
    rating: 4.7,
    uploadedAt: '2026-07-20T08:00:00Z',
    description: 'Illustrates the best approaches and major pitfalls of many different aspects of software development.',
  },
  {
    id: 'bk-07',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    category: 'History',
    fileSizeStr: '9.6 MB',
    fileSizeBytes: 9600000,
    format: 'EPUB',
    status: 'Published',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Kaab Khan',
    uploaderEmail: 'kaabkhan879@gmail.com',
    downloadsCount: 1890,
    rating: 4.8,
    uploadedAt: '2026-07-12T13:30:00Z',
    description: 'Explores how Homo sapiens conquered the earth through cognitive, agricultural, and scientific revolutions.',
  },
  {
    id: 'bk-08',
    title: 'Zero to One: Notes on Startups, or How to Build the Future',
    author: 'Peter Thiel & Blake Masters',
    category: 'Business',
    fileSizeStr: '3.4 MB',
    fileSizeBytes: 3400000,
    format: 'PDF',
    status: 'Published',
    coverUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Sarah Jenkins',
    uploaderEmail: 'sarah.j@example.com',
    downloadsCount: 1420,
    rating: 4.7,
    uploadedAt: '2026-07-14T15:10:00Z',
    description: 'The great secret of our time is that there are still uncharted frontiers and new inventions to create.',
  },
  {
    id: 'bk-09',
    title: 'The Hobbit, or There and Back Again',
    author: 'J.R.R. Tolkien',
    category: 'Fantasy',
    fileSizeStr: '7.9 MB',
    fileSizeBytes: 7900000,
    format: 'PDF',
    status: 'Flagged',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Unverified Reader',
    uploaderEmail: 'guest.upload@example.com',
    downloadsCount: 45,
    rating: 3.2,
    uploadedAt: '2026-07-20T12:00:00Z',
    description: 'Flagged due to copyright verification request submitted by community moderator.',
  },
  {
    id: 'bk-10',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Classic Literature',
    fileSizeStr: '2.8 MB',
    fileSizeBytes: 2800000,
    format: 'EPUB',
    status: 'Published',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    uploaderName: 'Michael Chen',
    uploaderEmail: 'm.chen@example.com',
    downloadsCount: 880,
    rating: 4.9,
    uploadedAt: '2026-07-05T17:20:00Z',
    description: 'A haunting novel of childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
  },
]
