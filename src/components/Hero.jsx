import React, { useState, useEffect } from 'react'

const Hero = () => {
  const [stats, setStats] = useState({
    activeUsers: '...',
    groups: '...'
  })

  // Get API base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://groops.fun'

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
    <>
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: float-reverse 2.5s ease-in-out infinite;
        }
        
        /* Hide animated background on mobile */
        @media (max-width: 768px) {
          .desktop-only-bg {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Hero Section */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative py-16 sm:py-24 lg:py-32">
          
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Main floating glow */}
            <div 
              className="desktop-only-bg absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl animate-float animate-pulse-glow"
              style={{ backgroundColor: 'rgb(0, 173, 181)' }}
            />
            
            {/* Secondary floating glow */}
            <div 
              className="desktop-only-bg absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-2xl animate-float-reverse"
              style={{ 
                backgroundColor: 'rgb(0, 173, 181)',
                opacity: '0.15'
              }}
            />
            
            {/* Additional ambient glow */}
            <div 
              className="desktop-only-bg absolute top-1/3 left-1/4 w-48 h-48 rounded-full blur-3xl animate-pulse-glow"
              style={{ 
                backgroundColor: 'rgb(34, 211, 238)',
                opacity: '0.1',
                animationDelay: '2s'
              }}
            />
            
          </div>

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
    </>
  )
}

export default Hero 