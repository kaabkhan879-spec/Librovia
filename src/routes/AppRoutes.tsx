import React, { Suspense } from 'react'
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

// Lazy loaded Pages
const LoginPage = React.lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = React.lazy(() =>
  import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)
const ForgotPasswordPage = React.lazy(() =>
  import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = React.lazy(() =>
  import('../pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)
const DashboardPage = React.lazy(() =>
  import('../pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const LibraryPage = React.lazy(() =>
  import('../pages/library/LibraryPage').then((m) => ({ default: m.LibraryPage }))
)
const UploadBookPage = React.lazy(() =>
  import('../pages/upload/UploadBookPage').then((m) => ({ default: m.UploadBookPage }))
)
const BookDetailsPage = React.lazy(() =>
  import('../pages/book-details/BookDetailsPage').then((m) => ({ default: m.BookDetailsPage }))
)
const ReaderPage = React.lazy(() =>
  import('../pages/reader/ReaderPage').then((m) => ({ default: m.ReaderPage }))
)
const CategoriesPage = React.lazy(() =>
  import('../pages/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
)
const NotesPage = React.lazy(() =>
  import('../pages/notes/NotesPage').then((m) => ({ default: m.NotesPage }))
)
const ProfilePage = React.lazy(() =>
  import('../pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)
const SettingsPage = React.lazy(() =>
  import('../pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const StoragePage = React.lazy(() =>
  import('../pages/storage/StoragePage').then((m) => ({ default: m.StoragePage }))
)
const AnalyticsPage = React.lazy(() =>
  import('../pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
)
const SubscriptionPage = React.lazy(() =>
  import('../pages/subscription/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage }))
)
const SharedLibraryPage = React.lazy(() =>
  import('../pages/shared-library/SharedLibraryPage').then((m) => ({
    default: m.SharedLibraryPage,
  }))
)

// Super Admin SaaS Pages
const AdminDashboardPage = React.lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
)
const AdminUsersPage = React.lazy(() =>
  import('../pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
)
const AdminSubscriptionsPage = React.lazy(() =>
  import('../pages/admin/AdminSubscriptionsPage').then((m) => ({
    default: m.AdminSubscriptionsPage,
  }))
)
const AdminPaymentsPage = React.lazy(() =>
  import('../pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage }))
)
const AdminStoragePage = React.lazy(() =>
  import('../pages/admin/AdminStoragePage').then((m) => ({ default: m.AdminStoragePage }))
)
const AdminLibraryPage = React.lazy(() =>
  import('../pages/admin/AdminLibraryPage').then((m) => ({ default: m.AdminLibraryPage }))
)
const AdminReportsPage = React.lazy(() =>
  import('../pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage }))
)
const AdminAnnouncementsPage = React.lazy(() =>
  import('../pages/admin/AdminAnnouncementsPage').then((m) => ({
    default: m.AdminAnnouncementsPage,
  }))
)
const AdminSystemSettingsPage = React.lazy(() =>
  import('../pages/admin/AdminSystemSettingsPage').then((m) => ({
    default: m.AdminSystemSettingsPage,
  }))
)
const AdminAuditLogsPage = React.lazy(() =>
  import('../pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage }))
)

const RouteLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600 dark:border-slate-800 dark:border-t-purple-500" />
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        Loading Librovian canvas...
      </span>
    </div>
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Pages Layout */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.LANDING} element={<Navigate to={ROUTES.LOGIN} replace />} />

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
            <Route path={ROUTES.SHARED_LIBRARY} element={<SharedLibraryPage />} />
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
    </Suspense>
  )
}
