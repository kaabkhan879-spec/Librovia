import { supabase } from './supabase'

// Storage limits & types validation constants
export const STORAGE_LIMITS = {
  BOOK: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    allowedTypes: ['application/pdf', 'application/epub+zip'],
    allowedExtensions: ['pdf', 'epub'],
  },
  COVER: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  AVATAR: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  SCREENSHOT: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
} as const

export class StorageError extends Error {
  public code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'StorageError'
    this.code = code
  }
}

// Helper to validate files before sending to network
function validateFile(
  file: File,
  config: {
    maxSize: number
    allowedTypes: readonly string[]
    allowedExtensions: readonly string[]
  },
  label: string
) {
  if (file.size > config.maxSize) {
    throw new StorageError(
      `File size exceeds limit. Max size allowed for ${label} is ${config.maxSize / (1024 * 1024)}MB.`,
      'FILE_TOO_LARGE'
    )
  }
  const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
  const allowedTypes = config.allowedTypes as readonly string[]
  const allowedExtensions = config.allowedExtensions as readonly string[]

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
    throw new StorageError(
      `Invalid file type. Allowed formats for ${label} are: ${allowedExtensions.join(', ').toUpperCase()}.`,
      'INVALID_FILE_TYPE'
    )
  }
}

export const storageService = {
  // Books uploads (PDF/EPUB)
  async uploadBook(file: File): Promise<string> {
    validateFile(file, STORAGE_LIMITS.BOOK, 'books')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new StorageError('User not authenticated', 'UNAUTHENTICATED')

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('books')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (error) throw new StorageError(error.message, error.name)
    return data.path
  },

  // Covers uploads (Images)
  async uploadCover(file: File): Promise<string> {
    validateFile(file, STORAGE_LIMITS.COVER, 'covers')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new StorageError('User not authenticated', 'UNAUTHENTICATED')

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('covers')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (error) throw new StorageError(error.message, error.name)
    return data.path
  },

  // Avatars uploads (Images)
  async uploadAvatar(file: File): Promise<string> {
    validateFile(file, STORAGE_LIMITS.AVATAR, 'avatars')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new StorageError('User not authenticated', 'UNAUTHENTICATED')

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (error) throw new StorageError(error.message, error.name)
    return data.path
  },

  // Deletions
  async deleteBook(path: string): Promise<void> {
    const { error } = await supabase.storage.from('books').remove([path])
    if (error) throw new StorageError(error.message, error.name)
  },

  async deleteCover(path: string): Promise<void> {
    const { error } = await supabase.storage.from('covers').remove([path])
    if (error) throw new StorageError(error.message, error.name)
  },

  async deleteAvatar(path: string): Promise<void> {
    const { error } = await supabase.storage.from('avatars').remove([path])
    if (error) throw new StorageError(error.message, error.name)
  },

  // Signed URLs Generation (since buckets are private, we need signed links or read permission via client)
  async getBookURL(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from('books').createSignedUrl(path, expiresIn)
    if (error) throw new StorageError(error.message, error.name)
    return data.signedUrl
  },

  async getCoverURL(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from('covers').createSignedUrl(path, expiresIn)
    if (error) throw new StorageError(error.message, error.name)
    return data.signedUrl
  },

  async getAvatarURL(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, expiresIn)
    if (error) throw new StorageError(error.message, error.name)
    return data.signedUrl
  },

  // Screenshots uploads for payment verification
  async uploadScreenshot(file: File): Promise<string> {
    validateFile(file, STORAGE_LIMITS.SCREENSHOT, 'screenshots')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new StorageError('User not authenticated', 'UNAUTHENTICATED')

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('payments')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (error) throw new StorageError(error.message, error.name)
    return data.path
  },

  async getScreenshotURL(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from('payments').createSignedUrl(path, expiresIn)
    if (error) throw new StorageError(error.message, error.name)
    return data.signedUrl
  },
}
