/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ActiveTheme = 'light' | 'dark'

interface ThemeContextType {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  activeTheme: ActiveTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('librovia_theme_mode')
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved as ThemeMode
    }
    return 'system'
  })

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>('light')

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem('librovia_theme_mode', mode)
    localStorage.setItem('librovia-theme', mode === 'system' ? '' : mode)
  }

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      let resolvedTheme: ActiveTheme

      if (themeMode === 'dark') {
        resolvedTheme = 'dark'
      } else if (themeMode === 'light') {
        resolvedTheme = 'light'
      } else {
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light'
      }

      setActiveTheme(resolvedTheme)

      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    applyTheme()

    // Listen for system theme changes dynamically
    const listener = () => {
      if (themeMode === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [themeMode])

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
