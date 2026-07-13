import React, { forwardRef } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={id}
            className="text-text-sub block text-xs font-bold tracking-wider uppercase"
          >
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          className={`bg-bg-surface text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 disabled:bg-bg-app disabled:text-text-muted block w-full rounded-sm border px-4 py-2.5 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:opacity-50 ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' : 'border-border-base'} ${className} `}
          {...props}
        />
        {error && <p className="text-error-500 mt-1 text-xs font-semibold select-none">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
