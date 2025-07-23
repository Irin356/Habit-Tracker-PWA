import React, { useState, useEffect } from 'react'
import SignIn from './SignIn'
import SignUp from './SignUp'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import EmailConfirmation from './EmailConfirmation'

const AuthWrapper = () => {
  const [currentView, setCurrentView] = useState('signin')
  const [resetTokenData, setResetTokenData] = useState(null)
  const [confirmationData, setConfirmationData] = useState(null)
  
  // Check URL parameters for different auth flows
  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      // Check both query and hash parameters
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token')
      const type = urlParams.get('type') || hashParams.get('type')
      const token = urlParams.get('token') || hashParams.get('token')
      const resetToken = urlParams.get('reset_token') || hashParams.get('reset_token')
      
      // Check for error states in hash
      const error = hashParams.get('error')
      const errorCode = hashParams.get('error_code')
      const errorDescription = hashParams.get('error_description')
      
      // Log everything for debugging
      console.log('=== URL DEBUG INFO ===')
      console.log('Full URL:', window.location.href)
      console.log('Search params:', window.location.search)
      console.log('Hash:', window.location.hash)
      console.log('Parsed params:', { accessToken, type, token, resetToken })
      console.log('Error params:', { error, errorCode, errorDescription })
      console.log('All query params:', Object.fromEntries(urlParams))
      console.log('All hash params:', Object.fromEntries(hashParams))
      
      // Handle email confirmation flow
      if (type === 'signup' || type === 'email_confirmation' || type === 'confirm') {
        console.log('✅ Email confirmation flow detected')
        const confirmData = {
          accessToken,
          type,
          token,
          error,
          errorCode,
          errorDescription,
          success: !error && (accessToken || token)
        }
        
        setConfirmationData(confirmData)
        setCurrentView('email-confirmation')
        return
      }
      
      // Handle password reset flow
      if ((accessToken && type === 'recovery') || 
          (token && type === 'recovery') ||
          (resetToken) ||
          (accessToken && type === 'reset') ||
          (token && type === 'reset') ||
          (accessToken && type === 'password_reset') ||
          (token && type === 'password_reset') ||
          window.location.pathname === '/reset-password' ||
          urlParams.get('reset') === 'true' ||
          hashParams.get('reset') === 'true') {
        console.log('✅ Password reset flow detected')
        const tokenData = {
          accessToken,
          type,
          token,
          resetToken,
          error,
          errorCode,
          errorDescription
        }
        
        setResetTokenData(tokenData)
        setCurrentView('reset')
        return
      }
      
      // Handle general errors (like expired confirmation links)
      if (error && (errorCode === 'otp_expired' || error === 'access_denied')) {
        console.log('✅ Email confirmation error detected')
        const confirmData = {
          error,
          errorCode,
          errorDescription,
          success: false
        }
        
        setConfirmationData(confirmData)
        setCurrentView('email-confirmation')
        return
      }
    }
    
    // Check immediately
    checkUrlParams()
    
    // Also listen for URL changes (in case of SPA routing)
    const handlePopState = () => {
      checkUrlParams()
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
  
  const renderView = () => {
    console.log('Current view:', currentView) // Debug log
    
    switch (currentView) {
      case 'signin':
        return (
          <SignIn 
            onSwitchToSignUp={() => setCurrentView('signup')}
            onSwitchToForgotPassword={() => setCurrentView('forgot')}
          />
        )
      case 'signup':
        return (
          <SignUp 
            onSwitchToSignIn={() => setCurrentView('signin')}
          />
        )
      case 'forgot':
        return (
          <ForgotPassword 
            onSwitchToSignIn={() => setCurrentView('signin')}
          />
        )
      case 'reset':
        return (
          <ResetPassword 
            onNavigate={(view) => setCurrentView(view)}
            tokenData={resetTokenData}
          />
        )
      case 'email-confirmation':
        return (
          <EmailConfirmation 
            onNavigate={(view) => setCurrentView(view)}
            confirmationData={confirmationData}
          />
        )
      default:
        return null
    }
  }
  
  return renderView()
}

export default AuthWrapper