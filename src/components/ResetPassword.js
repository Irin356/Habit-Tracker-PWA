import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

const ResetPassword = ({ onNavigate, tokenData }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  
  const { updatePassword, supabase } = useAuth()

  // Check if user has access token from email link
  useEffect(() => {
    console.log('ResetPassword component mounted')
    console.log('Current URL:', window.location.href)
    console.log('TokenData received:', tokenData)
    
    // First check if token data was passed as prop
    if (tokenData) {
      console.log('Token data from props:', tokenData)
      
      // Check for errors in token data
      if (tokenData.error) {
        console.log('Error in token data:', tokenData.error)
        
        // Handle specific error types
        if (tokenData.errorCode === 'otp_expired' || tokenData.error === 'access_denied') {
          setError('This password reset link has expired. Please request a new password reset link.')
        } else {
          setError(`Reset link error: ${tokenData.errorDescription || tokenData.error}`)
        }
        return
      }
      
      if (tokenData.accessToken) {
        setAccessToken(tokenData.accessToken)
        console.log('Access token from props:', tokenData.accessToken)
        return
      }
    }
    
    // Fallback to URL parsing
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    
    // Check for errors in URL first
    const urlError = hashParams.get('error')
    const urlErrorCode = hashParams.get('error_code')
    const urlErrorDescription = hashParams.get('error_description')
    
    if (urlError) {
      console.log('Error in URL:', urlError)
      if (urlErrorCode === 'otp_expired' || urlError === 'access_denied') {
        setError('This password reset link has expired. Please request a new password reset link.')
      } else {
        setError(`Reset link error: ${urlErrorDescription || urlError}`)
      }
      return
    }
    
    // Check both query and hash parameters for token
    const token = urlParams.get('access_token') || hashParams.get('access_token')
    const type = urlParams.get('type') || hashParams.get('type')
    
    console.log('URL Parameters:', { token, type })
    console.log('Hash Parameters:', Object.fromEntries(hashParams))
    
    if (token) {
      setAccessToken(token)
      console.log('Access token found in URL:', token)
      
      // If we have a token, try to set the session
      if (supabase && type === 'recovery') {
        console.log('Setting session with recovery token...')
        supabase.auth.setSession({
          access_token: token,
          refresh_token: hashParams.get('refresh_token') || ''
        }).then(({ data, error }) => {
          if (error) {
            console.error('Error setting session:', error)
          } else {
            console.log('Session set successfully:', data)
          }
        })
      }
    } else {
      console.log('No access token found')
      setError('Invalid or expired reset link. Please request a new password reset.')
    }
  }, [tokenData, supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Reset password form submitted')
    
    setLoading(true)
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!accessToken) {
      setError('No valid reset token found. Please request a new password reset.')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting to update password...')
      
      // Try using the direct supabase method if available
      if (supabase) {
        console.log('Using direct supabase updateUser method')
        const { data, error } = await supabase.auth.updateUser({
          password: password
        })
        
        if (error) {
          console.error('Supabase password update error:', error)
          setError(error.message)
        } else {
          console.log('Password updated successfully via supabase:', data)
          setSuccess(true)
        }
      } else {
        // Fallback to auth context method
        console.log('Using auth context updatePassword method')
        const { error } = await updatePassword(password)
        
        if (error) {
          console.error('Auth context password update error:', error)
          setError(error.message)
        } else {
          console.log('Password updated successfully via auth context')
          setSuccess(true)
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    }
    
    setLoading(false)
  }

  // Debug render
  console.log('ResetPassword render state:', {
    success,
    error,
    loading,
    accessToken,
    hasOnNavigate: !!onNavigate,
    tokenData
  })

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Updated!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => {
                console.log('Navigating to signin')
                if (onNavigate) {
                  onNavigate('signin')
                } else {
                  console.error('onNavigate prop not provided')
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Continue to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </div>

         
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Match Indicator */}
            {password && confirmPassword && (
              <div className={`text-sm ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || password !== confirmPassword || !accessToken}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Update Password
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                console.log('Back to sign in clicked')
                if (onNavigate) {
                  onNavigate('signin')
                } else {
                  console.error('onNavigate prop not provided')
                }
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword