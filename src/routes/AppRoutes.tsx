import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

// Layouts
import { PublicLayout } from '../layouts/PublicLayout'
import { AppLayout } from '../layouts/AppLayout'

// Guards
import { PrivateRoute } from './PrivateRoute'
import { PublicRoute } from './PublicRoute'

// Pages
import { LandingPage } from '../pages/landing/LandingPage'
import { LoginPage } from '../pages/login/LoginPage'
import { RegisterPage } from '../pages/register/RegisterPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { LibraryPage } from '../pages/library/LibraryPage'
import { UploadBookPage } from '../pages/upload/UploadBookPage'
import { BookDetailsPage } from '../pages/book-details/BookDetailsPage'
import { ReaderPage } from '../pages/reader/ReaderPage'
import { FavoritesPage } from '../pages/favorites/FavoritesPage'
import { CategoriesPage } from '../pages/categories/CategoriesPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { DesignSystemShowcase } from '../pages/showcase/DesignSystemShowcase'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.LANDING} element={<LandingPage />} />

        {/* Auth Pages wrapped in PublicRoute guard */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Authenticated Dashboard Pages wrapped in PrivateRoute guard */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
          <Route path={ROUTES.UPLOAD} element={<UploadBookPage />} />
          <Route path={ROUTES.BOOK_DETAILS} element={<BookDetailsPage />} />
          <Route path={ROUTES.READER} element={<ReaderPage />} />
          <Route path={ROUTES.FAVORITES} element={<FavoritesPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Design System Showcase Route */}
      <Route path={ROUTES.DESIGN_SYSTEM} element={<DesignSystemShowcase />} />

      {/* Fallback Catch All */}
      <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
    </Routes>
  )
}
