import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { supabase } from '../../services/supabase'
import { PasswordInput } from './PasswordInput'
import { GoogleButton } from './GoogleButton'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { Mail, ArrowRight } from 'lucide-react'
import { AuthCard } from './AuthCard'

export const LoginForm: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { email?: string; password?: string } = {}

    // Validation checks
    if (!email) {
      newErrors.email = 'Email address is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    login(email, password)
      .then((loggedUser) => {
        setIsLoading(false)
        if (loggedUser?.role === 'super_admin') {
          navigate(ROUTES.ADMIN)
        } else {
          navigate(ROUTES.DASHBOARD)
        }
      })
      .catch((err: unknown) => {
        setIsLoading(false)
        const message = err instanceof Error ? err.message : String(err)
        setErrors({ email: message || 'Invalid login details.' })
      })
  }

  return (
    <AuthCard>
      <div className="space-y-6 text-left">
        <div>
          <h2 className="text-text-main text-2xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="text-text-muted mt-1 text-xs font-semibold">
            Please enter your login details to access your shelf.
          </p>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email}
            disabled={isLoading}
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between text-xs font-semibold select-none">
            <label className="text-text-sub flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="border-border-base text-primary-600 focus:ring-primary-500/10 h-4 w-4 cursor-pointer rounded"
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full justify-center py-2.5 text-center font-bold"
            loading={isLoading}
            disabled={isLoading}
            rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {isLoading ? 'Signing In...' : 'Login to Shelf'}
          </Button>
        </form>

        <div className="relative my-4 flex items-center justify-center select-none">
          <div className="bg-border-base absolute inset-x-0 h-px" />
          <span className="bg-bg-surface text-text-muted relative z-10 px-3 text-[10px] font-bold tracking-widest uppercase">
            Or continue with
          </span>
        </div>

        <GoogleButton
          onClick={async () => {
            setIsLoading(true)
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}${ROUTES.DASHBOARD}`,
                },
              })
              if (error) throw error
            } catch (err) {
              setIsLoading(false)
              console.error(err)
            }
          }}
          disabled={isLoading}
          label={isLoading ? 'Connecting Google...' : 'Continue with Google'}
        />

        <p className="text-text-sub pt-2 text-center text-xs font-semibold select-none">
          Don't have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
