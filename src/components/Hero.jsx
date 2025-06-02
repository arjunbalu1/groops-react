import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles, Users, Zap } from 'lucide-react'

const Hero = () => {
  const navigate = useNavigate()
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
            <div className="flex flex-col items-center mb-6 xs:mb-8">
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

            {/* Call to Action Section */}
            <div className="max-w-3xl mx-auto">
              {/* Inspirational Message */}
              <div className="mb-4 xs:mb-6">
                <h2 
                  className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-2 xs:mb-3"
                  style={{ color: 'rgb(238, 238, 238)' }}
                >
                  Can't find what you're looking for?
                </h2>
                <p 
                  className="text-base xs:text-lg sm:text-xl leading-relaxed"
                  style={{ color: 'rgb(156, 163, 175)' }}
                >
                  Be the spark that brings people together! Create your own groop and watch your community grow.
                </p>
              </div>

              {/* Feature Points */}
              <div className="flex flex-wrap justify-center gap-3 xs:gap-4 mb-4 xs:mb-6 text-sm xs:text-base">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <span style={{ color: 'rgb(238, 238, 238)' }}>Start in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span style={{ color: 'rgb(238, 238, 238)' }}>Meet amazing people</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span style={{ color: 'rgb(238, 238, 238)' }}>Completely free</span>
                </div>
              </div>

              {/* Create Groop Button */}
              <button
                onClick={() => navigate('/create-group')}
                className="group relative inline-flex items-center gap-3 px-6 xs:px-8 py-3 xs:py-4 text-lg xs:text-xl font-bold rounded-xl xs:rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(34, 211, 238) 50%, rgb(6, 182, 212) 100%)',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(0, 173, 181, 0.4), 0 0 60px rgba(34, 211, 238, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgb(6, 182, 212) 0%, rgb(34, 211, 238) 50%, rgb(0, 173, 181) 100%)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 173, 181, 0.6), 0 0 80px rgba(34, 211, 238, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(34, 211, 238) 50%, rgb(6, 182, 212) 100%)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 173, 181, 0.4), 0 0 60px rgba(34, 211, 238, 0.3)'
                }}
              >
                {/* Sparkle animation overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-2 left-4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
                  <div className="absolute top-4 right-6 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute bottom-3 left-8 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute bottom-4 right-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.7s' }} />
                </div>
                
                <Plus className="w-6 h-6 xs:w-7 xs:h-7 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Your Groop</span>
                <Sparkles className="w-5 h-5 xs:w-6 xs:h-6 group-hover:rotate-12 transition-transform duration-300" />
              </button>

              {/* Additional encouragement */}
              <p 
                className="mt-3 xs:mt-4 text-xs xs:text-sm opacity-75"
                style={{ color: 'rgb(156, 163, 175)' }}
              >
                Join thousands of organizers who've already brought their communities together ✨
              </p>
            </div>

        </div>
      </div>
    </main>
  )
}

export default Hero 