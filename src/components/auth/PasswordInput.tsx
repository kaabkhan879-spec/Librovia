import React, { useState, forwardRef } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

export interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="text-text-sub font-sans text-xs font-bold tracking-wider uppercase">
            {label}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {/* Left Icon */}
          <div className="text-text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-4 w-4" />
          </div>

          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`border-border-base bg-bg-surface text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border py-2.5 pr-10 pl-10 text-sm shadow-inner transition-all focus:ring-2 focus:outline-none ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' : ''} ${className} `}
            {...props}
          />

          {/* Right Visibility Toggle Toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-text-muted hover:text-text-main absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="text-error-500 mt-1 text-xs font-semibold">{error}</p>}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
