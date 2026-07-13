import React, { forwardRef } from 'react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1 text-left">
        <div className="flex items-center gap-2.5">
          <input
            id={id}
            type="checkbox"
            ref={ref}
            className={`border-border-base bg-bg-surface text-primary-600 focus:ring-primary-500/20 h-4 w-4 cursor-pointer rounded-xs border shadow-sm transition-all focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${error ? 'border-error-500' : ''} ${className} `}
            {...props}
          />
          {label && (
            <label
              htmlFor={id}
              className="text-text-sub cursor-pointer text-sm font-semibold select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-error-500 pl-6 text-xs font-semibold select-none">{error}</p>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
