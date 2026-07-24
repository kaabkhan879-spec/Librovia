import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { supabase } from '../../services/supabase'
import { PasswordInput } from './PasswordInput'
import { GoogleButton } from './GoogleButton'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { Mail, ArrowRight, AlertTriangle } from 'lucide-react'
import { AuthCard } from './AuthCard'

// Check if Supabase keys are correctly defined (i.e. not the default placeholder values)
const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-public-key'

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
      <div className="space-y-7 text-left">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#FFFFFF]">Welcome Back 👋</h2>
          <p className="mt-2 text-xs font-semibold text-[#CBD5E1]">
            Sign in to continue your reading journey.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="space-y-1.5 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse text-amber-500" />
              <span>Configuration Required</span>
            </div>
            <p className="leading-relaxed text-amber-200/80">
              Supabase connection keys are missing from the build environment. If this is deployed
              on Vercel, please add{' '}
              <code className="rounded bg-black/35 px-1 py-0.5 font-mono text-[10px] text-amber-300">
                VITE_SUPABASE_URL
              </code>{' '}
              and{' '}
              <code className="rounded bg-black/35 px-1 py-0.5 font-mono text-[10px] text-amber-300">
                VITE_SUPABASE_ANON_KEY
              </code>{' '}
              to your Vercel Project Settings, then redeploy the project.
            </p>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="h-4.5 w-4.5 text-[#A78BFA]" />}
            error={errors.email}
            disabled={isLoading}
            labelClassName="text-[#E2E8F0] font-semibold text-xs tracking-wider uppercase block mb-2"
            className="!rounded-2xl !border-[#334155] !bg-[#1E293B] !py-3.5 !pl-11 !text-[#FFFFFF] placeholder:!text-[#94A3B8] focus:!border-[#8B5CF6] focus:!ring-4 focus:!ring-[#8B5CF6]/20"
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
            disabled={isLoading}
            labelClassName="text-[#E2E8F0] font-semibold text-xs tracking-wider uppercase block mb-2"
            className="!rounded-2xl !border-[#334155] !bg-[#1E293B] !py-3.5 !text-[#FFFFFF] placeholder:!text-[#94A3B8] focus:!border-[#8B5CF6] focus:!ring-4 focus:!ring-[#8B5CF6]/20"
          />

          <div className="flex items-center justify-between py-1 text-xs font-semibold select-none">
            <label className="flex cursor-pointer items-center gap-2.5 text-[#E2E8F0]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-800 text-[#8B5CF6] accent-[#8B5CF6] focus:ring-[#8B5CF6]/20 focus:ring-offset-[#0B0F19]"
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-[#8B5CF6] transition-colors duration-200 hover:text-[#A855F7] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-3 w-full justify-center !rounded-2xl !bg-gradient-to-r !from-[#7C3AED] !to-[#9333EA] !py-3.5 text-center font-bold !shadow-[0_12px_40px_rgba(124,58,237,0.35)] transition-all duration-200 hover:scale-[1.01] hover:!from-[#8B5CF6] hover:!to-[#A855F7] active:scale-[0.99]"
            loading={isLoading}
            disabled={isLoading}
            rightIcon={!isLoading ? <ArrowRight className="h-4.5 w-4.5" /> : undefined}
          >
            {isLoading ? 'Signing In...' : 'Login to Librovia'}
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center select-none">
          <div className="absolute inset-x-0 h-px bg-[#334155]/60" />
          <span className="relative z-10 bg-[#0F172A] px-4 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">
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

        <p className="text-text-sub pt-3 text-center text-xs font-semibold select-none">
          Don't have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-bold text-[#8B5CF6] transition-colors duration-200 hover:text-[#A855F7] hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
