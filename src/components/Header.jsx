import React from 'react'
import { Button } from '@/components/ui/button'
import LocationSearch from './LocationSearch'
import logoTransparent from '@/assets/logo-transparent.png'

const Header = () => {
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
          
          {/* Right side: Login Button */}
          <div className="flex items-center">
            <Button 
              size="sm"
              className="font-medium px-6 transition-colors"
              style={{ 
                backgroundColor: 'rgb(15, 20, 25)',
                color: 'rgb(238, 238, 238)',
                border: '1px solid rgb(0, 173, 181)',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgb(0, 173, 181)'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgb(15, 20, 25)'
                e.target.style.color = 'rgb(238, 238, 238)'
              }}
            >
              Sign in
            </Button>
          </div>
          
        </div>
      </div>
    </header>
  )
}

export default Header
