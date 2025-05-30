import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status by making API call to backend
  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status via API call...')
      console.log('🌍 Using API base URL:', API_BASE_URL)
      
      // Make authenticated request to new auth/me endpoint
      // The browser will automatically include HttpOnly cookies
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        // If we get a successful response, user is authenticated with full profile
        const profileData = await response.json()
        console.log('✅ User is authenticated with profile:', profileData)
        setUser(profileData)
      } else if (response.status === 401) {
        // 401 = Unauthorized - could be not authenticated or incomplete profile
        console.log('🔍 Got 401 response, parsing error data...')
        try {
          const errorData = await response.json()
          console.log('📄 Full 401 Response data:', errorData)
          console.log('🔎 needsProfile check:', errorData.needsProfile, typeof errorData.needsProfile)
          if (errorData.needsProfile) {
            console.log('⚠️ User authenticated but needs to complete profile')
            // Set user with needsProfile flag and Google profile data for prefilling
            setUser({ 
              authenticated: true,
              needsProfile: true,
              username: errorData.username,
              email: errorData.email,
              name: errorData.name,
              picture: errorData.picture,
              avatarURL: errorData.picture, // Set avatarURL for consistency with complete profiles
              given_name: errorData.given_name,
              family_name: errorData.family_name
            })
          } else {
            console.log('❌ User not authenticated (401)')
            setUser(null)
          }
        } catch (parseError) {
          // If we can't parse error response, assume not authenticated
          console.log('❌ Failed to parse 401 response:', parseError)
          setUser(null)
        }
      } else {
        // Other errors - might be network issues
        console.log('⚠️ Auth check failed:', response.status)
        setUser(null)
      }
    } catch (error) {
      console.error('🚨 Auth check error:', error)
      // Network error or CORS issue
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const signIn = () => {
    // Redirect to backend OAuth flow
    window.location.href = `${API_BASE_URL}/auth/login`
  }

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...')
      
      // Make logout request to backend
      // This will clear the HttpOnly session cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include', // Re-enabled for proper authentication
      })
      
      // Update local state
      setUser(null)
      
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
      // Force logout locally even if backend call fails
      setUser(null)
      window.location.href = '/'
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}