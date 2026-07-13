import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { supabase } from '../../services/supabase'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { Mail, CheckCircle2, ArrowLeft, Send } from 'lucide-react'
import { AuthCard } from './AuthCard'

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Email address is required')
      return
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setIsLoading(true)

    supabase.auth
      .resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${ROUTES.LOGIN}`,
      })
      .then(({ error }) => {
        setIsLoading(false)
        if (error) {
          setError(error.message)
        } else {
          setIsSuccess(true)
        }
      })
      .catch((err) => {
        setIsLoading(false)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      })
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
              Check your inbox
            </h2>
            <p className="text-text-sub max-w-sm text-xs leading-relaxed">
              We have simulated sending a password reset link to{' '}
              <strong className="text-text-main">{email}</strong>. Please check your emails.
            </p>
          </div>

          <Link to={ROUTES.LOGIN} className="mt-4 block">
            <Button variant="outline" className="w-full justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="space-y-6 text-left">
        <div className="space-y-2">
          <h2 className="text-text-main text-2xl font-extrabold tracking-tight">Forgot Password</h2>
          <p className="text-text-muted text-xs leading-relaxed font-semibold">
            Enter your account email. We will simulate sending you a link to reset your credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={error}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full justify-center py-2.5 font-bold"
            loading={isLoading}
            disabled={isLoading}
            rightIcon={!isLoading ? <Send className="h-4 w-4" /> : undefined}
          >
            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className="text-text-sub border-border-light border-t pt-2 text-center text-xs font-semibold select-none">
          <Link
            to={ROUTES.LOGIN}
            className="text-text-muted hover:text-primary-600 inline-flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
