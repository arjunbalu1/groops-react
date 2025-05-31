/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, MapPin, Users, IndianRupee, AlertCircle, CheckCircle, Save, ArrowLeft, Loader2, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EditGroup = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [group, setGroup] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    activity_type: '',
    skill_level: '',
    max_members: null,
    cost: null,
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
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState('')

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Fetch existing group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Group not found')
          } else {
            setError('Failed to load group details')
          }
          return
        }
        
        const data = await response.json()
        setGroup(data)
        
        // Check if user is the organizer
        if (data.organizer_username !== user?.username) {
          setError('Only the organizer can edit this group')
          return
        }
        
        // Convert datetime to local date and time
        const eventDate = new Date(data.date_time)
        const localDate = eventDate.toISOString().split('T')[0]
        const localTime = eventDate.toTimeString().split(' ')[0].slice(0, 5)
        
        // Populate form with existing data
        setFormData({
          name: data.name || '',
          description: data.description || '',
          date: localDate,
          time: localTime,
          activity_type: data.activity_type || '',
          skill_level: data.skill_level || '',
          max_members: data.max_members || null,
          cost: data.cost || null,
          location: {
            name: data.location?.name || '',
            formatted_address: data.location?.formatted_address || '',
            place_id: data.location?.place_id || '',
            latitude: data.location?.latitude || null,
            longitude: data.location?.longitude || null
          }
        })
        
        // Set location search field
        setLocationSearch(data.location?.formatted_address || '')
        
      } catch (err) {
        console.error('Error fetching group details:', err)
        setError('Failed to load group details')
      } finally {
        setFetchLoading(false)
      }
    }

    if (groupId && user) {
      fetchGroupData()
    }
  }, [groupId, user, API_BASE_URL])

    // Check if Google Maps is already loaded
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsLoaded(true)
      return
    }

    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleMapsLoaded(true)
      }
    }

    const interval = setInterval(checkGoogleMaps, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Maps API not available after waiting')
        setError('Failed to load location services')
      }
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  // Activity types and skill levels
  const activityTypes = [
    'sport', 'social', 'games', 'fitness', 'outdoor', 
    'educational', 'arts', 'wellness', 'music', 'other'
  ]
  const skillLevels = ['beginner', 'intermediate', 'advanced']

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  // Debounce location search to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocationSearch(locationSearch)
    }, 500)

    return () => clearTimeout(timer)
  }, [locationSearch])

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedLocationSearch.trim().length >= 3) {
      if (formData.location.place_id && 
          (debouncedLocationSearch === formData.location.formatted_address || 
           debouncedLocationSearch === formData.location.name)) {
        setLocationResults([])
        setShowLocationResults(false)
        return
      }
      searchLocations(debouncedLocationSearch)
    } else if (debouncedLocationSearch.trim().length === 0) {
      setLocationResults([])
      setShowLocationResults(false)
    }
  }, [debouncedLocationSearch])

  // Location search with Google Places API
  const searchLocations = async (query) => {
    if (!query.trim() || query.trim().length < 3) {
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
    if (!formData.name.trim()) return 'Groop name is required'
    if (formData.name.trim().length < 5) return 'Groop name must be at least 5 characters'
    if (!formData.description.trim()) return 'Description is required'
    if (formData.description.trim().length < 10) return 'Description must be at least 10 characters'
    if (!formData.date) return 'Date is required'
    if (!formData.time) return 'Time is required'
    if (!formData.activity_type) return 'Activity type is required'
    if (!formData.max_members) return 'Maximum members is required'
    if (formData.max_members && formData.max_members < 2) return 'Groop must allow at least 2 members'
    if (formData.max_members && formData.max_members > 50) return 'Groop cannot exceed 50 members'
    if (formData.cost && formData.cost < 0) return 'Cost cannot be negative'
    if (formData.cost && formData.cost > 100000) return 'Cost cannot exceed ₹1,00,000'
    if (!formData.location.place_id) return 'Location is required'
    
    // Check if date is at least 1 hour in the future
    const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    if (selectedDateTime <= oneHourFromNow) {
      return 'Event must be scheduled at least 1 hour in advance'
    }
    
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
      
      // Convert date and time to UTC datetime
      const localDateTime = new Date(`${formData.date}T${formData.time}`)
      const utcDateTime = localDateTime.toISOString()

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        date_time: utcDateTime,
        activity_type: formData.activity_type,
        skill_level: formData.skill_level || null,
        max_members: formData.max_members || 10,
        cost: formData.cost || 0,
        location: validatedLocation
      }

      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update groop')
      }

      await response.json() // Just consume the response without storing it
      setSuccess(true)
      
      // Redirect to the group page after a short delay
      setTimeout(() => {
        navigate(`/groups/${groupId}`)
      }, 1500)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while fetching
  if (isLoading || fetchLoading) {
    return (
      <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgb(0, 173, 181)' }} />
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !group) {
    return (
      <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(239, 68, 68)' }} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                {error}
              </h2>
              <button
                onClick={() => navigate(`/groups/${groupId}`)}
                className="mt-4 px-4 py-2 rounded-lg border hover:opacity-80 transition-opacity"
                style={{ 
                  backgroundColor: 'rgba(0, 173, 181, 0.1)', 
                  borderColor: 'rgb(0, 173, 181)', 
                  color: 'rgb(0, 173, 181)' 
                }}
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Group
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(34, 197, 94)' }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
              Groop Updated Successfully!
            </h2>
            <p style={{ color: 'rgb(156, 163, 175)' }}>
              Redirecting you back to the group page...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
          <button
              onClick={() => navigate(`/groups/${groupId}`)}
              className="p-2 rounded-lg border hover:opacity-80 transition-opacity"
              style={{ 
                backgroundColor: 'rgba(0, 173, 181, 0.1)', 
                borderColor: 'rgb(0, 173, 181)', 
                color: 'rgb(0, 173, 181)' 
              }}
            >
              <ArrowLeft className="w-5 h-5" />
          </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                Edit Groop
              </h1>
              <p className="text-lg" style={{ color: 'rgb(156, 163, 175)' }}>
                Update your groop details
              </p>
      </div>
    </div>
        </div>

        {/* Edit Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
      <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                Basic Information
              </h3>
              <div className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Groop Name *
                  </label>
        <input
          type="text"
          placeholder="e.g., Morning Runners Club, Beach Volleyball Squad..."
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          maxLength={100}
        />
                  <div className="mt-1 text-sm text-gray-400">
          {formData.name.length}/100 characters 
          <span className={`ml-2 ${formData.name.trim().length >= 5 ? 'text-green-400' : 'text-orange-400'}`}>
            (min 5)
          </span>
        </div>
      </div>

                {/* Description */}
      <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Description *
                  </label>
        <textarea
          placeholder="Tell people what this groop is about..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          maxLength={1000}
        />
                  <div className="mt-1 text-sm text-gray-400">
          {formData.description.length}/1000 characters 
          <span className={`ml-2 ${formData.description.trim().length >= 10 ? 'text-green-400' : 'text-orange-400'}`}>
            (min 10)
          </span>
        </div>
      </div>
    </div>
            </div>

            {/* Activity Type Section */}
      <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                Activity Type *
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {activityTypes.map((type) => (
                <button
                    key={type}
                  type="button"
                    onClick={() => handleInputChange('activity_type', type)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      formData.activity_type === type
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-teal-400'
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {type === 'games' ? '🎮' : type === 'social' ? '🍽️' : type === 'educational' ? '📚' : '🏃‍♂️'}
                    </div>
                    <div className="text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                </button>
              ))}
            </div>
      </div>

            {/* Date, Time & Location Section */}
        <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                When & Where
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  {formData.date && (
                    (() => {
                      // Check if we also have time to do full validation
                      if (formData.time) {
                        const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
                        const now = new Date()
                        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
                        if (selectedDateTime <= oneHourFromNow) {
                          return (
                            <div className="mt-1 text-sm text-red-400">
                              Event must be scheduled at least 1 hour in advance
                            </div>
                          )
                        }
                      }
                      // Show normal date preview if valid or time not set yet
                      return (
                        <div className="mt-1 text-sm text-green-400">
                          {new Date(formData.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )
                    })()
                  )}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {formData.time && (
                    (() => {
                      // Check if we also have date to do full validation
                      if (formData.date) {
                        const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
                        const now = new Date()
                        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
                        if (selectedDateTime <= oneHourFromNow) {
                          return (
                            <div className="mt-1 text-sm text-red-400">
                              Event must be scheduled at least 1 hour in advance
                            </div>
                          )
                        }
                      }
                      // Show normal time preview if valid or date not set yet
                      return (
                        <div className="mt-1 text-sm text-green-400">
                          {new Date(`2000-01-01T${formData.time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      )
                    })()
                  )}
                </div>
                    </div>

              {/* Location */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Location Results Dropdown */}
                {showLocationResults && locationResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {locationResults.map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectLocation(location)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-white">{location.name}</div>
                        <div className="text-sm text-gray-400">{location.formatted_address}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Location Display */}
                {formData.location.place_id && (
                  <div className="mt-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-teal-300">{formData.location.name}</div>
                        <div className="text-sm text-teal-400">{formData.location.formatted_address}</div>
        </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            location: { name: '', formatted_address: '', place_id: '', latitude: null, longitude: null }
                          }))
                          setLocationSearch('')
                        }}
                        className="text-teal-400 hover:text-teal-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
      </div>
    </div>
                )}
              </div>
            </div>

            {/* Group Settings Section */}
      <div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                Group Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Max Members */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Max Members *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="2-50"
                      value={formData.max_members || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        // Only allow numbers and empty string
                        if (value === '' || /^\d+$/.test(value)) {
                          const numValue = parseInt(value) || null;
                          handleInputChange('max_members', numValue);
                        }
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  {formData.max_members && (formData.max_members < 2 || formData.max_members > 50) ? (
                    <p className="text-sm mt-1 text-red-400">
                      {formData.max_members < 2 ? 'Minimum 2 members required' : 'Maximum 50 members allowed'}
                    </p>
                  ) : (
                    <p className="text-sm mt-1 text-gray-400">Total groop size including you (min 2, max 50)</p>
                  )}
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Skill Level
                  </label>
        <select
          value={formData.skill_level}
          onChange={(e) => handleInputChange('skill_level', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
                    <option value="">Select level</option>
          {skillLevels.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </div>

                {/* Cost */}
      <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(201, 209, 217)' }}>
                    Cost (₹)
                  </label>
        <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
                      type="text"
                      placeholder="0"
            value={formData.cost || ''}
            onChange={(e) => {
              const value = e.target.value;
                        
                        // Only allow numbers, decimal point, and empty string
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          const numValue = parseFloat(value) || null;
              
              // Prevent entering values above the limit
              if (value !== '' && numValue > 100000) {
                return; // Don't update state if above limit
              }
              
                          handleInputChange('cost', numValue);
                        }
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
            </div>
          </div>
        </div>
        
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300">{error}</p>
          </div>
        </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-700">
        <button
          type="button"
                onClick={() => navigate(`/groups/${groupId}`)}
                className="px-6 py-3 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-800/50 transition-colors"
              >
                Cancel
        </button>
        <button
          type="submit"
          disabled={loading || validateForm() !== null}
                className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  backgroundColor: loading || validateForm() !== null ? 'rgba(0, 173, 181, 0.3)' : 'rgb(0, 173, 181)',
                  color: 'white'
                }}
        >
          {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
                  <Save className="w-5 h-5" />
          )}
                {loading ? 'Updating...' : 'Update Groop'}
        </button>
    </div>
          </form>
        </div>
        </div>
      </div>
    )
  }

export default EditGroup 