import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNewPasswordError('')
    setConfirmPasswordError('')
    
    let isValid = true
    
    // Password length check
    if (!newPassword) {
      setNewPasswordError('New password is required')
      isValid = false
    } else if (newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters')
      isValid = false
    }
    
    // Password match check
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password')
      isValid = false
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      isValid = false
    }
    
    if (!isValid) {
      return
    }
    
    if (!token) {
      setError('Invalid reset token')
      return
    }

    setIsLoading(true)

    try {
      const result = await authService.resetPassword(token, newPassword)
      setMessage(result.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            Invalid reset token. Please request a new password reset.
          </div>
          <div className="text-center">
            <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Request new reset
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 placeholder="••••••••"
               />
               {newPasswordError && (
                 <p className="mt-1 text-sm text-red-600">{newPasswordError}</p>
               )}
             </div>

             <div>
               <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                 Confirm Password
               </label>
               <input
                 id="confirmPassword"
                 name="confirmPassword"
                 type="password"
                 autoComplete="new-password"
                 required
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 placeholder="••••••••"
               />
               {confirmPasswordError && (
                 <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
               )}
             </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage