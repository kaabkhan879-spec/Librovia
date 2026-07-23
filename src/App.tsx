import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { ThemeProvider } from './context/ThemeContext'
import { PWAHandler } from './components/common/PWAHandler'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PWAHandler />
        <AuthProvider>
          <ToastProvider>
            <SubscriptionProvider>
              <AppRoutes />
            </SubscriptionProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
