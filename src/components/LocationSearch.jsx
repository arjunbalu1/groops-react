import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

const LocationSearch = () => {
  const [location, setLocation] = useState('')
  const [placeholder, setPlaceholder] = useState('Detecting location...')
  const [isLoading, setIsLoading] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

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
      // Cleanup script if component unmounts (though this rarely happens for Header)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [GOOGLE_MAPS_API_KEY])

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

  // Automatically get GPS location
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
            console.log('GPS coordinates:', { latitude, longitude })
            
            // Use Google Maps Geocoding API instead of OpenStreetMap
            const geocoder = new window.google.maps.Geocoder()
            const latlng = { lat: latitude, lng: longitude }
            
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                console.log('Google geocoding results:', results[0])
                
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
                
                if (city && state) {
                  const gpsLocation = `${city}, ${state}`
                  console.log('GPS location:', gpsLocation)
                  resolve(gpsLocation)
                } else if (city) {
                  resolve(city)
                } else {
                  // Fallback to formatted address
                  const formattedAddress = results[0].formatted_address
                  const shortAddress = formattedAddress.split(',').slice(0, 2).join(',').trim()
                  resolve(shortAddress)
                }
              } else {
                console.error('Google geocoding failed:', status)
                reject(new Error(`Geocoding failed: ${status}`))
              }
            })
          } catch (error) {
            console.error('GPS geocoding failed:', error)
            reject(error)
          }
        },
        (error) => {
          console.error('GPS error:', error)
          reject(error)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // Detect location automatically using IP first, then GPS for precision
  const detectLocation = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Try IP detection first (fast) - using ipapi.co direct JSON endpoint
      console.log('Detecting location using ipapi.co/json/...')
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
      console.log('IP location data received:', data)
      
      // Check for error response from ipapi.co
      if (data.error) {
        throw new Error(data.reason || 'IP detection failed')
      }
      
      // If IP detection successful, use it and try GPS for better precision
      if (data.city && data.region) {
        const ipLocation = `${data.city}, ${data.region}`
        console.log('IP location detected:', ipLocation)
        setLocation(ipLocation)
        setPlaceholder(getMobilePlaceholder(ipLocation))
        
        // Try GPS for better precision in the background (only if Google Maps is loaded)
        if (googleMapsLoaded) {
          try {
            setPlaceholder(getMobilePlaceholder('Getting precise location...'))
            const gpsLocation = await getGPSLocation()
            console.log('GPS improved location:', gpsLocation)
            setLocation(gpsLocation)
            setPlaceholder(getMobilePlaceholder(gpsLocation))
          } catch (gpsError) {
            console.log('GPS failed, keeping IP location:', gpsError.message)
            // Keep the IP location if GPS fails
          }
        }
      } else {
        throw new Error('IP detection returned incomplete data')
      }
    } catch (ipError) {
      console.error('IP location detection failed:', ipError)
      
      // If IP fails, try GPS as fallback (only if Google Maps is loaded)
      if (googleMapsLoaded) {
        try {
          console.log('Trying GPS as fallback...')
          setPlaceholder(getMobilePlaceholder('Getting GPS location...'))
          const gpsLocation = await getGPSLocation()
          console.log('GPS fallback location:', gpsLocation)
          setLocation(gpsLocation)
          setPlaceholder(getMobilePlaceholder(gpsLocation))
        } catch (gpsError) {
          console.error('All location detection failed:', gpsError)
          setPlaceholder(getMobilePlaceholder('Enter location...'))
        }
      } else {
        console.log('Google Maps not loaded, skipping GPS fallback')
        setPlaceholder(getMobilePlaceholder('Enter location...'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [googleMapsLoaded])

  useEffect(() => {
    // Only start location detection when Google Maps is loaded or after a timeout
    if (googleMapsLoaded) {
      detectLocation()
    } else {
      // Try without GPS after 2 seconds if Google Maps hasn't loaded
      const timeout = setTimeout(() => {
        if (!googleMapsLoaded) {
          detectLocation()
        }
      }, 2000)
      
      return () => clearTimeout(timeout)
    }
  }, [detectLocation, googleMapsLoaded])

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <MapPin 
          size={16} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgb(0, 173, 181)' }}
        />
        <Input 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={getMobilePlaceholder(placeholder)}
          className="h-8 pl-10 pr-3 w-28 sm:w-36 md:w-48 lg:w-56 xl:w-64 text-xs sm:text-sm"
          style={{ 
            backgroundColor: 'rgb(15, 20, 25)',
            color: 'rgb(238, 238, 238)',
            border: '1px solid rgb(0, 173, 181)',
            boxShadow: '0 0 12px rgba(0, 173, 181, 0.4)',
          }}
        />
      </div>
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="w-8 h-8 flex items-center justify-center">
          <div 
            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" 
            style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </div>
  )
}

export default LocationSearch
 