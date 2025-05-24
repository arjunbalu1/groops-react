import React, { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { LogIn, User } from 'lucide-react'
import LocationSearch from './LocationSearch'
import logoTransparent from '@/assets/logo-transparent.png'
import { useAuth } from '@/hooks/useAuth'

const Header = () => {
  const { user, isLoading, signIn, signOut } = useAuth()

  // Common button styles to avoid duplication
  const buttonBaseStyle = {
    backgroundColor: 'rgb(15, 20, 25)',
    color: 'rgb(238, 238, 238)',
    border: '1px solid rgb(0, 173, 181)',
  }

  const handleSignInHover = useCallback((e, isEntering) => {
    if (isEntering) {
      e.target.style.backgroundColor = 'rgb(0, 173, 181)'
      e.target.style.color = 'white'
    } else {
      Object.assign(e.target.style, buttonBaseStyle)
    }
  }, [])

  const handleSignOutHover = useCallback((e, isEntering) => {
    if (isEntering) {
      e.target.style.backgroundColor = 'rgb(220, 38, 127)'
      e.target.style.borderColor = 'rgb(220, 38, 127)'
      e.target.style.color = 'white'
    } else {
      Object.assign(e.target.style, buttonBaseStyle)
    }
  }, [])

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur border-b"
      style={{ 
        backgroundColor: 'rgba(25, 30, 35, 0.95)', 
        borderColor: 'rgb(15, 20, 25)' 
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left side: Logo and Location */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src={logoTransparent} 
                alt="Groops" 
                className="h-30"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(238, 238, 238, 0.3))'
                }}
              />
            </div>
            
            {/* Location Search */}
            <LocationSearch />
          </div>
          
          {/* Right side: Auth Button */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div 
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" 
                  style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : user ? (
              <Button 
                size="sm"
                className="font-medium px-6 transition-colors flex items-center gap-2"
                style={buttonBaseStyle}
                onMouseEnter={(e) => handleSignOutHover(e, true)}
                onMouseLeave={(e) => handleSignOutHover(e, false)}
                onClick={signOut}
              >
                <User size={16} />
                Sign out
              </Button>
            ) : (
              <Button 
                size="sm"
                className="font-medium px-6 transition-colors flex items-center gap-2"
                style={buttonBaseStyle}
                onMouseEnter={(e) => handleSignInHover(e, true)}
                onMouseLeave={(e) => handleSignInHover(e, false)}
                onClick={signIn}
              >
                <LogIn size={16} />
                Sign in
              </Button>
            )}
          </div>
          
        </div>
      </div>
    </header>
  )
}

export default Header
