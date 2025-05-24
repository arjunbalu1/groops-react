import React from 'react'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'

const App = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <Header />
      
      {/* Custom CSS for animations */}
      <style jsx>{`
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
      `}</style>
      
      {/* Hero Section */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative py-16 sm:py-24 lg:py-32">
          
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Main floating glow */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl animate-float animate-pulse-glow"
              style={{ backgroundColor: 'rgb(0, 173, 181)' }}
            />
            
            {/* Secondary floating glow */}
            <div 
              className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-2xl animate-float-reverse"
              style={{ 
                backgroundColor: 'rgb(0, 173, 181)',
                opacity: '0.15'
              }}
            />
            
            {/* Additional ambient glow */}
            <div 
              className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full blur-3xl animate-pulse-glow"
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
              className="text-xl sm:text-2xl lg:text-3xl mb-8 max-w-4xl mx-auto leading-relaxed"
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              Connect with like-minded people in your area. Discover communities, 
              join events, and build meaningful relationships wherever you are.
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg"
                className="font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: 'rgb(0, 173, 181)',
                  color: 'white',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgb(34, 211, 238)'
                  e.target.style.boxShadow = '0 10px 30px rgba(0, 173, 181, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgb(0, 173, 181)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Get Started
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'rgb(238, 238, 238)',
                  border: '2px solid rgb(0, 173, 181)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                  e.target.style.borderColor = 'rgb(34, 211, 238)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.borderColor = 'rgb(0, 173, 181)'
                }}
              >
                Learn More
              </Button>
            </div>

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
                    10K+
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    Active Users
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'rgb(0, 173, 181)' }}
                  >
                    500+
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    Communities
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: 'rgb(0, 173, 181)' }}
                  >
                    50+
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    Cities
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default App
