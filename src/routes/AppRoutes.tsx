import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

// Layouts
import { PublicLayout } from '../layouts/PublicLayout'
import { AppLayout } from '../layouts/AppLayout'
import { AdminLayout } from '../layouts/AdminLayout'

// Guards
import { PrivateRoute } from './PrivateRoute'
import { PublicRoute } from './PublicRoute'
import { AdminRoute } from './AdminRoute'

// Pages
import { LandingPage } from '../pages/landing/LandingPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { LibraryPage } from '../pages/library/LibraryPage'
import { UploadBookPage } from '../pages/upload/UploadBookPage'
import { BookDetailsPage } from '../pages/book-details/BookDetailsPage'
import { ReaderPage } from '../pages/reader/ReaderPage'
import { CategoriesPage } from '../pages/categories/CategoriesPage'
import { NotesPage } from '../pages/notes/NotesPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { StoragePage } from '../pages/storage/StoragePage'
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage'
import { SubscriptionPage } from '../pages/subscription/SubscriptionPage'

// Super Admin SaaS Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminSubscriptionsPage } from '../pages/admin/AdminSubscriptionsPage'
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage'
import { AdminStoragePage } from '../pages/admin/AdminStoragePage'
import { AdminLibraryPage } from '../pages/admin/AdminLibraryPage'
import { AdminReportsPage } from '../pages/admin/AdminReportsPage'
import { AdminAnnouncementsPage } from '../pages/admin/AdminAnnouncementsPage'
import { AdminSystemSettingsPage } from '../pages/admin/AdminSystemSettingsPage'
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage'

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
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Authenticated Reader Dashboard Pages wrapped in PrivateRoute guard */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.LIBRARY} element={<LibraryPage />} />
          <Route path={ROUTES.UPLOAD} element={<UploadBookPage />} />
          <Route path={ROUTES.BOOK_DETAILS} element={<BookDetailsPage />} />
          <Route path={ROUTES.READER} element={<ReaderPage />} />
          <Route
            path={ROUTES.FAVORITES}
            element={<Navigate to="/library?tab=favorites" replace />}
          />
          <Route path={ROUTES.COLLECTIONS} element={<CategoriesPage />} />
          <Route path={ROUTES.NOTES} element={<NotesPage />} />
          <Route path={ROUTES.READING} element={<Navigate to="/analytics" replace />} />
          <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.STORAGE} element={<StoragePage />} />
          <Route path={ROUTES.SUBSCRIPTION} element={<SubscriptionPage />} />
        </Route>

        {/* Dedicated Super Admin SaaS Suite wrapped in AdminRoute guard + AdminLayout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
            <Route path={ROUTES.ADMIN_SUBSCRIPTIONS} element={<AdminSubscriptionsPage />} />
            <Route path={ROUTES.ADMIN_PAYMENTS} element={<AdminPaymentsPage />} />
            <Route path={ROUTES.ADMIN_STORAGE} element={<AdminStoragePage />} />
            <Route path={ROUTES.ADMIN_LIBRARY} element={<AdminLibraryPage />} />
            <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
            <Route path={ROUTES.ADMIN_ANNOUNCEMENTS} element={<AdminAnnouncementsPage />} />
            <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSystemSettingsPage />} />
            <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback Catch All */}
      <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
    </Routes>
  )
}
