import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Session error:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    supabase, // Export supabase instance
    signUp: async (email, password, additionalData = {}) => {
  try {
    // Detect user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userCountry = Intl.DateTimeFormat().resolvedOptions().locale;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Set the redirect URL for email confirmation
        emailRedirectTo: `${window.location.origin}`,
        // Store timezone and additional data in user metadata
        data: {
          timezone: userTimezone,
          country: userCountry,
          signup_date: new Date().toISOString(),
          ...additionalData // Allow passing additional data like name
        }
      }
    })
    
    if (error) {
      console.error('SignUp error:', error)
    } else {
      console.log('SignUp success with timezone:', userTimezone, data)
    }
    
    return { data, error }
  } catch (error) {
    console.error('SignUp exception:', error)
    return { data: null, error }
  }
},

    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          console.error('SignIn error:', error)
        } else {
          console.log('SignIn success:', data)
        }
        
        return { data, error }
      } catch (error) {
        console.error('SignIn exception:', error)
        return { data: null, error }
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('SignOut error:', error)
        } else {
          console.log('SignOut success')
        }
        return { error }
      } catch (error) {
        console.error('SignOut exception:', error)
        return { error }
      }
    },
    resetPassword: async (email) => {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          // Use a different redirect URL for password reset
          redirectTo: `${window.location.origin}/reset-password`,
        })
        
        if (error) {
          console.error('Reset password error:', error)
        } else {
          console.log('Reset password success:', data)
        }
        
        return { data, error }
      } catch (error) {
        console.error('Reset password exception:', error)
        return { data: null, error }
      }
    },
    updatePassword: async (password) => {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: password
        })
        
        if (error) {
          console.error('Update password error:', error)
        } else {
          console.log('Update password success:', data)
        }
        
        return { data, error }
      } catch (error) {
        console.error('Update password exception:', error)
        return { data: null, error }
      }
    },
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}