import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', id, ...props }, ref) => {
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
        <div className="relative rounded-sm">
          <select
            id={id}
            ref={ref}
            className={`bg-bg-surface text-text-main focus:border-primary-500 focus:ring-primary-500/10 disabled:bg-bg-app disabled:text-text-muted block w-full cursor-pointer appearance-none rounded-sm border py-2.5 pr-10 pl-4 text-sm shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:opacity-50 ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' : 'border-border-base'} ${className} `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-main">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="text-text-muted pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <ChevronDown className="h-4 w-4 shrink-0" />
          </div>
        </div>
        {error && <p className="text-error-500 mt-1 text-xs font-semibold select-none">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
