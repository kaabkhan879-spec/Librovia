import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import {
  Upload,
  Shield,
  Smartphone,
  Sparkles,
  Search,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  CheckCircle,
  BookOpen,
  Laptop,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'reader' | 'upload'>(
    'dashboard'
  )
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const features = [
    {
      title: 'Cloud Library',
      desc: 'Keep your entire personal collection stored safely in the cloud, ready to stream instantly.',
      icon: Laptop,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    },
    {
      title: 'Secure Storage',
      desc: 'All books are locked behind private folders with personal encryption keys.',
      icon: Shield,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    },
    {
      title: 'Read Anywhere',
      desc: 'Synchronize page counts and bookmarks effortlessly between desktop, tablet, and mobile browsers.',
      icon: Smartphone,
      color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
    },
    {
      title: 'AI-Powered Reading',
      desc: 'Extract key vocabulary, auto-generate reading summaries, and get smart insights instantly.',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    },
    {
      title: 'Smart Search',
      desc: 'Find any book, author, tag, custom description, or inside chapter title in milliseconds.',
      icon: Search,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    },
    {
      title: 'Reading Progress',
      desc: 'Track metrics like pages read, average reading speeds, and maintain customizable reading streaks.',
      icon: TrendingUp,
      color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    },
  ]

  const steps = [
    {
      step: '01',
      title: 'Create an Account',
      desc: 'Sign up in seconds. Every reader gets a separate database namespace to guarantee zero data cross-access.',
    },
    {
      step: '02',
      title: 'Upload Your Books',
      desc: 'Drag and drop your PDF collections. Librovia handles metadata parsing and storage allocation automatically.',
    },
    {
      step: '03',
      title: 'Organize Your Library',
      desc: 'Add custom tags, arrange books into folders, and star your favorites for quick, organized access.',
    },
    {
      step: '04',
      title: 'Read Anytime, Anywhere',
      desc: 'Open our distraction-free browser reader canvas. Your progress autosaves as you flip pages.',
    },
  ]

  const advantages = [
    'Access from any device (No app install required)',
    'Private and secure (Tenant-isolated cloud databases)',
    'Fast cloud sync (Low latency PostgreSQL state pipelines)',
    'Beautiful reading experience (Clean serif grids, spacing adjustments)',
    'Organized collections (Custom tagging and folder nesting rules)',
    'Modern user interface (Notion/Linear-inspired light and dark theme)',
  ]

  const testimonials = [
    {
      quote:
        'Librovia completely replaced my proprietary reading setups. Having my private research paper library accessible cleanly across all devices is a game-changer.',
      author: 'Dr. Sarah Jenkins',
      role: 'Research Scientist',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    },
    {
      quote:
        'The interface is stunning. It feels like Linear met Kindle. Zero ads, zero algorithms pushing recommendations, just my books and a clean paper layout.',
      author: 'Alex Rivera',
      role: 'Software Designer',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    },
    {
      quote:
        'Private-first storage is the reason I chose Librovia. I know my digital book assets and personal notes are isolated and under my sole control.',
      author: 'Marcus Chen',
      role: 'DRM-Free Collector',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    },
  ]

  const faqs = [
    {
      q: 'Is my library private?',
      a: 'Yes, absolutely. Librovia uses Supabase PostgreSQL Row-Level Security (RLS) and storage namespace triggers. This isolates user assets at the database layer. Nobody else, including administrator roles, can query or read your uploaded files.',
    },
    {
      q: 'Which file formats are supported?',
      a: 'Currently, Librovia focuses on delivering a premium reading experience for standard PDF documents. We plan to add support for EPUB and MOBI formats in Phase 4 of our roadmap.',
    },
    {
      q: 'Can I access books on multiple devices?',
      a: 'Yes. Since Librovia is a fully responsive progressive web application, you can log in from any desktop, tablet, or smartphone browser. Page reading counts automatically save as you progress and sync.',
    },
    {
      q: 'Is my data secure?',
      a: 'Your data is hosted on enterprise-grade AWS servers managed by Supabase, with encrypted SSL connections and secure authentication JWT tokens guarding all storage transactions.',
    },
  ]

  return (
    <div id="home" className="bg-bg-app text-text-main relative overflow-hidden">
      {/* Glow decorative graphics */}
      <div className="bg-primary-600/10 pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-3xl select-none" />
      <div className="bg-accent-500/5 pointer-events-none absolute top-[30%] right-10 h-[400px] w-[400px] rounded-full blur-3xl select-none" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl space-y-10 px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-32 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold select-none">
            <Sparkles className="h-3.5 w-3.5" />
            Beautiful Cloud Shelves For Avid Readers
          </div>

          <h1 className="text-text-main font-sans text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Your Personal Library,{' '}
            <span className="from-primary-600 bg-gradient-to-r to-indigo-500 bg-clip-text text-transparent">
              Anywhere.
            </span>
          </h1>

          <p className="text-text-sub mx-auto max-w-2xl text-base leading-relaxed md:text-lg">
            Upload, organize, and read your books securely from any device. Librovia gives every
            reader a personal cloud library with a beautiful reading experience.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link to={ROUTES.REGISTER}>
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get Started Free
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </a>
        </div>

        {/* Abstract Devices Premium Illustration Mockup */}
        <div className="border-border-base bg-bg-surface/50 relative mx-auto mt-16 max-w-4xl rounded-xl border p-3 shadow-lg backdrop-blur select-none">
          <div className="border-border-light bg-bg-app flex h-[400px] flex-col overflow-hidden rounded-lg border sm:h-[500px]">
            {/* Window control header bar */}
            <div className="border-border-base/60 bg-bg-surface flex shrink-0 items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <span className="text-text-muted font-mono text-[10px] font-semibold select-none">
                librovia.app/dashboard
              </span>
              <div className="h-1 w-12 bg-transparent" />
            </div>

            {/* Simulated Desktop App Page layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left sidebar stub */}
              <div className="border-border-base bg-bg-surface hidden w-48 flex-col gap-4 border-r p-3 text-left sm:flex">
                <div className="text-text-muted flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                  <BookOpen className="text-primary-500 h-4 w-4" />
                  Librovia
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="bg-primary-50 dark:bg-primary-500/10 h-7 rounded" />
                  <div className="h-7 rounded bg-transparent" />
                  <div className="h-7 rounded bg-transparent" />
                </div>
              </div>

              {/* Main canvas showcase */}
              <div className="bg-bg-app flex-1 space-y-6 overflow-y-auto p-6 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-text-main text-sm font-bold">Reading Shelf</h4>
                  <div className="bg-bg-surface border-border-base h-6 w-32 rounded border" />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: 'The Great Gatsby',
                      author: 'F. Fitzgerald',
                      progress: 42,
                      tag: 'Classic',
                    },
                    {
                      title: 'Clean Code principles',
                      author: 'Robert C. Martin',
                      progress: 85,
                      tag: 'Engineering',
                    },
                    {
                      title: 'Atomic Habits study',
                      author: 'James Clear',
                      progress: 12,
                      tag: 'Self-help',
                    },
                  ].map((book, idx) => (
                    <div
                      key={idx}
                      className="bg-bg-surface border-border-base flex h-36 flex-col justify-between rounded-md border p-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="bg-sec-100 text-text-muted flex h-14 w-10 shrink-0 items-center justify-center rounded text-[10px] font-bold shadow-sm">
                          Book
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-text-main truncate text-[11px] font-bold">
                            {book.title}
                          </h5>
                          <p className="text-text-sub mt-0.5 truncate text-[9px]">{book.author}</p>
                          <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 mt-2 inline-block rounded px-1 py-0.5 text-[8px] font-bold">
                            {book.tag}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="bg-border-light h-1 w-full overflow-hidden rounded-full">
                          <div
                            className="bg-primary-600 h-full"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Features Grid */}
      <section
        id="features"
        className="border-border-base/50 mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
            Product Capabilities
          </span>
          <h2 className="text-text-main text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need for clean reading.
          </h2>
          <p className="text-text-sub text-sm leading-relaxed sm:text-base">
            We strip away advertising, recommendations, and algorithmic feeds. You only focus on
            your documents and study logs.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="group border-border-base bg-bg-surface space-y-4 rounded-xl border p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-md ${feat.color}`}
              >
                <feat.icon className="h-5 w-5" />
              </div>
              <h3 className="text-text-main text-base font-bold">{feat.title}</h3>
              <p className="text-text-sub text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How Librovia Works Timeline */}
      <section className="border-border-base/50 mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
            The Roadmap
          </span>
          <h2 className="text-text-main text-3xl font-extrabold tracking-tight sm:text-4xl">
            How Librovia Works
          </h2>
          <p className="text-text-sub text-sm leading-relaxed sm:text-base">
            Get started in 4 simple steps and transform your local documents shelf into a private
            cloud library.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 text-left md:grid-cols-4">
          {/* Connector line for large displays */}
          <div className="bg-border-light pointer-events-none absolute top-1/2 right-0 left-0 hidden h-0.5 -translate-y-12 select-none md:block" />

          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-bg-surface border-border-base relative z-10 space-y-4 rounded-xl border p-6 shadow-sm"
            >
              <div className="bg-primary-600 shadow-primary-500/20 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-bold text-white shadow-md">
                {item.step}
              </div>
              <h3 className="text-text-main mt-4 text-sm font-bold">{item.title}</h3>
              <p className="text-text-sub text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Why Choose Librovia */}
      <section
        id="about"
        className="border-border-base/50 mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          <div className="flex-1 space-y-6 text-left">
            <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
              Core Advantages
            </span>
            <h2 className="text-text-main text-3xl font-extrabold tracking-tight sm:text-4xl">
              Why choose Librovia?
            </h2>
            <p className="text-text-sub text-sm leading-relaxed sm:text-base">
              We design software for collectors and students. By avoiding corporate recommendation
              algorithms, we guarantee total client document ownership and privacy.
            </p>

            <ul className="space-y-3 pt-2">
              {advantages.map((adv, idx) => (
                <li
                  key={idx}
                  className="text-text-sub flex items-center gap-3 text-sm font-semibold"
                >
                  <CheckCircle className="text-success-500 h-4.5 w-4.5 shrink-0" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive features display widgets stack */}
          <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border-border-base bg-bg-surface space-y-2 rounded-xl border p-6 text-left shadow-sm">
              <h4 className="text-text-main text-sm font-bold">Tenant Isolation</h4>
              <p className="text-text-sub text-xs leading-relaxed">
                Row-Level Database controls ensure only you can select your metadata records.
              </p>
            </div>
            <div className="border-border-base bg-bg-surface space-y-2 rounded-xl border p-6 text-left shadow-sm">
              <h4 className="text-text-main text-sm font-bold">Distraction-Free</h4>
              <p className="text-text-sub text-xs leading-relaxed">
                No recommendations feeds. Your library is only populated with your own books.
              </p>
            </div>
            <div className="border-border-base bg-bg-surface space-y-2 rounded-xl border p-6 text-left shadow-sm">
              <h4 className="text-text-main text-sm font-bold">Debounced Progress Sync</h4>
              <p className="text-text-sub text-xs leading-relaxed">
                Page locations updates are debounced and stored to PostgreSQL efficiently.
              </p>
            </div>
            <div className="border-border-base bg-bg-surface space-y-2 rounded-xl border p-6 text-left shadow-sm">
              <h4 className="text-text-main text-sm font-bold">Tailwind CSS v4 styling</h4>
              <p className="text-text-sub text-xs leading-relaxed">
                Fluid layouts, Outfit headers, and responsive structures built for mobile reading.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. App Preview Interactive Tabs */}
      <section className="border-border-base/50 mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
            Product Interface
          </span>
          <h2 className="text-text-main text-3xl font-extrabold tracking-tight sm:text-4xl">
            Clean, Notion-like app layout.
          </h2>
          <p className="text-text-sub text-sm leading-relaxed sm:text-base">
            Click the tabs below to preview different pages of the Librovia application.
          </p>
        </div>

        {/* Dynamic Tab Triggers */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {['dashboard', 'library', 'reader', 'upload'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'dashboard' | 'library' | 'reader' | 'upload')}
              className={`cursor-pointer rounded-lg border px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-primary-600 border-primary-600 shadow-primary-500/10 text-white shadow-sm'
                  : 'bg-bg-surface border-border-base text-text-sub hover:bg-bg-app'
              } `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab display contents */}
        <div className="border-border-base bg-bg-surface/50 mt-8 rounded-xl border p-3 shadow-lg backdrop-blur select-none">
          <div className="border-border-light bg-bg-app flex h-[300px] items-center justify-center overflow-hidden rounded-lg border p-6 sm:h-[400px] sm:p-8">
            {activeTab === 'dashboard' && (
              <div className="w-full max-w-lg space-y-4 text-left">
                <div className="border-border-base/60 flex items-center justify-between border-b pb-3">
                  <h4 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                    Dashboard Overview
                  </h4>
                  <span className="text-primary-600 text-xs font-bold">Active Session</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-surface border-border-base rounded-lg border p-4">
                    <p className="text-text-sub text-[10px] font-bold uppercase">Total books</p>
                    <p className="text-text-main mt-1 text-xl font-bold">3 Books</p>
                  </div>
                  <div className="bg-bg-surface border-border-base rounded-lg border p-4">
                    <p className="text-text-sub text-[10px] font-bold uppercase">Storage Used</p>
                    <p className="text-text-main mt-1 text-xl font-bold">1.5% space</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="w-full max-w-xl space-y-4 text-left">
                <div className="border-border-base/60 flex items-center justify-between border-b pb-3">
                  <h4 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                    My Library
                  </h4>
                  <div className="bg-bg-surface border-border-base h-6 w-32 rounded border" />
                </div>
                <div className="space-y-2">
                  <div className="bg-bg-surface border-border-base flex items-center justify-between rounded-lg border p-3 text-xs font-semibold">
                    <span className="text-text-main max-w-[200px] truncate">The Great Gatsby</span>
                    <span className="text-text-muted">F. Scott Fitzgerald</span>
                  </div>
                  <div className="bg-bg-surface border-border-base flex items-center justify-between rounded-lg border p-3 text-xs font-semibold">
                    <span className="text-text-main max-w-[200px] truncate">Clean Code</span>
                    <span className="text-text-muted">Robert C. Martin</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reader' && (
              <div className="bg-bg-surface border-border-base flex h-56 w-full max-w-md flex-col justify-between rounded-lg border p-6 text-left shadow-sm">
                <div className="text-text-muted border-border-light flex items-center justify-between border-b pb-2 text-[10px] font-bold uppercase">
                  <span>Atomic Habits</span>
                  <span>Page 15 of 320</span>
                </div>
                <div className="my-4">
                  <h5 className="text-text-main text-sm font-bold">The Power of Tiny Changes</h5>
                  <p className="text-text-sub mt-2 font-serif text-xs leading-relaxed">
                    An easy and proven way to build good habits and break bad ones. Your reading
                    state is tracked and synchronized securely across platforms.
                  </p>
                </div>
                <div className="text-text-muted border-border-light flex items-center justify-between border-t pt-2 text-[10px] select-none">
                  <span>Zoom 100%</span>
                  <span>Autosaved</span>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="border-border-base bg-bg-surface w-full max-w-sm rounded-xl border-2 border-dashed p-8 text-center">
                <Upload className="text-text-muted mx-auto h-8 w-8" />
                <p className="text-text-main mt-4 text-xs font-bold">
                  Drag and drop book files here
                </p>
                <p className="text-text-muted mt-1 text-[10px]">PDF file formats up to 50MB</p>
                <div className="bg-primary-600 mx-auto mt-4 flex h-7 w-28 cursor-pointer items-center justify-center rounded text-[10px] font-bold text-white">
                  Browse Files
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section className="border-border-base/50 mx-auto max-w-7xl border-t px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
            Client Reviews
          </span>
          <h2 className="text-text-main text-3xl font-extrabold tracking-tight sm:text-4xl">
            Loved by modern readers.
          </h2>
          <p className="text-text-sub text-sm leading-relaxed sm:text-base">
            See how research scholars, writers, and students organize their book shelves using
            Librovia.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="bg-bg-surface border-border-base flex flex-col justify-between space-y-6 rounded-xl border p-6 text-left shadow-sm"
            >
              <p className="text-text-sub text-sm leading-relaxed italic">"{test.quote}"</p>

              <div className="flex items-center gap-3">
                <img
                  src={test.avatar}
                  alt={test.author}
                  className="h-10 w-10 rounded-full object-cover shadow-sm"
                />
                <div>
                  <h4 className="text-text-main text-xs font-bold">{test.author}</h4>
                  <p className="text-text-muted text-[10px] font-semibold">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ Accordion Section */}
      <section
        id="faq"
        className="border-border-base/50 mx-auto max-w-4xl border-t px-4 py-24 sm:px-6"
      >
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
            Got Questions?
          </span>
          <h2 className="text-text-main text-3xl font-extrabold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-16 space-y-4 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={idx}
                className="bg-bg-surface border-border-base overflow-hidden rounded-xl border shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="text-text-main hover:bg-bg-app flex w-full cursor-pointer items-center justify-between p-5 text-left text-sm font-bold transition-colors select-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`text-text-muted h-4 w-4 transition-transform duration-200 ${isOpen ? 'text-primary-500 rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-border-light border-t px-5 pt-1 pb-5">
                    <p className="text-text-sub text-xs leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 8. Final Call to Action */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="from-primary-600 shadow-primary-500/10 relative space-y-8 overflow-hidden rounded-3xl bg-gradient-to-r to-indigo-600 p-8 text-center text-white shadow-lg sm:p-16">
          {/* Backdrop graphic */}
          <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 rounded-full bg-white/5 blur-2xl select-none" />

          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Start Building Your Personal Library Today
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-indigo-100">
              Upload your documents and check our progressive reader controls immediately. Free tier
              includes up to 1 GB cloud storage.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to={ROUTES.REGISTER}>
              <Button className="text-primary-600 border-transparent bg-white shadow-sm hover:bg-slate-50">
                Get Started Free
              </Button>
            </Link>
            <Link to={ROUTES.DESIGN_SYSTEM}>
              <Button className="border border-indigo-300 bg-transparent text-white hover:bg-indigo-700">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
