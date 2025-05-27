import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Users, Star, Calendar, ChevronDown } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Infinite scroll state for ratings
  const [ratings, _setRatings] = useState([])
  const [_ratingsPage, _setRatingsPage] = useState(1)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [ratingsHasMore, setRatingsHasMore] = useState(true)
  
  // Infinite scroll state for friends
  const [friends, _setFriends] = useState([])
  const [_friendsPage, _setFriendsPage] = useState(1)
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsHasMore, setFriendsHasMore] = useState(true)
  
  // Infinite scroll state for past groups
  const [pastGroups, setPastGroups] = useState([])
  const [pastGroupsPage, setPastGroupsPage] = useState(1)
  const [pastGroupsLoading, setPastGroupsLoading] = useState(false)
  const [pastGroupsHasMore, setPastGroupsHasMore] = useState(true)
  
  // Upcoming groups state
  const [upcomingGroups, setUpcomingGroups] = useState([])
  const [upcomingGroupsLoading, setUpcomingGroupsLoading] = useState(false)
  
  // Dropdown states
  const [showRatingsDropdown, setShowRatingsDropdown] = useState(false)
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false)
  const [showActivityDropdown, setShowActivityDropdown] = useState(false)
  
  // Intersection observers
  const { ref: ratingsRef, inView: ratingsInView } = useInView({ threshold: 0, rootMargin: '100px' })
  const { ref: friendsRef, inView: friendsInView } = useInView({ threshold: 0, rootMargin: '100px' })
  const { ref: pastGroupsRef, inView: pastGroupsInView } = useInView({ threshold: 0, rootMargin: '100px' })

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
          setPastGroups(filteredPastGroups.slice(0, 10))
          setPastGroupsPage(2)
          if (filteredPastGroups.length <= 10) {
            setPastGroupsHasMore(false)
          }
        } else {
          setPastGroupsHasMore(false)
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
      
      for (const membership of approvedJoinedMemberships) {
        try {
          const response = await fetch(`${API_BASE_URL}/groups/${membership.group_id}`)
          if (response.ok) {
            const group = await response.json()
            if (new Date(group.date_time) > now) {
              upcomingGroups.push(group)
            }
          }
        } catch (err) {
          console.error('Error fetching group:', membership.group_id, err)
        }
      }
      
      // Sort by date
      const sortedUpcomingGroups = upcomingGroups.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
      
      setUpcomingGroups(sortedUpcomingGroups)
    } catch (err) {
      console.error('Error fetching upcoming groups:', err)
    } finally {
      setUpcomingGroupsLoading(false)
    }
  }, [dashboardData, API_BASE_URL])

  // Fetch upcoming groups when dashboard data changes
  useEffect(() => {
    fetchUpcomingGroups()
  }, [fetchUpcomingGroups])

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

  // Load more functions
  const loadMoreRatings = useCallback(async () => {
    if (ratingsLoading || !ratingsHasMore) return
    setRatingsLoading(true)
    try {
      // TODO: Replace with actual API call when ratings endpoint is available
      // For now, just mark as no more data available
      setRatingsHasMore(false)
    } catch (err) {
      console.error('Error loading more ratings:', err)
    } finally {
      setRatingsLoading(false)
    }
  }, [ratingsLoading, ratingsHasMore])

  const loadMoreFriends = useCallback(async () => {
    if (friendsLoading || !friendsHasMore) return
    setFriendsLoading(true)
    try {
      // TODO: Replace with actual API call when friends endpoint is available
      // For now, just mark as no more data available
      setFriendsHasMore(false)
    } catch (err) {
      console.error('Error loading more friends:', err)
    } finally {
      setFriendsLoading(false)
    }
  }, [friendsLoading, friendsHasMore])

  const loadMorePastGroups = useCallback(async () => {
    if (pastGroupsLoading || !pastGroupsHasMore || !dashboardData) return
    setPastGroupsLoading(true)
    try {
      // Get all groups and filter past ones
      const allGroups = [...(dashboardData.owned_groups || []), ...(dashboardData.joined_groups || [])]
      const now = new Date()
      const filteredPastGroups = allGroups.filter(group => {
        const groupDate = new Date(group.date_time)
        return groupDate < now
      })
      
      const startIndex = (pastGroupsPage - 1) * 10
      const newPastGroups = filteredPastGroups.slice(startIndex, startIndex + 10)
      
      if (newPastGroups.length === 0 || newPastGroups.length < 10) {
        setPastGroupsHasMore(false)
      }
      
      if (newPastGroups.length > 0) {
        setPastGroups(prev => [...prev, ...newPastGroups])
        setPastGroupsPage(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error loading more past groups:', err)
    } finally {
      setPastGroupsLoading(false)
    }
  }, [pastGroupsPage, pastGroupsLoading, pastGroupsHasMore, dashboardData])

  // Intersection observer effects
  useEffect(() => {
    if (ratingsInView && !ratingsLoading && ratingsHasMore) {
      loadMoreRatings()
    }
  }, [ratingsInView, ratingsLoading, ratingsHasMore, loadMoreRatings])

  useEffect(() => {
    if (friendsInView && !friendsLoading && friendsHasMore) {
      loadMoreFriends()
    }
  }, [friendsInView, friendsLoading, friendsHasMore, loadMoreFriends])

  useEffect(() => {
    if (pastGroupsInView && !pastGroupsLoading && pastGroupsHasMore) {
      loadMorePastGroups()
    }
  }, [pastGroupsInView, pastGroupsLoading, pastGroupsHasMore, loadMorePastGroups])

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
                                    {new Date(group.date_time).toLocaleDateString()}
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
                  Upcoming Groups
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
                      {new Date(group.date_time).toLocaleDateString()} at {new Date(group.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgb(156, 163, 175)' }}>
                      {group.activity_type} • {group.location?.name || 'Location TBD'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                    {group.organizer_username === user?.username ? 'Organizer' : 'Member'}
                  </div>
                </div>
              ))}
              
              {upcomingGroups.length === 0 && !upcomingGroupsLoading && (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto mb-3 opacity-50" style={{ color: 'rgb(156, 163, 175)' }} />
                  <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                    No upcoming groups
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