import React from 'react'

export interface GoogleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  label = 'Continue with Google',
  ...props
}) => {
  return (
    <button
      type="button"
      className="border border-slate-200 bg-white text-[#0F172A] hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition-all focus:ring-2 focus:outline-none"
      {...props}
    >
      <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.85 2.99c.9-2.7 3.4-4.45 6.65-4.45z"
        />
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.65 2.83c2.14-1.97 3.38-4.88 3.38-8.55z"
        />
        <path
          fill="#FBBC05"
          d="M5.35 10.49c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.5 3.14C.55 5.04 0 7.16 0 9.41s.55 4.37 1.5 6.27l3.85-2.99a7.35 7.35 0 0 1 0-4.38z"
        />
        <path
          fill="#34A853"
          d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.83c-1.01.68-2.31 1.09-4.31 1.09-3.25 0-5.75-1.75-6.65-4.45L1.5 16.89C3.4 20.74 7.35 23 12 23z"
        />
      </svg>
      <span>{label}</span>
    </button>
  )
}
