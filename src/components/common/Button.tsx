import React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) => {
  // Variant styling mapping using Librovia design system variables
  const baseStyles =
    'inline-flex items-center justify-center font-semibold tracking-wide rounded-sm active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 premium-button'

  const variants = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/10 cursor-pointer',
    secondary:
      'bg-sec-100 hover:bg-sec-100/80 dark:bg-sec-100 dark:hover:bg-sec-100/80 text-text-main cursor-pointer',
    outline: 'border border-border-base hover:bg-bg-app text-text-main cursor-pointer',
    ghost: 'hover:bg-bg-app text-text-main cursor-pointer',
    danger:
      'bg-error-500 hover:bg-error-500/90 text-white shadow-sm shadow-error-500/10 cursor-pointer',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-sm',
    md: 'text-sm px-4 py-2.5 gap-2 rounded-md',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-lg',
  }

  const isBtnDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isBtnDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
      {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}
