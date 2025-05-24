import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

const LocationSearch = () => {
  const [location, setLocation] = useState('')
  const [placeholder, setPlaceholder] = useState('Detecting location...')
  const [isLoading, setIsLoading] = useState(false)

  // Automatically get GPS location
  const getGPSLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            console.log('GPS coordinates:', { latitude, longitude })
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'GroopsApp/1.0'
                }
              }
            )
            
            if (!response.ok) {
              throw new Error(`Geocoding failed: HTTP ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Geocoding data:', data)
            
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village
              const state = data.address.state || data.address.region
              
              if (city && state) {
                const gpsLocation = `${city}, ${state}`
                console.log('GPS location:', gpsLocation)
                resolve(gpsLocation)
              } else if (city) {
                resolve(city)
              } else {
                throw new Error('Could not determine location')
              }
            } else {
              throw new Error('Invalid geocoding response')
            }
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
      // Try IP detection first (fast)
      console.log('Detecting location using ip-api.com...')
      setPlaceholder('Detecting location...')
      
      const response = await fetch('http://ip-api.com/json/', {
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
      
      // If IP detection successful, use it and try GPS for better precision
      if (data.status === 'success' && data.city && data.regionName) {
        const ipLocation = `${data.city}, ${data.regionName}`
        console.log('IP location detected:', ipLocation)
        setLocation(ipLocation)
        setPlaceholder(ipLocation)
        
        // Try GPS for better precision in the background
        try {
          setPlaceholder('Getting precise location...')
          const gpsLocation = await getGPSLocation()
          console.log('GPS improved location:', gpsLocation)
          setLocation(gpsLocation)
          setPlaceholder(gpsLocation)
        } catch (gpsError) {
          console.log('GPS failed, keeping IP location:', gpsError.message)
          // Keep the IP location if GPS fails
        }
      } else {
        throw new Error('IP detection failed')
      }
    } catch (ipError) {
      console.error('IP location detection failed:', ipError)
      
      // If IP fails, try GPS as fallback
      try {
        console.log('Trying GPS as fallback...')
        setPlaceholder('Getting GPS location...')
        const gpsLocation = await getGPSLocation()
        console.log('GPS fallback location:', gpsLocation)
        setLocation(gpsLocation)
        setPlaceholder(gpsLocation)
      } catch (gpsError) {
        console.error('All location detection failed:', gpsError)
        setPlaceholder('Enter location...')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    detectLocation()
  }, [])

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
          placeholder={placeholder}
          className="w-64 h-8 pl-10 pr-3 text-sm"
          style={{ 
            backgroundColor: 'rgb(15, 20, 25)',
            color: 'rgb(238, 238, 238)',
            border: '1px solid rgb(0, 173, 181)',
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
