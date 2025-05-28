import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, IndianRupee, MessageCircle, Settings, UserPlus, UserX, Edit, Trash2, Check, X, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const GroupDetails = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  const [joinLoading, setJoinLoading] = useState(false)
  const [pendingMembers, setPendingMembers] = useState([])
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Scroll to top when entering group details
  useEffect(() => {
    // Disable scroll restoration and force scroll to top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!groupId) return

    const fetchGroupData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setGroup(data)
          
          // Fetch member profiles for any new members
          const allMembers = [data.organizer_username, ...(data.members?.map(m => m.username) || [])]
          const uniqueMembers = [...new Set(allMembers)]
          uniqueMembers.forEach(username => fetchMemberProfile(username))
        }
      } catch (err) {
        console.error('Error auto-refreshing group data:', err)
      }
    }

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      // Only refresh if page is visible (user hasn't switched tabs)
      if (!document.hidden) {
        fetchGroupData()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, API_BASE_URL])

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Group not found')
          } else {
            setError('Failed to load group details')
          }
          return
        }
        
        const data = await response.json()
        setGroup(data)
        
        // Fetch member profiles
        const allMembers = [data.organizer_username, ...(data.members?.map(m => m.username) || [])]
        const uniqueMembers = [...new Set(allMembers)]
        uniqueMembers.forEach(username => fetchMemberProfile(username))
        
      } catch (err) {
        console.error('Error fetching group details:', err)
        setError('Failed to load group details')
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchGroupDetails()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  // Fetch pending members for organizers
  useEffect(() => {
    const fetchPendingMembers = async () => {
      if (!group || getUserMembershipStatus() !== 'organizer') return
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/pending-members`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setPendingMembers(data || [])
          data.forEach(member => fetchMemberProfile(member.username))
        }
      } catch (err) {
        console.error('Error fetching pending members:', err)
      }
    }

    fetchPendingMembers()

    // Auto-refresh pending members every 30 seconds for organizers
    if (group && getUserMembershipStatus() === 'organizer') {
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchPendingMembers()
        }
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, groupId, user])

  // Fetch member profile
  const fetchMemberProfile = async (username) => {
    if (memberProfiles[username]) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${username}`)
      if (response.ok) {
        const profile = await response.json()
        setMemberProfiles(prev => ({
          ...prev,
          [username]: profile
        }))
      }
    } catch (err) {
      console.error('Error fetching member profile:', err)
    }
  }

  // Get user's membership status
  const getUserMembershipStatus = () => {
    if (!user?.username || !group) return 'non-member'
    
    if (group.organizer_username === user.username) return 'organizer'
    
    const member = group.members?.find(m => m.username === user.username)
    if (!member) return 'non-member'
    
    return member.status // 'approved', 'pending', etc.
  }

  // Join group
  const handleJoinGroup = async () => {
    setJoinLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/join`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Add user to group members with pending status
        const newMember = {
          group_id: groupId,
          username: user.username,
          status: 'pending',
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setGroup(prev => ({
          ...prev,
          members: [...(prev.members || []), newMember]
        }))
        
        // Fetch user's profile if not already cached
        fetchMemberProfile(user.username)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join group')
      }
    } catch (err) {
      console.error('Error joining group:', err)
      alert('Failed to join group')
    } finally {
      setJoinLoading(false)
    }
  }

  // Leave group
  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        navigate('/')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to leave group')
      }
    } catch (err) {
      console.error('Error leaving group:', err)
      alert('Failed to leave group')
    }
  }

  // Approve/Reject join request
  const handleMembershipAction = async (username, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${username}/${action}`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        if (action === 'approve') {
          // Move member from pending to approved
          setGroup(prev => ({
            ...prev,
            members: prev.members?.map(member => 
              member.username === username 
                ? { ...member, status: 'approved', updated_at: new Date().toISOString() }
                : member
            ) || []
          }))
        } else if (action === 'reject') {
          // Remove member from group entirely
          setGroup(prev => ({
            ...prev,
            members: prev.members?.filter(member => member.username !== username) || []
          }))
        }
        
        // Remove from pending members list
        setPendingMembers(prev => prev.filter(member => member.username !== username))
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${action} member`)
      }
    } catch (err) {
      console.error(`Error ${action}ing member:`, err)
      alert(`Failed to ${action} member`)
    }
  }

  // Remove member
  const handleRemoveMember = async (username) => {
    if (!confirm(`Are you sure you want to remove ${username} from this group?`)) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${username}/remove`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Remove member from group
        setGroup(prev => ({
          ...prev,
          members: prev.members?.filter(member => member.username !== username) || []
        }))
        
        // Remove from pending members if they were there
        setPendingMembers(prev => prev.filter(member => member.username !== username))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Error removing member:', err)
      alert('Failed to remove member')
    }
  }

  // Activity type colors
  const getActivityTypeColor = (type) => {
    const colors = {
      sport: '#10b981', fitness: '#f59e0b', social: '#8b5cf6',
      outdoor: '#059669', educational: '#3b82f6', arts: '#ec4899',
      games: '#ef4444', wellness: '#84cc16', music: '#6366f1'
    }
    return colors[type?.toLowerCase()] || '#6b7280'
  }

  // Skill level colors
  const getSkillLevelStyle = (level) => {
    const styles = {
      beginner: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
      intermediate: { bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
      advanced: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }
    }
    return styles[level?.toLowerCase()] || { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' }
  }

  // Initialize Google Map
  const initializeMap = () => {
    if (!group?.location?.latitude || !group?.location?.longitude || !mapRef.current || mapInstanceRef.current) {
      return
    }

    // Dark theme map styles to match your app
    const darkMapStyles = [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
      },
    ]

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: {
        lat: group.location.latitude,
        lng: group.location.longitude,
      },
      styles: darkMapStyles,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      keyboardShortcuts: false,
    })

    // Custom marker with your brand colors
    const marker = new window.google.maps.Marker({
      position: {
        lat: group.location.latitude,
        lng: group.location.longitude,
      },
      map: map,
      title: group.location.name || group.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#00adb5', // Your brand cyan color
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 12,
      },
    })

    // Info window with location details
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="color: #1f2937; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #00adb5;">
            ${group.location.name || group.name}
          </h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563;">
            ${group.location.formatted_address}
          </p>
        </div>
      `,
    })

    marker.addListener('click', () => {
      infoWindow.open(map, marker)
    })

    mapInstanceRef.current = map

    // Add custom CSS to move zoom controls up
    const style = document.createElement('style')
    style.textContent = `
      .gm-bundled-control-on-bottom {
        transform: translateY(-10px) !important;
      }
      .gm-bundled-control {
        transform: translateY(-50px) !important;
      }
    `
    document.head.appendChild(style)
  }

  // Load Google Maps script and initialize map
  useEffect(() => {
    if (!group?.location?.latitude || !group?.location?.longitude) return

    if (typeof window.google !== 'undefined') {
      initializeMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      initializeMap()
    }
    
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      document.head.appendChild(script)
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [group])

  // Reinitialize map when group data changes
  useEffect(() => {
    if (group && typeof window.google !== 'undefined') {
      mapInstanceRef.current = null
      setTimeout(initializeMap, 100) // Small delay to ensure DOM is ready
    }
  }, [group?.location?.latitude, group?.location?.longitude])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div 
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
            {error}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'rgb(0, 173, 181)',
              color: 'white'
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  if (!group) return null

  const membershipStatus = getUserMembershipStatus()
  const isOrganizer = membershipStatus === 'organizer'
  const isMember = membershipStatus === 'approved'
  const isPending = membershipStatus === 'pending'
  const isNonMember = membershipStatus === 'non-member'

  const approvedMembers = group.members?.filter(m => m.status === 'approved') || []
  const nonOrganizerMembers = approvedMembers.filter(m => m.username !== group.organizer_username)
  const skillStyle = getSkillLevelStyle(group.skill_level)

  return (
    <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
            <div className="flex-1">
              {/* Group Name and Badges */}
              <h1 className="text-3xl font-bold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                {group.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {group.skill_level && (
                  <div
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: skillStyle.bg,
                      color: skillStyle.text
                    }}
                  >
                    {group.skill_level}
                  </div>
                )}
                <div 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: getActivityTypeColor(group.activity_type) + '20',
                    color: getActivityTypeColor(group.activity_type)
                  }}
                >
                  {group.activity_type}
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(156, 163, 175, 0.2)', color: 'rgb(156, 163, 175)' }}>
                  <Users size={14} />
                  <span>
                    {approvedMembers.length}/{group.max_members}
                    {pendingMembers.length > 0 && ` • ${pendingMembers.length} pending`}
                  </span>
                </div>
              </div>

              {/* Organizer Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'rgb(0, 173, 181)' }}>
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: memberProfiles[group.organizer_username]?.avatar_url ? 'transparent' : 'rgba(0, 173, 181, 0.2)' }}>
                    {memberProfiles[group.organizer_username]?.avatar_url ? (
                      <img
                        src={`${API_BASE_URL}/profiles/${group.organizer_username}/image`}
                        alt={group.organizer_username}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: 'rgb(0, 173, 181)' }}>
                        {group.organizer_username?.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold" style={{ color: 'rgb(238, 238, 238)' }}>
                      {memberProfiles[group.organizer_username]?.full_name || group.organizer_username}
                    </span>
                    <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                      Organizer
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                        {memberProfiles[group.organizer_username]?.rating || '5.0'}
                      </span>
                    </div>
                    {memberProfiles[group.organizer_username]?.bio && (
                      <p className="text-sm flex-1" style={{ color: 'rgb(201, 209, 217)' }}>
                        {memberProfiles[group.organizer_username].bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3">
              {isOrganizer && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: 'rgb(107, 114, 128)',
                    color: 'rgb(156, 163, 175)'
                  }}
                  onClick={() => {/* TODO: Edit group */}}
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
              
              {isNonMember && (
                <button
                  onClick={handleJoinGroup}
                  disabled={joinLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: joinLoading ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
                    color: 'white'
                  }}
                >
                  <UserPlus size={16} />
                  {joinLoading ? 'Joining...' : 'Join Group'}
                </button>
              )}
              
              {isPending && (
                <div
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
                  style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    color: '#f97316'
                  }}
                >
                  <Clock size={16} />
                  Pending
                </div>
              )}
              
              {isMember && !isOrganizer && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: 'rgb(239, 68, 68)',
                    color: 'rgb(239, 68, 68)'
                  }}
                  onClick={handleLeaveGroup}
                >
                  <UserX size={16} />
                  Leave
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Combined Event Details, About, Location, and Members Box */}
        <div className="mb-8">
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(75, 85, 99, 0.3)'
            }}
          >
            <div className="space-y-8">
              {/* Top Section: Event Details + Map */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Event Details + About */}
                <div className="flex flex-col justify-center h-full min-h-[240px]">
                  <div className="space-y-6">
                    {/* Event Details Section */}
                    <div>
                      <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                          <span style={{ color: 'rgb(238, 238, 238)' }}>
                            {new Date(group.date_time).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <MapPin size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                          <span style={{ color: 'rgb(238, 238, 238)' }}>
                            {group.location?.formatted_address || group.location?.name || group.location}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <IndianRupee size={16} style={{ color: 'rgb(0, 173, 181)' }} />
                          <span style={{ color: 'rgb(238, 238, 238)' }}>
                            {group.cost === 0 ? 'Free' : `₹${group.cost}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* About Section - Immediately under Event Details */}
                    {group.description && (
                      <div>
                        <p style={{ color: 'rgb(201, 209, 217)', lineHeight: '1.6' }}>
                          {group.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Location/Map */}
                <div>
                  {group.location?.latitude && group.location?.longitude ? (
                    <div 
                      ref={mapRef}
                      className="w-full rounded-lg"
                      style={{ height: '240px' }}
                    />
                  ) : (
                    <div 
                      className="w-full rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(75, 85, 99, 0.2)', height: '240px' }}
                    >
                      <div className="text-center">
                        <MapPin size={36} style={{ color: 'rgba(75, 85, 99, 0.5)' }} className="mx-auto mb-2" />
                        <h4 className="font-medium mb-1" style={{ color: 'rgb(156, 163, 175)' }}>
                          Location Details
                        </h4>
                        <p className="text-sm" style={{ color: 'rgb(238, 238, 238)' }}>
                          {group.location?.formatted_address || group.location?.name || group.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section: Members */}
              <div className="border-t pt-6" style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
                  Members ({approvedMembers.length})
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Organizer */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <div className="w-16 h-16 rounded-full border-2 overflow-hidden" style={{ borderColor: 'rgb(0, 173, 181)' }}>
                        {memberProfiles[group.organizer_username]?.avatar_url ? (
                          <img
                            src={`${API_BASE_URL}/profiles/${group.organizer_username}/image`}
                            alt={group.organizer_username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                            {group.organizer_username?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'rgb(0, 173, 181)', color: 'white' }}
                      >
                        ★
                      </div>
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                      {memberProfiles[group.organizer_username]?.full_name || group.organizer_username}
                    </div>
                    <div className="text-xs" style={{ color: 'rgb(0, 173, 181)' }}>
                      Organizer
                    </div>
                  </div>

                  {/* Approved Members (excluding organizer) */}
                  {nonOrganizerMembers.map((member) => (
                    <div key={member.username} className="flex flex-col items-center text-center group">
                      <div className="relative mb-2">
                        <div className="w-16 h-16 rounded-full border-2 overflow-hidden" style={{ borderColor: 'rgba(75, 85, 99, 0.5)' }}>
                          {memberProfiles[member.username]?.avatar_url ? (
                            <img
                              src={`${API_BASE_URL}/profiles/${member.username}/image`}
                              alt={member.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(75, 85, 99, 0.3)', color: 'rgb(156, 163, 175)' }}>
                              {member.username?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* Remove button for organizers */}
                        {isOrganizer && (
                          <button
                            onClick={() => handleRemoveMember(member.username)}
                            className="absolute -top-2 -right-2 rounded-full flex items-center justify-center z-10"
                            style={{ 
                              width: '24px',
                              height: '24px',
                              backgroundColor: 'rgb(185, 28, 28)', 
                              color: 'white',
                              border: '2px solid rgb(220, 38, 38)',
                              minWidth: '24px',
                              minHeight: '24px'
                            }}
                            title="Remove member"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                        {memberProfiles[member.username]?.full_name || member.username}
                      </div>
                      <div className="text-xs" style={{ color: 'rgb(156, 163, 175)' }}>
                        Member
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests - Prominent for Organizers */}
        {isOrganizer && pendingMembers.length > 0 && (
          <div 
            className="p-6 rounded-lg border mb-8"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(249, 115, 22, 0.3)'
            }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(238, 238, 238)' }}>
              <UserPlus size={18} style={{ color: '#f97316' }} />
              Pending Join Requests ({pendingMembers.length})
            </h3>
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div key={member.username} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(75, 85, 99, 0.2)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 overflow-hidden" style={{ borderColor: 'rgb(0, 173, 181)' }}>
                      {memberProfiles[member.username]?.avatar_url ? (
                        <img
                          src={`${API_BASE_URL}/profiles/${member.username}/image`}
                          alt={member.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                          {member.username?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                        {memberProfiles[member.username]?.full_name || member.username}
                      </div>
                      <div className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                        Requested {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMembershipAction(member.username, 'approve')}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleMembershipAction(member.username, 'reject')}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Section - Placeholder for approved members */}
        {(isMember || isOrganizer) && (
          <div 
            className="p-6 rounded-lg border mt-6"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(75, 85, 99, 0.3)'
            }}
          >
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle size={48} style={{ color: 'rgba(75, 85, 99, 0.5)' }} className="mx-auto mb-3" />
                <h4 className="font-medium mb-2" style={{ color: 'rgb(156, 163, 175)' }}>
                  Group Chat
                </h4>
                <p className="text-sm" style={{ color: 'rgba(75, 85, 99, 0.8)' }}>
                  Chat functionality coming soon
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDetails