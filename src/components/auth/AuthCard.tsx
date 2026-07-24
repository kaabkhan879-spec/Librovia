import React from 'react'

export interface AuthCardProps {
  children: React.ReactNode
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
        borderRadius: '28px'
      }}
      className="w-full p-6 text-left sm:p-10"
    >
      {children}
    </div>
  )
}
