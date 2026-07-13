import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Laptop,
  BookOpen,
  Layers,
  BookMarked,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'reader' | 'upload'>(
    'dashboard'
  )
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // Simulation loading delay (1.8s) for premium splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

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
      desc: 'Register in seconds. Every reader gets a separate database namespace to guarantee zero data cross-access.',
      icon: UserIcon,
    },
    {
      step: '02',
      title: 'Upload Your Books',
      desc: 'Drag and drop your PDF collections. Librovia handles metadata parsing and storage allocation automatically.',
      icon: Upload,
    },
    {
      step: '03',
      title: 'Organize Your Library',
      desc: 'Add custom tags, arrange books into folders, and star your favorites for quick, organized access.',
      icon: Layers,
    },
    {
      step: '04',
      title: 'Read Anytime, Anywhere',
      desc: 'Open our distraction-free browser reader canvas. Your progress autosaves as you flip pages.',
      icon: BookMarked,
    },
  ]

  const benefits = [
    {
      title: 'Private Library',
      desc: 'Strict data isolation ensures your collection is entirely private to your account.',
    },
    {
      title: 'Fast Cloud Sync',
      desc: 'Sync progress and bookmarks instantly across all devices without delay.',
    },
    {
      title: 'Beautiful Reading Experience',
      desc: 'Distraction-free viewer with customized fonts, sizes, and backgrounds.',
    },
    {
      title: 'Smart Organization',
      desc: 'Categorize by tags, folder shelves, and search inside books instantly.',
    },
    {
      title: 'Read Anywhere',
      desc: 'Supports responsive layouts across desktop, tablet, and mobile browsers.',
    },
    {
      title: 'Modern Interface',
      desc: 'A clean, aesthetic layout optimized for reading comfort (Light and Dark Mode).',
    },
  ]

  const testimonials = [
    {
      quote:
        'Librovia completely replaced my proprietary reading setups. Having my private research paper library accessible cleanly across all devices is a game-changer.',
      author: 'Dr. Sarah Jenkins',
      role: 'Research Scientist',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
    },
    {
      quote:
        'The interface is stunning. It feels like Linear met Kindle. Zero ads, zero algorithms pushing recommendations, just my books and a clean paper layout.',
      author: 'Alex Rivera',
      role: 'Software Designer',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
    },
    {
      quote:
        'Private-first storage is the reason I chose Librovia. I know my digital book assets and personal notes are isolated and under my sole control.',
      author: 'Marcus Chen',
      role: 'DRM-Free Collector',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
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
    <>
      {/* 1. Splash Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="bg-bg-app text-text-main fixed inset-0 z-9999 flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              {/* Librovia logo container with rotating book elements */}
              <div className="bg-primary-600 shadow-primary-500/20 relative flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg select-none">
                <BookOpen className="animate-book-flip h-8 w-8" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-text-main font-sans text-lg font-bold tracking-wider uppercase">
                  Librovia
                </h3>
                <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
                  <div className="bg-primary-500 h-1.5 w-1.5 animate-ping rounded-full" />
                  <span>Loading Library Shelf...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-bg-app text-text-main selection:bg-primary-100 selection:text-primary-700 relative min-h-screen overflow-hidden">
        {/* Glow decorative graphics */}
        <div className="bg-primary-600/10 pointer-events-none absolute top-[-10%] left-1/4 h-[700px] w-[700px] -translate-y-1/2 rounded-full blur-3xl select-none" />
        <div className="pointer-events-none absolute top-[35%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-3xl select-none" />
        <div className="bg-accent-500/5 pointer-events-none absolute bottom-[20%] left-[-10%] h-[600px] w-[600px] rounded-full blur-3xl select-none" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            {/* Left Column Text details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="flex-1 space-y-8 text-left"
            >
              <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-500/20 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold select-none">
                <Sparkles className="h-3.5 w-3.5" />
                Beautiful Cloud Shelves For Avid Readers
              </div>

              <h1 className="text-text-main font-sans text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                Your Personal Library,{' '}
                <span className="from-primary-600 bg-gradient-to-r to-indigo-500 bg-clip-text text-transparent">
                  Anywhere.
                </span>
              </h1>

              <p className="text-text-sub max-w-lg text-sm leading-relaxed md:text-base">
                Upload, organize, and read your books securely from any device. Librovia gives every
                reader a personal cloud library with a beautiful reading experience.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to={ROUTES.REGISTER}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="hover:shadow-primary-500/10 transition-shadow hover:shadow-lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Get Started Free
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right Column Layout - Floating Devices Stack Illustrations */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
              className="relative flex min-h-[380px] w-full flex-1 items-center justify-center sm:min-h-[460px]"
            >
              {/* Radial backdrop glow */}
              <div className="from-primary-600/10 pointer-events-none absolute inset-0 bg-radial via-transparent to-transparent opacity-65 blur-2xl select-none" />

              {/* Glowing particles */}
              <div className="animate-float absolute top-10 left-10 h-2.5 w-2.5 rounded-full bg-indigo-500/30 blur-xs" />
              <div className="animate-float-delay absolute right-10 bottom-20 h-3 w-3 rounded-full bg-cyan-500/30 blur-xs" />

              {/* Device 1: Laptop Mockup Container */}
              <div className="border-border-base bg-bg-surface/50 absolute z-10 aspect-[1.6/1] w-[80%] rounded-xl border p-2.5 shadow-xl backdrop-blur transition-transform duration-300 hover:scale-[1.01]">
                <div className="border-border-light bg-bg-app flex h-full flex-col overflow-hidden rounded-lg border">
                  <div className="border-border-base/50 bg-bg-surface flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5 select-none">
                    <span className="h-2 w-2 rounded-full bg-red-400/80" />
                    <span className="h-2 w-2 rounded-full bg-yellow-400/80" />
                    <span className="h-2 w-2 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 space-y-4 overflow-hidden p-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="bg-border-base h-3 w-20 rounded" />
                      <div className="bg-primary-50 dark:bg-primary-500/10 h-4.5 w-16 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-bg-surface border-border-base/60 flex h-20 flex-col justify-between rounded border p-3 shadow-sm">
                        <div className="bg-border-light h-2 w-12 rounded" />
                        <div className="bg-primary-600 h-3 w-8 rounded" />
                      </div>
                      <div className="bg-bg-surface border-border-base/60 flex h-20 flex-col justify-between rounded border p-3 shadow-sm">
                        <div className="bg-border-light h-2 w-16 rounded" />
                        <div className="h-3 w-10 rounded bg-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device 2: Tablet Mockup Container (Overlapping bottom-left) */}
              <div className="border-border-base bg-bg-surface/85 absolute bottom-5 left-[5%] z-20 aspect-[1.2/1] w-[42%] rounded-lg border p-2 shadow-2xl backdrop-blur transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="border-border-light bg-bg-app flex h-full flex-col justify-between overflow-hidden rounded-md border p-3 text-left">
                  <div className="border-border-light flex justify-between border-b pb-1.5 select-none">
                    <span className="text-text-muted text-[7px] font-bold">Atomic Habits</span>
                    <span className="text-text-muted text-[7px] font-bold">P. 12</span>
                  </div>
                  <div className="my-2 space-y-1">
                    <div className="bg-text-sub/10 h-1.5 w-full rounded" />
                    <div className="bg-text-sub/10 h-1.5 w-11/12 rounded" />
                    <div className="bg-text-sub/10 h-1.5 w-8/12 rounded" />
                  </div>
                  <div className="bg-border-light h-1 w-full shrink-0 overflow-hidden rounded-full">
                    <div className="bg-primary-600 h-full" style={{ width: '42%' }} />
                  </div>
                </div>
              </div>

              {/* Device 3: Smartphone Mockup Container (Overlapping bottom-right) */}
              <div className="border-border-base bg-bg-surface/95 absolute right-[8%] bottom-[-10px] z-30 aspect-[0.55/1] w-[24%] rounded-2xl border p-1.5 shadow-2xl backdrop-blur transition-transform duration-300 hover:translate-y-[-4px]">
                <div className="border-border-light bg-bg-app flex h-full flex-col justify-between overflow-hidden rounded-xl border p-2.5 text-left">
                  <div className="flex h-3 w-full shrink-0 justify-center select-none">
                    <span className="bg-border-base h-1 w-8 rounded-full" />
                  </div>
                  <div className="mt-2 flex flex-1 flex-col justify-center gap-1.5">
                    <div className="bg-border-base h-3 w-10/12 rounded" />
                    <div className="bg-border-base h-2 w-8/12 rounded" />
                    <div className="bg-border-light mt-2 h-1.5 w-full rounded" />
                  </div>
                  <div className="bg-primary-600 mt-4 flex h-4 w-full cursor-pointer items-center justify-center rounded text-[7px] font-bold text-white">
                    Open
                  </div>
                </div>
              </div>

              {/* Floating Books */}
              <div className="animate-float pointer-events-none absolute top-[12%] left-[-2%] z-25 select-none">
                <div className="to-primary-600 flex h-20 w-14 rotate-[-12deg] items-center justify-center rounded border border-indigo-400/20 bg-gradient-to-br from-indigo-500 text-[8px] font-bold tracking-wide text-white shadow-md">
                  Habits
                </div>
              </div>
              <div className="animate-float-delay pointer-events-none absolute top-[8%] right-[5%] z-25 select-none">
                <div className="flex h-22 w-16 rotate-[15deg] items-center justify-center rounded border border-emerald-400/20 bg-gradient-to-br from-emerald-500 to-teal-600 text-[8px] font-bold tracking-wide text-white shadow-md">
                  Clean Code
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Key Features Grid */}
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
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="glass-effect bg-bg-surface/50 border-border-base hover:border-primary-500/30 space-y-4 rounded-xl border p-6 text-left shadow-sm transition-all"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-md ${feat.color}`}
                >
                  <feat.icon className="h-5 w-5" />
                </div>
                <h3 className="text-text-main text-base font-bold">{feat.title}</h3>
                <p className="text-text-sub text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How Librovia Works Timeline */}
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
            <div className="bg-border-light pointer-events-none absolute top-1/2 right-0 left-0 hidden h-0.5 -translate-y-12 overflow-hidden select-none md:block">
              {/* Sliding gradient overlay animation on connecting line */}
              <div className="via-primary-500/40 h-full w-1/3 animate-[translate-x_2.5s_linear_infinite] bg-gradient-to-r from-transparent to-transparent" />
            </div>

            {steps.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="bg-bg-surface border-border-base hover:border-slate-350 relative z-10 space-y-4 rounded-xl border p-6 shadow-sm"
              >
                <div className="bg-primary-600 shadow-primary-500/20 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-bold text-white shadow-md">
                  {item.step}
                </div>
                <div className="text-primary-600 mt-4 flex items-center gap-2">
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <h3 className="text-text-main text-sm font-bold">{item.title}</h3>
                </div>
                <p className="text-text-sub text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Choose Librovia */}
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

              <ul className="space-y-4 pt-2">
                {benefits.map((ben, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="text-success-500 mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-text-main text-sm font-bold">{ben.title}</h4>
                      <p className="text-text-sub mt-0.5 text-xs leading-relaxed">{ben.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Benefit visual display widgets */}
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
                <h4 className="text-text-main text-sm font-bold">Autosaved Tracking</h4>
                <p className="text-text-sub text-xs leading-relaxed">
                  Page reading counts automatically save as you navigate, allowing easy pause and
                  resumes.
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

        {/* App Preview Interactive Tabs */}
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
            <div className="border-border-light bg-bg-app flex h-[340px] items-center justify-center overflow-hidden rounded-lg border p-6 sm:h-[420px] sm:p-8">
              {activeTab === 'dashboard' && (
                <div className="w-full max-w-lg space-y-5 text-left">
                  <div className="border-border-base/60 flex items-center justify-between border-b pb-3">
                    <h4 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                      Dashboard Overview
                    </h4>
                    <span className="text-primary-600 text-xs font-bold">Active Session</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-surface border-border-base rounded-lg border p-4">
                      <p className="text-text-sub text-[10px] font-bold uppercase">Total books</p>
                      <p className="text-text-main mt-1 text-xl font-bold">4 Books</p>
                    </div>
                    <div className="bg-bg-surface border-border-base rounded-lg border p-4">
                      <p className="text-text-sub text-[10px] font-bold uppercase">Storage Used</p>
                      <p className="text-text-main mt-1 text-xl font-bold">15.8 MB of 1 GB</p>
                    </div>
                  </div>
                  {/* Storage alert indicator */}
                  <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 text-text-sub flex items-start gap-2.5 rounded-lg border p-3 text-xs leading-normal">
                    <Sparkles className="text-primary-500 mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Free Plan active. You can upgrade parameters inside configuration triggers at
                      any time.
                    </span>
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { title: 'Atomic Habits', author: 'James Clear', tag: 'Self-help' },
                      { title: 'Clean Code', author: 'Robert C. Martin', tag: 'Engineering' },
                      { title: 'Deep Work', author: 'Cal Newport', tag: 'Productivity' },
                      { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', tag: 'Finance' },
                    ].map((book, idx) => (
                      <div
                        key={idx}
                        className="bg-bg-surface border-border-base hover:border-slate-350 flex items-center gap-3 rounded-lg border p-3 text-xs font-semibold"
                      >
                        <div className="bg-sec-100 text-text-muted flex h-11 w-8 shrink-0 items-center justify-center rounded text-[8px] font-bold">
                          Cover
                        </div>
                        <div className="min-w-0">
                          <span className="text-text-main block truncate">{book.title}</span>
                          <span className="text-text-muted mt-0.5 block truncate text-[10px]">
                            By {book.author}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reader' && (
                <div className="bg-bg-surface border-border-base flex h-60 w-full max-w-md flex-col justify-between rounded-lg border p-6 text-left shadow-sm">
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
                  <Upload className="text-text-muted mx-auto h-8 w-8 animate-[bounce_2s_infinite]" />
                  <p className="text-text-main mt-4 text-xs font-bold">
                    Drag and drop book files here
                  </p>
                  <p className="text-text-muted mt-1 text-[10px]">PDF file formats up to 50MB</p>
                  <div className="bg-primary-600 hover:bg-primary-700 mx-auto mt-4 flex h-7 w-28 cursor-pointer items-center justify-center rounded text-[10px] font-bold text-white shadow-md transition-colors">
                    Browse Files
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
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
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="glass-effect bg-bg-surface/50 border-border-base flex flex-col justify-between space-y-6 rounded-xl border p-6 text-left shadow-sm"
              >
                <p className="text-text-sub text-sm leading-relaxed italic">"{test.quote}"</p>

                <div className="flex items-center gap-3">
                  <img
                    src={test.avatar}
                    alt={test.author}
                    className="ring-primary-500/10 h-14 w-14 rounded-full object-cover shadow-sm ring-2"
                  />
                  <div>
                    <h4 className="text-text-main text-xs font-bold">{test.author}</h4>
                    <p className="text-text-muted mt-0.5 text-[10px] font-semibold">{test.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section */}
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

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="border-border-light overflow-hidden border-t"
                      >
                        <div className="px-5 pt-3 pb-5">
                          <p className="text-text-sub text-xs leading-relaxed">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="from-primary-600 shadow-primary-500/10 relative z-10 overflow-hidden rounded-3xl bg-gradient-to-r to-indigo-600 p-8 text-center text-white shadow-lg sm:p-16">
            {/* Background Glow Layers */}
            <div className="pointer-events-none absolute top-0 right-0 z-0 h-80 w-80 rounded-full bg-white/10 blur-3xl select-none" />
            <div className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl select-none" />

            {/* Content Container */}
            <div className="relative z-10 mx-auto max-w-xl space-y-4">
              <h2 className="text-3xl leading-[1.1] font-extrabold tracking-tight text-white opacity-100 sm:text-4xl">
                Start Building Your Personal Library Today
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-indigo-50 opacity-100">
                Upload your documents and check our progressive reader controls immediately. Free
                tier includes up to 1 GB cloud storage.
              </p>
            </div>

            {/* Buttons Container */}
            <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button className="text-primary-600 border-transparent bg-white px-6 py-3 shadow-sm hover:bg-slate-100">
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
    </>
  )
}

// Simple placeholder icon component for Timeline user step
const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4.5 w-4.5"
    {...props}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
