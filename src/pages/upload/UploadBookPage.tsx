import React, { useState, useRef, useEffect } from 'react'
import { collectionsService, type Collection } from '../../services/collections'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService } from '../../services/books'
import { notificationsService } from '../../services/notifications'
import { UploadCloud, FileText, X, Plus, Star, CheckCircle, Lock, Tag } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { formatBytes } from '../../utils/helpers'

interface TagItem {
  id: string
  label: string
}

export const UploadBookPage: React.FC = () => {
  const navigate = useNavigate()
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [file, setFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newColName, setNewColName] = useState('')

  const [language, setLanguage] = useState('English')
  const [isbn, setIsbn] = useState('')
  const [pubYear, setPubYear] = useState('')
  const [pages, setPages] = useState('')
  const [edition, setEdition] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const cols = await collectionsService.getCollections()
        setCollections(cols)
        if (cols.length > 0) {
          setSelectedCollectionId(cols[0].id)
        }
      } catch (err) {
        console.error('Failed to load collections:', err)
      }
    }
    loadCollections()
  }, [])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    try {
      const newCol = await collectionsService.createCollection(newColName.trim())
      setCollections((prev) => [newCol, ...prev])
      setSelectedCollectionId(newCol.id)
      setNewColName('')
      setShowCreateModal(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection'
      alert(msg)
    }
  }

  // Tag input states
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<TagItem[]>([
    { id: '1', label: 'Programming' },
    { id: '2', label: 'Self-Help' },
  ])

  // Toggle options
  const [options, setOptions] = useState({
    isFavorite: false,
    currentlyReading: false,
    completed: false,
    wishlist: false,
  })

  const [visibility, setVisibility] = useState<'private' | 'public'>('private')

  // Upload Simulation/Real states
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('Uploading Cover...')
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleBrowseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleCoverSelectTrigger = () => {
    coverInputRef.current?.click()
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setCoverFile(selectedFile)
      setCoverUrl(URL.createObjectURL(selectedFile))
    }
  }

  const addTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagInput.trim()) return
    setTags((prev) => [...prev, { id: Date.now().toString(), label: tagInput.trim() }])
    setTagInput('')
  }

  const removeTag = (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id))
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Explicit field validations
    if (!file) {
      setGeneralError('Book file is required.')
      return
    }
    if (!title.trim()) {
      setGeneralError('Book title is required.')
      return
    }
    if (!author.trim()) {
      setGeneralError('Author name is required.')
      return
    }

    // Format validation
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    if (fileExt !== 'pdf' && fileExt !== 'epub') {
      setGeneralError('Only PDF and EPUB formats are supported.')
      return
    }

    if (coverFile) {
      const coverExt = coverFile.name.split('.').pop()?.toLowerCase() || ''
      const allowedCovers = ['jpg', 'jpeg', 'png', 'webp']
      if (!allowedCovers.includes(coverExt)) {
        setGeneralError('Only JPG, JPEG, PNG, and WEBP cover image formats are allowed.')
        return
      }
    }

    setStatus('uploading')
    setUploadProgress(10)
    setGeneralError(null)
    setProgressLabel('Uploading Cover image...')

    try {
      setUploadProgress(40)
      setProgressLabel('Uploading PDF file to storage...')

      const uploadedBook = await booksService.uploadBook(
        file,
        {
          title: title.trim(),
          author: author.trim(),
          description,
          collectionId: selectedCollectionId || undefined,
          tags: tags.map((t) => t.label),
          pages: parseInt(pages) || 320,
          publisher,
          language,
          isbn,
          edition,
        },
        coverFile || undefined
      )

      if (selectedCollectionId) {
        await collectionsService
          .addBookToCollection(selectedCollectionId, uploadedBook.id)
          .catch((e) => {
            console.error('Failed to add uploaded book to collection:', e)
          })
      }

      setUploadProgress(80)
      setProgressLabel('Indexing text elements & generating shelf reference...')
      setUploadProgress(100)
      setStatus('success')
      notificationsService
        .addNotification(
          'upload',
          'Book Uploaded Successfully 📚',
          `"${title.trim()}" has been uploaded to your library.`
        )
        .catch((e) => console.error(e))
    } catch (err: unknown) {
      console.error(err)
      setStatus('idle')
      const message = err instanceof Error ? err.message : String(err)
      setGeneralError(message || 'Failed to complete book upload.')
    }
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Dynamic Header Banner */}
      <div className="border-border-base flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
            Upload New Book
          </h1>
          <p className="text-text-muted mt-1 text-xs font-semibold tracking-wider uppercase">
            Add books to your personal cloud library shelf.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold tracking-wider uppercase"
          >
            Cancel
          </button>
          <Button
            onClick={handleUploadSubmit}
            disabled={!file || status === 'uploading'}
            variant="primary"
            size="sm"
            className="font-bold tracking-wider uppercase"
          >
            Upload Book
          </Button>
        </div>
      </div>

      {generalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          Error: {generalError}
        </div>
      )}

      <AnimatePresence mode="wait">
        {status === 'success' ? (
          /* Success Animation Frame */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="border-border-base bg-bg-surface mx-auto max-w-xl space-y-6 rounded-3xl border p-10 text-center shadow-xl"
          >
            <div className="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
              <CheckCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-text-main font-sans text-xl font-extrabold tracking-tight">
                Book Uploaded Successfully!
              </h2>
              <p className="text-text-sub mx-auto max-w-sm text-xs leading-relaxed">
                <strong className="text-text-main">{title}</strong> by {author || 'Unknown'} is now
                processed and synced with your cloud cabinet library.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setFile(null)
                  setCoverFile(null)
                  setCoverUrl(null)
                  setTitle('')
                  setAuthor('')
                  setPublisher('')
                  setPages('')
                  setPubYear('')
                  setIsbn('')
                  setEdition('')
                  setDescription('')
                  setStatus('idle')
                }}
                className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app cursor-pointer rounded-lg border px-4 py-2.5 text-xs font-bold tracking-wider uppercase"
              >
                Upload Another
              </button>
              <Link to={ROUTES.LIBRARY}>
                <Button size="sm" className="font-bold tracking-wider uppercase">
                  Go to My Library
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : status === 'uploading' ? (
          /* Upload Progress Card */
          <motion.div
            key="progress-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-border-base bg-bg-surface mx-auto max-w-md space-y-5 rounded-3xl border p-8 text-center shadow-lg"
          >
            <UploadCloud className="text-primary-500 mx-auto h-10 w-10 animate-bounce" />
            <div className="space-y-1.5">
              <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                {progressLabel}
              </h3>
              <p className="text-text-muted text-[10px]">Do not close this panel during sync.</p>
            </div>

            <div className="space-y-2">
              <div className="bg-border-light relative h-2 w-full overflow-hidden rounded-full">
                <motion.div
                  className="bg-primary-600 h-full rounded-full"
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="text-primary-600 text-xs font-bold">{uploadProgress}%</span>
            </div>
          </motion.div>
        ) : (
          /* Upload Form Grid */
          <motion.div
            key="upload-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            {/* Left and Center: Form Fields */}
            <div className="space-y-6 lg:col-span-2">
              {/* Form card wrapper */}
              <div className="bg-bg-surface border-border-base space-y-6 rounded-3xl border p-6 shadow-sm sm:p-8">
                <h3 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-3 text-xs font-extrabold tracking-widest uppercase">
                  <FileText className="h-4.5 w-4.5" />
                  <span>Metadata Specifications</span>
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Clean Code"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Author *
                    </label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Robert C. Martin"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Prentice Hall"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                        Collection
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-[10px] font-bold uppercase transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create Collection
                      </button>
                    </div>
                    {collections.length === 0 ? (
                      <div className="border-border-base bg-bg-app text-text-muted flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span>No collections found.</span>
                      </div>
                    ) : (
                      <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="border-border-base bg-bg-app text-text-main focus:border-primary-500 focus:ring-primary-500/10 block w-full cursor-pointer rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                      >
                        {collections.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Language
                    </label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="978-0132350884"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Publication Year
                    </label>
                    <input
                      type="text"
                      value={pubYear}
                      onChange={(e) => setPubYear(e.target.value)}
                      placeholder="2008"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Number of Pages
                    </label>
                    <input
                      type="number"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      placeholder="464"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                      Edition
                    </label>
                    <input
                      type="text"
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      placeholder="e.g. 2nd Edition"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
                    Description / Notes
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a short description of the book..."
                    className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                  />
                </div>

                {/* Interactive tag input */}
                <div className="space-y-2 text-left">
                  <label className="text-text-sub flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider uppercase">
                    <Tag className="h-4.5 w-4.5" />
                    <span>Tags</span>
                  </label>

                  <form onSubmit={addTag} className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Type a tag and press Add"
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 flex-1 rounded-lg border px-3 py-1.5 text-xs focus:ring-2 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-bg-app border-border-base text-text-sub hover:bg-bg-surface hover:text-text-main flex h-8 cursor-pointer items-center rounded-lg border px-3.5 text-xs font-bold tracking-wider uppercase"
                    >
                      Add
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-500/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-[10px] font-bold"
                      >
                        {tag.label}
                        <button
                          type="button"
                          onClick={() => removeTag(tag.id)}
                          className="cursor-pointer hover:text-red-500 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Upload Dropzone, Cover Select, & Previews */}
            <div className="space-y-6">
              {/* Dropzone container */}
              <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 shadow-sm">
                <h4 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-3 text-xs font-extrabold tracking-widest uppercase">
                  <UploadCloud className="h-4.5 w-4.5" />
                  <span>Book Dropzone</span>
                </h4>

                {file ? (
                  <div className="border-primary-200 dark:border-primary-500/20 bg-primary-50/20 dark:bg-primary-500/5 flex items-center justify-between gap-4 rounded-2xl border p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-text-main truncate text-xs leading-tight font-bold">
                          {file.name}
                        </p>
                        <p className="text-text-muted mt-1 text-[10px] leading-none">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-text-muted cursor-pointer p-1 hover:text-red-500"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="hover:border-primary-500 hover:bg-bg-app/40 group border-border-base relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all"
                  >
                    <input
                      type="file"
                      accept=".pdf,.epub"
                      onChange={handleBrowseFile}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <UploadCloud className="text-text-muted group-hover:text-primary-500 h-10 w-10 transition-colors" />
                    <span className="text-text-main mt-4 text-xs font-bold">
                      Drag & drop your book here
                    </span>
                    <span className="text-primary-600 hover:text-primary-700 mt-1.5 text-[10px] font-bold tracking-wider uppercase">
                      or Browse Files
                    </span>
                    <p className="text-text-muted mt-3 text-[9px]">
                      Supports PDF or EPUB (Max 100 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Cover Select Panel */}
              <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 shadow-sm">
                <h4 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-3 text-xs font-extrabold tracking-widest uppercase">
                  <Star className="h-4.5 w-4.5" />
                  <span>Book Cover</span>
                </h4>

                <div className="flex items-center gap-4">
                  {coverUrl ? (
                    <div className="group relative shrink-0 shadow-md">
                      <img
                        src={coverUrl}
                        alt="Preview"
                        className="border-border-light aspect-[0.7/1] w-16 rounded-lg border object-cover"
                      />
                      <button
                        onClick={() => {
                          setCoverFile(null)
                          setCoverUrl(null)
                        }}
                        className="absolute -top-1.5 -right-1.5 cursor-pointer rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-border-base text-text-muted bg-bg-app flex aspect-[0.7/1] w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                      <Plus className="h-5 w-5" />
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <p className="text-text-muted font-sans text-[10px] leading-normal">
                      PNG, JPG, or WEBP. Upload a custom cover image.
                    </p>
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCoverSelectTrigger}
                      className="bg-bg-app border-border-base text-text-sub hover:bg-bg-surface hover:text-text-main flex h-8 cursor-pointer items-center rounded-lg border px-4 text-[10px] font-bold tracking-wider uppercase"
                    >
                      {coverUrl ? 'Change Cover' : 'Upload Cover'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reading Options & Flags */}
              <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm">
                <h4 className="text-primary-600 border-border-light border-b pb-3 text-xs font-extrabold tracking-widest uppercase">
                  Reading Options
                </h4>

                <div className="space-y-2.5">
                  <label className="text-text-sub flex cursor-pointer items-center gap-2.5 text-xs font-bold select-none">
                    <input
                      type="checkbox"
                      checked={options.isFavorite}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, isFavorite: e.target.checked }))
                      }
                      className="border-border-base text-primary-600 focus:ring-primary-500/10 h-4.5 w-4.5 cursor-pointer rounded"
                    />
                    <span>Mark as Favorite</span>
                  </label>
                </div>
              </div>

              {/* VisibilitySelector Radio Cards */}
              <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm">
                <h4 className="text-primary-600 border-border-light border-b pb-3 text-xs font-extrabold tracking-widest uppercase">
                  Library Visibility
                </h4>

                <div className="space-y-3">
                  <div
                    onClick={() => setVisibility('private')}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                      visibility === 'private'
                        ? 'border-primary-500 bg-primary-50/10 dark:bg-primary-500/5'
                        : 'border-border-base bg-bg-app/40 hover:bg-bg-app'
                    } `}
                  >
                    <Lock
                      className={`mt-0.5 h-5 w-5 shrink-0 ${visibility === 'private' ? 'text-primary-600' : 'text-text-muted'}`}
                    />
                    <div>
                      <span className="text-text-main block text-xs font-bold">
                        Private Library
                      </span>
                      <span className="text-text-muted mt-1 block text-[9px] leading-normal">
                        Only you can see and access this book in your cloud shelf.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE COLLECTION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-surface border-border-base relative w-full max-w-sm space-y-4 rounded-2xl border p-6 text-left shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:bg-bg-app hover:text-text-main absolute top-4 right-4 rounded-lg p-1.5"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                Create Collection
              </h3>

              <form onSubmit={handleCreateCollection} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="e.g. Science Fiction, Research Paper"
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 focus:ring-primary-500 w-full rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all outline-none focus:ring-1"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
