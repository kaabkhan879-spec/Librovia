import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { PasswordInput } from './PasswordInput'
import { GoogleButton } from './GoogleButton'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { Mail, User, ShieldAlert, ArrowRight } from 'lucide-react'
import { AuthCard } from './AuthCard'

export const RegisterForm: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errors, setErrors] = useState<{
    fullName?: string
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}

    if (!fullName) {
      newErrors.fullName = 'Full Name is required'
    }

    if (!username) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

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

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    // Simulate registration timeout (1.5s)
    setTimeout(() => {
      login(email, password)
        .then(() => {
          setIsLoading(false)
          navigate(ROUTES.DASHBOARD)
        })
        .catch(() => setIsLoading(false))
    }, 1500)
  }

  return (
    <AuthCard>
      <div className="space-y-5 text-left">
        <div>
          <h2 className="text-text-main text-2xl font-extrabold tracking-tight">
            Create an account
          </h2>
          <p className="text-text-muted mt-1 font-sans text-xs font-semibold">
            Get started with 1 GB free cloud library storage today.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.fullName}
            disabled={isLoading}
          />

          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            leftIcon={<ShieldAlert className="h-4 w-4" />}
            error={errors.username}
            disabled={isLoading}
          />

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

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="mt-2.5 w-full justify-center py-2.5 text-center font-bold"
            loading={isLoading}
            disabled={isLoading}
            rightIcon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="relative my-3 flex items-center justify-center select-none">
          <div className="bg-border-base absolute inset-x-0 h-px" />
          <span className="bg-bg-surface text-text-muted relative z-10 px-3 text-[10px] font-bold tracking-widest uppercase">
            Or register with
          </span>
        </div>

        <GoogleButton
          onClick={() => {
            setIsLoading(true)
            setTimeout(() => {
              login('google@librovia.com', 'google-auth-key')
                .then(() => {
                  setIsLoading(false)
                  navigate(ROUTES.DASHBOARD)
                })
                .catch(() => setIsLoading(false))
            }, 1500)
          }}
          disabled={isLoading}
          label={isLoading ? 'Connecting Google...' : 'Continue with Google'}
        />

        <p className="text-text-sub pt-1 text-center text-xs font-semibold select-none">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
