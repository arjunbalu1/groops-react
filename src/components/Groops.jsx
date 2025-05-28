/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Users, IndianRupee, Search, Filter, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Groops = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedActivityType, setSelectedActivityType] = useState(searchParams.get('activity') || '')
  const [selectedSkillLevel, setSelectedSkillLevel] = useState(searchParams.get('skill') || '')
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Activity types for filter
  const activityTypes = [
    'sport', 'social', 'games', 'fitness', 'outdoor', 
    'educational', 'arts', 'wellness', 'music', 'other'
  ]

  // Skill levels for filter
  const skillLevels = ['beginner', 'intermediate', 'advanced']

  // Scroll to top when entering groops page
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms debounce delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch member profile data
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

  // Build query string for API
  const buildQueryString = useCallback((pageNum = 1) => {
    const params = new URLSearchParams()
    
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery)
    if (selectedActivityType) params.append('activity_type', selectedActivityType)
    if (selectedSkillLevel) params.append('skill_level', selectedSkillLevel)
    
    // Backend expects offset and limit, not page
    const limit = 9
    const offset = (pageNum - 1) * limit
    params.append('offset', offset.toString())
    params.append('limit', limit.toString())
    params.append('sort', 'created_desc')
    
    return params.toString()
  }, [debouncedSearchQuery, selectedActivityType, selectedSkillLevel])

  // Fetch groups
  const fetchGroups = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const queryString = buildQueryString(pageNum)
      const response = await fetch(`${API_BASE_URL}/groups?${queryString}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups')
      }
      
      const data = await response.json()
      const newGroups = data || []
      
      if (append && pageNum > 1) {
        setGroups(prev => [...prev, ...newGroups])
      } else {
        setGroups(newGroups)
      }
      
      // Check if there are more groups to load
      setHasMore(newGroups.length === 9)
      
      // Fetch member profiles for all approved members
      const allMembers = newGroups.flatMap(group => 
        group.members?.filter(m => m.status === 'approved').map(m => m.username) || []
      )
      const uniqueMembers = [...new Set(allMembers)]
      
      uniqueMembers.forEach(username => {
        fetchMemberProfile(username)
      })
      
    } catch (err) {
      setError(err.message)
      console.error('Error fetching groups:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [API_BASE_URL, buildQueryString])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery)
    if (selectedActivityType) params.set('activity', selectedActivityType)
    if (selectedSkillLevel) params.set('skill', selectedSkillLevel)
    
    setSearchParams(params)
  }, [debouncedSearchQuery, selectedActivityType, selectedSkillLevel, setSearchParams])

  // Fetch groups when filters change
  useEffect(() => {
    setPage(1)
    fetchGroups(1, false)
  }, [fetchGroups])

  // Load more groups manually
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchGroups(nextPage, true)
    }
  }, [hasMore, loadingMore, page, fetchGroups])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSelectedActivityType('')
    setSelectedSkillLevel('')
    setShowFilters(false)
  }

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Activity type colors
  const getActivityTypeColor = (type) => {
    const colors = {
      sport: 'rgb(34, 197, 94)',
      social: 'rgb(168, 85, 247)',
      games: 'rgb(59, 130, 246)',
      fitness: 'rgb(251, 191, 36)',
      outdoor: 'rgb(34, 197, 94)',
      educational: 'rgb(59, 130, 246)',
      arts: 'rgb(236, 72, 153)',
      wellness: 'rgb(132, 204, 22)',
      music: 'rgb(99, 102, 241)',
      other: 'rgb(156, 163, 175)'
    }
    return colors[type] || colors.other
  }

  // Skill level colors
  const getSkillLevelBadge = (level) => {
    const styles = {
      beginner: { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgb(34, 197, 94)' },
      intermediate: { bg: 'rgba(251, 191, 36, 0.1)', text: 'rgb(251, 191, 36)' },
      advanced: { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(239, 68, 68)' }
    }
    return styles[level] || styles.beginner
  }

  return (
    <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
              All Groops
            </h1>
            <p style={{ color: 'rgb(156, 163, 175)' }}>
              Discover and join groups that match your interests
            </p>
          </div>
          
          {/* Create Group Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/create-group')}
              className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] overflow-hidden"
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
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-300 group-hover:rotate-90" 
                   style={{ backgroundColor: 'rgba(15, 20, 25, 0.2)' }}>
                <Plus size={14} className="transition-all duration-300" />
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
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'rgb(156, 163, 175)' }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="pl-10"
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  borderColor: 'rgba(75, 85, 99, 0.3)',
                  color: 'rgb(238, 238, 238)'
                }}
              />
            </div>

            {/* Filter Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
              style={{
                backgroundColor: showFilters ? 'rgba(0, 173, 181, 0.1)' : 'transparent',
                borderColor: 'rgba(0, 173, 181, 0.3)',
                color: 'rgb(0, 173, 181)'
              }}
            >
              <Filter size={16} />
              Filters
              {(selectedActivityType || selectedSkillLevel) && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[selectedActivityType, selectedSkillLevel].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div 
              className="p-6 rounded-lg border mb-4"
              style={{
                backgroundColor: 'rgba(25, 30, 35, 0.8)',
                borderColor: 'rgba(0, 173, 181, 0.2)'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Filters
                </h3>
                {(searchQuery || selectedActivityType || selectedSkillLevel) && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={16} className="mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Activity Type Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                    Activity Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {activityTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedActivityType(selectedActivityType === type ? '' : type)}
                        className="p-2 rounded-lg text-sm font-medium transition-colors text-left"
                        style={{
                          backgroundColor: selectedActivityType === type ? getActivityTypeColor(type) + '20' : 'rgba(75, 85, 99, 0.2)',
                          color: selectedActivityType === type ? getActivityTypeColor(type) : 'rgb(156, 163, 175)',
                          border: selectedActivityType === type ? `1px solid ${getActivityTypeColor(type)}` : '1px solid rgba(75, 85, 99, 0.3)'
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill Level Filter */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                    Skill Level
                  </label>
                  <div className="space-y-2">
                    {skillLevels.map(level => {
                      const skillStyle = getSkillLevelBadge(level)
                      return (
                        <button
                          key={level}
                          onClick={() => setSelectedSkillLevel(selectedSkillLevel === level ? '' : level)}
                          className="w-full p-2 rounded-lg text-sm font-medium transition-colors text-left"
                          style={{
                            backgroundColor: selectedSkillLevel === level ? skillStyle.bg : 'rgba(75, 85, 99, 0.2)',
                            color: selectedSkillLevel === level ? skillStyle.text : 'rgb(156, 163, 175)',
                            border: selectedSkillLevel === level ? `1px solid ${skillStyle.text}` : '1px solid rgba(75, 85, 99, 0.3)'
                          }}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && groups.length === 0 && (
          <div className="text-center py-16">
            <div 
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'rgb(156, 163, 175)' }}>Loading groups...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p style={{ color: 'rgb(239, 68, 68)' }}>Error: {error}</p>
            <Button 
              onClick={() => fetchGroups(1, false)} 
              className="mt-4"
              style={{ backgroundColor: 'rgb(0, 173, 181)', color: 'white' }}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Groups Grid - 3 Column Layout */}
        {!loading && groups.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {groups.map((group) => {
                const skillStyle = getSkillLevelBadge(group.skill_level)
                const approvedMembers = group.members?.filter(m => m.status === 'approved').length || 0
                
                return (
                  <div
                    key={group.id}
                    className="group rounded-lg border backdrop-blur cursor-pointer hover:border-opacity-80 transition-all"
                    style={{
                      backgroundColor: 'rgba(25, 30, 35, 0.8)',
                      borderColor: 'rgba(0, 173, 181, 0.2)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            {/* Title */}
                            <h3 
                              className="text-lg font-semibold group-hover:text-cyan-400 transition-colors mb-1 line-clamp-2"
                              style={{ color: 'rgb(238, 238, 238)' }}
                            >
                              {group.name}
                            </h3>
                            
                            {/* Badges */}
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
                            className="text-sm mb-2 line-clamp-2"
                            style={{ color: 'rgb(156, 163, 175)' }}
                          >
                            {group.description}
                          </p>

                          {/* Details */}
                          <div className="space-y-2 text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-2 flex-shrink-0" />
                              <span className="truncate">{formatDate(group.date_time)}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-2 flex-shrink-0" />
                              <span className="truncate">{group.location?.formatted_address || group.location?.name || 'Location TBD'}</span>
                            </div>
                            <div className="flex items-center">
                              <Users size={14} className="mr-2 flex-shrink-0" />
                              <span>{approvedMembers}/{group.max_members} members</span>
                              {group.cost > 0 && (
                                <span className="mx-2">•</span>
                              )}
                              {group.cost > 0 && (
                                <div className="flex items-center">
                                  <IndianRupee size={14} className="mr-1" />
                                  <span>{group.cost}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                            
                            {/* Member Avatars */}
                            <div className="pt-4 border-t" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                              <div className="mb-3">
                                <p className="text-xs font-semibold mb-3" style={{ color: 'rgb(0, 173, 181)' }}>
                                  WHO'S JOINING
                                </p>
                              </div>
                              <div className="flex items-center -space-x-2 overflow-hidden mb-3">
                                {/* Show approved members (up to 8 for horizontal layout) */}
                                {(() => {
                                  const approvedMembersList = group.members?.filter(m => m.status === 'approved') || []
                                  const maxSlotsToShow = Math.min(8, group.max_members)
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

                                {/* Show +X remaining if there are more spots beyond the 8 displayed */}
                                {group.max_members > 8 && (
                                  <div className="flex items-center ml-2 flex-shrink-0">
                                    <span 
                                      className="text-xs font-medium"
                                      style={{ color: 'rgb(156, 163, 175)' }}
                                    >
                                      +{group.max_members - 8}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Organizer */}
                              <div className="pt-3 border-t" style={{ borderColor: 'rgba(0, 173, 181, 0.2)' }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold mr-3 overflow-hidden"
                                      style={{ 
                                        borderColor: 'rgb(0, 173, 181)', 
                                        backgroundColor: 'rgba(0, 173, 181, 0.2)', 
                                        color: 'rgb(0, 173, 181)' 
                                      }}
                                    >
                                      {memberProfiles[group.organiser_id] && memberProfiles[group.organiser_id].avatar_url ? (
                                        <img
                                          src={`${API_BASE_URL}/profiles/${group.organiser_id}/image`}
                                          alt={group.organiser_id}
                                          className="w-full h-full object-cover rounded-full"
                                          onError={(e) => {
                                            e.target.style.display = 'none'
                                            e.target.nextSibling.style.display = 'flex'
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="w-full h-full flex items-center justify-center text-xs font-bold"
                                        style={{
                                          display: memberProfiles[group.organiser_id] && memberProfiles[group.organiser_id].avatar_url ? 'none' : 'flex'
                                        }}
                                      >
                                        {group.organiser_id?.slice(0, 1).toUpperCase()}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: 'rgb(156, 163, 175)' }}>
                                        Organized by
                                      </p>
                                      <p className="text-sm font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
                                        {group.organiser_id}
                                      </p>
                                    </div>
                                  </div>
                                  <div 
                                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-opacity-80"
                                    style={{ 
                                      backgroundColor: 'rgba(0, 173, 181, 0.2)', 
                                      color: 'rgb(0, 173, 181)',
                                      border: '1px solid rgba(0, 173, 181, 0.3)'
                                    }}
                                  >
                                    View Details →
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-8">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3"
                  style={{
                    backgroundColor: loadingMore ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
                    color: 'white'
                  }}
                >
                  {loadingMore ? (
                    <>
                      <div 
                        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
                        style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                      />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
            
            {/* End of Results Indicator */}
            {!hasMore && groups.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
                  No more groups to load
                </p>
              </div>
            )}
          </>
        )}

        {/* No Results State */}
        {!loading && groups.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="mb-4">
              <Search size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'rgb(156, 163, 175)' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                No groups found
              </h3>
              <p style={{ color: 'rgb(156, 163, 175)' }}>
                {searchQuery || selectedActivityType || selectedSkillLevel 
                  ? 'Try adjusting your search or filters'
                  : 'No groups available at the moment'
                }
              </p>
            </div>
            {(searchQuery || selectedActivityType || selectedSkillLevel) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                style={{
                  borderColor: 'rgba(0, 173, 181, 0.3)',
                  color: 'rgb(0, 173, 181)'
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Groops 