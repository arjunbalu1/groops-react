import React, { useState, useEffect } from 'react'

const Hero = () => {
  const [stats, setStats] = useState({
    activeUsers: '...',
    groups: '...'
  })

  // Get API base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Fetch real stats from stats API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stats`)
        if (response.ok) {
          const data = await response.json()
          
          setStats({
            activeUsers: data.users.toLocaleString(),
            groups: data.groups.toLocaleString()
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Keep loading indicators on error
      }
    }

    fetchStats()
  }, [API_BASE_URL])

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative pt-2 xs:pt-4 sm:pt-6 lg:pt-8 pb-2 sm:pb-3 lg:pb-4">
        {/* Hero Content */}
        <div className="relative text-center">
            
            {/* Main Heading */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-bold mb-2 xs:mb-3">
              <span style={{ color: 'rgb(238, 238, 238)' }}>Find Your </span>
              <span 
                className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent"
                style={{ 
                  textShadow: '0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4), 0 0 90px rgba(34, 211, 238, 0.3)'
                }}
              >
                Groops
              </span>
            </h1>

            {/* Subheading */}
            <p 
              className="text-lg xs:text-xl sm:text-2xl lg:text-3xl mb-4 xs:mb-6 max-w-4xl mx-auto leading-relaxed"
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              Turn your interests into real connections. Find local groops, join exciting activities, 
              and meet people who get you - all in one place.
            </p>

            {/* Social Proof */}
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-4 xs:space-x-6">
                <div className="text-center">
                  <div 
                    className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold"
                    style={{ 
                      color: 'rgb(34, 211, 238)',
                      textShadow: '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.4), 0 0 60px rgba(34, 211, 238, 0.3)'
                    }}
                  >
                    {stats.activeUsers}
                  </div>
                  <div 
                    className="text-xs xs:text-sm"
                    style={{ 
                      color: 'rgb(255, 255, 255)',
                      textShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), 0 0 45px rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Users
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold"
                    style={{ 
                      color: 'rgb(34, 211, 238)',
                      textShadow: '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.4), 0 0 60px rgba(34, 211, 238, 0.3)'
                    }}
                  >
                    {stats.groups}
                  </div>
                  <div 
                    className="text-xs xs:text-sm"
                    style={{ 
                      color: 'rgb(255, 255, 255)',
                      textShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), 0 0 45px rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Groops
                  </div>
                </div>
              </div>
            </div>

        </div>
      </div>
    </main>
  )
}

export default Hero 