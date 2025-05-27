import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogIn, Settings, LogOut, Bell, LayoutDashboard } from 'lucide-react'
import LocationSearch from './LocationSearch'
import logoTransparent from '@/assets/logo-transparent.png'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationCount } from '@/hooks/useNotificationCount'

const Header = () => {
  const { user, isLoading, signIn, signOut } = useAuth()
  const { unreadCount, refreshUnreadCount } = useNotificationCount()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsHasMore, setNotificationsHasMore] = useState(true)
  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)

  // Get API base URL for image proxy
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    if (dropdownOpen || notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen, notificationsOpen])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      e.currentTarget.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
    } else {
      e.currentTarget.style.backgroundColor = dropdownOpen ? 'rgba(0, 173, 181, 0.1)' : 'transparent'
    }
  }, [dropdownOpen])

  // Fetch notifications with progressive loading
  const fetchNotifications = useCallback(async (loadMore = false) => {
    if (!user?.authenticated || notificationsLoading) return
    
    setNotificationsLoading(true)
    try {
      // Progressive loading: start with 50, then load in chunks of 50 (no upper limit)
      const currentLimit = loadMore ? notifications.length + 50 : 50
      const response = await fetch(`${API_BASE_URL}/api/notifications?limit=${currentLimit}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const newNotifications = data || []
        
        setNotifications(newNotifications)
        
        // Check if we have more notifications to load (no upper limit)
        setNotificationsHasMore(newNotifications.length === currentLimit)
      } else {
        console.error('Failed to fetch notifications')
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [user?.authenticated, API_BASE_URL, notificationsLoading, notifications.length])

  // Load more notifications
  const loadMoreNotifications = useCallback(() => {
    if (notificationsHasMore && !notificationsLoading) {
      fetchNotifications(true)
    }
  }, [fetchNotifications, notificationsHasMore, notificationsLoading])

  // Handle notifications button click
  const handleNotificationsClick = useCallback(() => {
    if (!notificationsOpen) {
      // Reset state and fetch fresh notifications
      setNotificationsHasMore(true)
      fetchNotifications(false)
      // Refresh unread count when opening notifications
      refreshUnreadCount()
    }
    setNotificationsOpen(!notificationsOpen)
    setDropdownOpen(false) // Close user dropdown if open
  }, [notificationsOpen, fetchNotifications, refreshUnreadCount])

  // Handle scroll in notifications dropdown
  const handleNotificationsScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    
    // Load more when scrolled to bottom (with small buffer)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      loadMoreNotifications()
    }
  }, [loadMoreNotifications])


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
              <button 
                onClick={() => window.location.href = '/'}
                className="cursor-pointer transition-opacity hover:scale-105 hover:rotate-350"
                title="Go to Homepage"
              >
                <img 
                  src={logoTransparent} 
                  alt="Groops" 
                  className="h-12 sm:h-16 md:h-18"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(238, 238, 238, 0.3))'
                  }}
                />
              </button>
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
              <div className="flex items-center gap-3">
                {/* Dashboard Button */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 rounded-lg transition-colors flex items-center gap-2 hover:bg-opacity-20"
                  style={{
                    backgroundColor: 'rgba(0, 173, 181, 0.1)',
                    color: 'rgb(0, 173, 181)',
                    border: '1px solid rgba(0, 173, 181, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 173, 181, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                  }}
                  title="My Groops"
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline text-sm font-medium pointer-events-none">My Groops</span>
                </button>

                {/* Notifications Button */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={handleNotificationsClick}
                    className="p-2 rounded-lg transition-colors flex items-center gap-2 relative"
                    style={{
                      backgroundColor: notificationsOpen ? 'rgba(0, 173, 181, 0.2)' : 'rgba(0, 173, 181, 0.1)',
                      color: 'rgb(0, 173, 181)',
                      border: '1px solid rgba(0, 173, 181, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 173, 181, 0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notificationsOpen ? 'rgba(0, 173, 181, 0.2)' : 'rgba(0, 173, 181, 0.1)'
                    }}
                    title="Notifications"
                  >
                    <Bell size={16} />
                    {/* Unread Count Badge */}
                    {unreadCount > 0 && (
                      <div 
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center z-10"
                        style={{
                          backgroundColor: 'rgb(239, 68, 68)',
                          color: 'white',
                          fontSize: '11px',
                          pointerEvents: 'none'
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-80 max-h-96 rounded-lg border shadow-lg z-50 overflow-hidden"
                      style={{
                        backgroundColor: 'rgb(25, 30, 35)',
                        borderColor: 'rgba(0, 173, 181, 0.2)',
                      }}
                    >
                      {/* Header */}
                      <div 
                        className="px-4 py-3 border-b"
                        style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}
                      >
                        <h3 className="text-sm font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
                          Notifications
                        </h3>
                      </div>

                      {/* Content */}
                      <div className="max-h-80 overflow-y-auto" onScroll={handleNotificationsScroll}>
                        {notificationsLoading && notifications.length === 0 ? (
                          <div className="flex items-center justify-center py-8">
                            <div 
                              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                              style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
                            />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell size={32} className="mx-auto mb-2 opacity-50" style={{ color: 'rgb(156, 163, 175)' }} />
                            <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          <div className="py-2">
                            {notifications.map((notification, index) => (
                              <div 
                                key={notification.id || index}
                                className="px-4 py-3 border-b last:border-b-0 hover:bg-opacity-50 transition-colors cursor-pointer"
                                style={{ 
                                  borderColor: 'rgba(75, 85, 99, 0.2)',
                                  backgroundColor: notification.read ? 'transparent' : 'rgba(0, 173, 181, 0.05)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(0, 173, 181, 0.05)'
                                }}
                                onClick={() => {
                                  if (notification.group_id) {
                                    setNotificationsOpen(false)
                                    // Refresh unread count when clicking a notification
                                    refreshUnreadCount()
                                    navigate(`/groups/${notification.group_id}`)
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  {!notification.read && (
                                    <div 
                                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                      style={{ backgroundColor: 'rgb(239, 68, 68)' }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                                      {notification.title || notification.message}
                                    </p>
                                    {notification.title && notification.message && notification.title !== notification.message && (
                                      <p className="text-sm mt-1" style={{ color: 'rgb(156, 163, 175)' }}>
                                        {notification.message}
                                      </p>
                                    )}
                                    <p className="text-xs mt-1" style={{ color: 'rgb(107, 114, 128)' }}>
                                      {notification.created_at ? (
                                        (() => {
                                          const date = new Date(notification.created_at)
                                          const now = new Date()
                                          const diffInMinutes = Math.floor((now - date) / (1000 * 60))
                                          const diffInHours = Math.floor(diffInMinutes / 60)
                                          const diffInDays = Math.floor(diffInHours / 24)
                                          
                                          if (diffInMinutes < 1) return 'Just now'
                                          if (diffInMinutes < 60) return `${diffInMinutes}m ago`
                                          if (diffInHours < 24) return `${diffInHours}h ago`
                                          if (diffInDays < 7) return `${diffInDays}d ago`
                                          
                                          // For older notifications, show full date and time
                                          return date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })
                                        })()
                                      ) : 'Recently'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Load more indicator */}
                            {notificationsLoading && notifications.length > 0 && (
                              <div className="flex items-center justify-center py-4">
                                <div 
                                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                  style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
                                />
                              </div>
                            )}
                            
                            {/* End of notifications indicator */}
                            {!notificationsHasMore && notifications.length > 0 && (
                              <div className="text-center py-4">
                                <p className="text-xs" style={{ color: 'rgb(107, 114, 128)' }}>
                                  No more notifications
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer - View All Link */}
                      {notifications.length > 0 && (
                        <div 
                          className="px-4 py-3 border-t"
                          style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}
                        >
                          <button
                            className="w-full text-sm text-center transition-colors"
                            style={{ color: 'rgb(0, 173, 181)' }}
                            onMouseEnter={(e) => {
                              e.target.style.color = 'rgb(6, 182, 212)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = 'rgb(0, 173, 181)'
                            }}
                            onClick={() => {
                              setNotificationsOpen(false)
                              // TODO: Navigate to full notifications page
                              console.log('Navigate to all notifications')
                            }}
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                      className="text-sm font-medium hidden sm:block pointer-events-none"
                      style={{ color: 'rgb(238, 238, 238)' }}
                    >
                      {user.fullName || user.username}
                    </span>
                  )}
                  
                  {/* Show temp user status if needed */}
                  {user.needsProfile && (
                    <span 
                      className="text-xs px-2 py-1 rounded ml-2 pointer-events-none"
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
