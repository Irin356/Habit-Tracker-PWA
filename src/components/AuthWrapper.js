import React, { useState, useEffect } from 'react'
import SignIn from './SignIn'
import SignUp from './SignUp'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'

const AuthWrapper = () => {
  const [currentView, setCurrentView] = useState('signin')
  const [resetTokenData, setResetTokenData] = useState(null)
  
  // Check URL parameters for reset password flow
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
      
      // Store token data for reset password
      const tokenData = {
        accessToken,
        type,
        token,
        resetToken,
        error,
        errorCode,
        errorDescription
      }
      
      // Check for error states first
      if (error) {
        console.log('❌ Error in URL, but still showing reset form')
        setResetTokenData(tokenData)
        setCurrentView('reset')
        return
      }
      
      // Check for different possible parameter combinations
      if ((accessToken && type === 'recovery') || 
          (token && type === 'recovery') ||
          (resetToken) ||
          (accessToken && type === 'reset') ||
          (token && type === 'reset') ||
          (accessToken && type === 'password_reset') ||
          (token && type === 'password_reset') ||
          // Check if we're on the reset-password path
          window.location.pathname === '/reset-password' ||
          // Check for our new reset parameter
          urlParams.get('reset') === 'true' ||
          hashParams.get('reset') === 'true') {
        console.log('✅ Setting view to reset')
        setResetTokenData(tokenData)
        setCurrentView('reset')
      } else {
        console.log('❌ No matching reset parameters found')
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
      default:
        return null
    }
  }
  
  return renderView()
}

export default AuthWrapper