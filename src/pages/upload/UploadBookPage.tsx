import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { booksService } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { UploadCloud, FileText, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'

export const UploadBookPage: React.FC = () => {
  const navigate = useNavigate()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf') {
        alert('Currently, only PDF files are supported.')
        return
      }
      setFile(selectedFile)
      // Autofill title with filename (without extension)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    try {
      setStatus('uploading')
      setProgress(10)

      // Simulate upload increments
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 20
        })
      }, 200)

      const formattedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await booksService.uploadBook(file, {
        title,
        author,
        description,
        tags: formattedTags,
      })

      clearInterval(interval)
      setProgress(100)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-500">Back to Library</span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        {status === 'success' ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">Book Uploaded Successfully!</h3>
            <p className="mt-2 text-sm text-slate-500">
              "{title}" is now added to your private library shelf.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => {
                  setFile(null)
                  setTitle('')
                  setAuthor('')
                  setDescription('')
                  setTags('')
                  setStatus('idle')
                  setProgress(0)
                }}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate(ROUTES.LIBRARY)}
                className="bg-brand-600 hover:bg-brand-700 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Go to Shelf
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Drag and Drop */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Book File (PDF)
              </label>
              {file ? (
                <div className="border-brand-200 bg-brand-50/20 flex items-center justify-between rounded-xl border p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-brand-100 text-brand-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="hover:border-brand-500 hover:bg-brand-50/5 group relative flex cursor-pointer justify-center rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div>
                    <UploadCloud className="group-hover:text-brand-600 mx-auto h-12 w-12 text-slate-400 transition-colors" />
                    <div className="mt-4 flex justify-center text-sm text-slate-600">
                      <span className="text-brand-600 group-hover:text-brand-700 font-semibold">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">PDF books up to 50MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
                  Book Title *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  disabled={!file}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Great Gatsby"
                  className="focus:border-brand-500 focus:ring-brand-500/10 mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-semibold text-slate-700">
                  Author
                </label>
                <input
                  id="author"
                  type="text"
                  disabled={!file}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. F. Scott Fitzgerald"
                  className="focus:border-brand-500 focus:ring-brand-500/10 mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
                Description / Notes
              </label>
              <textarea
                id="description"
                rows={3}
                disabled={!file}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary or personal study notes about this book..."
                className="focus:border-brand-500 focus:ring-brand-500/10 mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-semibold text-slate-700">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                disabled={!file}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Fiction, Classics, Business"
                className="focus:border-brand-500 focus:ring-brand-500/10 mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Uploading file...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="bg-brand-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>There was an error uploading this book. Please try again.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !title || status === 'uploading'}
              className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500/20 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-sm focus:ring-2 focus:outline-none disabled:opacity-50"
            >
              {status === 'uploading' ? 'Uploading Book...' : 'Upload Book to Library'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
