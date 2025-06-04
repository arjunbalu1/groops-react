/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, IndianRupee, Plus } from 'lucide-react'

const GroupCards = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'
  const GROUPS_TO_FETCH = 6



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

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups?limit=${GROUPS_TO_FETCH}&sort=created_desc`)
        if (!response.ok) {
          throw new Error('Failed to fetch groops')
        }
        const data = await response.json()
        setGroups(data || [])
        
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
        console.error('Error fetching groops:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [API_BASE_URL])

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
            Loading groops...
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
            Error loading groops: {error}
          </p>
        </div>
      </section>
    )
  }

  // Empty state when no groups are available
  if (!loading && groups.length === 0) {
    return (
      <section className="py-6">
        {/* Section Header - Constrained */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h2 
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ color: 'rgb(238, 238, 238)' }}
              >
                Trending Groops
              </h2>
              <p 
                className="text-lg"
                style={{ color: 'rgb(156, 163, 175)' }}
              >
                Browse popular activities happening near you
              </p>
            </div>
            <div className="text-center sm:text-right">
              <button
                className="text-xl font-bold transition-colors hover:underline"
                style={{ 
                  color: 'rgb(34, 211, 238)',
                  textShadow: '0 0 10px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'rgb(255, 255, 255)'
                  e.target.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'rgb(34, 211, 238)'
                  e.target.style.textShadow = '0 0 10px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.2)'
                }}
                onClick={() => navigate('/groops')}
              >
                See all Groops →
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="relative inline-block">
                <Users size={64} className="mx-auto mb-4 opacity-50" style={{ color: 'rgb(0, 173, 181)' }} />
                <div className="absolute -top-2 -right-2">
                  <div 
                    className="w-6 h-6 rounded-full animate-pulse"
                    style={{ backgroundColor: 'rgb(34, 211, 238)' }}
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                No groops near you yet
              </h3>
              <p className="text-lg mb-2" style={{ color: 'rgb(156, 163, 175)' }}>
                Be the first to bring your community together! 🌟
              </p>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'rgb(107, 114, 128)' }}>
                Start something amazing - create the first groop in your area and watch your community come alive with new connections and friendships.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6">
      {/* Section Header - Constrained */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h2 
              className="text-3xl sm:text-4xl font-bold mb-2"
              style={{ color: 'rgb(238, 238, 238)' }}
            >
              Trending Groops
            </h2>
            <p 
              className="text-lg"
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              Browse popular activities happening near you
            </p>
          </div>
          <div className="text-center sm:text-right">
            <button
              className="text-xl font-bold transition-colors hover:underline"
              style={{ 
                color: 'rgb(34, 211, 238)',
                textShadow: '0 0 10px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'rgb(255, 255, 255)'
                e.target.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'rgb(34, 211, 238)'
                e.target.style.textShadow = '0 0 10px rgba(34, 211, 238, 0.4), 0 0 20px rgba(34, 211, 238, 0.2)'
              }}
              onClick={() => navigate('/groops')}
            >
              See all Groops →
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrolling Group Cards - Full Width */}
      <div className="relative">
        <div 
          className="flex gap-3 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
        {groups.map((group) => {
          const skillStyle = getSkillLevelBadge(group.skill_level)
          const approvedMembers = group.members?.filter(m => m.status === 'approved').length || 0
          
          return (
            <div
              key={group.id}
              className="group rounded-lg border backdrop-blur cursor-pointer flex-shrink-0 w-72 sm:w-80 lg:w-96"
              style={{
                backgroundColor: 'rgba(25, 30, 35, 0.8)',
                borderColor: 'rgba(0, 173, 181, 0.2)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                scrollSnapAlign: 'center'
              }}
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="p-3 sm:p-4">
                {/* Header */}
                <div className="flex flex-col gap-1.5 sm:gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 sm:mb-2">
                      {/* Title */}
                      <h3 
                        className="text-base sm:text-lg font-semibold group-hover:text-cyan-400 transition-colors mb-1 line-clamp-2"
                        style={{ color: 'rgb(238, 238, 238)' }}
                      >
                        {group.name}
                      </h3>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {group.skill_level && (
                          <div
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: skillStyle.bg,
                              color: skillStyle.text
                            }}
                          >
                            {group.skill_level}
                          </div>
                        )}
                        <div 
                          className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium"
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
                      className="text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2"
                      style={{ color: 'rgb(156, 163, 175)' }}
                    >
                      {group.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1.5 sm:mr-2 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{formatDate(group.date_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin size={12} className="mr-1.5 sm:mr-2 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{group.location?.formatted_address || group.location?.name || 'Location TBD'}</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={12} className="mr-1.5 sm:mr-2 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                        <span>{approvedMembers}/{group.max_members} members</span>
                        {group.cost > 0 && (
                          <span className="mx-1.5 sm:mx-2">•</span>
                        )}
                        {group.cost > 0 && (
                          <div className="flex items-center">
                            <IndianRupee size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5" />
                            <span>{group.cost}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Avatars */}
                  <div className="pt-2 sm:pt-3 border-t" style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                    <div className="flex items-center -space-x-1.5 sm:-space-x-2 overflow-hidden">
                      {/* Show approved members (up to 5 on mobile, 6 on larger screens) */}
                      {(() => {
                        const approvedMembersList = group.members?.filter(m => m.status === 'approved') || []
                        const maxSlotsToShow = Math.min(window.innerWidth < 640 ? 5 : 6, group.max_members)
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
                                  className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium flex-shrink-0"
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
                                className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0"
                                style={{
                                  borderColor: 'rgba(156, 163, 175, 0.4)',
                                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                  zIndex: 9 - (membersToShow.length + index)
                                }}
                                title="Available spot"
                              >
                                <div
                                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                                  style={{
                                    backgroundColor: 'rgba(156, 163, 175, 0.6)'
                                  }}
                                />
                              </div>
                            ))}
                          </>
                        )
                      })()}

                      {/* Show +X remaining if there are more spots beyond the displayed */}
                      {group.max_members > (window.innerWidth < 640 ? 5 : 6) && (
                        <div className="flex items-center ml-1.5 sm:ml-2 flex-shrink-0">
                          <span 
                            className="text-xs font-medium"
                            style={{ color: 'rgb(156, 163, 175)' }}
                          >
                            +{group.max_members - (window.innerWidth < 640 ? 5 : 6)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Organizer */}
                    <div className="mt-1 pt-1 border-t" style={{ borderColor: 'rgba(75, 85, 99, 0.2)' }}>
                      <div className="flex items-center justify-between">
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
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </section>
  )
}

export default GroupCards 