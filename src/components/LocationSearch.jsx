/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, RotateCcw, Search } from 'lucide-react'

const LocationSearch = () => {
  const [location, setLocation] = useState('')
  const [placeholder, setPlaceholder] = useState('Enter location...')
  const [isLoading, setIsLoading] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [locationResults, setLocationResults] = useState([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const [debouncedLocation, setDebouncedLocation] = useState('')
  const [isUserTyping, setIsUserTyping] = useState(false)
  const dropdownRef = useRef(null)

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // Storage keys
  const STORAGE_KEYS = {
    location: 'groops_user_location',
    isManual: 'groops_location_is_manual',
    lastAutoDetect: 'groops_last_auto_detect'
  }

  // Load Google Maps API if not already loaded
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found in environment variables')
      setPlaceholder(getMobilePlaceholder('Enter location...'))
      return
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsLoaded(true)
      return
    }

    // Prevent multiple script loading attempts
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script is already being loaded, wait for it
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setGoogleMapsLoaded(true)
        }
      }
      
      existingScript.addEventListener('load', checkLoaded)
      existingScript.addEventListener('error', () => {
        console.error('Failed to load Google Maps API')
        setPlaceholder(getMobilePlaceholder('Enter location...'))
      })
      
      return () => {
        existingScript.removeEventListener('load', checkLoaded)
      }
    }

    // Load Google Maps JavaScript API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setGoogleMapsLoaded(true)
      } else {
        console.error('Google Maps API loaded but services not available')
        setPlaceholder(getMobilePlaceholder('Enter location...'))
      }
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      setPlaceholder(getMobilePlaceholder('Enter location...'))
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [GOOGLE_MAPS_API_KEY])

  // Load saved location and mode on component mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(STORAGE_KEYS.location)
    const savedIsManual = localStorage.getItem(STORAGE_KEYS.isManual) === 'true'
    
    if (savedLocation && savedIsManual) {
      setLocation(savedLocation)
      setIsManualMode(true)
      setPlaceholder(getMobilePlaceholder(savedLocation))
    } else if (savedLocation && !savedIsManual) {
      // Auto-detected location exists, use it but allow re-detection
      setLocation(savedLocation)
      setIsManualMode(false)
      setPlaceholder(getMobilePlaceholder(savedLocation))
    }
  }, [])

  // Get mobile-friendly placeholder text
  const getMobilePlaceholder = (text) => {
    const isMobile = window.innerWidth < 640 // sm breakpoint
    if (!isMobile) return text
    
    // Shorter placeholders for mobile
    const mobileMap = {
      'Detecting location...': 'Detecting...',
      'Getting precise location...': 'Getting GPS...',
      'Getting GPS location...': 'Getting GPS...',
      'Enter location...': 'Location...'
    }
    
    return mobileMap[text] || (text.length > 12 ? text.substring(0, 10) + '...' : text)
  }

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location)
    }, 500)

    return () => clearTimeout(timer)
  }, [location])

  // Additional debounced event for location changes (when user manually types)
  useEffect(() => {
    if (isManualMode && location.trim() && !isUserTyping) {
      // Dispatch event after user stops typing
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('locationChanged', { 
          detail: { location: location.trim(), manual: true } 
        }))
      }, 1000) // 1 second after user stops typing

      return () => clearTimeout(timer)
    }
  }, [location, isManualMode, isUserTyping])

  // Trigger search when debounced value changes (only if user is actively typing)
  useEffect(() => {
    if (isManualMode && isUserTyping && debouncedLocation.trim().length >= 3) {
      searchLocations(debouncedLocation)
    } else {
      setLocationResults([])
      setShowLocationResults(false)
    }
  }, [debouncedLocation, isManualMode, isUserTyping])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLocationResults(false)
      }
    }

    if (showLocationResults) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLocationResults])

  // Search locations with Google Places API
  const searchLocations = async (query) => {
    if (!query.trim() || query.trim().length < 3 || !googleMapsLoaded || !window.google) {
      setLocationResults([])
      setShowLocationResults(false)
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

  // Handle location selection from dropdown
  const selectLocation = (selectedLocation) => {
    const locationText = selectedLocation.formatted_address || selectedLocation.name
    setLocation(locationText)
    setPlaceholder(getMobilePlaceholder(locationText))
    setShowLocationResults(false)
    setIsUserTyping(false)
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.location, locationText)
    localStorage.setItem(STORAGE_KEYS.isManual, 'true')
    setIsManualMode(true)
    
    // Clear GPS coordinates since this is manual selection
    localStorage.removeItem('groops_user_coordinates')
    
    // Dispatch custom event to notify other components (like Groops)
    window.dispatchEvent(new CustomEvent('locationChanged', { 
      detail: { location: locationText, manual: true } 
    }))
  }

  // Handle manual input change
  const handleLocationChange = (e) => {
    const value = e.target.value
    setLocation(value)
    setIsUserTyping(true)
    
    if (!isManualMode) {
      setIsManualMode(true)
      localStorage.setItem(STORAGE_KEYS.isManual, 'true')
    }
    
    // Clear GPS coordinates when manually typing
    localStorage.removeItem('groops_user_coordinates')
    
    // Save to localStorage as user types (debounced)
    if (value.trim()) {
      localStorage.setItem(STORAGE_KEYS.location, value)
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    // Clear the location text when user clicks on the input
    setLocation('')
    setIsUserTyping(true)
    setIsManualMode(true)
    localStorage.setItem(STORAGE_KEYS.isManual, 'true')
    
    // Clear GPS coordinates when manually selecting
    localStorage.removeItem('groops_user_coordinates')
  }

  // Handle input blur
  const handleInputBlur = () => {
    // Small delay to allow for dropdown clicks
    setTimeout(() => {
      setIsUserTyping(false)
    }, 150)
  }

  // Auto-detect GPS location
  const getGPSLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not supported'))
        return
      }

      if (!googleMapsLoaded || !window.google) {
        reject(new Error('Google Maps API not loaded'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            
            // Use Google Maps Geocoding API
            const geocoder = new window.google.maps.Geocoder()
            const latlng = { lat: latitude, lng: longitude }
            
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                // Extract city and state from address components
                const addressComponents = results[0].address_components
                let city = ''
                let state = ''
                
                for (const component of addressComponents) {
                  const types = component.types
                  
                  if (types.includes('locality')) {
                    city = component.long_name
                  } else if (types.includes('administrative_area_level_1')) {
                    state = component.short_name
                  }
                }
                
                let gpsLocation
                if (city && state) {
                  gpsLocation = `${city}, ${state}`
                } else if (city) {
                  gpsLocation = city
                } else {
                  // Fallback to formatted address
                  const formattedAddress = results[0].formatted_address
                  gpsLocation = formattedAddress.split(',').slice(0, 2).join(',').trim()
                }
                
                // Save precise coordinates for GPS detection
                localStorage.setItem('groops_user_coordinates', JSON.stringify({
                  lat: latitude,
                  lng: longitude,
                  timestamp: Date.now(),
                  source: 'gps' // Mark as GPS source for precise coordinates
                }))
                
                resolve(gpsLocation)
              } else {
                reject(new Error(`Geocoding failed: ${status}`))
              }
            })
          } catch (error) {
            reject(error)
          }
        },
        (error) => {
          reject(error)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // Detect location automatically using IP first, then GPS for precision
  const detectLocation = useCallback(async () => {
    setIsLoading(true)
    setIsManualMode(false)
    setIsUserTyping(false)
    
    try {
      // Try IP detection first
      setPlaceholder(getMobilePlaceholder('Detecting location...'))
      
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.reason || 'IP detection failed')
      }
      
      if (data.city && data.region) {
        const ipLocation = `${data.city}, ${data.region}`
        setLocation(ipLocation)
        setPlaceholder(getMobilePlaceholder(ipLocation))
        
        // Save as auto-detected location
        localStorage.setItem(STORAGE_KEYS.location, ipLocation)
        localStorage.setItem(STORAGE_KEYS.isManual, 'false')
        localStorage.setItem(STORAGE_KEYS.lastAutoDetect, Date.now().toString())
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('locationChanged', { 
          detail: { location: ipLocation, manual: false } 
        }))
        
        // Try GPS for better precision in the background
        if (googleMapsLoaded) {
          try {
            setPlaceholder(getMobilePlaceholder('Getting precise location...'))
            const gpsLocation = await getGPSLocation()
            setLocation(gpsLocation)
            setPlaceholder(getMobilePlaceholder(gpsLocation))
            localStorage.setItem(STORAGE_KEYS.location, gpsLocation)
            
            // Dispatch event for GPS location update
            window.dispatchEvent(new CustomEvent('locationChanged', { 
              detail: { location: gpsLocation, manual: false } 
            }))
          } catch (gpsError) {
            console.log('GPS failed, keeping IP location:', gpsError.message)
          }
        }
      } else {
        throw new Error('IP detection returned incomplete data')
      }
    } catch (ipError) {
      console.error('IP location detection failed:', ipError)
      
      // Try GPS as fallback
      if (googleMapsLoaded) {
        try {
          setPlaceholder(getMobilePlaceholder('Getting GPS location...'))
          const gpsLocation = await getGPSLocation()
          setLocation(gpsLocation)
          setPlaceholder(getMobilePlaceholder(gpsLocation))
          localStorage.setItem(STORAGE_KEYS.location, gpsLocation)
          localStorage.setItem(STORAGE_KEYS.isManual, 'false')
          
          // Dispatch event for GPS fallback location
          window.dispatchEvent(new CustomEvent('locationChanged', { 
            detail: { location: gpsLocation, manual: false } 
          }))
        } catch (gpsError) {
          console.error('All location detection failed:', gpsError)
          setPlaceholder(getMobilePlaceholder('Enter location...'))
        }
      } else {
        setPlaceholder(getMobilePlaceholder('Enter location...'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [googleMapsLoaded])

  // Auto-detect location only if not manually set or on first visit
  useEffect(() => {
    const savedIsManual = localStorage.getItem(STORAGE_KEYS.isManual) === 'true'
    const hasLocation = localStorage.getItem(STORAGE_KEYS.location)
    
    // Only auto-detect if:
    // 1. No location is saved, OR
    // 2. Location was auto-detected and it's been more than 24 hours
    if (!hasLocation || (!savedIsManual && shouldRefreshAutoLocation())) {
      if (googleMapsLoaded) {
        detectLocation()
      } else {
        // Wait for Google Maps to load
        const timeout = setTimeout(() => {
          if (!localStorage.getItem(STORAGE_KEYS.location) || !savedIsManual) {
            detectLocation()
          }
        }, 2000)
        
        return () => clearTimeout(timeout)
      }
    }
  }, [detectLocation, googleMapsLoaded])

  // Check if auto-detected location should be refreshed (after 24 hours)
  const shouldRefreshAutoLocation = () => {
    const lastAutoDetect = localStorage.getItem(STORAGE_KEYS.lastAutoDetect)
    if (!lastAutoDetect) return true
    
    const twentyFourHours = 24 * 60 * 60 * 1000
    return Date.now() - parseInt(lastAutoDetect) > twentyFourHours
  }

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <div className="relative" ref={dropdownRef}>
        <MapPin 
          size={14} 
          className="absolute left-2 xs:left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-10"
          style={{ color: 'rgb(0, 173, 181)' }}
        />
        <Input 
          value={location}
          onChange={handleLocationChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={getMobilePlaceholder(placeholder)}
          className="h-8 pl-7 pr-8 xs:pl-9 xs:pr-12 w-28 xs:w-48 sm:w-40 md:w-48 lg:w-56 xl:w-64 text-xs sm:text-sm"
          style={{ 
            backgroundColor: 'rgb(15, 20, 25)',
            color: 'rgb(238, 238, 238)',
            border: '1px solid rgb(0, 173, 181)',
            boxShadow: '0 0 12px rgba(0, 173, 181, 0.4)',
          }}
        />
        
        {/* Auto-detect button */}
        <button
          onClick={detectLocation}
          disabled={isLoading}
          className="absolute right-1 xs:right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors hover:bg-opacity-20"
          style={{
            color: isLoading ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
            backgroundColor: 'transparent'
          }}
          title={isManualMode ? "Detect my location" : "Refresh location"}
        >
          {isLoading ? (
            <div 
              className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(0, 173, 181, 0.5)', borderTopColor: 'transparent' }}
            />
          ) : (
            <RotateCcw size={12} />
          )}
        </button>

        {/* Location suggestions dropdown */}
        {showLocationResults && locationResults.length > 0 && (
          <div 
            className="absolute top-full left-0 mt-1 w-full max-w-sm rounded-lg border shadow-lg z-50 max-h-60 overflow-y-auto"
            style={{
              backgroundColor: 'rgb(25, 30, 35)',
              borderColor: 'rgba(0, 173, 181, 0.2)',
              minWidth: '250px'
            }}
          >
            {locationResults.map((result, index) => (
              <button
                key={result.place_id || index}
                onClick={() => selectLocation(result)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 transition-colors border-b last:border-b-0 flex items-start gap-2"
                style={{ 
                  borderColor: 'rgba(75, 85, 99, 0.3)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Search size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'rgb(156, 163, 175)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" style={{ color: 'rgb(238, 238, 238)' }}>
                    {result.name}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'rgb(156, 163, 175)' }}>
                    {result.formatted_address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationSearch
 