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
      <div className="relative pt-1 xs:pt-2 sm:pt-3 lg:pt-4 pb-1 sm:pb-2 lg:pb-3">
        {/* Hero Content */}
        <div className="relative text-center">
            
            {/* Main Heading */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-bold mb-2">
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
              className="text-base xs:text-lg sm:text-xl lg:text-2xl mb-3 xs:mb-4 max-w-3xl mx-auto"
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              Join activities and meet like-minded people in your area
            </p>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-6 xs:space-x-8 mb-4 xs:mb-5">
              <div className="text-center">
                <div 
                  className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold"
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
                  className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold"
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

            {/* Compact Call to Action */}
            <div className="max-w-2xl mx-auto">
              {/* Feature Points */}
              <div className="flex flex-wrap justify-center gap-2 xs:gap-3 mb-3 xs:mb-4 text-xs xs:text-sm">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
                  <Zap className="w-3 h-3 text-teal-400" />
                  <span style={{ color: 'rgb(238, 238, 238)' }}>Quick Setup</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span style={{ color: 'rgb(238, 238, 238)' }}>Real Connections</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span style={{ color: 'rgb(238, 238, 238)' }}>Always Free</span>
                </div>
              </div>

              {/* Create Groop Button */}
              <button
                onClick={() => navigate('/create-group')}
                className="group relative inline-flex items-center gap-2 xs:gap-3 px-5 xs:px-6 py-2.5 xs:py-3 text-base xs:text-lg font-bold rounded-lg xs:rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(34, 211, 238) 50%, rgb(6, 182, 212) 100%)',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(0, 173, 181, 0.4), 0 0 40px rgba(34, 211, 238, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgb(6, 182, 212) 0%, rgb(34, 211, 238) 50%, rgb(0, 173, 181) 100%)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 173, 181, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(34, 211, 238) 50%, rgb(6, 182, 212) 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 173, 181, 0.4), 0 0 40px rgba(34, 211, 238, 0.3)'
                }}
              >
                {/* Sparkle animation overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-1.5 left-3 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
                  <div className="absolute top-2.5 right-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute bottom-2 left-6 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute bottom-2.5 right-3 w-0.5 h-0.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.7s' }} />
                </div>
                
                <Plus className="w-5 h-5 xs:w-6 xs:h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Your Groop</span>
                <Sparkles className="w-4 h-4 xs:w-5 xs:h-5 group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </div>

        </div>
      </div>
    </main>
  )
}

export default Hero 