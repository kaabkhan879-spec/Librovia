import React from 'react'

export interface ToggleProps {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 text-left ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`focus:ring-primary-500/20 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out select-none focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${checked ? 'bg-primary-600' : 'bg-border-base'} `}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'} `}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          onClick={() => !disabled && onChange(!checked)}
          className={`text-text-sub cursor-pointer text-sm font-semibold select-none ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  )
}
