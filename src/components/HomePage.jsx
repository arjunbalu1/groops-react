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
      {/* Custom CSS for flickering lights and sparkles */}
      <style>{`
        @keyframes flicker-1 {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          10% { opacity: 0.8; transform: scale(1.2); }
          20% { opacity: 0.1; transform: scale(0.9); }
          30% { opacity: 0.6; transform: scale(1.1); }
          50% { opacity: 0.05; transform: scale(0.8); }
          70% { opacity: 0.7; transform: scale(1.3); }
          90% { opacity: 0.15; transform: scale(0.95); }
        }
        
        @keyframes flicker-2 {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          15% { opacity: 0.5; transform: scale(1.4); }
          35% { opacity: 0.08; transform: scale(0.7); }
          55% { opacity: 0.9; transform: scale(1.2); }
          75% { opacity: 0.03; transform: scale(0.6); }
          85% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes flicker-3 {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          25% { opacity: 0.7; transform: scale(1.5); }
          40% { opacity: 0.02; transform: scale(0.5); }
          60% { opacity: 0.4; transform: scale(1.1); }
          80% { opacity: 0.85; transform: scale(1.3); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        
        @keyframes sparkle-drift {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(50px, -30px) rotate(360deg); opacity: 0; }
        }
        
        @keyframes sparkle-drift-reverse {
          0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-40px, 25px) rotate(-360deg); opacity: 0; }
        }
        
        .flicker-light-1 {
          animation: flicker-1 2.3s ease-in-out infinite;
        }
        
        .flicker-light-2 {
          animation: flicker-2 3.1s ease-in-out infinite;
        }
        
        .flicker-light-3 {
          animation: flicker-3 2.7s ease-in-out infinite;
        }
        
        .twinkle-sparkle {
          animation: twinkle 1.8s ease-in-out infinite;
        }
        
        .drift-sparkle {
          animation: sparkle-drift 4s linear infinite;
        }
        
        .drift-sparkle-reverse {
          animation: sparkle-drift-reverse 3.5s linear infinite;
        }
        
        /* Sparkle shapes */
        .sparkle {
          position: absolute;
          background: rgb(34, 211, 238);
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
        
        .sparkle-small {
          width: 8px;
          height: 8px;
        }
        
        .sparkle-tiny {
          width: 4px;
          height: 4px;
        }
      `}</style>

      <div className="relative">
        {/* Flickering Lights and Sparkles Background */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          
          {/* Small flickering lights - Hero section */}
          <div 
            className="desktop-only-bg absolute top-32 left-1/3 w-12 h-12 rounded-full blur-md flicker-light-1"
            style={{ backgroundColor: 'rgb(0, 173, 181)' }}
          />
          <div 
            className="desktop-only-bg absolute top-48 right-1/3 w-8 h-8 rounded-full blur-sm flicker-light-2"
            style={{ backgroundColor: 'rgb(34, 211, 238)', animationDelay: '0.5s' }}
          />
          <div 
            className="desktop-only-bg absolute top-72 left-2/3 w-16 h-16 rounded-full blur-lg flicker-light-3"
            style={{ backgroundColor: 'rgb(0, 173, 181)', animationDelay: '1.2s' }}
          />
          <div 
            className="desktop-only-bg absolute top-24 right-1/2 w-6 h-6 rounded-full blur-sm flicker-light-1"
            style={{ backgroundColor: 'rgb(34, 211, 238)', animationDelay: '2s' }}
          />

          {/* Flickering lights - GroupCards section */}
          <div 
            className="desktop-only-bg absolute top-[420px] left-1/4 w-10 h-10 rounded-full blur-md flicker-light-2"
            style={{ backgroundColor: 'rgb(0, 173, 181)', animationDelay: '0.8s' }}
          />
          <div 
            className="desktop-only-bg absolute top-[480px] right-1/5 w-14 h-14 rounded-full blur-lg flicker-light-1"
            style={{ backgroundColor: 'rgb(34, 211, 238)', animationDelay: '1.5s' }}
          />
          <div 
            className="desktop-only-bg absolute top-[540px] left-3/4 w-8 h-8 rounded-full blur-sm flicker-light-3"
            style={{ backgroundColor: 'rgb(0, 173, 181)', animationDelay: '0.3s' }}
          />
          <div 
            className="desktop-only-bg absolute top-[600px] right-2/3 w-12 h-12 rounded-full blur-md flicker-light-2"
            style={{ backgroundColor: 'rgb(34, 211, 238)', animationDelay: '2.2s' }}
          />
          <div 
            className="desktop-only-bg absolute top-[660px] left-1/2 w-6 h-6 rounded-full blur-sm flicker-light-1"
            style={{ backgroundColor: 'rgb(0, 173, 181)', animationDelay: '1.8s' }}
          />

          {/* Twinkling sparkles - Hero */}
          <div className="sparkle sparkle-small absolute top-40 left-1/2 twinkle-sparkle" style={{ animationDelay: '0.2s' }} />
          <div className="sparkle sparkle-tiny absolute top-56 right-1/4 twinkle-sparkle" style={{ animationDelay: '1.1s' }} />
          <div className="sparkle sparkle-small absolute top-68 left-1/4 twinkle-sparkle" style={{ animationDelay: '0.7s' }} />
          <div className="sparkle sparkle-tiny absolute top-28 right-2/3 twinkle-sparkle" style={{ animationDelay: '1.8s' }} />
          
          {/* Drifting sparkles - Hero */}
          <div className="sparkle sparkle-small absolute top-44 left-1/5 drift-sparkle" style={{ animationDelay: '0.5s' }} />
          <div className="sparkle sparkle-tiny absolute top-64 right-1/5 drift-sparkle-reverse" style={{ animationDelay: '2.1s' }} />

          {/* Twinkling sparkles - GroupCards */}
          <div className="sparkle sparkle-small absolute top-[440px] left-1/3 twinkle-sparkle" style={{ animationDelay: '0.9s' }} />
          <div className="sparkle sparkle-tiny absolute top-[500px] right-1/4 twinkle-sparkle" style={{ animationDelay: '1.4s' }} />
          <div className="sparkle sparkle-small absolute top-[560px] left-2/3 twinkle-sparkle" style={{ animationDelay: '0.1s' }} />
          <div className="sparkle sparkle-tiny absolute top-[620px] right-1/3 twinkle-sparkle" style={{ animationDelay: '1.9s' }} />
          <div className="sparkle sparkle-small absolute top-[680px] left-1/5 twinkle-sparkle" style={{ animationDelay: '0.6s' }} />
          
          {/* Drifting sparkles - GroupCards */}
          <div className="sparkle sparkle-small absolute top-[460px] right-1/6 drift-sparkle" style={{ animationDelay: '1.3s' }} />
          <div className="sparkle sparkle-tiny absolute top-[580px] left-1/6 drift-sparkle-reverse" style={{ animationDelay: '0.4s' }} />
          <div className="sparkle sparkle-small absolute top-[640px] right-2/5 drift-sparkle" style={{ animationDelay: '2.5s' }} />
          
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