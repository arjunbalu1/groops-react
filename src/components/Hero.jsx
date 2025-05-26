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
      <div className="relative py-8 sm:py-12 lg:py-16">
        {/* Hero Content */}
        <div className="relative text-center">
            
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span style={{ color: 'rgb(238, 238, 238)' }}>Find Your </span>
              <span 
                className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: 'linear-gradient(to right, rgb(0, 173, 181), rgb(34, 211, 238))'
                }}
              >
                Groops
              </span>
            </h1>

            {/* Subheading */}
            <p 
              className="text-xl sm:text-2xl lg:text-3xl mb-12 max-w-4xl mx-auto leading-relaxed"
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              Turn your interests into real connections. Find local groups, join exciting activities, 
              and meet people who get you - all in one place.
            </p>

            {/* Social Proof */}
            <div className="flex flex-col items-center space-y-4">
              <p 
                className="text-sm font-medium tracking-wide uppercase"
                style={{ color: 'rgb(107, 114, 128)' }}
              >
                Join thousands of people building connections
              </p>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'rgb(0, 173, 181)' }}
                  >
                    {stats.activeUsers}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    Users
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'rgb(0, 173, 181)' }}
                  >
                    {stats.groups}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'rgb(156, 163, 175)' }}
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