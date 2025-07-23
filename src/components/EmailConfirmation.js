import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const EmailConfirmation = ({ onNavigate, confirmationData }) => {
  const [status, setStatus] = useState('checking') // checking, success, error, expired
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)
  const { supabase } = useAuth()

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!confirmationData) {
        setStatus('error')
        setMessage('No confirmation data found')
        return
      }

      // Check if there's an error in the URL
      if (confirmationData.error) {
        if (confirmationData.errorCode === 'otp_expired' || 
            confirmationData.error === 'access_denied') {
          setStatus('expired')
          setMessage('Your email confirmation link has expired or is invalid. Please request a new confirmation email.')
        } else {
          setStatus('error')
          setMessage(confirmationData.errorDescription || 'Email confirmation failed')
        }
        return
      }

      // If we have tokens, try to confirm the email
      if (confirmationData.accessToken || confirmationData.token) {
        try {
          // The confirmation should be handled automatically by Supabase
          // Just check the current session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session error:', error)
            setStatus('error')
            setMessage('Failed to verify email confirmation')
            return
          }

          if (session && session.user) {
            setStatus('success')
            setMessage('Email verified successfully! Welcome to HabTrack.')
            
            // Start countdown to redirect
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer)
                  // The user will be automatically redirected by the auth state change
                  return 0
                }
                return prev - 1
              })
            }, 1000)

            return () => clearInterval(timer)
          } else {
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in.')
          }
        } catch (error) {
          console.error('Confirmation error:', error)
          setStatus('error')
          setMessage('An error occurred during email verification')
        }
      } else {
        setStatus('error')
        setMessage('Invalid confirmation link')
      }
    }

    handleConfirmation()
  }, [confirmationData, supabase])

  const handleResendConfirmation = async () => {
    // This would require storing the email somewhere or asking user to re-enter
    setMessage('Please go back to sign up and enter your email again to resend confirmation.')
  }

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we confirm your email address...</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Email Verified!</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            
            {countdown > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700">
                  Redirecting to app in {countdown} seconds...
                </p>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('signin')}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue to App
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-orange-700 mb-2">Link Expired</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            
            <div className="space-y-4">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Request New Confirmation
              </button>
              
              <button
                onClick={() => onNavigate('signin')}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            
            <div className="space-y-4">
              <button
                onClick={() => onNavigate('signup')}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>
              
              <button
                onClick={() => onNavigate('signin')}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="auth-background">
      <div className="auth-container">
        <div className="text-center mb-8">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">HabTrack</h1>
        </div>
        
        {renderContent()}
      </div>
    </div>
  )
}

export default EmailConfirmation