import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { supabase } from '../../services/supabase'
import { Button } from '../common/Button'
import { PasswordInput } from './PasswordInput'
import { CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { AuthCard } from './AuthCard'
import { useToast } from '../../context/ToastContext'

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Validation States
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [globalError, setGlobalError] = useState('')

  // Verify that the user came via a recovery reset link / has valid session
  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true)
      }
    })

    // 2. Listen for PASSWORD_RECOVERY event or active session detection
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true)
      }
    })

    // 3. Fallback check for access token in hash or query parameters
    const timer = setTimeout(() => {
      const hash = window.location.hash || window.location.search
      if (
        hash &&
        (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('token='))
      ) {
        setHasSession(true)
      } else {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setHasSession(false)
            setGlobalError(
              'Invalid or expired password reset link. Please request a new recovery link.'
            )
          }
        })
      }
    }, 800)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  // Live Password Strength Check
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-200', pct: 0 }
    let score = 0
    if (password.length >= 8) score += 25
    if (/[A-Z]/.test(password)) score += 25
    if (/[0-9]/.test(password)) score += 25
    if (/[^A-Za-z0-9]/.test(password)) score += 25

    if (score <= 25) return { label: 'Weak', color: 'bg-rose-500', pct: 25 }
    if (score <= 50) return { label: 'Fair', color: 'bg-amber-500', pct: 50 }
    if (score <= 75) return { label: 'Good', color: 'bg-blue-500', pct: 75 }
    return { label: 'Strong', color: 'bg-emerald-500', pct: 100 }
  }

  const strength = getPasswordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setConfirmError('')
    setGlobalError('')

    let valid = true
    if (!password) {
      setPasswordError('New password is required')
      valid = false
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      valid = false
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match')
      valid = false
    }

    if (!valid) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      await supabase.auth.signOut()
      setIsSuccess(true)
      showSuccess('Password updated successfully. Please log in with your new password.')

      // Delay redirect to login so they see the success card
      setTimeout(() => {
        navigate(ROUTES.LOGIN)
      }, 3000)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update password. Your reset link may have expired.'
      setGlobalError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthCard>
        <div className="space-y-5 text-center">
          <div className="bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-text-main text-xl font-extrabold tracking-tight">
              Password Updated
            </h2>
            <p className="text-text-sub max-w-sm text-xs leading-relaxed">
              Password updated successfully. Please log in with your new password.
            </p>
          </div>

          <Link to={ROUTES.LOGIN} className="mt-4 block">
            <Button variant="primary" className="w-full justify-center">
              Go to Login
            </Button>
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (hasSession === false) {
    return (
      <AuthCard>
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-text-main text-xl font-extrabold tracking-tight">
              Link Expired or Invalid
            </h2>
            <p className="text-text-sub max-w-sm text-xs leading-relaxed">
              {globalError ||
                'The password reset link is invalid, expired, or has already been used.'}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link to={ROUTES.FORGOT_PASSWORD} className="block">
              <Button variant="primary" className="w-full justify-center gap-2">
                Request New Reset Email
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN} className="block">
              <Button variant="outline" className="w-full justify-center">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="space-y-6 text-left">
        <div className="space-y-2">
          <h2 className="text-text-main text-2xl font-extrabold tracking-tight">Reset Password</h2>
          <p className="text-text-muted text-xs leading-relaxed font-semibold">
            Please enter your new password to secure your Librovia account.
          </p>
        </div>

        {globalError && (
          <div className="flex gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={passwordError}
            disabled={isLoading}
          />

          {/* Password strength meter */}
          {password && (
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
                <span>
                  Strength:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">{strength.label}</strong>
                </span>
                <span>{strength.pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.pct}%` }}
                />
              </div>
            </div>
          )}

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            error={confirmError}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full justify-center py-2.5 font-bold"
            loading={isLoading}
            disabled={isLoading || hasSession === null}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>

        <p className="text-text-sub border-border-light border-t pt-2 text-center text-xs font-semibold select-none">
          <Link
            to={ROUTES.LOGIN}
            className="text-text-muted hover:text-primary-600 inline-flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
