import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, IndianRupee } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

const GroupCards = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '300px',
  })

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'
  const GROUPS_PER_PAGE = 6

  // Fetch member profile data including avatar URLs
  const fetchMemberProfile = async (username) => {
    if (memberProfiles[username]) return memberProfiles[username]
    
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${username}`)
      if (response.ok) {
        const profile = await response.json()

        setMemberProfiles(prev => ({
          ...prev,
          [username]: profile
        }))
        return profile
      }
    } catch (err) {
      console.error('Error fetching member profile:', err)
    }
    return null
  }

  const loadMoreGroups = useCallback(async () => {
    setLoadingMore(true)
    try {
      const offset = (page - 1) * GROUPS_PER_PAGE
      const response = await fetch(`${API_BASE_URL}/groups?limit=${GROUPS_PER_PAGE}&offset=${offset}`)
      if (!response.ok) {
        throw new Error('Failed to fetch more groups')
      }
      const newGroups = await response.json()
      
      if (newGroups.length === 0 || newGroups.length < GROUPS_PER_PAGE) {
        setHasMore(false)
      }
      
      if (newGroups.length > 0) {
        setGroups(prev => {
          const existingIds = new Set(prev.map(group => group.id))
          const uniqueNewGroups = newGroups.filter(group => !existingIds.has(group.id))
          return [...prev, ...uniqueNewGroups]
        })
        setPage(prev => prev + 1)
        
        const allMembers = newGroups.flatMap(group => 
          group.members?.filter(m => m.status === 'approved').map(m => m.username) || []
        )
        const uniqueMembers = [...new Set(allMembers)]
        
        uniqueMembers.forEach(username => {
          fetchMemberProfile(username)
        })
      }
    } catch (err) {
      console.error('Error loading more groups:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [page, API_BASE_URL])

  // Initial groups fetch
  useEffect(() => {
    const fetchInitialGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups?limit=${GROUPS_PER_PAGE}&offset=0`)
        if (!response.ok) {
          throw new Error('Failed to fetch groups')
        }
        const data = await response.json()
        setGroups(data || [])
        
        if (data.length < GROUPS_PER_PAGE) {
          setHasMore(false)
        } else {
          setPage(2)
        }
        
        // Fetch member profiles for all approved members
        const allMembers = data.flatMap(group => 
          group.members?.filter(m => m.status === 'approved').map(m => m.username) || []
        )
        const uniqueMembers = [...new Set(allMembers)]
        
        // Fetch profiles for all unique members
        uniqueMembers.forEach(username => {
          fetchMemberProfile(username)
        })
      } catch (err) {
        setError(err.message)
        console.error('Error fetching groups:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialGroups()
  }, [API_BASE_URL])

  useEffect(() => {
    if (inView && !loadingMore && hasMore) {
      loadMoreGroups()
    }
  }, [inView, loadingMore, hasMore, loadMoreGroups])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityTypeColor = (type) => {
    const colors = {
      sport: 'rgb(34, 197, 94)',  // green
      social: 'rgb(168, 85, 247)', // purple
      games: 'rgb(59, 130, 246)',  // blue
      other: 'rgb(156, 163, 175)'  // gray
    }
    return colors[type] || colors.other
  }

  const getSkillLevelBadge = (level) => {
    const styles = {
      beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgb(34, 197, 94)' },
      intermediate: { bg: 'rgba(251, 191, 36, 0.1)', text: 'rgb(251, 191, 36)' },
      advanced: { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(239, 68, 68)' }
    }
    return styles[level] || styles.beginner
  }

  if (loading) {
    return (
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
          />
          <p className="mt-4" style={{ color: 'rgb(156, 163, 175)' }}>
            Loading groups...
          </p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <p style={{ color: 'rgb(239, 68, 68)' }}>
            Error loading groups: {error}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ color: 'rgb(238, 238, 238)' }}
        >
          Discover Local Groups
        </h2>
        <p 
          className="text-lg max-w-2xl mx-auto"
          style={{ color: 'rgb(156, 163, 175)' }}
        >
          Join exciting activities and meet like-minded people in your area
        </p>
      </div>

      {/* Group Cards Grid */}
      <div className="space-y-6">
        {groups.map((group) => {
          const skillStyle = getSkillLevelBadge(group.skill_level)
          const approvedMembers = group.members?.filter(m => m.status === 'approved').length || 0
          
          return (
            <div
              key={group.id}
              className="group rounded-lg border backdrop-blur transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              style={{
                backgroundColor: 'rgba(25, 30, 35, 0.8)',
                borderColor: 'rgba(0, 173, 181, 0.2)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => navigate(`/groups/${group.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgb(0, 173, 181)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 173, 181, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 173, 181, 0.2)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      {/* Title */}
                      <h3 
                        className="text-xl font-semibold group-hover:text-cyan-400 transition-colors mb-2"
                        style={{ color: 'rgb(238, 238, 238)' }}
                      >
                        {group.name}
                      </h3>
                      
                      {/* Badges - stacked on mobile, inline on desktop */}
                      <div className="flex flex-wrap items-center gap-2">
                        {group.skill_level && (
                          <div
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: skillStyle.bg,
                              color: skillStyle.text
                            }}
                          >
                            {group.skill_level}
                          </div>
                        )}
                        <div 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getActivityTypeColor(group.activity_type) + '20',
                            color: getActivityTypeColor(group.activity_type)
                          }}
                        >
                          {group.activity_type}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p 
                      className="text-sm mb-4 max-w-2xl"
                      style={{ color: 'rgb(156, 163, 175)' }}
                    >
                      {group.description}
                    </p>

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-6 text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {formatDate(group.date_time)}
                      </div>
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2" />
                        {group.location?.formatted_address || group.location?.name || 'Location TBD'}
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="mr-2" />
                        {approvedMembers}/{group.max_members} members
                      </div>
                      {group.cost > 0 && (
                        <div className="flex items-center">
                          <IndianRupee size={16} className="mr-2" />
                          ≈₹{group.cost}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Avatars - Right Side */}
                  <div className="lg:ml-6 flex-shrink-0">
                    <div className="flex items-center justify-start lg:justify-end mb-2">
                      <span className="text-xs font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                        Members ({approvedMembers}/{group.max_members})
                      </span>
                    </div>
                    <div className="flex items-center -space-x-2 justify-start lg:justify-end overflow-hidden">
                      {/* Show approved members (up to 4 total) */}
                      {(() => {
                        const approvedMembersList = group.members?.filter(m => m.status === 'approved') || []
                        const maxSlotsToShow = Math.min(4, group.max_members) // Total slots to display
                        const membersToShow = approvedMembersList.slice(0, maxSlotsToShow)
                        const emptySlots = Math.max(0, maxSlotsToShow - membersToShow.length)
                        
                        return (
                          <>
                            {/* Render actual approved members */}
                            {membersToShow.map((member, index) => {
                              const profile = memberProfiles[member.username]
                              const isCreator = member.username === group.organiser_id
                              
                              // Generate consistent color for each member
                              const colors = [
                                'rgb(0, 173, 181)',   // cyan (creator gets this)
                                'rgb(34, 197, 94)',   // green
                                'rgb(168, 85, 247)',  // purple
                                'rgb(251, 191, 36)',  // yellow
                                'rgb(239, 68, 68)',   // red
                                'rgb(59, 130, 246)',  // blue
                              ]
                              const colorIndex = isCreator ? 0 : (member.username.charCodeAt(0) % (colors.length - 1)) + 1
                              const bgColor = colors[colorIndex]
                              
                              return (
                                <div
                                  key={member.username}
                                  className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium flex-shrink-0"
                                  style={{
                                    backgroundColor: bgColor + '20',
                                    borderColor: 'rgb(15, 20, 25)',
                                    color: bgColor,
                                    zIndex: 10 - index
                                  }}
                                  title={member.username}
                                >
                                  {profile && profile.avatar_url ? (
                                    <img
                                      src={`${API_BASE_URL}/profiles/${member.username}/image`}
                                      alt={member.username}
                                      className="w-full h-full object-cover rounded-full"
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'flex'
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="w-full h-full flex items-center justify-center text-xs font-medium"
                                    style={{
                                      display: profile && profile.avatar_url ? 'none' : 'flex'
                                    }}
                                  >
                                    {member.username.slice(0, 2).toUpperCase()}
                                  </div>
                                </div>
                              )
                            })}

                            {/* Show empty skeleton slots for remaining spaces */}
                            {Array.from({ length: emptySlots }).map((_, index) => (
                              <div
                                key={`empty-${index}`}
                                className="relative w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0"
                                style={{
                                  borderColor: 'rgba(156, 163, 175, 0.4)',
                                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                  zIndex: 9 - (membersToShow.length + index)
                                }}
                                title="Available spot"
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: 'rgba(156, 163, 175, 0.6)'
                                  }}
                                />
                              </div>
                            ))}
                          </>
                        )
                      })()}

                      {/* Show +X remaining if there are more spots beyond the 4 displayed */}
                      {group.max_members > 4 && (
                        <div className="flex items-center ml-2 flex-shrink-0">
                          <span 
                            className="text-xs font-medium"
                            style={{ color: 'rgb(156, 163, 175)' }}
                          >
                            +{group.max_members - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                  <span className="text-xs" style={{ color: 'rgb(107, 114, 128)' }}>
                    By {group.organiser_id}
                  </span>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: 'rgb(0, 173, 181)' }}
                  >
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Intersection Observer Sentinel */}
      {hasMore && (
        <div 
          ref={sentinelRef}
          className="h-4 w-full"
          style={{ background: 'transparent' }}
        />
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="text-center mt-12">
          <div 
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
          />
          <p className="mt-4 text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
            Loading more groups...
          </p>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && groups.length > 0 && (
        <div className="text-center mt-12">
          <p className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
            You've seen all available groops! 
          </p>
        </div>
      )}
    </section>
  )
}

export default GroupCards 