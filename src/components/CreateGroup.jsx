/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, MapPin, Users, IndianRupee, Plus, AlertCircle, CheckCircle, ChevronRight, ArrowLeft, ArrowRight, Loader2, Sparkles, Tag, Target, Minus, Check, Trophy, PartyPopper, Gamepad2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CreateGroup = () => {
  const navigate = useNavigate()
  const { user, isLoading, signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

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
    },
    agreesToGuidelines: false
  })

  // Multi-step questionnaire state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Location search state
  const [locationSearch, setLocationSearch] = useState('')
  const [locationResults, setLocationResults] = useState([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState('')

  // Activity types and skill levels
  const activityTypes = ['sport', 'social', 'games']
  
  const activitySubTypes = {
    sport: [
      'Badminton', 'Football', 'Cricket', 'Tennis', 'Table Tennis', 'Basketball',
      'Swimming', 'Volleyball', 'Running', 'Cycling', 'Boxing', 'Something Else?'
    ],
    social: [
      'Networking', 'Book Club', 'Chill Hangout', 'Party', 'Art & Crafts', 'Music', 'Movies', 'Food', 'Coffee',
      'Karaoke', 'Dancing', 'Something Else?'
    ],
    games: [
      'Board Games', 'Chess', 'Poker', 'Pool/Billiards', 'Dota 2', 'League of Legends', 
      'Counter-Strike 2', 'Fortnite', 'Valorant', 'Rainbow Six Siege', 'Rocket League', 
      'Call of Duty', 'Apex Legends', 'PUBG', 'Something Else?'
    ]
  }
  
  const skillLevels = ['beginner', 'intermediate', 'advanced']

  // Activity selection state
  const [selectedMainActivity, setSelectedMainActivity] = useState('')
  const [selectedSubActivity, setSelectedSubActivity] = useState('')
  const [customActivityInput, setCustomActivityInput] = useState('')

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
    if (!formData.agreesToGuidelines) return 'You must agree to the community guidelines'
    
    // Check if date is at least 1 hour in the future
    const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000) // Add 1 hour in milliseconds
    if (selectedDateTime <= oneHourFromNow) return 'Event must be scheduled at least 1 hour in advance'
    
    return null
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent accidental submission on Step 5 - only allow if user explicitly clicked submit
    if (currentStep === 5 && e.nativeEvent.submitter?.type !== 'submit') {
      return
    }
    
    // Extra protection: only allow submission on step 5 with valid form and guidelines checked
    if (currentStep !== 5) {
      console.warn('Form submission attempted from step', currentStep, '- blocking')
      return
    }
    
    if (!formData.agreesToGuidelines) {
      setError('You must agree to the community guidelines')
      return
    }
    
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
        max_members: formData.max_members || 10,  // Backend requires this with min=2
        cost: formData.cost || 0,                 // Backend expects number, has default 0.0
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
        throw new Error(errorData.message || 'Failed to create groop')
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
    return Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      // If leaving step 5, reset the guidelines agreement
      if (currentStep === 5) {
        setFormData(prev => ({
          ...prev,
          agreesToGuidelines: false
        }))
      }
      setCurrentStep(currentStep - 1)
    }
  }

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length >= 5 && formData.description.trim().length >= 10
      case 2: {
        if (selectedMainActivity === 'custom') {
          return customActivityInput.trim().length >= 3 && formData.activity_type !== ''
        }
        return selectedSubActivity !== '' && formData.activity_type !== ''
      }
      case 3: {
        // Check if all required fields are filled
        if (!formData.date || !formData.time || !formData.location.place_id) {
          return false
        }
        // Check if date and time is at least 1 hour in the future
        const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
        const now = new Date()
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
        return selectedDateTime > oneHourFromNow
      }
      case 4: {
        // Check if max_members is valid (required and within range)
        if (!formData.max_members || formData.max_members < 2 || formData.max_members > 50) {
          return false
        }
        // Check if cost is valid (optional but if specified must be within range)
        if (formData.cost !== null && formData.cost !== undefined && formData.cost !== '' && 
            (formData.cost < 0 || formData.cost > 100000)) {
          return false
        }
        return true
      }
      case 5: return validateForm() === null
      default: return false
    }
  }

  // Step titles and messages
  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Tell us about your groop",
          subtitle: "Give it a name and describe what it's all about!",
          encouragement: formData.name.trim().length >= 5 ? "Great choice! 🎯" : ""
        }
      case 2:
        return {
          title: "What kind of activity are you organizing?",
          subtitle: "This helps us connect you with the right people!",
          encouragement: "Let's get started! 🚀"
        }
      case 3:
        return {
          title: "When and where will it happen?",
          subtitle: "Set the date, time, and location for your activity",
          encouragement: "Almost there! 📍"
        }
      case 4:
        return {
          title: "Groop size and additional details",
          subtitle: "Set your groop size and any optional preferences",
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

  // Step 1: Group Name and Description (was step 2)
  const renderStep1 = () => (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Groop Name *</label>
        <input
          type="text"
          placeholder="e.g., Morning Runners Club, Beach Volleyball Squad..."
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base sm:text-lg"
          maxLength={100}
        />
        <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-gray-400">
          {formData.name.length}/100 characters 
          <span className={`ml-2 ${formData.name.trim().length >= 5 ? 'text-green-400' : 'text-orange-400'}`}>
            (min 5)
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Description *</label>
        <textarea
          placeholder="Tell people what this groop is about..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm sm:text-base"
          maxLength={1000}
        />
        <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-gray-400">
          {formData.description.length}/1000 characters 
          <span className={`ml-2 ${formData.description.trim().length >= 10 ? 'text-green-400' : 'text-orange-400'}`}>
            (min 10)
          </span>
        </div>
      </div>
    </div>
  )

  // Step 2: Activity Type Selection (was step 1)
  const renderStep2 = () => (
    <div className="space-y-4">
      {/* Main Activity Categories */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {activityTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setSelectedMainActivity(type)
              setSelectedSubActivity('')
              setFormData(prev => ({ ...prev, activity_type: '' }))
            }}
            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              selectedMainActivity === type
                ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-teal-400'
            }`}
          >
            <div className="text-sm sm:text-lg">
              {type === 'games' ? (
                <Gamepad2 className="w-4 h-4 sm:w-6 sm:h-6 mx-auto" />
              ) : type === 'social' ? (
                <PartyPopper className="w-4 h-4 sm:w-6 sm:h-6 mx-auto" />
              ) : (
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 mx-auto" />
              )}
            </div>
            <div className="text-xs sm:text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
          </button>
        ))}
      </div>

      {/* Custom Activity Option */}
      {!selectedMainActivity && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setSelectedMainActivity('custom')
              setSelectedSubActivity('')
              setCustomActivityInput('')
              setFormData(prev => ({ ...prev, activity_type: '' }))
            }}
            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 text-sm sm:text-base relative overflow-hidden max-w-md w-full ${
              selectedMainActivity === 'custom'
                ? 'border-2 border-dashed border-amber-400 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-red-500/25 text-amber-300 shadow-lg shadow-amber-500/20'
                : 'border-2 border-dashed border-amber-500/50 bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-red-900/30 text-amber-200 hover:border-amber-400 hover:from-amber-500/20 hover:via-orange-500/15 hover:to-red-500/20 hover:shadow-md hover:shadow-amber-500/10'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="font-medium">Something Else?</span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="text-xs sm:text-sm opacity-80 mt-1">Create your own unique activity</div>
          </button>
        </div>
      )}

      {/* Custom Activity Input */}
      {selectedMainActivity === 'custom' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm font-medium text-gray-300 mb-3">
            Tell us about your custom activity:
          </div>
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., Photography Walk, Book Club, Cooking Session..."
                value={customActivityInput}
                onChange={(e) => {
                  const value = e.target.value
                  setCustomActivityInput(value)
                  setFormData(prev => ({ ...prev, activity_type: value.trim() || 'Something Else?' }))
                }}
                className="w-full px-4 py-3 bg-gray-800/50 border-2 border-dashed border-amber-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:bg-gradient-to-r focus:from-amber-900/20 focus:to-orange-900/20 transition-all text-sm sm:text-base"
                maxLength={50}
              />
              <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400 opacity-60" />
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              {customActivityInput.length}/50 characters
              {customActivityInput.trim().length >= 3 && (
                <span className="ml-2 text-green-400">✓ Looks good!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Activity Selection */}
      {selectedMainActivity && selectedMainActivity !== 'custom' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm font-medium text-gray-300 mb-3">
            Choose specific {selectedMainActivity} activity:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {activitySubTypes[selectedMainActivity].map((subType) => {
              const isCustomOption = subType === 'Something Else?'
              return (
                <button
                  key={subType}
                  type="button"
                  onClick={() => {
                    if (subType === 'Something Else?') {
                      // Redirect to custom activity input
                      setSelectedMainActivity('custom')
                      setSelectedSubActivity('')
                      setCustomActivityInput('')
                      setFormData(prev => ({ ...prev, activity_type: '' }))
                    } else {
                      setSelectedSubActivity(subType)
                      setFormData(prev => ({ ...prev, activity_type: subType }))
                    }
                  }}
                  className={`p-2 sm:p-3 rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm relative overflow-hidden ${
                    selectedSubActivity === subType
                      ? isCustomOption
                        ? 'border-2 border-dashed border-amber-400 bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-red-500/25 text-amber-300 shadow-lg shadow-amber-500/20'
                        : 'border border-teal-500 bg-teal-500/10 text-teal-300'
                      : isCustomOption
                        ? 'border-2 border-dashed border-amber-500/50 bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-red-900/30 text-amber-200 hover:border-amber-400 hover:from-amber-500/20 hover:via-orange-500/15 hover:to-red-500/20 hover:shadow-md hover:shadow-amber-500/10'
                        : 'border border-gray-600 bg-gray-800/30 text-gray-300 hover:border-teal-400'
                  }`}
                >
                  {isCustomOption && (
                    <Sparkles className="w-3 h-3 absolute top-1 right-1 text-amber-400 opacity-70" />
                  )}
                  {subType}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  // Step 3: Date, Time, and Location
  const renderStep3 = () => (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Location *</label>
        <div className="relative">
          <MapPin className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
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
            className="w-full pl-10 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
          />
          {showLocationResults && locationResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {locationResults.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => selectLocation(suggestion)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl focus:outline-none focus:bg-gray-700"
                >
                  <div className="text-white text-sm sm:text-base">{suggestion.name}</div>
                  <div className="text-gray-400 text-xs sm:text-sm">{suggestion.formatted_address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {formData.location.name && (
          <div className="mt-1 sm:mt-1.5 flex items-center text-xs sm:text-sm text-green-400">
            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {formData.location.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Date *</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer text-sm sm:text-base"
              style={{
                colorScheme: 'dark'
              }}
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
                    <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-400">
                      Event must be scheduled at least 1 hour in advance
                    </div>
                  )
                }
              }
              // Show normal date preview if valid or time not set yet
              return (
                <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-green-400">
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

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Time *</label>
          <div className="relative">
            <svg 
              className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="w-full pl-10 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer text-sm sm:text-base"
              style={{
                colorScheme: 'dark'
              }}
            />
          </div>
          {formData.time && (
            (() => {
              // Check if we also have date to do full validation
              if (formData.date) {
                const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
                const now = new Date()
                const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
                if (selectedDateTime <= oneHourFromNow) {
                  return (
                    <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-red-400">
                      Event must be scheduled at least 1 hour in advance
                    </div>
                  )
                }
              }
              // Show normal time preview if valid or date not set yet
              return (
                <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-green-400">
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
    </div>
  )

  // Step 4: Optional Details
  const renderStep4 = () => (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Skill Level (Optional)</label>
        <select
          value={formData.skill_level}
          onChange={(e) => handleInputChange('skill_level', e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
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
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Max Members *</label>
        <div className="relative">
          <Users className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
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
            className="w-full pl-10 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        {formData.max_members && (formData.max_members < 2 || formData.max_members > 50) ? (
          <p className="text-xs mt-0.5 sm:mt-1 text-red-400">
            {formData.max_members < 2 ? 'Minimum 2 members required' : 'Maximum 50 members allowed'}
          </p>
        ) : (
          <p className="text-xs mt-0.5 sm:mt-1 text-gray-400">Total groop size including you (min 2, max 50)</p>
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Cost per Person (Optional)</label>
        <div className="relative">
          <IndianRupee className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Free"
            value={formData.cost || ''}
            onChange={(e) => {
              const value = e.target.value;
              
              // Only allow numbers, decimal point, and empty string
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                const numValue = parseFloat(value) || 0;
                
                // Prevent entering values above the limit
                if (value !== '' && numValue > 100000) {
                  return; // Don't update state if above limit
                }
                
                handleInputChange('cost', value === '' ? null : numValue);
              }
            }}
            className={`w-full pl-10 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-800/50 border rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm sm:text-base ${
              formData.cost && formData.cost > 100000
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-600 focus:ring-teal-500'
            }`}
          />
        </div>
        {formData.cost && formData.cost > 100000 ? (
          <p className="text-xs mt-0.5 sm:mt-1 text-red-400">Cost cannot exceed ₹1,00,000</p>
        ) : (
          <p className="text-xs mt-0.5 sm:mt-1 text-gray-400">Leave empty if the activity is free (max ₹1,00,000)</p>
        )}
      </div>
    </div>
  )

  // Step 5: Review
  const renderStep5 = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Hidden input to prevent accidental form submission */}
      <input type="hidden" />
      
      {/* Confirmation Section */}
      <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-teal-500/20">
        <div className="flex items-start gap-2 sm:gap-3">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">Ready to Launch Your Groop?</h4>
            <p className="text-sm sm:text-base text-gray-300 mb-2 sm:mb-3">
              By creating this groop, you confirm that all information is accurate and you agree to:
            </p>
            <ul className="text-xs sm:text-sm text-gray-300 space-y-0.5 mb-2 sm:mb-3">
              <li>• Host the activity at the specified date, time, and location</li>
              <li>• Welcome and manage groop members respectfully</li>
              <li>• Provide clear communication about any changes</li>
              <li>• Follow GroopsApp community guidelines</li>
            </ul>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400" />
              <span>Your groop will be visible to other users immediately after creation</span>
            </div>
          </div>
        </div>
        
        {/* Agreement Checkbox */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-teal-500/20">
          <div className="flex items-start gap-2 sm:gap-3">
            <input
              type="checkbox"
              checked={formData.agreesToGuidelines}
              onChange={(e) => handleInputChange('agreesToGuidelines', e.target.checked)}
              className="mt-0.5 sm:mt-1 w-4 h-4 text-teal-600 bg-gray-800 border-gray-600 rounded focus:ring-teal-500 focus:ring-2"
            />
            <span className="text-xs sm:text-sm text-gray-300">
              I have read and agree to follow the{' '}
              <span className="text-teal-400 font-medium">GroopsApp Community Guidelines</span>{' '}
              and understand my responsibilities as a groop organizer.
            </span>
          </div>
          {!formData.agreesToGuidelines && (
            <p className="text-xs text-gray-400 mt-1.5 sm:mt-2 ml-6 sm:ml-7">
              You must agree to the guidelines before creating your groop
            </p>
          )}
        </div>
      </div>

      {/* Final Call to Action */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-teal-500/20 rounded-full text-teal-300 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Everything looks great!</span>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm">
          Click "Create Groop" below to make your groop live and start connecting with people
        </p>
      </div>
    </div>
  )

  // Navigation buttons
  const renderNavigationButtons = () => (
    <div className="flex justify-between items-center pt-3 sm:pt-4">
      {currentStep > 1 ? (
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-700 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Back
        </button>
      ) : (
        <div></div>
      )}

      {currentStep < totalSteps ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            nextStep()
          }}
          disabled={!isCurrentStepValid()}
          className={`flex items-center px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base ${
            isCurrentStepValid()
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={loading || validateForm() !== null}
          className={`flex items-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-colors text-sm sm:text-base ${
            loading || validateForm() !== null
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Groop
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
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
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-6">
            <Sparkles size={48} className="mx-auto mb-2" style={{ color: 'rgb(0, 173, 181)' }} />
            <div className="absolute -top-2 -right-2">
              <Sparkles size={24} className="animate-pulse" style={{ color: 'rgb(34, 211, 238)' }} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
            Ready to bring people together?
          </h2>
          <p className="mb-6 text-lg leading-relaxed" style={{ color: 'rgb(156, 163, 175)' }}>
            Join our amazing community to start creating groops and connecting with like-minded people in your area! 
            It's quick, free, and opens up a world of new friendships.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => signIn()}
              className="w-full py-3 text-lg font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(34, 211, 238) 100%)',
                border: 'none'
              }}
            >
              <Users className="w-5 h-5 mr-2" />
              Join the Community
            </Button>
            <p className="text-sm opacity-75" style={{ color: 'rgb(156, 163, 175)' }}>
              ✨ Takes less than 30 seconds • Completely free • No spam ever
            </p>
          </div>
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
            You need to complete your profile before creating a groop.
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
            Groop Created Successfully!
          </h2>
          <p style={{ color: 'rgb(156, 163, 175)' }}>
            Redirecting to your new groop...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Plus size={24} className="sm:w-8 sm:h-8" style={{ color: 'rgb(0, 173, 181)' }} />
              <div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Create New Groop
                </h1>
                <p className="text-sm sm:text-base lg:text-lg mt-0.5 sm:mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                  Organize an activity and bring people together
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-rgba(25, 30, 35, 0.8) to-rgba(31, 41, 55, 0.5) px-3 sm:px-4 py-2 sm:py-3 rounded-lg border" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
              <div className="text-xs sm:text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                Progress
              </div>
              <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${getFormCompletionPercentage()}%`,
                    background: 'linear-gradient(90deg, rgb(0, 173, 181), rgb(0, 200, 210))'
                  }}
                />
              </div>
              <div className="text-xs sm:text-sm font-medium" style={{ color: 'rgb(0, 173, 181)' }}>
                {getFormCompletionPercentage()}%
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
          
          {/* Error Message */}
          {error && (
            <div 
              className="p-3 sm:p-4 rounded-lg border flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertCircle size={16} className="sm:w-5 sm:h-5" style={{ color: 'rgb(239, 68, 68)' }} />
              <span className="text-sm sm:text-base" style={{ color: 'rgb(239, 68, 68)' }}>{error}</span>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <div 
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(0, 200, 210, 0.15) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 173, 181, 0.3)'
                }}
              >
                {/* Header with step info */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-block px-2 sm:px-3 py-1 sm:py-1.5 bg-teal-500/20 rounded-full text-teal-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                    Step {currentStep} of {totalSteps}
                </div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white mb-1">
                    {getStepInfo().title}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-300">
                    {getStepInfo().subtitle}
                  </p>
                  {formData.activity_type && currentStep > 1 && (
                    <div className="mt-2 sm:mt-3 text-sm sm:text-base text-teal-300 font-medium">
                      {getStepInfo().encouragement}
                  </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                    <span>Progress</span>
                    <span>{getFormCompletionPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${getFormCompletionPercentage()}%` }}
                      />
                    </div>
                  </div>

                {/* Step Content */}
                <div className="min-h-[240px] sm:min-h-[320px]">
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
              <div className="sticky top-8 space-y-3 sm:space-y-6">
                
                {/* Form Summary */}
                <div 
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(25, 30, 35, 0.8)',
                    borderColor: 'rgba(0, 173, 181, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                    Groop Summary
                  </h4>
                  
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Name:</span>
                      <span className="text-right break-words ml-2 max-w-[120px] sm:max-w-[140px]"
                            style={{ 
                              color: formData.name ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)',
                              wordWrap: 'break-word',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: '1.3'
                            }}>
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
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Date:</span>
                      <span className="text-right break-words ml-2 max-w-[120px] sm:max-w-[140px]"
                            style={{ 
                              color: formData.date ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)',
                              wordWrap: 'break-word',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: '1.3'
                            }}>
                        {formData.date ? new Date(formData.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Not set'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Time:</span>
                      <span style={{ color: formData.time ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)' }}>
                        {formData.time ? new Date(`2000-01-01T${formData.time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'Not set'}
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
                      <span style={{ color: formData.max_members ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)' }}>
                        {formData.max_members ? `${formData.max_members} people` : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Cost:</span>
                      <span style={{ color: formData.cost ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)' }}>
                        {formData.cost ? `₹${formData.cost} per person` : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span style={{ color: 'rgb(156, 163, 175)' }}>Location:</span>
                      <span className="text-right break-words ml-2 max-w-[120px] sm:max-w-[140px]"
                            style={{ 
                              color: formData.location.name ? 'rgb(238, 238, 238)' : 'rgb(75, 85, 99)',
                              wordWrap: 'break-word',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: '1.3'
                            }}>
                        {formData.location.name || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full py-2 sm:py-2.5 text-sm sm:text-base"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Tips */}
                <div 
                  className="p-2.5 sm:p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <h5 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'rgb(59, 130, 246)' }}>
                    🚀 Pro Groop Tips
                  </h5>
                  <ul className="text-xs space-y-0.5" style={{ color: 'rgb(156, 163, 175)' }}>
                    <li>• Write descriptions that make people excited to join!</li>
                    <li>• Pick spots with parking or public transport nearby</li>
                    <li>• "Beginner-friendly" attracts more diverse crowds</li>
                    <li>• Smaller groops (4-8 people) bond better</li>
                    <li>• Free activities get 3x more signups</li>
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