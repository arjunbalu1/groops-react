/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, MapPin, Users, IndianRupee, Plus, AlertCircle, CheckCircle, ChevronRight, ArrowLeft, ArrowRight, Loader2, Sparkles, Tag, Target, Minus, DollarSign, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CreateGroup = () => {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
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

  // Multi-step questionnaire state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Location search state
  const [locationSearch, setLocationSearch] = useState('')
  const [locationResults, setLocationResults] = useState([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState('')

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Check if Google Maps is already loaded (it should be loaded by LocationSearch in Header)
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsLoaded(true)
      return
    }

    // If not loaded, wait for it to be loaded by LocationSearch
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleMapsLoaded(true)
      }
    }

    // Check every 100ms for up to 10 seconds
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

  // Debounce location search to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocationSearch(locationSearch)
    }, 500) // 500ms delay - only search after user stops typing

    return () => clearTimeout(timer)
  }, [locationSearch])

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedLocationSearch.trim().length >= 3) {
      // Don't search if we already have a location selected and the search term matches
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
    return Math.round((currentStep / totalSteps) * 100)
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1: return formData.activity_type !== ''
      case 2: return formData.name.trim() !== ''
      case 3: return formData.description.trim() !== '' && formData.date_time !== '' && formData.location.place_id !== ''
      case 4: return true // Optional fields
      case 5: return validateForm() === null
      default: return false
    }
  }

  // Step titles and messages
  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "What kind of activity are you organizing?",
          subtitle: "This helps us connect you with the right people!",
          encouragement: "Let's get started! 🚀"
        }
      case 2:
        return {
          title: "What should we call your groop?",
          subtitle: "Pick something fun and descriptive!",
          encouragement: "Great choice! 🎯"
        }
      case 3:
        return {
          title: "Let's add the essential details",
          subtitle: "When, where, and what's it all about?",
          encouragement: "Almost there! 📍"
        }
      case 4:
        return {
          title: "Just a little bit more info!",
          subtitle: "These optional details help make your groop even better",
          encouragement: "Looking good! ✨"
        }
      case 5:
        return {
          title: "Ready to launch your groop?",
          subtitle: "Review everything and let's make it happen!",
          encouragement: "You're all set! 🎉"
        }
      default:
        return { title: "", subtitle: "", encouragement: "" }
    }
  }

  // Step 1: Activity Type Selection
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {activityTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleInputChange('activity_type', type)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              formData.activity_type === type
                ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-teal-400'
            }`}
          >
            <div className="text-lg">
              {type === 'games' ? '🎮' : type === 'social' ? '🍽️' : type === 'educational' ? '📚' : '🏃‍♂️'}
            </div>
            <div className="text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // Step 2: Group Name
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="e.g., Morning Runners Club, Beach Volleyball Squad..."
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg"
          maxLength={100}
        />
        <div className="mt-2 text-sm text-gray-400">
          {formData.name.length}/100 characters
        </div>
      </div>
    </div>
  )

  // Step 3: Essential Details
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
        <textarea
          placeholder="Tell people what this groop is about..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <div className="mt-2 text-sm text-gray-400">
          {formData.description.length}/500 characters
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time *</label>
        <input
          type="datetime-local"
          value={formData.date_time}
          onChange={(e) => handleInputChange('date_time', e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a location..."
            value={locationSearch}
            onChange={(e) => {
              const newValue = e.target.value
              setLocationSearch(newValue)
              
              // Clear selected location if user is typing something different
              if (formData.location.place_id && 
                  newValue !== formData.location.formatted_address && 
                  newValue !== formData.location.name) {
                setFormData(prev => ({
                  ...prev,
                  location: {
                    name: '',
                    formatted_address: '',
                    place_id: '',
                    latitude: null,
                    longitude: null
                  }
                }))
              }
            }}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {showLocationResults && locationResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {locationResults.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => selectLocation(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl focus:outline-none focus:bg-gray-700"
                >
                  <div className="text-white">{suggestion.name}</div>
                  <div className="text-gray-400 text-sm">{suggestion.formatted_address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {formData.location.name && (
          <div className="mt-2 flex items-center text-sm text-green-400">
            <Check className="w-4 h-4 mr-1" />
            {formData.location.name}
          </div>
        )}
      </div>
    </div>
  )

  // Step 4: Optional Details
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Skill Level (Optional)</label>
        <select
          value={formData.skill_level}
          onChange={(e) => handleInputChange('skill_level', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">Any level</option>
          {skillLevels.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Max Members (Optional)</label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => formData.max_members > 2 && handleInputChange('max_members', formData.max_members - 1)}
            className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xl font-semibold w-8 text-center">{formData.max_members}</span>
          <button
            type="button"
            onClick={() => formData.max_members < 20 && handleInputChange('max_members', formData.max_members + 1)}
            className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Cost per Person (Optional)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="number"
            placeholder="0"
            value={formData.cost || ''}
            onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )

  // Step 5: Review
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/30 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{formData.name}</h3>
          <p className="text-gray-300">{formData.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-teal-400" />
            {new Date(formData.date_time).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} at {new Date(formData.date_time).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
          
          <div className="flex items-center text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-teal-400" />
            {formData.location.name}
          </div>
          
          <div className="flex items-center text-gray-300">
            <Tag className="w-4 h-4 mr-2 text-teal-400" />
            {formData.activity_type}
          </div>
          
          <div className="flex items-center text-gray-300">
            <Users className="w-4 h-4 mr-2 text-teal-400" />
            Up to {formData.max_members} members
          </div>
          
          {formData.skill_level && (
            <div className="flex items-center text-gray-300">
              <Target className="w-4 h-4 mr-2 text-teal-400" />
              {formData.skill_level} level
            </div>
          )}
          
          {formData.cost > 0 && (
            <div className="flex items-center text-gray-300">
              <DollarSign className="w-4 h-4 mr-2 text-teal-400" />
              ${formData.cost} per person
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Navigation buttons
  const renderNavigationButtons = () => (
    <div className="flex justify-between items-center pt-6">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      ) : (
        <div></div>
      )}

      {currentStep < totalSteps ? (
        <button
          type="button"
          onClick={nextStep}
          disabled={!isCurrentStepValid()}
          className={`flex items-center px-6 py-3 rounded-xl transition-colors ${
            isCurrentStepValid()
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={loading || validateForm() !== null}
          className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-colors ${
            loading || validateForm() !== null
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Groop
              <Sparkles className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      )}
    </div>
  )

  // Check auth - show loading while checking, then appropriate state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin" style={{ color: 'rgb(0, 173, 181)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
            Loading...
          </h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'rgb(239, 68, 68)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
            Login Required
          </h2>
          <p className="mb-4" style={{ color: 'rgb(156, 163, 175)' }}>
            You need to be logged in to create a group.
          </p>
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (user.needsProfile) {
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
            
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <div 
                className="p-8 rounded-2xl shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(0, 200, 210, 0.15) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 173, 181, 0.3)'
                }}
              >
                {/* Header with step info */}
                <div className="text-center mb-8">
                  <div className="inline-block px-4 py-2 bg-teal-500/20 rounded-full text-teal-300 text-sm font-medium mb-4">
                    Step {currentStep} of {totalSteps}
                </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {getStepInfo().title}
                  </h1>
                  <p className="text-gray-300 text-lg">
                    {getStepInfo().subtitle}
                  </p>
                  {formData.activity_type && currentStep > 1 && (
                    <div className="mt-4 text-teal-300 font-medium">
                      {getStepInfo().encouragement}
                  </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{getFormCompletionPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${getFormCompletionPercentage()}%` }}
                      />
                    </div>
                  </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                  {currentStep === 5 && renderStep5()}
                    </div>

                {/* Navigation */}
                {renderNavigationButtons()}
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
                  {renderNavigationButtons()}
                  
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