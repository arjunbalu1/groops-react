import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Users, Star, Calendar, ChevronDown, Bell, Plus } from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Ratings state (simplified - no pagination needed for dropdown)
  const [ratings, _setRatings] = useState([])
  
  // Friends state (simplified - no pagination needed for dropdown)
  const [friends, _setFriends] = useState([])
  
  // Past groups state (simplified - no pagination)
  const [pastGroups, setPastGroups] = useState([])
  
  // Upcoming groups state
  const [upcomingGroups, setUpcomingGroups] = useState([])
  const [upcomingGroupsLoading, setUpcomingGroupsLoading] = useState(false)
  
  // Pending members state for groups where user is organizer
  const [groupPendingMembers, setGroupPendingMembers] = useState({})
  
  // Dropdown states
  const [showRatingsDropdown, setShowRatingsDropdown] = useState(false)
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false)
  const [showActivityDropdown, setShowActivityDropdown] = useState(false)
  
  // Intersection observers (removed - no longer needed with dropdown design)

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Scroll to top when entering dashboard
  useEffect(() => {
    // Disable scroll restoration and force scroll to top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.username) return

      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/accounts/${user.username}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const data = await response.json()
        setDashboardData(data)
        
        // Initialize past groups - filter groups where date has passed and user was approved member
        const allGroups = [...(data.owned_groups || []), ...(data.joined_groups || [])]
        const now = new Date()
        const filteredPastGroups = allGroups.filter(group => {
          const groupDate = new Date(group.date_time)
          return groupDate < now // Group date has passed
        })
        
        if (filteredPastGroups.length > 0) {
          setPastGroups(filteredPastGroups)
        }
      } catch (err) {
        setError(err.message)
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.username, API_BASE_URL])

  // Fetch upcoming groups
  const fetchUpcomingGroups = useCallback(async () => {
    if (!dashboardData) return
    
    setUpcomingGroupsLoading(true)
    try {
      const now = new Date()
      
      // Get approved joined groups and fetch their details
      // This includes both groups the user joined AND groups they organize (since organizers are auto-approved members)
      const approvedJoinedMemberships = (dashboardData.joined_groups || [])
        .filter(membership => membership.status === 'approved')
      
      const upcomingGroups = []
      const pendingMembersData = {}
      
      for (const membership of approvedJoinedMemberships) {
        try {
          const response = await fetch(`${API_BASE_URL}/groups/${membership.group_id}`)
          if (response.ok) {
            const group = await response.json()
            if (new Date(group.date_time) > now) {
              upcomingGroups.push(group)
              
              // If user is the organizer, fetch pending members
              if (group.organizer_username === user?.username) {
                try {
                  const pendingResponse = await fetch(`${API_BASE_URL}/api/groups/${membership.group_id}/pending-members`, {
                    credentials: 'include'
                  })
                  if (pendingResponse.ok) {
                    const pendingMembers = await pendingResponse.json()
                    pendingMembersData[membership.group_id] = pendingMembers
                    console.log(`Fetched ${pendingMembers.length} pending members for group ${membership.group_id}`)
                  }
                } catch (pendingErr) {
                  console.error('Error fetching pending members for group:', membership.group_id, pendingErr)
                  pendingMembersData[membership.group_id] = []
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching group:', membership.group_id, err)
        }
      }
      
      // Sort by date
      const sortedUpcomingGroups = upcomingGroups.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
      
      setUpcomingGroups(sortedUpcomingGroups)
      setGroupPendingMembers(pendingMembersData)
    } catch (err) {
      console.error('Error fetching upcoming groups:', err)
    } finally {
      setUpcomingGroupsLoading(false)
    }
  }, [dashboardData, API_BASE_URL, user?.username])

  // Fetch upcoming groups when dashboard data changes
  useEffect(() => {
    fetchUpcomingGroups()
  }, [fetchUpcomingGroups])

  // Format date helper (consistent with other components)
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all dropdowns if clicking outside
      if (!event.target.closest('.dropdown-container')) {
        setShowRatingsDropdown(false)
        setShowFriendsDropdown(false)
        setShowActivityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
            style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'rgb(238, 238, 238)' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <p style={{ color: 'rgb(239, 68, 68)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  // Main dashboard content
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <LayoutDashboard size={32} style={{ color: 'rgb(0, 173, 181)' }} />
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
              Dashboard
            </h1>
          </div>
          
          {/* Dropdown Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Friends Dropdown */}
                <div className="relative dropdown-container flex-1">
                  <button
                    onClick={() => {
                      setShowFriendsDropdown(!showFriendsDropdown)
                      setShowRatingsDropdown(false)
                      setShowActivityDropdown(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:border-opacity-60"
                    style={{
                      backgroundColor: 'rgba(25, 30, 35, 0.8)',
                      borderColor: 'rgba(0, 173, 181, 0.3)',
                      color: 'rgb(238, 238, 238)'
                    }}
                  >
                    <Users size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                    <span className="text-sm font-medium">Friends</span>
                    <span className="text-sm font-medium">({dashboardData?.friends?.length || 0})</span>
                    <ChevronDown size={14} className={`transition-transform ${showFriendsDropdown ? 'rotate-180' : ''}`} style={{ color: 'rgb(156, 163, 175)' }} />
                  </button>
                  
                  {showFriendsDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-80 rounded-lg border shadow-lg z-50"
                      style={{
                        backgroundColor: 'rgb(25, 30, 35)',
                        borderColor: 'rgba(0, 173, 181, 0.2)'
                      }}
                    >
                      <div className="p-4 border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: 'rgb(0, 173, 181)' }}>Friends</p>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto">
                        {friends.length === 0 ? (
                          <p className="text-sm text-center py-4" style={{ color: 'rgb(156, 163, 175)' }}>
                            No friends yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {friends.map((friend) => (
                              <div key={friend.id} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}>
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                                  {friend.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm" style={{ color: 'rgb(238, 238, 238)' }}>{friend.username}</p>
                                  <p className="text-xs" style={{ color: 'rgb(156, 163, 175)' }}>{friend.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating Dropdown */}
                <div className="relative dropdown-container flex-1">
                  <button
                    onClick={() => {
                      setShowRatingsDropdown(!showRatingsDropdown)
                      setShowFriendsDropdown(false)
                      setShowActivityDropdown(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:border-opacity-60"
                    style={{
                      backgroundColor: 'rgba(25, 30, 35, 0.8)',
                      borderColor: 'rgba(0, 173, 181, 0.3)',
                      color: 'rgb(238, 238, 238)'
                    }}
                  >
                    <Star size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                    <span className="text-sm font-medium">Rating</span>
                    <span className="text-sm font-medium">({dashboardData?.rating?.toFixed(1) || '0.0'})</span>
                    <ChevronDown size={14} className={`transition-transform ${showRatingsDropdown ? 'rotate-180' : ''}`} style={{ color: 'rgb(156, 163, 175)' }} />
                  </button>
                  
                  {showRatingsDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-80 rounded-lg border shadow-lg z-50"
                      style={{
                        backgroundColor: 'rgb(25, 30, 35)',
                        borderColor: 'rgba(0, 173, 181, 0.2)'
                      }}
                    >
                      <div className="p-4 border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: 'rgb(0, 173, 181)' }}>Rating</p>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto">
                        {ratings.length === 0 ? (
                          <p className="text-sm text-center py-4" style={{ color: 'rgb(156, 163, 175)' }}>
                            No ratings yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {ratings.map((rating) => (
                              <div key={rating.id} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}>
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                                  {rating.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm" style={{ color: 'rgb(238, 238, 238)' }}>{rating.username}</p>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, idx) => (
                                      <Star key={idx} size={12} fill={idx < rating.rating ? 'rgb(0, 173, 181)' : 'none'} color="rgb(0, 173, 181)" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* History Dropdown */}
                <div className="relative dropdown-container flex-1">
                  <button
                    onClick={() => {
                      setShowActivityDropdown(!showActivityDropdown)
                      setShowFriendsDropdown(false)
                      setShowRatingsDropdown(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:border-opacity-60"
                    style={{
                      backgroundColor: 'rgba(25, 30, 35, 0.8)',
                      borderColor: 'rgba(0, 173, 181, 0.3)',
                      color: 'rgb(238, 238, 238)'
                    }}
                  >
                    <Calendar size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                    <span className="text-sm font-medium">History</span>
                    <span className="text-sm font-medium">({pastGroups?.length || 0})</span>
                    <ChevronDown size={14} className={`transition-transform ${showActivityDropdown ? 'rotate-180' : ''}`} style={{ color: 'rgb(156, 163, 175)' }} />
                  </button>
                  
                  {showActivityDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-80 rounded-lg border shadow-lg z-50"
                      style={{
                        backgroundColor: 'rgb(25, 30, 35)',
                        borderColor: 'rgba(0, 173, 181, 0.2)'
                      }}
                    >
                      <div className="p-4 border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: 'rgb(0, 173, 181)' }}>History</p>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto">
                        {pastGroups.length === 0 ? (
                          <p className="text-sm text-center py-4" style={{ color: 'rgb(156, 163, 175)' }}>
                            No past groups yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {pastGroups.map((group, index) => (
                              <div 
                                key={group.id || index} 
                                className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-opacity-80 transition-colors" 
                                style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}
                                onClick={() => navigate(`/groups/${group.id}`)}
                              >
                                <Calendar size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                                <div className="flex-1">
                                  <p className="text-sm" style={{ color: 'rgb(238, 238, 238)' }}>
                                    {group.name}
                                  </p>
                                  <p className="text-xs" style={{ color: 'rgb(156, 163, 175)' }}>
                                    {formatDate(group.date_time)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
          </div>
        </div>

        {/* Create Group Button */}
        <div className="mb-6 text-center">
          <button
            onClick={() => navigate('/create-group')}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgb(0, 173, 181) 0%, rgb(0, 200, 210) 50%, rgb(0, 173, 181) 100%)',
              color: 'rgb(15, 20, 25)',
              boxShadow: '0 8px 32px rgba(0, 173, 181, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Animated background effect */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
                transform: 'translateX(-100%)',
              }}
            />
            
            {/* Plus icon with animation */}
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full transition-transform duration-300 group-hover:rotate-90" 
                 style={{ backgroundColor: 'rgba(15, 20, 25, 0.2)' }}>
              <Plus size={16} className="transition-all duration-300" />
            </div>
            
            <span className="relative z-10 tracking-wide">Host Groop</span>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -top-2 -left-2 w-[calc(100%+16px)] h-[calc(100%+16px)] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div 
                className="w-full h-full rounded-xl animate-pulse"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(0, 173, 181, 0.4), transparent)',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </button>
        </div>

        {/* Main Content - Upcoming Groups */}

        {/* Upcoming Groups Section */}
        <div 
          className="rounded-lg border"
          style={{
            backgroundColor: 'rgb(25, 30, 35)',
            borderColor: 'rgba(0, 173, 181, 0.2)'
          }}
        >
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
            <div className="flex items-center gap-3">
              <Calendar size={20} style={{ color: 'rgb(0, 173, 181)' }} />
              <div className="text-left">
                <p className="text-xs font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                  Upcoming Groops
                </p>
                <p className="text-xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  {upcomingGroups?.length || 0}
                </p>
              </div>
            </div>
            {upcomingGroupsLoading && (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }} />
            )}
          </div>
          
          <div className="p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {upcomingGroups.map((group) => (
                <div 
                  key={group.id} 
                  className="flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-opacity-80 transition-colors" 
                  style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <div className="flex-shrink-0">
                    <Calendar size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'rgb(238, 238, 238)' }}>
                      {group.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgb(156, 163, 175)' }}>
                      {formatDate(group.date_time)}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgb(156, 163, 175)' }}>
                      {group.activity_type} • {group.location?.name || 'Location TBD'}
                    </p>
                    {/* Show pending requests if user is organizer and there are pending members */}
                    {group.organizer_username === user?.username && groupPendingMembers[group.id]?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Bell size={12} style={{ color: 'rgb(251, 191, 36)' }} />
                        <p className="text-xs" style={{ color: 'rgb(251, 191, 36)' }}>
                          {groupPendingMembers[group.id].length} join request{groupPendingMembers[group.id].length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                      {group.organizer_username === user?.username ? 'Organizer' : 'Member'}
                    </div>
                    {/* Show notification badge for pending requests */}
                    {group.organizer_username === user?.username && groupPendingMembers[group.id]?.length > 0 && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgb(251, 191, 36)', color: 'rgb(15, 20, 25)' }}>
                        {groupPendingMembers[group.id].length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {upcomingGroups.length === 0 && !upcomingGroupsLoading && (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto mb-3 opacity-50" style={{ color: 'rgb(156, 163, 175)' }} />
                  <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                    No Upcoming Groops
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgb(107, 114, 128)' }}>
                    Join or create a group to see it here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard 