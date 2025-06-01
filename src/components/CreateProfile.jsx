/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, User } from 'lucide-react'

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
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

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
      setPreviewUrl(user.picture || '')
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
      let avatarURL = formData.avatarURL

      // Upload new file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile()
        if (!uploadedUrl) {
          setIsSubmitting(false)
          return
        }
        avatarURL = uploadedUrl
      }

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
          avatar_url: avatarURL
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

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file (JPG, PNG, GIF, or WebP)' }))
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, avatar: 'File size must be less than 5MB' }))
      return
    }

    // Clear avatar errors
    setErrors(prev => ({ ...prev, avatar: '' }))
    setSelectedFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Upload file to server
  const uploadFile = async () => {
    if (!selectedFile) return null

    setIsUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append('avatar', selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-avatar`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      return data.avatar_url
    } catch (error) {
      console.error('Upload error:', error)
      setErrors(prev => ({ ...prev, avatar: error.message || 'Failed to upload image' }))
      return null
    } finally {
      setIsUploading(false)
    }
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

            {/* Avatar */}
            <div>
              <label 
                htmlFor="avatar" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Avatar
              </label>
              
              {/* Avatar Preview and Upload */}
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center"
                       style={{ 
                         borderColor: 'rgba(0, 173, 181, 0.3)',
                         backgroundColor: 'rgba(31, 41, 55, 0.5)'
                       }}>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8" style={{ color: 'rgb(156, 163, 175)' }} />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  {/* File Upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex items-center px-3 py-2 rounded-md border cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'rgba(0, 173, 181, 0.1)',
                        borderColor: 'rgba(0, 173, 181, 0.3)',
                        color: 'rgb(0, 173, 181)'
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photo
                    </label>
                    <p className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                      JPG, PNG, GIF or WebP. Max 5MB.
                    </p>
                    {selectedFile && (
                      <p className="text-xs mt-1" style={{ color: 'rgb(34, 197, 94)' }}>
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {errors.avatar && (
                <p className="text-sm mt-1" style={{ color: 'rgb(239, 68, 68)' }}>
                  {errors.avatar}
                </p>
              )}
              
              <p className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                We'll use your Google profile picture if you don't provide one
              </p>
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
              disabled={isSubmitting || isUploading || usernameChecking || usernameAvailable === false}
              style={{
                backgroundColor: 'rgb(0, 173, 181)',
                color: 'white',
                opacity: (isSubmitting || isUploading || usernameChecking || usernameAvailable === false) ? 0.6 : 1
              }}
            >
              {isSubmitting ? 
                (isUploading ? 'Uploading...' : 'Creating Profile...') : 
                'Create Profile'
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateProfile 