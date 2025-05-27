import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, MapPin, Users, IndianRupee, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CreateGroup = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

    try {
      // Mock location results for now - replace with actual Google Places API
      const mockResults = [
        {
          place_id: '1',
          name: 'Central Park',
          formatted_address: 'Central Park, New York, NY, USA',
          latitude: 40.7829,
          longitude: -73.9654
        },
        {
          place_id: '2', 
          name: 'Liberty Park',
          formatted_address: 'Liberty Park, Jersey City, NJ, USA',
          latitude: 40.7114,
          longitude: -74.0447
        }
      ].filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.formatted_address.toLowerCase().includes(query.toLowerCase())
      )

      setLocationResults(mockResults)
      setShowLocationResults(true)
    } catch (err) {
      console.error('Location search error:', err)
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

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) return 'Group name is required'
    if (!formData.description.trim()) return 'Description is required'
    if (!formData.date_time) return 'Date and time are required'
    if (!formData.activity_type) return 'Activity type is required'
    if (!formData.skill_level) return 'Skill level is required'
    if (formData.max_members < 2) return 'Group must allow at least 2 members'
    if (formData.max_members > 50) return 'Group cannot exceed 50 members'
    if (formData.cost < 0) return 'Cost cannot be negative'
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
      // Convert local datetime to UTC
      const localDateTime = new Date(formData.date_time)
      const utcDateTime = localDateTime.toISOString()

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        date_time: utcDateTime,
        activity_type: formData.activity_type,
        skill_level: formData.skill_level,
        max_members: parseInt(formData.max_members),
        cost: parseFloat(formData.cost),
        location: formData.location
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Plus size={32} style={{ color: 'rgb(0, 173, 181)' }} />
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
              Create New Groop
            </h1>
          </div>
          <p style={{ color: 'rgb(156, 163, 175)' }}>
            Organize an activity and bring people together
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
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

          {/* Basic Details */}
          <div 
            className="p-6 rounded-lg border space-y-6"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
              Basic Details
            </h3>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                Group Name *
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
                  color: 'rgb(238, 238, 238)'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell people what this group is about, what to expect, and any requirements..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 rounded-md border text-sm resize-none"
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  borderColor: 'rgba(75, 85, 99, 0.3)',
                  color: 'rgb(238, 238, 238)'
                }}
              />
              <div className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                {formData.description.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Activity & Skill Level */}
          <div 
            className="p-6 rounded-lg border space-y-6"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
              Activity Type & Level
            </h3>

            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                Activity Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activityTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('activity_type', type)}
                    className="p-3 rounded-lg text-sm font-medium transition-colors text-left"
                    style={{
                      backgroundColor: formData.activity_type === type ? getActivityTypeColor(type) + '20' : 'rgba(75, 85, 99, 0.2)',
                      color: formData.activity_type === type ? getActivityTypeColor(type) : 'rgb(156, 163, 175)',
                      border: formData.activity_type === type ? `1px solid ${getActivityTypeColor(type)}` : '1px solid rgba(75, 85, 99, 0.3)'
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                Skill Level *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {skillLevels.map(level => {
                  const skillStyle = getSkillLevelStyle(level)
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleInputChange('skill_level', level)}
                      className="p-3 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: formData.skill_level === level ? skillStyle.bg : 'rgba(75, 85, 99, 0.2)',
                        color: formData.skill_level === level ? skillStyle.text : 'rgb(156, 163, 175)',
                        border: formData.skill_level === level ? `1px solid ${skillStyle.text}` : '1px solid rgba(75, 85, 99, 0.3)'
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Date, Time & Location */}
          <div 
            className="p-6 rounded-lg border space-y-6"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
              When & Where
            </h3>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                Date & Time *
              </label>
              <div className="relative">
                <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
                <input
                  type="datetime-local"
                  value={formData.date_time}
                  onChange={(e) => handleInputChange('date_time', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full pl-10 pr-3 py-2 rounded-md border text-sm"
                  style={{
                    backgroundColor: 'rgba(31, 41, 55, 0.5)',
                    borderColor: 'rgba(75, 85, 99, 0.3)',
                    color: 'rgb(238, 238, 238)'
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                Time will be displayed in your local timezone
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                Location *
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
                    color: 'rgb(238, 238, 238)'
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

          {/* Group Settings */}
          <div 
            className="p-6 rounded-lg border space-y-6"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
              Group Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Max Members */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                  Maximum Members *
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
                      color: 'rgb(238, 238, 238)'
                    }}
                  />
                </div>
              </div>

              {/* Cost */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                  Cost per Person (₹)
                </label>
                <div className="relative">
                  <IndianRupee size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    min={0}
                    step="0.01"
                    placeholder="0"
                    className="w-full pl-10"
                    style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      color: 'rgb(238, 238, 238)'
                    }}
                  />
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                  Leave as 0 for free events
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 font-semibold"
              style={{
                backgroundColor: loading ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
                color: 'white'
              }}
            >
              {loading ? (
                <>
                  <div 
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
                    style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroup 