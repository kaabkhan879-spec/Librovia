import React from 'react'

export interface AuthCardProps {
  children: React.ReactNode
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <div className="glass-effect bg-bg-surface/50 border-border-base w-full rounded-2xl border p-6 text-left shadow-lg sm:p-10">
      {children}
    </div>
  )
}
