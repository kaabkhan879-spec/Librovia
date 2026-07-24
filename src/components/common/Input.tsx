import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  labelClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, type = 'text', labelClassName, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={id}
            className={labelClassName || "text-text-sub block text-xs font-bold tracking-wider uppercase"}
          >
            {label}
          </label>
        )}
        <div className="relative rounded-sm">
          {leftIcon && (
            <div className="text-text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            className={`bg-bg-surface text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 disabled:bg-bg-app disabled:text-text-muted block w-full rounded-sm border px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:opacity-50 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' : 'border-border-base'} ${className} `}
            {...props}
          />
          {rightIcon && (
            <div className="text-text-muted absolute inset-y-0 right-0 flex items-center pr-3.5">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-error-500 mt-1 text-xs font-semibold select-none">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
