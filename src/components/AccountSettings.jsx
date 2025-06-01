/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Check, X, Upload, User } from 'lucide-react'

const AccountSettings = () => {
  const navigate = useNavigate()
  const { user, isLoading, checkAuthStatus, refreshAvatar } = useAuth()
  const [formData, setFormData] = useState({
    bio: '',
    avatarURL: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

  // Toast management functions
  const addToast = (message, type = 'success') => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (user && !user.needsProfile) {
      setFormData({
        bio: user.bio || '',
        avatarURL: user.avatarURL || ''
      })
      setPreviewUrl(user.avatarURL || '')
    }
  }, [user])

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      addToast('Please select a valid image file (JPG, PNG, GIF, or WebP)', 'error')
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      addToast('File size must be less than 5MB', 'error')
      return
    }

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
    const formData = new FormData()
    formData.append('avatar', selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      return data.avatar_url
    } catch (error) {
      console.error('Upload error:', error)
      addToast(error.message || 'Failed to upload image', 'error')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

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

      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bio: formData.bio,
          avatar_url: avatarURL
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      // Update local state
      setFormData(prev => ({ ...prev, avatarURL }))
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      addToast('Profile updated successfully!', 'success')
      
      // Refresh user data
      await checkAuthStatus()
      refreshAvatar()
    } catch (error) {
      console.error('Error updating profile:', error)
      addToast(error.message || 'Failed to update profile', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user || user.needsProfile) {
    navigate('/create-profile')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            <div className="flex items-center">
              {toast.type === 'success' ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <X className="h-5 w-5 mr-2" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div 
          className="rounded-lg border p-8"
          style={{
            backgroundColor: 'rgba(25, 30, 35, 0.9)',
            borderColor: 'rgba(0, 173, 181, 0.2)',
            boxShadow: '0 8px 25px rgba(0, 173, 181, 0.15)'
          }}
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 p-0 h-auto"
            style={{
              color: 'rgb(156, 163, 175)',
              backgroundColor: 'transparent',
              border: 'none',
              alignSelf: 'flex-start'
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: 'rgb(238, 238, 238)' }}
            >
              Account Settings
            </h1>
            <p style={{ color: 'rgb(156, 163, 175)' }}>
              Update your profile information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Profile Picture
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

            {/* Bio Section */}
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
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 rounded-md border resize-none"
                placeholder="Tell people about yourself..."
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
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full"
              style={{
                backgroundColor: 'rgb(0, 173, 181)',
                color: 'white',
                opacity: (isSubmitting || isUploading) ? 0.6 : 1
              }}
            >
              {isSubmitting || isUploading ? (
                <div className="flex items-center">
                  <div 
                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                  ></div>
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings 