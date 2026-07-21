import React from 'react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm'

export const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
