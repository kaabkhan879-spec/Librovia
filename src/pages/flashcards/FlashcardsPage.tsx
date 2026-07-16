import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { flashcardsService, type Flashcard } from '../../services/flashcards'
import { booksService, type Book } from '../../services/books'
import {
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Star,
  Trash2,
  CheckCircle,
  BookOpen,
  Search,
  RefreshCw,
  Trophy,
} from 'lucide-react'

export const FlashcardsPage: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast()

  // App state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')

  // Study View / Browse View toggle
  const [viewMode, setViewMode] = useState<'study' | 'browse'>('study')

  // Study Mode navigation states
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Network state
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Fetch initial books list to map book ID to titles
  const fetchBooks = useCallback(async () => {
    try {
      const data = await booksService.getBooks()
      setBooks(data)
    } catch (err) {
      console.error('Failed to load books:', err)
    }
  }, [])

  // Fetch flashcards list
  const fetchFlashcards = useCallback(async () => {
    setLoading(true)
    try {
      const data = await flashcardsService.getFlashcards()
      setFlashcards(data)
    } catch (err) {
      console.error('Failed to load flashcards:', err)
      showError('Failed to load study flashcards.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  // Sync offline updates when returning online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      try {
        await flashcardsService.syncOfflineFlashcards()
        await fetchFlashcards()
        showSuccess("You're back online. Flashcards have been synchronized.")
      } catch (err) {
        console.error('Sync failed:', err)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchFlashcards, showSuccess])

  // Mount logic
  useEffect(() => {
    fetchBooks()
    fetchFlashcards()
  }, [fetchBooks, fetchFlashcards])

  // Map bookId to book title
  const bookTitleMap = useMemo(() => {
    const map: Record<string, string> = {}
    books.forEach((b) => {
      map[b.id] = b.title
    })
    return map
  }, [books])

  // Get distinct topics for filters list
  const distinctTopics = useMemo(() => {
    const topics = new Set<string>()
    flashcards.forEach((c) => {
      if (c.topic) topics.add(c.topic)
    })
    return Array.from(topics).sort()
  }, [flashcards])

  // Apply filters & search to flashcards list
  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((card) => {
      const matchesSearch =
        card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.topic.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesBook = selectedBookId === 'all' || card.bookId === selectedBookId
      const matchesTopic = selectedTopic === 'all' || card.topic === selectedTopic
      const matchesDifficulty =
        selectedDifficulty === 'all' || card.difficulty === selectedDifficulty

      return matchesSearch && matchesBook && matchesTopic && matchesDifficulty
    })
  }, [flashcards, searchQuery, selectedBookId, selectedTopic, selectedDifficulty])

  // Reset index when deck updates
  useEffect(() => {
    setCurrentDeckIndex(0)
    setIsFlipped(false)
  }, [filteredFlashcards.length])

  // Shuffle currently filtered cards
  const handleShuffle = () => {
    if (filteredFlashcards.length === 0) return
    setIsFlipped(false)
    const shuffled = [...flashcards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setFlashcards(shuffled)
    showInfo('Deck shuffled! 🃏')
  }

  // Toggle Learned status of card
  const handleToggleLearned = async (card: Flashcard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updated: Flashcard = {
      ...card,
      isLearned: !card.isLearned,
      updatedAt: new Date().toISOString(),
    }
    setFlashcards((prev) => prev.map((c) => (c.id === card.id ? updated : c)))
    try {
      await flashcardsService.saveFlashcard(updated)
      showSuccess(updated.isLearned ? 'Marked as Learned! 🎓' : 'Unmarked as Learned.')
    } catch (err) {
      console.error(err)
      showError('Failed to update flashcard status.')
    }
  }

  // Toggle Favorite status of card
  const handleToggleFavorite = async (card: Flashcard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updated: Flashcard = {
      ...card,
      isFavorite: !card.isFavorite,
      updatedAt: new Date().toISOString(),
    }
    setFlashcards((prev) => prev.map((c) => (c.id === card.id ? updated : c)))
    try {
      await flashcardsService.saveFlashcard(updated)
    } catch (err) {
      console.error(err)
      showError('Failed to update favorite.')
    }
  }

  // Update Difficulty of card
  const handleSetDifficulty = async (card: Flashcard, difficulty: 'easy' | 'medium' | 'hard', e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updated: Flashcard = {
      ...card,
      difficulty,
      updatedAt: new Date().toISOString(),
    }
    setFlashcards((prev) => prev.map((c) => (c.id === card.id ? updated : c)))
    try {
      await flashcardsService.saveFlashcard(updated)
      showSuccess(`Marked as ${difficulty.toUpperCase()}`)
    } catch (err) {
      console.error(err)
      showError('Failed to update difficulty.')
    }
  }

  // Delete card
  const handleDeleteCard = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Are you sure you want to delete this study card?')) return
    setIsFlipped(false)
    setFlashcards((prev) => prev.filter((c) => c.id !== id))
    try {
      await flashcardsService.deleteFlashcard(id)
      showSuccess('Flashcard deleted successfully.')
    } catch (err) {
      console.error(err)
      showError('Failed to delete card.')
    }
  }

  const activeCard = filteredFlashcards[currentDeckIndex]

  return (
    <PageWrapper className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* CSS 3D Transforms */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Header bar controls */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-primary-50 p-2 rounded-2xl dark:bg-primary-950/20 text-primary-600">
              <Layers className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Study Flashcards
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                  {filteredFlashcards.length} cards
                </span>
              </h1>
              <p className="text-text-muted text-[10px] font-semibold mt-0.5 uppercase tracking-wider">
                Generate dynamic exam-focused flashcards straight from book text highlights
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Sync state dot */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-150 bg-white shadow-xs dark:border-slate-850 dark:bg-slate-900 text-[10px] font-bold tracking-wider uppercase">
            <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('study')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg cursor-pointer transition-all ${
                viewMode === 'study'
                  ? 'bg-white text-primary-600 shadow-xs dark:bg-slate-900'
                  : 'text-slate-400 hover:text-slate-655'
              }`}
            >
              Study View
            </button>
            <button
              onClick={() => setViewMode('browse')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg cursor-pointer transition-all ${
                viewMode === 'browse'
                  ? 'bg-white text-primary-600 shadow-xs dark:bg-slate-900'
                  : 'text-slate-400 hover:text-slate-655'
              }`}
            >
              Browse Grid
            </button>
          </div>
        </div>
      </div>

      {/* Filters Shelf layout */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 md:grid-cols-4 items-center">
        {/* Search input query */}
        <div className="relative">
          <Search className="absolute top-3 left-3.5 h-4 w-4 text-slate-350" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-100 bg-slate-50/50 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40"
          />
        </div>

        {/* Books list drop down */}
        <div className="relative">
          <BookOpen className="absolute top-3 left-3.5 h-4 w-4 text-slate-350" />
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold uppercase rounded-xl border border-slate-100 bg-slate-50/50 outline-hidden dark:border-slate-800 dark:bg-slate-800/40 cursor-pointer appearance-none"
          >
            <option value="all">All Books</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>

        {/* Topic drop down */}
        <div className="relative">
          <Sparkles className="absolute top-3 left-3.5 h-4 w-4 text-slate-350" />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold uppercase rounded-xl border border-slate-100 bg-slate-50/50 outline-hidden dark:border-slate-800 dark:bg-slate-800/40 cursor-pointer appearance-none"
          >
            <option value="all">All Topics</option>
            {distinctTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty drop down */}
        <div className="relative">
          <Trophy className="absolute top-3 left-3.5 h-4 w-4 text-slate-350" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold uppercase rounded-xl border border-slate-100 bg-slate-50/50 outline-hidden dark:border-slate-800 dark:bg-slate-800/40 cursor-pointer appearance-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
        </div>
      </div>

      {/* Main deck area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest">Loading flashcard deck...</p>
        </div>
      ) : filteredFlashcards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 dark:border-slate-800 py-24 space-y-2">
          <Layers className="h-10 w-10 mx-auto text-slate-300" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest">No study flashcards found matching criteria.</p>
          <p className="text-xs text-slate-450 mt-1">Open a book in library mode, select text, and generate cards instantly using Gemini AI.</p>
        </div>
      ) : viewMode === 'study' ? (
        // ------------------ STUDY VIEW ------------------
        <div className="flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto py-4">
          {/* Main 3D Card flips */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 w-full h-80 cursor-pointer active:scale-[0.99] transition-transform duration-100"
          >
            <div
              className={`preserve-3d relative w-full h-full duration-500 ease-out transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* CARD FRONT SIDE */}
              <div className="backface-hidden absolute inset-0 bg-white border border-slate-100 dark:border-slate-800/80 dark:bg-slate-900 rounded-3xl p-8 shadow-sm flex flex-col justify-between text-center">
                {/* Meta details tag */}
                <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-800/40">
                  <span className="text-[8px] font-black uppercase text-purple-650 tracking-widest bg-purple-50 px-2 py-0.5 rounded-lg dark:bg-purple-950/20 dark:text-purple-400">
                    📂 {activeCard.topic || 'General'}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">
                    📖 p. {activeCard.pageNumber} • {bookTitleMap[activeCard.bookId] || 'Active Book'}
                  </span>
                </div>

                {/* Question block */}
                <div className="my-auto py-4">
                  <span className="block text-[8px] font-black text-slate-350 uppercase tracking-widest mb-2">Question</span>
                  <h2 className="text-base font-bold text-slate-850 dark:text-white leading-relaxed">
                    {activeCard.question}
                  </h2>
                </div>

                {/* Footer instructions */}
                <div className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider pt-3 border-t border-slate-50 dark:border-slate-800/40">
                  👆 Click or tap to reveal study answer
                </div>
              </div>

              {/* CARD BACK SIDE */}
              <div className="backface-hidden rotate-y-180 absolute inset-0 bg-white border border-slate-100 dark:border-slate-800/80 dark:bg-slate-900 rounded-3xl p-8 shadow-sm flex flex-col justify-between text-center">
                {/* Meta details tag */}
                <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-800/40">
                  <div className="flex gap-1.5 items-center">
                    <button
                      onClick={(e) => handleSetDifficulty(activeCard, 'easy', e)}
                      className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-lg transition-all border ${
                        activeCard.difficulty === 'easy'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-950/20'
                          : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                      }`}
                    >
                      Easy
                    </button>
                    <button
                      onClick={(e) => handleSetDifficulty(activeCard, 'medium', e)}
                      className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-lg transition-all border ${
                        activeCard.difficulty === 'medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-950/20'
                          : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={(e) => handleSetDifficulty(activeCard, 'hard', e)}
                      className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-lg transition-all border ${
                        activeCard.difficulty === 'hard'
                          ? 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-950/20'
                          : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                      }`}
                    >
                      Hard
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleFavorite(activeCard, e)}
                      className={`p-1 rounded-md transition-colors ${
                        activeCard.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                      }`}
                      title="Favorite card"
                    >
                      <Star className="h-4 w-4" fill={activeCard.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleToggleLearned(activeCard, e)}
                      className={`p-1 rounded-md transition-colors ${
                        activeCard.isLearned ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'
                      }`}
                      title="Mark as learned"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCard(activeCard.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Answer block */}
                <div className="my-auto py-4">
                  <span className="block text-[8px] font-black text-slate-350 uppercase tracking-widest mb-2">Answer</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed font-serif">
                    {activeCard.answer}
                  </p>
                </div>

                {/* Footer instructions */}
                <div className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider pt-3 border-t border-slate-50 dark:border-slate-800/40">
                  👆 Click or tap to return to study question
                </div>
              </div>
            </div>
          </div>

          {/* Navigation controllers */}
          <div className="flex items-center justify-between w-full border border-slate-100 bg-white px-6 py-4 rounded-3xl dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <button
              onClick={() => {
                setIsFlipped(false)
                setCurrentDeckIndex((prev) => (prev > 0 ? prev - 1 : filteredFlashcards.length - 1))
              }}
              className="text-text-sub hover:text-text-main flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="Previous card"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center space-y-1">
              <span className="font-mono text-xs font-bold text-slate-400">
                {currentDeckIndex + 1} / {filteredFlashcards.length}
              </span>
              <button
                onClick={handleShuffle}
                className="text-[9px] font-black uppercase text-purple-650 hover:text-purple-750 flex items-center gap-1 transition-colors"
              >
                <Shuffle className="h-3 w-3" /> Shuffle Deck
              </button>
            </div>

            <button
              onClick={() => {
                setIsFlipped(false)
                setCurrentDeckIndex((prev) => (prev < filteredFlashcards.length - 1 ? prev + 1 : 0))
              }}
              className="text-text-sub hover:text-text-main flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="Next card"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        // ------------------ BROWSE GRID VIEW ------------------
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFlashcards.map((card) => (
            <div
              key={card.id}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-850 dark:bg-slate-900 hover:shadow-md transition-shadow relative flex flex-col justify-between h-64 text-left group"
            >
              <div>
                {/* Meta details tag */}
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 dark:border-slate-800/40">
                  <span className="text-[7.5px] font-black uppercase text-purple-650 tracking-widest">
                    📂 {card.topic || 'General'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleToggleFavorite(card, e)}
                      className={`p-1 rounded-md transition-colors ${
                        card.isFavorite ? 'text-amber-400' : 'text-slate-350 hover:text-amber-400'
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" fill={card.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleToggleLearned(card, e)}
                      className={`p-1 rounded-md transition-colors ${
                        card.isLearned ? 'text-emerald-500' : 'text-slate-350 hover:text-emerald-500'
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Q&A info */}
                <div className="space-y-3 mt-3">
                  <div>
                    <span className="text-[7.5px] font-extrabold text-slate-350 uppercase tracking-widest">Question</span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-normal mt-0.5">
                      {card.question}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[7.5px] font-extrabold text-slate-350 uppercase tracking-widest">Answer</span>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal mt-0.5 line-clamp-3 font-serif">
                      {card.answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-3 dark:border-slate-800/40">
                <div className="flex gap-1.5 items-center">
                  <span className={`text-[7.5px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                    card.difficulty === 'easy'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20'
                      : card.difficulty === 'medium'
                      ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20'
                      : 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-950/20'
                  }`}>
                    {card.difficulty}
                  </span>
                </div>
                <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-slate-400">
                  📖 p. {card.pageNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
