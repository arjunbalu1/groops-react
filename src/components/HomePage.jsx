import React, { useEffect } from 'react'
import Hero from '@/components/Hero'
import GroupCards from '@/components/GroupCards'

const HomePage = () => {
  // Scroll to top when entering homepage
  useEffect(() => {
    // Disable scroll restoration and force scroll to top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <>
      {/* Custom CSS for shared background animations */}
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
      `}</style>

      <div className="relative">
        {/* Shared Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          
          {/* Main floating glow */}
          <div 
            className="desktop-only-bg absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl animate-float animate-pulse-glow"
            style={{ backgroundColor: 'rgb(0, 173, 181)' }}
          />
          
          {/* Secondary floating glow */}
          <div 
            className="desktop-only-bg absolute top-96 right-1/4 w-64 h-64 rounded-full blur-2xl animate-float-reverse"
            style={{ 
              backgroundColor: 'rgb(0, 173, 181)',
              opacity: '0.15'
            }}
          />
          
          {/* Additional ambient glow */}
          <div 
            className="desktop-only-bg absolute top-60 left-1/4 w-48 h-48 rounded-full blur-3xl animate-pulse-glow"
            style={{ 
              backgroundColor: 'rgb(34, 211, 238)',
              opacity: '0.1',
              animationDelay: '2s'
            }}
          />

          {/* Lower section glow for group cards */}
          <div 
            className="desktop-only-bg absolute top-[600px] right-1/3 w-80 h-80 rounded-full blur-3xl animate-float"
            style={{ 
              backgroundColor: 'rgb(0, 173, 181)',
              opacity: '0.1',
              animationDelay: '1s'
            }}
          />

          {/* Bottom ambient glow */}
          <div 
            className="desktop-only-bg absolute top-[800px] left-1/3 w-56 h-56 rounded-full blur-2xl animate-pulse-glow"
            style={{ 
              backgroundColor: 'rgb(34, 211, 238)',
              opacity: '0.08',
              animationDelay: '3s'
            }}
          />
          
        </div>

        {/* Content with higher z-index */}
        <div className="relative" style={{ zIndex: 1 }}>
          <Hero />
          <GroupCards />
        </div>
      </div>
    </>
  )
}

export default HomePage 