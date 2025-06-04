/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Users, IndianRupee, Search, Filter, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Groops = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedActivityType, setSelectedActivityType] = useState(searchParams.get('activity') || '')
  const [selectedSkillLevel, setSelectedSkillLevel] = useState(searchParams.get('skill') || '')
  const [showFilters, setShowFilters] = useState(false)
  
  // New filter states
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '')
  const [minMembers, setMinMembers] = useState(searchParams.get('min_members') || '')
  const [maxMembers, setMaxMembers] = useState(searchParams.get('max_members') || '')
  const [radius, setRadius] = useState(searchParams.get('radius') || '')
  
  // Location state for distance sorting
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [isUsingPreciseLocation, setIsUsingPreciseLocation] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Activity types for filter
  const activityTypes = [
    'cricket', 'football', 'basketball', 'tennis', 'badminton', 'swimming', 
    'running', 'cycling', 'volleyball', 'yoga', 'chess', 'gaming', 
    'photography', 'cooking', 'music', 'dancing'
  ]

  // Skill levels for filter
  const skillLevels = ['beginner', 'intermediate', 'advanced']

  // Scroll to top when entering groops page
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Load user location from localStorage and geocode it
  const loadUserLocation = useCallback(async () => {
    const savedLocation = localStorage.getItem('groops_user_location')
    
    if (!savedLocation) {
      setUserLocation(null)
      setIsUsingPreciseLocation(false)
      setLocationLoading(false)
      return
    }

    // Check if we have precise GPS coordinates saved
    const cachedCoords = localStorage.getItem('groops_user_coordinates')
    if (cachedCoords) {
      try {
        const coords = JSON.parse(cachedCoords)
        // Use GPS coordinates if they're from GPS source and less than 24 hours old
        const coordsAge = Date.now() - (coords.timestamp || 0)
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        if (coords.source === 'gps' && coordsAge < twentyFourHours) {
          setUserLocation({
            lat: coords.lat,
            lng: coords.lng,
            address: savedLocation
          })
          setIsUsingPreciseLocation(true)
          setLocationLoading(false)
          return
        }
      } catch (err) {
        console.error('Error parsing cached coordinates:', err)
      }
    }

    // Fall back to geocoding the address for manual locations or expired GPS
    if (window.google && window.google.maps) {
      try {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address: savedLocation }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location
            const coords = {
              lat: location.lat(),
              lng: location.lng(),
              address: savedLocation
            }
            
            setUserLocation(coords)
            setIsUsingPreciseLocation(false)
            
            // Cache geocoded coordinates (marked as geocoded, not GPS)
            localStorage.setItem('groops_user_coordinates', JSON.stringify({
              lat: coords.lat,
              lng: coords.lng,
              timestamp: Date.now(),
              source: 'geocoded'
            }))
          } else {
            console.error('Geocoding failed:', status)
            setUserLocation(null)
            setIsUsingPreciseLocation(false)
          }
          setLocationLoading(false)
        })
      } catch (err) {
        console.error('Error geocoding location:', err)
        setUserLocation(null)
        setIsUsingPreciseLocation(false)
        setLocationLoading(false)
      }
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          loadUserLocation()
          return true
        }
        return false
      }

      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          clearInterval(interval)
        }
      }, 100)
      
      setTimeout(() => {
        clearInterval(interval)
        setLocationLoading(false)
      }, 5000)
    }
  }, [])

  // Load user location on component mount
  useEffect(() => {
    loadUserLocation()
  }, [loadUserLocation])

  // Listen for location changes from LocationSearch component
  useEffect(() => {
    const handleLocationChange = () => {
      setLocationLoading(true)
      loadUserLocation()
    }

    // Listen for custom event from LocationSearch component
    window.addEventListener('locationChanged', handleLocationChange)

    return () => {
      window.removeEventListener('locationChanged', handleLocationChange)
    }
  }, [loadUserLocation])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms debounce delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch member profile data
  const fetchMemberProfile = async (username) => {
    if (memberProfiles[username]) return memberProfiles[username]
    
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${username}`)
      if (response.ok) {
        const profile = await response.json()
        setMemberProfiles(prev => ({
          ...prev,
          [username]: profile
        }))
        return profile
      }
    } catch (err) {
      console.error('Error fetching member profile:', err)
    }
    return null
  }

  // Build query string for API
  const buildQueryString = useCallback((pageNum = 1) => {
    const params = new URLSearchParams()
    
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery)
    if (selectedActivityType) params.append('activity_type', selectedActivityType)
    if (selectedSkillLevel) params.append('skill_level', selectedSkillLevel)
    
    // Price filters
    if (minPrice && !isNaN(minPrice)) params.append('min_price', minPrice)
    if (maxPrice && !isNaN(maxPrice)) params.append('max_price', maxPrice)
    
    // Date filters
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    
    // Group size filters
    if (minMembers && !isNaN(minMembers)) params.append('min_members', minMembers)
    if (maxMembers && !isNaN(maxMembers)) params.append('max_members', maxMembers)
    
    // Add location parameters for distance sorting
    if (userLocation) {
      params.append('user_lat', userLocation.lat.toString())
      params.append('user_lng', userLocation.lng.toString())
      
      // Add radius filter if specified
      if (radius && !isNaN(radius)) params.append('radius', radius)
      
      params.append('sort_by', 'distance')
      params.append('sort_order', 'asc')
    } else {
      params.append('sort_by', 'date_time')
      params.append('sort_order', 'asc')
    }
    
    // Backend expects offset and limit, not page
    const limit = 9
    const offset = (pageNum - 1) * limit
    params.append('offset', offset.toString())
    params.append('limit', limit.toString())
    
    return params.toString()
  }, [debouncedSearchQuery, selectedActivityType, selectedSkillLevel, minPrice, maxPrice, dateFrom, dateTo, minMembers, maxMembers, radius, userLocation])

  // Fetch groups
  const fetchGroups = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const queryString = buildQueryString(pageNum)
      const response = await fetch(`${API_BASE_URL}/groups?${queryString}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch groops')
      }
      
      const data = await response.json()
      const newGroups = data || []
      
      if (append && pageNum > 1) {
        setGroups(prev => [...prev, ...newGroups])
      } else {
        setGroups(newGroups)
      }
      
      // Check if there are more groups to load
      setHasMore(newGroups.length === 9)
      
      // Fetch member profiles for all approved members
      const allMembers = newGroups.flatMap(group => 
        group.members?.filter(m => m.status === 'approved').map(m => m.username) || []
      )
      const uniqueMembers = [...new Set(allMembers)]
      
      uniqueMembers.forEach(username => {
        fetchMemberProfile(username)
      })
      
    } catch (err) {
      setError(err.message)
      console.error('Error fetching groops:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [API_BASE_URL, buildQueryString])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)
    if (selectedActivityType) params.set('activity', selectedActivityType)
    if (selectedSkillLevel) params.set('skill', selectedSkillLevel)
    if (minPrice) params.set('min_price', minPrice)
    if (maxPrice) params.set('max_price', maxPrice)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (minMembers) params.set('min_members', minMembers)
    if (maxMembers) params.set('max_members', maxMembers)
    if (radius) params.set('radius', radius)
    
    setSearchParams(params)
  }, [debouncedSearchQuery, selectedActivityType, selectedSkillLevel, minPrice, maxPrice, dateFrom, dateTo, minMembers, maxMembers, radius, setSearchParams])

  // Fetch groups when filters change
  useEffect(() => {
    // Only fetch groups after location loading is complete
    if (!locationLoading) {
      setPage(1)
      fetchGroups(1, false)
    }
  }, [fetchGroups, locationLoading, userLocation])

  // Load more groups manually
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchGroups(nextPage, true)
    }
  }, [hasMore, loadingMore, page, fetchGroups])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSelectedActivityType('')
    setSelectedSkillLevel('')
    setMinPrice('')
    setMaxPrice('')
    setDateFrom('')
    setDateTo('')
    setMinMembers('')
    setMaxMembers('')
    setRadius('')
    setShowFilters(false)
  }

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Activity type colors
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

  // Skill level colors
  const getSkillLevelBadge = (level) => {
    const styles = {
      beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgb(34, 197, 94)' },
      intermediate: { bg: 'rgba(251, 191, 36, 0.1)', text: 'rgb(251, 191, 36)' },
      advanced: { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(239, 68, 68)' }
    }
    return styles[level] || styles.beginner
  }

  return (
    <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
              <span 
                className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent"
                style={{ 
                  textShadow: '0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4), 0 0 90px rgba(34, 211, 238, 0.3)'
                }}
              >
                Groops
              </span>
              <span style={{ color: 'rgb(238, 238, 238)' }}> near you</span>
            </h1>
            <p style={{ color: 'rgb(156, 163, 175)' }}>
              {userLocation ? 
                `Discover and join groops within 50km of ${isUsingPreciseLocation ? 'your current location' : userLocation.address}` :
                'Discover and join groops that match your interests'
              }
            </p>
          </div>
          
          {/* Create Group Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/create-group')}
              className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(0, 200, 210) 50%, rgb(0, 173, 181) 100%)',
                color: 'rgb(15, 20, 25)',
                boxShadow: '0 8px 32px rgba(0, 173, 181, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* Animated background effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
                  transform: 'translateX(-100%)',
                }}
              />
              
              {/* Plus icon with animation */}
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-300 group-hover:rotate-90" 
                   style={{ backgroundColor: 'rgba(15, 20, 25, 0.2)' }}>
                <Plus size={14} className="transition-all duration-300" />
              </div>
              
              <span className="relative z-10 tracking-wide">Host Groop</span>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -top-2 -left-2 w-[calc(100%+16px)] h-[calc(100%+16px)] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div 
                  className="w-full h-full rounded-xl animate-pulse"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(0, 173, 181, 0.4), transparent)',
                    filter: 'blur(1px)'
                  }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groops..."
                className="pl-10"
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  borderColor: 'rgba(75, 85, 99, 0.3)',
                  color: 'rgb(238, 238, 238)'
                }}
              />
            </div>

            {/* Filter Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
              style={{
                backgroundColor: showFilters ? 'rgba(0, 173, 181, 0.1)' : 'transparent',
                borderColor: 'rgba(0, 173, 181, 0.3)',
                color: 'rgb(0, 173, 181)'
              }}
            >
              <Filter size={16} />
              Filters
              {(selectedActivityType || selectedSkillLevel || minPrice || maxPrice || dateFrom || dateTo || minMembers || maxMembers || radius) && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[selectedActivityType, selectedSkillLevel, minPrice, maxPrice, dateFrom, dateTo, minMembers, maxMembers, radius].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div 
              className="p-6 rounded-lg border mb-4"
              style={{
                backgroundColor: 'rgba(25, 30, 35, 0.8)',
                borderColor: 'rgba(0, 173, 181, 0.2)'
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Filters
                </h3>
                {(searchQuery || selectedActivityType || selectedSkillLevel || minPrice || maxPrice || dateFrom || dateTo || minMembers || maxMembers || radius) && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={16} className="mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Activity Type Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Activity Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {activityTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedActivityType(selectedActivityType === type ? '' : type)}
                          className="p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 text-left"
                          style={{
                            backgroundColor: selectedActivityType === type ? getActivityTypeColor(type) + '20' : 'rgba(75, 85, 99, 0.2)',
                            color: selectedActivityType === type ? getActivityTypeColor(type) : 'rgb(156, 163, 175)',
                            border: selectedActivityType === type ? `1px solid ${getActivityTypeColor(type)}` : '1px solid rgba(75, 85, 99, 0.3)'
                          }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skill Level Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Skill Level
                    </label>
                    <div className="space-y-2">
                      {skillLevels.map(level => {
                        const skillStyle = getSkillLevelBadge(level)
                        return (
                          <button
                            key={level}
                            onClick={() => setSelectedSkillLevel(selectedSkillLevel === level ? '' : level)}
                            className="w-full p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 text-left"
                            style={{
                              backgroundColor: selectedSkillLevel === level ? skillStyle.bg : 'rgba(75, 85, 99, 0.2)',
                              color: selectedSkillLevel === level ? skillStyle.text : 'rgb(156, 163, 175)',
                              border: selectedSkillLevel === level ? `1px solid ${skillStyle.text}` : '1px solid rgba(75, 85, 99, 0.3)'
                            }}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Price Range (₹)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Date Range
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">From</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">To</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group Size Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                      Group Size
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          placeholder="Min members"
                          value={minMembers}
                          onChange={(e) => setMinMembers(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Max members"
                          value={maxMembers}
                          onChange={(e) => setMaxMembers(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Radius Filter (only show if user has location) */}
                  {userLocation && (
                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                        Distance Radius (km)
                      </label>
                      <div className="space-y-3">
                        <input
                          type="number"
                          placeholder="e.g., 10"
                          value={radius}
                          onChange={(e) => setRadius(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min="1"
                        />
                        <div className="text-xs text-gray-400">
                          {isUsingPreciseLocation ? 'From your current location' : `From ${userLocation.address}`}
                          {radius && ` • Within ${radius}km`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && groups.length === 0 && (
          <div className="text-center py-16">
            <div 
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'rgb(156, 163, 175)' }}>Loading groups...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p style={{ color: 'rgb(239, 68, 68)' }}>Error: {error}</p>
            <Button 
              onClick={() => fetchGroups(1, false)} 
              className="mt-4"
              style={{ backgroundColor: 'rgb(0, 173, 181)', color: 'white' }}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Groups Grid - 3 Column Layout */}
        {!loading && groups.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {groups.map((group) => {
                const skillStyle = getSkillLevelBadge(group.skill_level)
                const approvedMembers = group.members?.filter(m => m.status === 'approved').length || 0
                
                return (
                  <div
                    key={group.id}
                    className="group rounded-lg border backdrop-blur cursor-pointer hover:border-opacity-80 transition-all"
                    style={{
                      backgroundColor: 'rgba(25, 30, 35, 0.8)',
                      borderColor: 'rgba(0, 173, 181, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            {/* Title */}
                            <h3 
                              className="text-lg font-semibold group-hover:text-cyan-400 transition-colors mb-1 line-clamp-2"
                              style={{ color: 'rgb(238, 238, 238)' }}
                            >
                              {group.name}
                            </h3>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              {group.skill_level && (
                                <div
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: skillStyle.bg,
                                    color: skillStyle.text
                                  }}
                                >
                                  {group.skill_level}
                                </div>
                              )}
                              <div 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: getActivityTypeColor(group.activity_type) + '20',
                                  color: getActivityTypeColor(group.activity_type)
                                }}
                              >
                                {group.activity_type}
                              </div>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p 
                            className="text-sm mb-2 line-clamp-2"
                            style={{ color: 'rgb(156, 163, 175)' }}
                          >
                            {group.description}
                          </p>

                          {/* Details */}
                          <div className="space-y-2 text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-2 flex-shrink-0" />
                              <span className="truncate">{formatDate(group.date_time)}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-2 flex-shrink-0" />
                              <span className="truncate">{group.location?.formatted_address || group.location?.name || 'Location TBD'}</span>
                              {userLocation && group.distance_km && (
                                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{
                                  backgroundColor: 'rgba(0, 173, 181, 0.1)',
                                  color: 'rgb(0, 173, 181)'
                                }}>
                                  {group.distance_km}km
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <Users size={14} className="mr-2 flex-shrink-0" />
                              <span>{approvedMembers}/{group.max_members} members</span>
                              {group.cost > 0 && (
                                <span className="mx-2">•</span>
                              )}
                              {group.cost > 0 && (
                                <div className="flex items-center">
                                  <IndianRupee size={14} className="mr-1" />
                                  <span>{group.cost}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                            
                            {/* Member Avatars */}
                            <div className="pt-4 border-t" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                              <div className="mb-3">
                                <p className="text-xs font-semibold mb-3" style={{ color: 'rgb(0, 173, 181)' }}>
                                  WHO'S JOINING
                                </p>
                              </div>
                              <div className="flex items-center -space-x-2 overflow-hidden mb-3">
                                {/* Show approved members (up to 8 for horizontal layout) */}
                                {(() => {
                                  const approvedMembersList = group.members?.filter(m => m.status === 'approved') || []
                                  const maxSlotsToShow = Math.min(8, group.max_members)
                                  const membersToShow = approvedMembersList.slice(0, maxSlotsToShow)
                                  const emptySlots = Math.max(0, maxSlotsToShow - membersToShow.length)
                                  
                                  return (
                                    <>
                                      {/* Render actual approved members */}
                                      {membersToShow.map((member, index) => {
                                        const profile = memberProfiles[member.username]
                                        const isCreator = member.username === group.organiser_id
                                        
                                        // Generate consistent color for each member
                                        const colors = [
                                          'rgb(0, 173, 181)',   // cyan (creator gets this)
                                          'rgb(34, 197, 94)',   // green
                                          'rgb(168, 85, 247)',  // purple
                                          'rgb(251, 191, 36)',  // yellow
                                          'rgb(239, 68, 68)',   // red
                                          'rgb(59, 130, 246)',  // blue
                                        ]
                                        const colorIndex = isCreator ? 0 : (member.username.charCodeAt(0) % (colors.length - 1)) + 1
                                        const bgColor = colors[colorIndex]
                                        
                                        return (
                                          <div
                                            key={member.username}
                                            className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium flex-shrink-0"
                                            style={{
                                              backgroundColor: bgColor + '20',
                                              borderColor: 'rgb(15, 20, 25)',
                                              color: bgColor,
                                              zIndex: 10 - index
                                            }}
                                            title={member.username}
                                          >
                                            {profile && profile.avatar_url ? (
                                              <img
                                                src={`${API_BASE_URL}/profiles/${member.username}/image`}
                                                alt={member.username}
                                                className="w-full h-full object-cover rounded-full"
                                                onError={(e) => {
                                                  e.target.style.display = 'none'
                                                  e.target.nextSibling.style.display = 'flex'
                                                }}
                                              />
                                            ) : null}
                                            <div
                                              className="w-full h-full flex items-center justify-center text-xs font-medium"
                                              style={{
                                                display: profile && profile.avatar_url ? 'none' : 'flex'
                                              }}
                                            >
                                              {member.username.slice(0, 2).toUpperCase()}
                                            </div>
                                          </div>
                                        )
                                      })}

                                      {/* Show empty skeleton slots for remaining spaces */}
                                      {Array.from({ length: emptySlots }).map((_, index) => (
                                        <div
                                          key={`empty-${index}`}
                                          className="relative w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0"
                                          style={{
                                            borderColor: 'rgba(156, 163, 175, 0.4)',
                                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                            zIndex: 9 - (membersToShow.length + index)
                                          }}
                                          title="Available spot"
                                        >
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                              backgroundColor: 'rgba(156, 163, 175, 0.6)'
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </>
                                  )
                                })()}

                                {/* Show +X remaining if there are more spots beyond the 8 displayed */}
                                {group.max_members > 8 && (
                                  <div className="flex items-center ml-2 flex-shrink-0">
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: 'rgb(156, 163, 175)' }}
                                    >
                                      +{group.max_members - 8}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Organizer */}
                              <div className="pt-3 border-t" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold mr-3 overflow-hidden"
                                      style={{ 
                                        borderColor: 'rgb(0, 173, 181)', 
                                        backgroundColor: 'rgba(0, 173, 181, 0.2)', 
                                        color: 'rgb(0, 173, 181)' 
                                      }}
                                    >
                                      {memberProfiles[group.organiser_id] && memberProfiles[group.organiser_id].avatar_url ? (
                                        <img
                                          src={`${API_BASE_URL}/profiles/${group.organiser_id}/image`}
                                          alt={group.organiser_id}
                                          className="w-full h-full object-cover rounded-full"
                                          onError={(e) => {
                                            e.target.style.display = 'none'
                                            e.target.nextSibling.style.display = 'flex'
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="w-full h-full flex items-center justify-center text-xs font-bold"
                                        style={{
                                          display: memberProfiles[group.organiser_id] && memberProfiles[group.organiser_id].avatar_url ? 'none' : 'flex'
                                        }}
                                      >
                                        {group.organiser_id?.slice(0, 1).toUpperCase()}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                                        Organized by
                                      </p>
                                      <p className="text-sm font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
                                        {group.organiser_id}
                                      </p>
                                    </div>
                                  </div>
                                  <div 
                                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-opacity-80"
                                    style={{ 
                                      backgroundColor: 'rgba(0, 173, 181, 0.2)', 
                                      color: 'rgb(0, 173, 181)',
                                      border: '1px solid rgba(0, 173, 181, 0.3)'
                                    }}
                                  >
                                    View Details →
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-8">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3"
                  style={{
                    backgroundColor: loadingMore ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
                    color: 'white'
                  }}
                >
                  {loadingMore ? (
                    <>
                      <div 
                        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
                        style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                      />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
            
            {/* End of Results Indicator */}
            {!hasMore && groups.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
                  No more groops to load
                </p>
              </div>
            )}
          </>
        )}

        {/* No Results State */}
        {!loading && groups.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="mb-4">
              <Search size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'rgb(156, 163, 175)' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                No groops found
              </h3>
              <p style={{ color: 'rgb(156, 163, 175)' }}>
                {searchQuery || selectedActivityType || selectedSkillLevel 
                  ? 'Try adjusting your search or filters'
                  : userLocation 
                    ? `No groops found within 50km of ${isUsingPreciseLocation ? 'your current location' : userLocation.address}` 
                    : 'No groops available at the moment'
                }
              </p>
            </div>
            {(searchQuery || selectedActivityType || selectedSkillLevel) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                style={{
                  borderColor: 'rgba(0, 173, 181, 0.3)',
                  color: 'rgb(0, 173, 181)'
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Groops 