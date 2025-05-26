import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogIn, Settings, LogOut, Bell } from 'lucide-react'
import LocationSearch from './LocationSearch'
import logoTransparent from '@/assets/logo-transparent.png'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationCount } from '@/hooks/useNotificationCount'

const Header = () => {
  const { user, isLoading, signIn, signOut } = useAuth()
  const { unreadCount } = useNotificationCount()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Get API base URL for image proxy
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

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

  const handleDropdownItemHover = useCallback((e, isEntering) => {
    if (isEntering) {
      e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
    } else {
      e.target.style.backgroundColor = 'transparent'
    }
  }, [])

  const handleAvatarHover = useCallback((e, isEntering) => {
    if (isEntering) {
      e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
    } else {
      e.target.style.backgroundColor = dropdownOpen ? 'rgba(0, 173, 181, 0.1)' : 'transparent'
    }
  }, [dropdownOpen])


  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur border-b"
      style={{ 
        backgroundColor: 'rgba(25, 30, 35, 0.8)', 
        borderColor: 'rgb(15, 20, 25)' 
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left side: Logo and Location */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
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
          
          {/* Right side: Auth */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div 
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" 
                  style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : user?.authenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Avatar - Clickable */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={(e) => handleAvatarHover(e, true)}
                  onMouseLeave={(e) => handleAvatarHover(e, false)}
                  className="flex items-center gap-3 p-2 rounded-lg transition-colors relative"
                  style={{
                    backgroundColor: dropdownOpen ? 'rgba(0, 173, 181, 0.1)' : 'transparent',
                  }}
                >
                  {/* Unread Count Badge on Avatar */}
                  {unreadCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center z-10"
                      style={{
                        backgroundColor: 'rgb(239, 68, 68)',
                        color: 'white',
                        fontSize: '12px',
                        pointerEvents: 'none'
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                  {/* Avatar */}
                  <div 
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center overflow-hidden"
                    style={{ 
                      borderColor: 'rgb(0, 173, 181)',
                      boxShadow: '0 0 12px rgba(0, 173, 181, 0.4)'
                    }}
                  >
                    {user.avatarURL && user.username ? (
                      <img
                        src={`${API_BASE_URL}/profiles/${user.username}/image`}
                        alt={user.username || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center text-xs font-medium"
                      style={{
                        display: (user.avatarURL && user.username) ? 'none' : 'flex',
                        backgroundColor: 'rgba(0, 173, 181, 0.2)',
                        color: 'rgb(0, 173, 181)'
                      }}
                    >
                      {user.needsProfile ? '?' : (user.username?.slice(0, 2).toUpperCase() || '??')}
                    </div>
                  </div>
                  
                  {/* User Name - Hidden on mobile */}
                  {user.username && (
                    <span 
                      className="text-sm font-medium hidden sm:block"
                      style={{ color: 'rgb(238, 238, 238)' }}
                    >
                      {user.fullName || user.username}
                    </span>
                  )}
                  
                  {/* Show temp user status if needed */}
                  {user.needsProfile && (
                    <span 
                      className="text-xs px-2 py-1 rounded ml-2"
                      style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'rgb(239, 68, 68)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      Profile Incomplete
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-50"
                    style={{
                      backgroundColor: 'rgb(25, 30, 35)',
                      borderColor: 'rgba(0, 173, 181, 0.2)',
                    }}
                  >
                    <div className="py-2">
                      {/* User Info Header OR Create Profile Button */}
                      {user.needsProfile ? (
                        <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                          <button
                            className="w-full px-3 py-2 rounded-lg border transition-colors text-center"
                            style={{
                              backgroundColor: 'rgba(0, 173, 181, 0.1)',
                              borderColor: 'rgb(0, 173, 181)',
                              color: 'rgb(0, 173, 181)',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                            }}
                            onClick={() => {
                              setDropdownOpen(false)
                              navigate('/create-profile')
                            }}
                          >
                            <div className="text-sm font-medium">Create Profile</div>
                            <div className="text-xs opacity-75">Complete your setup</div>
                          </button>
                        </div>
                      ) : (
                        <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                          <div className="text-sm font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                            {user.fullName || user.username}
                          </div>
                          <div className="text-xs" style={{ color: 'rgb(156, 163, 175)' }}>
                            {user.email}
                          </div>
                        </div>
                      )}

                      {/* Menu Items */}
                      <button
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors relative"
                        style={{ color: 'rgb(238, 238, 238)' }}
                        onMouseEnter={(e) => handleDropdownItemHover(e, true)}
                        onMouseLeave={(e) => handleDropdownItemHover(e, false)}
                        onClick={() => {
                          setDropdownOpen(false)
                          // TODO: Navigate to notifications
                          console.log('Navigate to notifications')
                        }}
                      >
                        <Bell size={16} />
                        Notifications
                        {/* Unread Count Badge */}
                        {unreadCount > 0 && (
                          <div 
                            className="ml-auto w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center"
                            style={{
                              backgroundColor: 'rgb(239, 68, 68)',
                              color: 'white',
                              fontSize: '12px',
                              pointerEvents: 'none'
                            }}
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </button>

                      <button
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                        style={{ color: 'rgb(238, 238, 238)' }}
                        onMouseEnter={(e) => handleDropdownItemHover(e, true)}
                        onMouseLeave={(e) => handleDropdownItemHover(e, false)}
                        onClick={() => {
                          setDropdownOpen(false)
                          // TODO: Navigate to account settings
                          console.log('Navigate to account settings')
                        }}
                      >
                        <Settings size={16} />
                        Account Settings
                      </button>

                      <button
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                        style={{ color: 'rgb(238, 238, 238)' }}
                        onMouseEnter={(e) => handleDropdownItemHover(e, true)}
                        onMouseLeave={(e) => handleDropdownItemHover(e, false)}
                        onClick={() => {
                          setDropdownOpen(false)
                          signOut()
                        }}
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
