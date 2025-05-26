import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Users, Star, Calendar } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Infinite scroll state for ratings
  const [ratings, setRatings] = useState([])
  const [ratingsPage, setRatingsPage] = useState(1)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [ratingsHasMore, setRatingsHasMore] = useState(true)
  
  // Infinite scroll state for friends
  const [friends, setFriends] = useState([])
  const [friendsPage, setFriendsPage] = useState(1)
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsHasMore, setFriendsHasMore] = useState(true)
  
  // Infinite scroll state for past groups
  const [pastGroups, setPastGroups] = useState([])
  const [pastGroupsPage, setPastGroupsPage] = useState(1)
  const [pastGroupsLoading, setPastGroupsLoading] = useState(false)
  const [pastGroupsHasMore, setPastGroupsHasMore] = useState(true)
  
  // Intersection observers
  const { ref: ratingsRef, inView: ratingsInView } = useInView({ threshold: 0, rootMargin: '100px' })
  const { ref: friendsRef, inView: friendsInView } = useInView({ threshold: 0, rootMargin: '100px' })
  const { ref: pastGroupsRef, inView: pastGroupsInView } = useInView({ threshold: 0, rootMargin: '100px' })

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Scroll to top when entering dashboard
  useEffect(() => {
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
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard size={32} style={{ color: 'rgb(0, 173, 181)' }} />
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
              Dashboard
            </h1>
          </div>
          <p style={{ color: 'rgb(156, 163, 175)' }}>
            Welcome {dashboardData?.full_name || dashboardData?.username}!
          </p>
        </div>

        {/* Interactive Dropdown Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Your Ratings Section */}
          <div 
            className="rounded-lg border"
            style={{
              backgroundColor: 'rgb(25, 30, 35)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <div className="p-6 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
              <Star size={24} style={{ color: 'rgb(0, 173, 181)' }} />
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                  Your Rating
                </p>
                <p className="text-2xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  {dashboardData?.rating?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Dynamically loaded ratings */}
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
                
                {/* Skeleton loaders when empty */}
                {ratings.length === 0 && !ratingsLoading && (
                  <>
                    <p className="text-sm text-center py-4" style={{ color: 'rgb(156, 163, 175)' }}>
                      No ratings yet
                    </p>
                    {[1, 2, 3].map(i => (
                      <div key={`rating-skeleton-${i}`} className="flex items-center gap-3 p-2 rounded animate-pulse" style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}>
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                        <div className="flex-1">
                          <div className="h-4 w-20 rounded mb-1" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, idx) => (
                              <div key={idx} className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Intersection observer sentinel */}
                {ratingsHasMore && (
                  <div ref={ratingsRef} className="h-4 w-full" />
                )}
                
                {/* Loading indicator */}
                {ratingsLoading && (
                  <div className="text-center py-2">
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Friends List Section */}
          <div 
            className="rounded-lg border"
            style={{
              backgroundColor: 'rgb(25, 30, 35)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <div className="p-6 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
              <Users size={24} style={{ color: 'rgb(0, 173, 181)' }} />
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                  Friends
                </p>
                <p className="text-2xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  {dashboardData?.friends?.length || 0}
                </p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Dynamically loaded friends */}
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
                
                {/* Skeleton loaders when empty */}
                {friends.length === 0 && !friendsLoading && (
                  <>
                    <p className="text-sm text-center py-4" style={{ color: 'rgb(156, 163, 175)' }}>
                      No friends yet
                    </p>
                    {[1, 2, 3].map(i => (
                      <div key={`friend-skeleton-${i}`} className="flex items-center gap-3 p-2 rounded animate-pulse" style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}>
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                        <div className="flex-1">
                          <div className="h-4 w-24 rounded mb-1" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                          <div className="h-3 w-16 rounded" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Intersection observer sentinel */}
                {friendsHasMore && (
                  <div ref={friendsRef} className="h-4 w-full" />
                )}
                
                {/* Loading indicator */}
                {friendsLoading && (
                  <div className="text-center py-2">
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div 
            className="rounded-lg border"
            style={{
              backgroundColor: 'rgb(25, 30, 35)',
              borderColor: 'rgba(0, 173, 181, 0.2)'
            }}
          >
            <div className="p-6 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
              <Calendar size={24} style={{ color: 'rgb(0, 173, 181)' }} />
              <div className="text-left">
                <p className="text-sm font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                  Activity History
                </p>
                <p className="text-2xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  {pastGroups?.length || 0}
                </p>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
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
                
                {/* Skeleton loaders when empty */}
                {pastGroups.length === 0 && !pastGroupsLoading && (
                  <>
                    <p className="text-sm text-center py-4" style={{ color: 'rgb(156, 163, 175)' }}>
                      No past groups yet
                    </p>
                    {[1, 2, 3].map(i => (
                      <div key={`group-skeleton-${i}`} className="flex items-center gap-3 p-2 rounded animate-pulse" style={{ backgroundColor: 'rgba(0, 173, 181, 0.05)' }}>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                        <div className="flex-1">
                          <div className="h-4 w-32 rounded mb-1" style={{ backgroundColor: 'rgba(156, 163, 175, 0.3)' }} />
                          <div className="h-3 w-20 rounded" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)' }} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Intersection observer sentinel */}
                {pastGroupsHasMore && (
                  <div ref={pastGroupsRef} className="h-4 w-full" />
                )}
                
                {/* Loading indicator */}
                {pastGroupsLoading && (
                  <div className="text-center py-2">
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>



      </div>
    </div>
  )
}

export default Dashboard 