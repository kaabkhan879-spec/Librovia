import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { Select } from '../../components/common/Select'
import { Checkbox } from '../../components/common/Checkbox'
import { Toggle } from '../../components/common/Toggle'
import { ROUTES } from '../../constants/routes'
import {
  BookOpen,
  Search,
  Lock,
  Info,
  ArrowRight,
  TrendingUp,
  Folder,
  ChevronRight,
} from 'lucide-react'

export const DesignSystemShowcase: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [toggleVal, setToggleVal] = useState(true)
  const [checkVal, setCheckVal] = useState(false)
  const [selectVal, setSelectVal] = useState('1')
  const [textInput, setTextInput] = useState('Linear design system')

  // Effect to toggle the dark class on <html> document element
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  const selectOptions = [
    { value: '1', label: 'Classic Paper (Warm Cream)' },
    { value: '2', label: 'Pure White (High Contrast)' },
    { value: '3', label: 'Charcoal (Night Reading)' },
  ]

  return (
    <div className="bg-bg-app text-text-main min-h-screen px-4 py-12 select-none sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header Controls */}
        <div className="border-border-base flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
              UI Foundation
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Librovia Design System</h1>
            <p className="text-text-sub mt-1 text-sm">
              Interactive tokens, typography grids, buttons, and input forms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Toggle
              id="theme-toggler"
              checked={isDarkMode}
              onChange={setIsDarkMode}
              label={isDarkMode ? 'Obsidian Theme' : 'Paper Theme'}
            />
            <Link
              to={ROUTES.LANDING}
              className="border-border-base bg-bg-surface text-text-main hover:bg-bg-app rounded-md border px-4 py-2 text-xs font-semibold shadow-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* 1. Color Palette Swatches */}
        <section className="space-y-4">
          <h2 className="border-border-light flex items-center gap-2 border-b pb-2 text-lg font-bold">
            <span className="bg-primary-600 h-2 w-2 rounded-full" />
            Color Palette & Tokens
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              {
                name: 'Primary (indigo)',
                bg: 'bg-primary-600',
                text: 'text-white',
                hex: '--color-primary-600',
              },
              {
                name: 'App Background',
                bg: 'bg-bg-app border border-border-base',
                text: 'text-text-main',
                hex: '--color-bg-app',
              },
              {
                name: 'Surface Background',
                bg: 'bg-bg-surface border border-border-base',
                text: 'text-text-main',
                hex: '--color-bg-surface',
              },
              {
                name: 'Primary Borders',
                bg: 'bg-border-base',
                text: 'text-text-sub',
                hex: '--color-border-base',
              },
              {
                name: 'Success Accent',
                bg: 'bg-success-500',
                text: 'text-white',
                hex: '--color-success-500',
              },
            ].map((color, idx) => (
              <div
                key={idx}
                className="border-border-base bg-bg-surface flex h-28 flex-col justify-between overflow-hidden rounded-md border shadow-sm"
              >
                <div className={`h-12 w-full ${color.bg}`} />
                <div className="p-3 text-left">
                  <p className="text-text-main truncate text-xs leading-tight font-bold">
                    {color.name}
                  </p>
                  <p className="text-text-muted mt-0.5 font-mono text-[9px]">{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Typography Headings */}
        <section className="space-y-4">
          <h2 className="border-border-light flex items-center gap-2 border-b pb-2 text-lg font-bold">
            <span className="bg-primary-600 h-2 w-2 rounded-full" />
            Typography Scales
          </h2>
          <div className="border-border-base bg-bg-surface space-y-4 rounded-lg border p-6 text-left">
            <div className="border-border-light border-b pb-4">
              <span className="text-text-muted font-mono text-[10px]">
                Outfit Bold font family (Headings)
              </span>
              <h1 className="mt-1 text-3xl font-extrabold">Heading 1: Secure Cloud Libraries</h1>
              <h2 className="mt-2 text-2xl font-bold">Heading 2: Secure Cloud Libraries</h2>
              <h3 className="mt-2 text-xl font-bold">Heading 3: Secure Cloud Libraries</h3>
            </div>
            <div>
              <span className="text-text-muted font-mono text-[10px]">
                Inter Regular font family (Body & UI text)
              </span>
              <p className="text-text-sub mt-1 text-sm leading-relaxed">
                This is a paragraph showcasing the core body text scale. The user interface uses
                Outfit for layout headers and Inter for descriptions, button actions, and inputs.
                These fonts provide maximum visibility and read ratios across multiple mobile
                viewports.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Reusable Button Components */}
        <section className="space-y-4">
          <h2 className="border-border-light flex items-center gap-2 border-b pb-2 text-lg font-bold">
            <span className="bg-primary-600 h-2 w-2 rounded-full" />
            Buttons Library
          </h2>
          <div className="border-border-base bg-bg-surface space-y-6 rounded-lg border p-6 text-left">
            {/* Variants */}
            <div className="space-y-2">
              <p className="text-text-muted text-xs font-bold tracking-wider uppercase">
                Button Variants
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Option</Button>
                <Button variant="ghost">Ghost Option</Button>
                <Button variant="danger">Danger Action</Button>
              </div>
            </div>

            {/* Sizes & Icons */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-text-muted text-xs font-bold tracking-wider uppercase">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">
                    Small size
                  </Button>
                  <Button variant="primary" size="md">
                    Medium size
                  </Button>
                  <Button variant="primary" size="lg">
                    Large size
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-text-muted text-xs font-bold tracking-wider uppercase">
                  Loading & Icons
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" loading>
                    Loading Button
                  </Button>
                  <Button variant="secondary" leftIcon={<Info className="h-4 w-4" />}>
                    Left Icon
                  </Button>
                  <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Right Icon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Form Components */}
        <section className="space-y-4">
          <h2 className="border-border-light flex items-center gap-2 border-b pb-2 text-lg font-bold">
            <span className="bg-primary-600 h-2 w-2 rounded-full" />
            Form Components
          </h2>
          <div className="border-border-base bg-bg-surface space-y-6 rounded-lg border p-6">
            <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
              {/* Text Input */}
              <Input
                label="Book Title"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g. Atomic Habits"
                leftIcon={<BookOpen className="h-4 w-4" />}
              />

              {/* Password Input */}
              <Input
                label="Security Key"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
              />

              {/* Search input */}
              <Input
                label="Search Library"
                placeholder="Search authors, tags..."
                leftIcon={<Search className="h-4 w-4" />}
              />

              {/* Dropdown Selector */}
              <Select
                label="Reading Mode Theme"
                options={selectOptions}
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
              />
            </div>

            <div className="border-border-light grid grid-cols-1 gap-6 border-t pt-6 text-left sm:grid-cols-2">
              {/* Textarea */}
              <Textarea
                label="Personal Notes"
                placeholder="Write summary notes or reviews of your books..."
              />

              {/* Checkboxes & Switches */}
              <div className="flex flex-col justify-center space-y-4">
                <Checkbox
                  id="favorites-check"
                  label="Pin to favorites"
                  checked={checkVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCheckVal(e.target.checked)
                  }
                />

                <Toggle
                  id="notif-toggle"
                  label="Receive email notifications"
                  checked={toggleVal}
                  onChange={setToggleVal}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Cards & UI Indicators */}
        <section className="space-y-4">
          <h2 className="border-border-light flex items-center gap-2 border-b pb-2 text-lg font-bold">
            <span className="bg-primary-600 h-2 w-2 rounded-full" />
            Cards & Widgets
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Stats Card */}
            <div className="border-border-base bg-bg-surface flex items-center gap-4 rounded-md border p-5 text-left shadow-sm">
              <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-text-sub text-xs font-bold tracking-wider uppercase">
                  Reading progress
                </p>
                <h4 className="text-text-main mt-0.5 text-xl font-bold">85% average</h4>
              </div>
            </div>

            {/* Book Card */}
            <div className="border-border-base bg-bg-surface flex flex-col justify-between rounded-md border p-3 text-left shadow-sm">
              <div className="flex gap-3">
                <div className="bg-sec-100 text-text-muted flex h-16 w-11 shrink-0 items-center justify-center rounded shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-text-main max-w-[150px] truncate text-xs font-bold">
                    Atomic Habits
                  </h4>
                  <p className="text-text-sub mt-0.5 text-[10px]">James Clear</p>
                  <span className="bg-accent-50 text-accent-500 mt-2 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold">
                    Self-Help
                  </span>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <div className="border-border-base bg-bg-surface flex flex-col justify-between rounded-md border p-5 text-left shadow-sm">
              <div className="flex items-start justify-between">
                <Folder className="text-primary-500 h-5 w-5" />
                <span className="bg-primary-50 text-primary-600 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase">
                  5 Books
                </span>
              </div>
              <h4 className="text-text-main mt-4 text-xs font-bold tracking-wider uppercase">
                Technical books
              </h4>
            </div>
          </div>
        </section>

        {/* 6. Navigation Elements */}
        <section className="space-y-4">
          <h2 className="border-border-light flex items-center gap-2 border-b pb-2 text-lg font-bold">
            <span className="bg-primary-600 h-2 w-2 rounded-full" />
            Navigation Layouts
          </h2>
          <div className="border-border-base bg-bg-surface space-y-4 rounded-lg border p-6 text-left">
            {/* Breadcrumbs */}
            <div>
              <p className="text-text-muted mb-2 text-xs font-bold tracking-wider uppercase">
                Breadcrumbs
              </p>
              <nav className="text-text-sub flex items-center gap-1.5 text-xs font-semibold">
                <Link to={ROUTES.DASHBOARD} className="hover:text-primary-600">
                  Home
                </Link>
                <ChevronRight className="text-text-muted h-3.5 w-3.5" />
                <Link to={ROUTES.LIBRARY} className="hover:text-primary-600">
                  Shelf
                </Link>
                <ChevronRight className="text-text-muted h-3.5 w-3.5" />
                <span className="text-text-muted select-none">Atomic Habits</span>
              </nav>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
