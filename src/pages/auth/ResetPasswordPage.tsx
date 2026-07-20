import React from 'react'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm'

export const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
