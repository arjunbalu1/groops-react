/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CreateProfile = () => {
  const navigate = useNavigate()
  const { user, isLoading, checkAuthStatus } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: '',
    avatarURL: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Scroll to top when entering create profile
  useEffect(() => {
    // Disable scroll restoration and force scroll to top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Pre-fill form with Google data if available
  useEffect(() => {
    if (user && user.name) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        avatarURL: user.picture || ''
      }))
    }
  }, [user])

  // Username validation and availability check
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      // Try to fetch the public profile to see if username exists
      const response = await fetch(`${API_BASE_URL}/profiles/${username}`)
      if (response.status === 404) {
        setUsernameAvailable(true)
      } else {
        setUsernameAvailable(false)
      }
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(formData.username)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [formData.username])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters'
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters and numbers'
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken'
    }

    // Bio validation (optional but max length)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.fullName,
          bio: formData.bio,
          avatar_url: formData.avatarURL
        })
      })

      if (response.ok) {
        // Profile created successfully, refresh auth status and redirect
        await checkAuthStatus()
        window.location.href = '/' // Redirect to home page
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          setErrors({ username: 'Username is already taken' })
        } else {
          setErrors({ submit: errorData.error || 'Failed to create profile' })
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect non-authenticated users to home page
  useEffect(() => {
    if (!isLoading && !user?.authenticated) {
      navigate('/')
    }
  }, [isLoading, user, navigate])

  // Redirect if user already has a complete profile
  if (user && !user.needsProfile) {
    navigate('/')
    return null
  }

  // Show loading if we're still checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'rgb(156, 163, 175)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <div className="w-full max-w-md">
        <div 
          className="rounded-lg border p-8"
          style={{
            backgroundColor: 'rgba(25, 30, 35, 0.9)',
            borderColor: 'rgba(0, 173, 181, 0.2)',
            boxShadow: '0 8px 25px rgba(0, 173, 181, 0.15)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: 'rgb(238, 238, 238)' }}
            >
              Complete Your Profile
            </h1>
            <p style={{ color: 'rgb(156, 163, 175)' }}>
              Just a few more details to get you started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Username <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
              </label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Enter your username"
                  style={{
                    backgroundColor: 'rgba(31, 41, 55, 0.5)',
                    borderColor: errors.username ? 'rgb(239, 68, 68)' : (usernameAvailable === true ? 'rgb(34, 197, 94)' : (usernameAvailable === false ? 'rgb(239, 68, 68)' : 'rgba(75, 85, 99, 0.3)')),
                    color: 'rgb(238, 238, 238)'
                  }}
                />
                {usernameChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
                    />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="text-sm mt-1" style={{ color: 'rgb(239, 68, 68)' }}>
                  {errors.username}
                </p>
              )}
              {usernameAvailable === true && !errors.username && (
                <p className="text-sm mt-1" style={{ color: 'rgb(34, 197, 94)' }}>
                  Username is available!
                </p>
              )}
              {usernameAvailable === false && !errors.username && (
                <p className="text-sm mt-1" style={{ color: 'rgb(239, 68, 68)' }}>
                  Username is already taken!
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full"
                placeholder="Enter your full name"
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  borderColor: 'rgba(75, 85, 99, 0.3)',
                  color: 'rgb(238, 238, 238)'
                }}
              />
            </div>

            {/* Bio */}
            <div>
              <label 
                htmlFor="bio" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border resize-none"
                placeholder="Tell us a bit about yourself..."
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  borderColor: errors.bio ? 'rgb(239, 68, 68)' : 'rgba(75, 85, 99, 0.3)',
                  color: 'rgb(238, 238, 238)'
                }}
              />
              {errors.bio && (
                <p className="text-sm mt-1" style={{ color: 'rgb(239, 68, 68)' }}>
                  {errors.bio}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label 
                htmlFor="avatarURL" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Avatar
              </label>
              
              {/* Avatar Preview */}
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0">
                  {user && user.username && formData.avatarURL ? (
                    <img
                      src={`${API_BASE_URL}/profiles/${user.username}/image`}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ 
                        borderColor: 'rgba(0, 173, 181, 0.3)',
                        backgroundColor: 'rgba(31, 41, 55, 0.5)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block'
                        e.target.nextElementSibling.style.display = 'none'
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback avatar placeholder */}
                  <div
                    className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold"
                    style={{ 
                      borderColor: 'rgba(0, 173, 181, 0.3)',
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      color: 'rgb(156, 163, 175)',
                      display: formData.avatarURL ? 'none' : 'flex'
                    }}
                  >
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                </div>
                
                <div className="flex-1">
                  <Input
                    id="avatarURL"
                    name="avatarURL"
                    type="url"
                    value={formData.avatarURL}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="https://example.com/avatar.jpg"
                    style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      color: 'rgb(238, 238, 238)'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                    We'll use your Google profile picture if you don't provide one
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div 
                className="p-3 rounded-md border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: 'rgb(239, 68, 68)'
                }}
              >
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || usernameChecking || usernameAvailable === false}
              style={{
                backgroundColor: 'rgb(0, 173, 181)',
                color: 'white',
                opacity: (isSubmitting || usernameChecking || usernameAvailable === false) ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateProfile 