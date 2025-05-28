import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, MapPin, Users, IndianRupee, Plus, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CreateGroup = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date_time: '',
    activity_type: '',
    skill_level: '',
    max_members: 4,
    cost: 0,
    location: {
      name: '',
      formatted_address: '',
      place_id: '',
      latitude: null,
      longitude: null
    }
  })

  // Location search state
  const [locationSearch, setLocationSearch] = useState('')
  const [locationResults, setLocationResults] = useState([])
  const [showLocationResults, setShowLocationResults] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // Load Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found in environment variables')
      return
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true)
      return
    }

    // Suppress Google Maps Places API deprecation warning
    const originalWarn = console.warn
    console.warn = (...args) => {
      const message = args.join(' ')
      if (message.includes('google.maps.places.PlacesService is not available to new customers') ||
          message.includes('google.maps.places.Place is recommended over google.maps.places.PlacesService') ||
          message.includes('Google Maps JavaScript API has been loaded directly without loading=async') ||
          message.includes('suboptimal performance') ||
          message.includes('https://goo.gle/js-api-loading')) {
        return // Suppress these Google Maps warnings
      }
      originalWarn.apply(console, args)
    }

    // Load Google Maps JavaScript API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      setGoogleMapsLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      setError('Failed to load location services')
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      // Restore original console.warn
      console.warn = originalWarn
    }
  }, [GOOGLE_MAPS_API_KEY])

  // Activity types and skill levels
  const activityTypes = [
    'sport', 'social', 'games', 'fitness', 'outdoor', 
    'educational', 'arts', 'wellness', 'music', 'other'
  ]
  const skillLevels = ['beginner', 'intermediate', 'advanced']

  // Get activity type color
  const getActivityTypeColor = (type) => {
    const colors = {
      sport: 'rgb(34, 197, 94)',
      social: 'rgb(168, 85, 247)',
      games: 'rgb(59, 130, 246)',
      fitness: 'rgb(251, 191, 36)',
      outdoor: 'rgb(34, 197, 94)',
      educational: 'rgb(59, 130, 246)',
      arts: 'rgb(236, 72, 153)',
      wellness: 'rgb(132, 204, 22)',
      music: 'rgb(99, 102, 241)',
      other: 'rgb(156, 163, 175)'
    }
    return colors[type] || colors.other
  }

  // Get skill level style
  const getSkillLevelStyle = (level) => {
    const styles = {
      beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgb(34, 197, 94)' },
      intermediate: { bg: 'rgba(251, 191, 36, 0.1)', text: 'rgb(251, 191, 36)' },
      advanced: { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(239, 68, 68)' }
    }
    return styles[level] || styles.beginner
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  // Location search with Google Places API
  const searchLocations = async (query) => {
    if (!query.trim()) {
      setLocationResults([])
      setShowLocationResults(false)
      return
    }

    if (!googleMapsLoaded || !window.google) {
      console.error('Google Maps API not loaded')
      return
    }

    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'))
      
      const request = {
        query: query,
        fields: ['place_id', 'name', 'formatted_address', 'geometry']
      }

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const locationSuggestions = results.slice(0, 5).map(place => ({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          }))
          
          setLocationResults(locationSuggestions)
          setShowLocationResults(true)
        } else {
          console.error('Places search failed:', status)
          setLocationResults([])
          setShowLocationResults(false)
        }
      })
    } catch (err) {
      console.error('Location search error:', err)
      setLocationResults([])
      setShowLocationResults(false)
    }
  }

  // Handle location selection
  const selectLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      location: {
        name: location.name,
        formatted_address: location.formatted_address,
        place_id: location.place_id,
        latitude: location.latitude,
        longitude: location.longitude
      }
    }))
    setLocationSearch(location.formatted_address)
    setShowLocationResults(false)
  }

  // Validate location with backend
  const validateLocation = async (placeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/validate?place_id=${placeId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Location validation failed')
      }
      
      const validatedLocation = await response.json()
      return validatedLocation
    } catch (err) {
      console.error('Location validation error:', err)
      throw new Error('Failed to validate location')
    }
  }

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) return 'Group name is required'
    if (!formData.description.trim()) return 'Description is required'
    if (!formData.date_time) return 'Date and time are required'
    if (!formData.activity_type) return 'Activity type is required'
    if (formData.max_members < 2) return 'Group must allow at least 2 members'
    if (formData.max_members > 50) return 'Group cannot exceed 50 members'
    if (formData.cost < 0) return 'Cost cannot be negative'
    if (formData.cost > 100000) return 'Cost cannot exceed ₹1,00,000'
    if (!formData.location.place_id) return 'Location is required'
    
    // Check if date is in the future
    const selectedDate = new Date(formData.date_time)
    const now = new Date()
    if (selectedDate <= now) return 'Event date must be in the future'
    
    return null
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      // First, validate the location with backend
      const validatedLocation = await validateLocation(formData.location.place_id)
      
      // Convert local datetime to UTC
      const localDateTime = new Date(formData.date_time)
      const utcDateTime = localDateTime.toISOString()

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        date_time: utcDateTime,
        activity_type: formData.activity_type,
        skill_level: formData.skill_level || null,
        max_members: parseInt(formData.max_members),
        cost: parseFloat(formData.cost),
        location: validatedLocation
      }

      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create group')
      }

      const newGroup = await response.json()
      setSuccess(true)
      
      // Redirect to the new group page after a short delay
      setTimeout(() => {
        navigate(`/groups/${newGroup.id}`)
      }, 1500)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate form completion percentage
  const getFormCompletionPercentage = () => {
    const fields = [
      formData.name.trim(),
      formData.description.trim(),
      formData.date_time,
      formData.activity_type,
      formData.location.place_id
    ]
    const completedFields = fields.filter(field => field).length
    return Math.round((completedFields / fields.length) * 100)
  }

  // Check auth
  if (!user || user.needsProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'rgb(239, 68, 68)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
            Profile Required
          </h2>
          <p className="mb-4" style={{ color: 'rgb(156, 163, 175)' }}>
            You need to complete your profile before creating a group.
          </p>
          <Button onClick={() => navigate('/create-profile')}>
            Complete Profile
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto mb-4" style={{ color: 'rgb(34, 197, 94)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
            Group Created Successfully!
          </h2>
          <p style={{ color: 'rgb(156, 163, 175)' }}>
            Redirecting to your new group...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Plus size={32} style={{ color: 'rgb(0, 173, 181)' }} />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Create New Groop
                </h1>
                <p className="text-base sm:text-lg mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                  Organize an activity and bring people together
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-rgba(25, 30, 35, 0.8) to-rgba(31, 41, 55, 0.5) px-4 py-3 rounded-lg border" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
              <div className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                Progress
              </div>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${getFormCompletionPercentage()}%`,
                    background: 'linear-gradient(90deg, rgb(0, 173, 181), rgb(0, 200, 210))'
                  }}
                />
              </div>
              <div className="text-sm font-medium" style={{ color: 'rgb(0, 173, 181)' }}>
                {getFormCompletionPercentage()}%
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Error Message */}
          {error && (
            <div 
              className="p-4 rounded-lg border flex items-center gap-3"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertCircle size={20} style={{ color: 'rgb(239, 68, 68)' }} />
              <span style={{ color: 'rgb(239, 68, 68)' }}>{error}</span>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2">
              
              {/* Combined Form Section */}
              <div 
                className="p-6 sm:p-8 rounded-xl border backdrop-blur-sm space-y-8"
                style={{
                  backgroundColor: 'rgba(25, 30, 35, 0.8)',
                  borderColor: 'rgba(0, 173, 181, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                    Group Name <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Weekend Soccer, Book Club, Hiking Adventure"
                    className="w-full"
                    maxLength={100}
                    style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      color: 'rgb(238, 238, 238)',
                      fontSize: '16px',
                      padding: '12px 16px'
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                    Description <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell people what this group is about, what to expect, and any requirements..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-md border text-sm resize-none"
                    style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      color: 'rgb(238, 238, 238)',
                      fontSize: '16px'
                    }}
                  />
                  <div className="text-xs mt-2 flex justify-between" style={{ color: 'rgb(156, 163, 175)' }}>
                    <span>{formData.description.length}/1000 characters</span>
                    <span>Be specific and welcoming</span>
                  </div>
                </div>

                {/* Activity Type */}
                <div>
                  <label className="block text-sm font-medium mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                    Activity Type <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {activityTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleInputChange('activity_type', type)}
                        className="p-3 rounded-lg text-sm font-medium transition-all duration-200 text-center hover:scale-105"
                        style={{
                          backgroundColor: formData.activity_type === type ? getActivityTypeColor(type) + '20' : 'rgba(75, 85, 99, 0.2)',
                          color: formData.activity_type === type ? getActivityTypeColor(type) : 'rgb(156, 163, 175)',
                          border: formData.activity_type === type ? `2px solid ${getActivityTypeColor(type)}` : '2px solid rgba(75, 85, 99, 0.3)'
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-sm font-medium mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                    Skill Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {skillLevels.map(level => {
                      const skillStyle = getSkillLevelStyle(level)
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleInputChange('skill_level', level)}
                          className="p-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: formData.skill_level === level ? skillStyle.bg : 'rgba(75, 85, 99, 0.2)',
                            color: formData.skill_level === level ? skillStyle.text : 'rgb(156, 163, 175)',
                            border: formData.skill_level === level ? `2px solid ${skillStyle.text}` : '2px solid rgba(75, 85, 99, 0.3)'
                          }}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date and Time */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Date & Time <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
                      <input
                        type="datetime-local"
                        value={formData.date_time}
                        onChange={(e) => handleInputChange('date_time', e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-3 py-3 rounded-md border text-sm"
                        style={{
                          backgroundColor: 'rgba(31, 41, 55, 0.5)',
                          borderColor: 'rgba(75, 85, 99, 0.3)',
                          color: 'rgb(238, 238, 238)',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    <div className="text-xs mt-2" style={{ color: 'rgb(156, 163, 175)' }}>
                      Time will be displayed in your local timezone
                    </div>
                  </div>

                  {/* Location */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Location <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
                      <Input
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value)
                          searchLocations(e.target.value)
                        }}
                        placeholder="Search for a location..."
                        className="w-full pl-10"
                        style={{
                          backgroundColor: 'rgba(31, 41, 55, 0.5)',
                          borderColor: 'rgba(75, 85, 99, 0.3)',
                          color: 'rgb(238, 238, 238)',
                          fontSize: '16px',
                          padding: '12px 16px 12px 40px'
                        }}
                      />
                    </div>

                    {/* Location Results */}
                    {showLocationResults && locationResults.length > 0 && (
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                        style={{
                          backgroundColor: 'rgb(25, 30, 35)',
                          borderColor: 'rgba(0, 173, 181, 0.2)'
                        }}
                      >
                        {locationResults.map(location => (
                          <button
                            key={location.place_id}
                            type="button"
                            onClick={() => selectLocation(location)}
                            className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-opacity-80"
                            style={{
                              borderColor: 'rgba(75, 85, 99, 0.3)',
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent'
                            }}
                          >
                            <div className="font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                              {location.name}
                            </div>
                            <div className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                              {location.formatted_address}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Max Members */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Maximum Members <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
                    </label>
                    <div className="relative">
                      <Users size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
                      <Input
                        type="number"
                        value={formData.max_members}
                        onChange={(e) => handleInputChange('max_members', e.target.value)}
                        min={2}
                        max={50}
                        className="w-full pl-10"
                        style={{
                          backgroundColor: 'rgba(31, 41, 55, 0.5)',
                          borderColor: 'rgba(75, 85, 99, 0.3)',
                          color: 'rgb(238, 238, 238)',
                          fontSize: '16px',
                          padding: '12px 16px 12px 40px'
                        }}
                      />
                    </div>
                    <div className="text-xs mt-2" style={{ color: 'rgb(156, 163, 175)' }}>
                      Including yourself (2-50 people)
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Cost per Person (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
                      <Input
                        type="number"
                        value={formData.cost}
                        onChange={(e) => handleInputChange('cost', e.target.value)}
                        min={0}
                        max={100000}
                        step="0.01"
                        placeholder="0"
                        className="w-full pl-10"
                        style={{
                          backgroundColor: 'rgba(31, 41, 55, 0.5)',
                          borderColor: 'rgba(75, 85, 99, 0.3)',
                          color: 'rgb(238, 238, 238)',
                          fontSize: '16px',
                          padding: '12px 16px 12px 40px'
                        }}
                      />
                    </div>
                    <div className="text-xs mt-2" style={{ color: 'rgb(156, 163, 175)' }}>
                      Leave as 0 for free events (max ₹1,00,000)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                
                {/* Form Summary */}
                <div 
                  className="p-6 rounded-xl border backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(25, 30, 35, 0.8)',
                    borderColor: 'rgba(0, 173, 181, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <h4 className="text-lg font-semibold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                    Group Summary
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Name:</span>
                      <span style={{ color: formData.name ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)' }}>
                        {formData.name || 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Activity:</span>
                      <span style={{ color: formData.activity_type ? getActivityTypeColor(formData.activity_type) : 'rgb(75, 85, 99)' }}>
                        {formData.activity_type ? formData.activity_type.charAt(0).toUpperCase() + formData.activity_type.slice(1) : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Skill Level:</span>
                      <span style={{ color: formData.skill_level ? getSkillLevelStyle(formData.skill_level).text : 'rgb(75, 85, 99)' }}>
                        {formData.skill_level ? formData.skill_level.charAt(0).toUpperCase() + formData.skill_level.slice(1) : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Max Members:</span>
                      <span style={{ color: 'rgb(238, 238, 238)' }}>
                        {formData.max_members} people
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Cost:</span>
                      <span style={{ color: 'rgb(238, 238, 238)' }}>
                        {formData.cost > 0 ? `₹${formData.cost}` : 'Free'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Location:</span>
                      <span style={{ color: formData.location.name ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)' }}>
                        {formData.location.name || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 font-semibold text-base transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: loading ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
                      color: 'white',
                      borderRadius: '12px'
                    }}
                  >
                    {loading ? (
                      <>
                        <div 
                          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-3"
                          style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                        />
                        Creating Group...
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="mr-2" />
                        Create Groop
                        <ChevronRight size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full py-3"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Tips */}
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <h5 className="text-sm font-medium mb-2" style={{ color: 'rgb(59, 130, 246)' }}>
                    💡 Tips for Success
                  </h5>
                  <ul className="text-xs space-y-1" style={{ color: 'rgb(156, 163, 175)' }}>
                    <li>• Be specific about what to expect</li>
                    <li>• Choose an accessible location</li>
                    <li>• Set realistic skill levels</li>
                    <li>• Consider group size carefully</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroup 