/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, MapPin, Users, IndianRupee, MessageCircle, Settings, UserPlus, UserX, Edit, Trash2, Check, X, Clock, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const GroupDetails = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signIn } = useAuth()
  
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [memberProfiles, setMemberProfiles] = useState({})
  const [joinLoading, setJoinLoading] = useState(false)
  const [pendingMembers, setPendingMembers] = useState([])
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isGroupNameExpanded, setIsGroupNameExpanded] = useState(false)
  const [showGroupNameButton, setShowGroupNameButton] = useState(false)
  const [showDescriptionButton, setShowDescriptionButton] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const groupNameRef = useRef(null)
  const descriptionRef = useRef(null)
  const [mapLoading, setMapLoading] = useState(true)
  
  // Member profile modal state
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberProfileModalOpen, setMemberProfileModalOpen] = useState(false)
  const [memberProfileLoading, setMemberProfileLoading] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Leave group confirmation modal state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)

  // Remove member confirmation modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)

  // Toast notification state
  const [toasts, setToasts] = useState([])

  // Chat state
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isInitialChatLoad, setIsInitialChatLoad] = useState(true)
  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null) // Add ref for message input

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  // Get user's membership status - moved here to be accessible throughout component
  const getUserMembershipStatus = () => {
    if (!user?.username || !group) return 'non-member'
    
    if (group.organizer_username === user.username) return 'organizer'
    
    const member = group.members?.find(m => m.username === user.username)
    if (!member) return 'non-member'
    
    return member.status // 'approved', 'pending', etc.
  }

  const membershipStatus = getUserMembershipStatus()
  const isOrganizer = membershipStatus === 'organizer'
  const isMember = membershipStatus === 'approved'
  const isPending = membershipStatus === 'pending'
  const isNonMember = membershipStatus === 'non-member'

  // Toast notification functions
  const showToast = (message, type = 'error') => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Scroll to top when entering group details
  useEffect(() => {
    // Disable scroll restoration and force scroll to top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    
    // Show toast if coming from notification
    if (location.state?.fromNotification) {
      showToast('Refreshing groop details...', 'success')
    }
  }, [location.state?.fromNotification])

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
          uniqueMembers.forEach(username => fetchMemberProfile(username, false))
        }
      } catch (err) {
        console.error('Error auto-refreshing groop data:', err)
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
  }, [groupId, API_BASE_URL])

  // Check if group name actually overflows and needs show more button
  useEffect(() => {
    if (!group?.name || !groupNameRef.current) return

    const checkOverflow = () => {
      const element = groupNameRef.current
      if (!element) return

      // Temporarily remove line clamp to measure natural height
      const originalDisplay = element.style.display
      const originalWebkitLineClamp = element.style.webkitLineClamp
      const originalOverflow = element.style.overflow
      
      element.style.display = 'block'
      element.style.webkitLineClamp = 'none'
      element.style.overflow = 'visible'
      
      const naturalHeight = element.scrollHeight
      
      // Apply 2-line clamp
      element.style.display = '-webkit-box'
      element.style.webkitLineClamp = '2'
      element.style.overflow = 'hidden'
      
      const clampedHeight = element.clientHeight
      
      // Restore original styles
      element.style.display = originalDisplay
      element.style.webkitLineClamp = originalWebkitLineClamp
      element.style.overflow = originalOverflow
      
      // Show button only if text actually overflows
      setShowGroupNameButton(naturalHeight > clampedHeight && group.name.length > 25)
    }

    // Check on mount and when name changes
    checkOverflow()
    
    // Also check when window resizes (font size might change)
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [group?.name])

  // Check if description actually overflows and needs show more button
  useEffect(() => {
    if (!group?.description || !descriptionRef.current) return

    const checkDescriptionOverflow = () => {
      const element = descriptionRef.current
      if (!element) return

      // Temporarily remove line clamp to measure natural height
      const originalDisplay = element.style.display
      const originalWebkitLineClamp = element.style.webkitLineClamp
      const originalOverflow = element.style.overflow
      
      element.style.display = 'block'
      element.style.webkitLineClamp = 'none'
      element.style.overflow = 'visible'
      
      const naturalHeight = element.scrollHeight
      
      // Apply 3-line clamp (description uses 3 lines vs 2 for name)
      element.style.display = '-webkit-box'
      element.style.webkitLineClamp = '3'
      element.style.overflow = 'hidden'
      
      const clampedHeight = element.clientHeight
      
      // Restore original styles
      element.style.display = originalDisplay
      element.style.webkitLineClamp = originalWebkitLineClamp
      element.style.overflow = originalOverflow
      
      // Show button only if text actually overflows
      setShowDescriptionButton(naturalHeight > clampedHeight && group.description.length > 200)
    }

    // Check on mount and when description changes
    checkDescriptionOverflow()
    
    // Also check when window resizes (font size might change)
    window.addEventListener('resize', checkDescriptionOverflow)
    return () => window.removeEventListener('resize', checkDescriptionOverflow)
  }, [group?.description])

  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        // Check if we're coming from a notification - if so, force refresh with cache-busting
        const isFromNotification = location.state?.fromNotification
        const cacheParam = isFromNotification ? `?_t=${Date.now()}` : ''
        
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}${cacheParam}`, {
          credentials: 'include',
          cache: isFromNotification ? 'no-cache' : 'default'
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Groop not found')
          } else {
            setError('Failed to load groop details')
          }
          return
        }
        
        const data = await response.json()
        setGroup(data)
        
        // Fetch member profiles
        const allMembers = [data.organizer_username, ...(data.members?.map(m => m.username) || [])]
        const uniqueMembers = [...new Set(allMembers)]
        uniqueMembers.forEach(username => fetchMemberProfile(username, isFromNotification))
        
        // Clear navigation state after successful fetch to prevent future refreshes
        if (isFromNotification && location.state) {
          // Replace current state without the fromNotification flag
          navigate(location.pathname, { replace: true, state: {} })
        }
        
      } catch (err) {
        console.error('Error fetching groop details:', err)
        setError('Failed to load groop details')
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchGroupDetails()
    }
  // Include location.state in dependencies to trigger refresh when coming from notifications
  }, [groupId, location.state?.fromNotification, location.state?.timestamp])

  // Fetch pending members for organizers
  useEffect(() => {
    const fetchPendingMembers = async () => {
      if (!group || getUserMembershipStatus() !== 'organizer') return
      
      try {
        // Force refresh pending members if coming from notification
        const isFromNotification = location.state?.fromNotification
        const cacheParam = isFromNotification ? `?_t=${Date.now()}` : ''
        
        const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/pending-members${cacheParam}`, {
          credentials: 'include',
          cache: isFromNotification ? 'no-cache' : 'default'
        })
        
        if (response.ok) {
          const data = await response.json()
          setPendingMembers(data || [])
          data.forEach(member => fetchMemberProfile(member.username, isFromNotification))
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
  }, [group, groupId, user, location.state?.fromNotification])

  // Fetch member profile
  const fetchMemberProfile = async (username, forceRefresh = false) => {
    if (memberProfiles[username] && !forceRefresh) return
    
    try {
      const cacheParam = forceRefresh ? `?_t=${Date.now()}` : ''
      const response = await fetch(`${API_BASE_URL}/profiles/${username}${cacheParam}`, {
        cache: forceRefresh ? 'no-cache' : 'default'
      })
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

  // Handle member profile viewing
  const handleMemberClick = async (username, event) => {
    setMemberProfileLoading(true)
    setMemberProfileModalOpen(true)
    
    // Calculate position for modal to appear on top of the clicked avatar
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2 // Center horizontally on avatar
    const y = rect.top - 10 // Position above the avatar
    
    setModalPosition({ x, y })
    
    try {
      // Fetch fresh profile data for the modal
      const response = await fetch(`${API_BASE_URL}/profiles/${username}`)
      if (response.ok) {
        const profile = await response.json()
        setSelectedMember(profile)
      } else {
        console.error('Failed to fetch member profile')
        setMemberProfileModalOpen(false)
      }
    } catch (err) {
      console.error('Error fetching member profile:', err)
      setMemberProfileModalOpen(false)
    } finally {
      setMemberProfileLoading(false)
    }
  }

  // Helper function to check if event is within 1 hour
  const isEventTooSoon = () => {
    if (!group?.date_time) return false
    const eventTime = new Date(group.date_time)
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    return eventTime <= oneHourFromNow
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
        fetchMemberProfile(user.username, false)
        showToast('Join request sent successfully!', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to join groop')
      }
    } catch (err) {
      console.error('Error joining groop:', err)
      showToast('Failed to join groop')
    } finally {
      setJoinLoading(false)
    }
  }

  // Leave group
  const handleLeaveGroup = async () => {
    setLeaveLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        navigate('/')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to leave groop')
      }
    } catch (err) {
      console.error('Error leaving groop:', err)
      showToast('Failed to leave groop')
    } finally {
      setLeaveLoading(false)
      setLeaveModalOpen(false)
    }
  }

  // Show leave confirmation modal
  const showLeaveModal = () => {
    setLeaveModalOpen(true)
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
          showToast(`${username} has been approved to join the groop`, 'success')
        } else if (action === 'reject') {
          // Remove member from group entirely
          setGroup(prev => ({
            ...prev,
            members: prev.members?.filter(member => member.username !== username) || []
          }))
          showToast(`${username}'s join request has been rejected`, 'success')
        }
        
        // Remove from pending members list
        setPendingMembers(prev => prev.filter(member => member.username !== username))
      } else {
        const data = await response.json()
        showToast(data.error || `Failed to ${action} member`)
      }
    } catch (err) {
      console.error(`Error ${action}ing member:`, err)
      showToast(`Failed to ${action} member`)
    }
  }

  // Remove member
  const handleRemoveMember = async (username) => {
    setRemoveLoading(true)
    
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
        showToast(`${username} has been removed from the groop`, 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Error removing member:', err)
      showToast('Failed to remove member')
    } finally {
      setRemoveLoading(false)
      setRemoveModalOpen(false)
      setMemberToRemove(null)
    }
  }

  // Show remove member confirmation modal
  const showRemoveModal = (username) => {
    setMemberToRemove(username)
    setRemoveModalOpen(true)
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

    // Enhanced dark theme map styles to match Groops branding
    const darkMapStyles = [
      // Main background - matches app background
      { elementType: "geometry", stylers: [{ color: "#0f1419" }] }, // rgb(15, 20, 25)
      
      // Label styling - matches app text colors
      { elementType: "labels.text.stroke", stylers: [{ color: "#0f1419" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] }, // Subtle gray text
      
      // Administrative areas with subtle cyan accents
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00adb5" }], // Groops brand cyan
      },
      {
        featureType: "administrative.province",
        elementType: "labels.text.fill", 
        stylers: [{ color: "#6b7280" }],
      },
      
      // Points of interest with brand colors
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00adb5" }], // Brand cyan for POIs
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#1a2e23" }], // Dark green for parks
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4ade80" }], // Brighter green for park labels
      },
      
      // Road network with cyan accents
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#2a3441" }], // Slightly lighter than background
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1a202c" }], // Darker stroke
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d1d5db" }], // Light gray for road labels
      },
      
      // Highways with subtle cyan glow
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#374151" }], // Lighter for highways
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#00adb5", lightness: -60 }], // Dark cyan stroke
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3f4f6" }], // Bright text for highways
      },
      
      // Transit with brand accent
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#1f2937" }],
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00adb5" }], // Cyan for transit stations
      },
      
      // Water with enhanced cyan theme
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0c4a6e" }], // Deep blue-cyan for water
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00adb5" }], // Brand cyan for water labels
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#0c4a6e" }],
      },
      
      // Business and commercial areas
      {
        featureType: "poi.business",
        elementType: "labels.text.fill",
        stylers: [{ color: "#fbbf24" }], // Golden accent for businesses
      },
      
      // Enhance visibility of important locations
      {
        featureType: "poi.attraction",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00adb5" }], // Cyan for attractions
      },
      
      // School and educational with different accent
      {
        featureType: "poi.school",
        elementType: "labels.text.fill",
        stylers: [{ color: "#a78bfa" }], // Purple for schools
      },
    ]

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: {
        lat: group.location.latitude,
        lng: group.location.longitude,
      },
      styles: darkMapStyles,
      backgroundColor: '#0f1419', // Prevent white flash during map initialization
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      keyboardShortcuts: false,
    })

    // Custom marker with pulsating white glow effect
    const markerElement = document.createElement('div')
    markerElement.className = 'custom-map-marker'
    markerElement.innerHTML = `
      <div class="marker-glow"></div>
      <div class="marker-core"></div>
    `

    // Add styles for the pulsating glow effect
    const markerStyles = document.createElement('style')
    markerStyles.textContent = `
      .custom-map-marker {
        position: relative;
        width: 28px;
        height: 28px;
        cursor: pointer;
      }
      
      .marker-core {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background-color: #1f2937;
        border: 3px solid #67e8f9;
        border-radius: 50%;
        z-index: 2;
      }
      
      .marker-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        animation: pulse-glow 2s ease-in-out infinite;
        z-index: 1;
      }
      
      @keyframes pulse-glow {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.5;
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
          opacity: 0.7;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.5;
          box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
        }
      }
    `
    
    if (!document.querySelector('.marker-glow-styles')) {
      markerStyles.className = 'marker-glow-styles'
      document.head.appendChild(markerStyles)
    }

    // Create custom overlay
    class CustomMarker extends window.google.maps.OverlayView {
      constructor(position, map) {
        super()
        this.position = position
        this.map = map
        this.div = null
      }

      onAdd() {
        this.div = markerElement
        const panes = this.getPanes()
        panes.overlayMouseTarget.appendChild(this.div)
      }

      draw() {
        const overlayProjection = this.getProjection()
        const position = overlayProjection.fromLatLngToDivPixel(this.position)
        
        if (this.div) {
          this.div.style.left = position.x - 14 + 'px'
          this.div.style.top = position.y - 14 + 'px'
        }
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode.removeChild(this.div)
          this.div = null
        }
      }
    }

    const marker = new CustomMarker(
      new window.google.maps.LatLng(group.location.latitude, group.location.longitude),
      map
    )
    marker.setMap(map)

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

    // Add click listener to custom marker
    markerElement.addEventListener('click', () => {
      infoWindow.setPosition(new window.google.maps.LatLng(group.location.latitude, group.location.longitude))
      infoWindow.open(map)
    })

    mapInstanceRef.current = map

    // Set loading to false after map is initialized
    setMapLoading(false)

    // Add custom CSS to move zoom controls up and remove glow effects
    const style = document.createElement('style')
    style.textContent = `
      .gm-bundled-control-on-bottom {
        transform: translateY(-50px) !important;
      }
      .gm-bundled-control {
        transform: translateY(-50px) !important;
      }
      
      /* Remove glow effects from Google Maps buttons */
      .gm-control-active > img,
      .gm-control-hover > img,
      .gm-control-active,
      .gm-control-hover,
      .gmnoprint button,
      .gmnoprint div[role="button"],
      .gm-style button,
      .gm-style div[role="button"] {
        box-shadow: none !important;
        filter: none !important;
        -webkit-filter: none !important;
      }
      
      /* Remove text glow/shadow effects */
      .gm-style div,
      .gm-style span,
      .gm-style label,
      .gm-style a {
        text-shadow: none !important;
        filter: none !important;
        -webkit-filter: none !important;
      }
      
      /* Remove glow from fullscreen and zoom buttons specifically */
      .gm-fullscreen-control,
      .gm-zoom-control,
      .gm-zoom-control button {
        box-shadow: none !important;
        filter: none !important;
        -webkit-filter: none !important;
        background-color: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(0, 0, 0, 0.2) !important;
      }
    `
    document.head.appendChild(style)
  }

  // Load Google Maps script and initialize map
  useEffect(() => {
    if (!group?.location?.latitude || !group?.location?.longitude) return

    // Check if Google Maps is already loaded (it should be loaded by LocationSearch in Header)
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeMap()
      return
    }

    // If not loaded, wait for it to be loaded by LocationSearch
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeMap()
        return true
      }
      return false
    }

    // Check every 100ms for up to 10 seconds
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval)
      }
    }, 100)
    
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Maps API not available after waiting')
      }
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [group])

  // Reinitialize map when group data changes
  useEffect(() => {
    if (group && window.google && window.google.maps && window.google.maps.places) {
      mapInstanceRef.current = null
      setTimeout(initializeMap, 100) // Small delay to ensure DOM is ready
    }
  }, [group?.location?.latitude, group?.location?.longitude])

  // Close modal on scroll to prevent disconnection from avatar
  useEffect(() => {
    const handleScroll = () => {
      if (memberProfileModalOpen) {
        setMemberProfileModalOpen(false)
      }
    }

    if (memberProfileModalOpen) {
      window.addEventListener('scroll', handleScroll, true) // Use capture phase to catch all scroll events
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [memberProfileModalOpen])

  // Delete group
  const handleDeleteGroup = async () => {
    setDeleteLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Navigate to home page after successful deletion
        navigate('/')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to delete groop')
      }
    } catch (err) {
      console.error('Error deleting groop:', err)
      showToast('Failed to delete groop')
    } finally {
      setDeleteLoading(false)
      setDeleteModalOpen(false)
    }
  }

  // Show delete confirmation modal
  const showDeleteModal = () => {
    setDeleteModalOpen(true)
  }

  // Chat functions
  const fetchMessages = async (isInitialLoad = true) => {
    if (!groupId || (!isMember && !isOrganizer)) return

    try {
      // For initial load, get the latest 50 messages
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/messages?limit=50`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        // Reverse the array since backend returns newest first, but we want oldest first for chat UI
        const reversedMessages = data.messages.reverse()
        
        if (isInitialLoad) {
          setMessages(reversedMessages)
          // Check if we got fewer than 50 messages, meaning there are no more
          setHasMoreMessages(data.messages.length === 50)
        } else {
          // For polling updates, only add new messages that aren't already in the state
          setMessages(prev => {
            const lastMessageId = prev.length > 0 ? prev[prev.length - 1].id : 0
            const newMessages = reversedMessages.filter(msg => msg.id > lastMessageId)
            
            // If there are new messages, scroll to bottom after state update
            if (newMessages.length > 0) {
              setTimeout(() => {
                scrollToBottom()
              }, 100)
            }
            
            return [...prev, ...newMessages]
          })
        }
      } else {
        console.error('Failed to fetch messages:', response.status)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  const loadOlderMessages = async () => {
    if (!groupId || (!isMember && !isOrganizer) || !hasMoreMessages || loadingOlderMessages) return

    setLoadingOlderMessages(true)
    try {
      // Get the oldest message ID to fetch messages before it
      const oldestMessageId = messages.length > 0 ? messages[0].id : 0
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/messages?limit=50&before=${oldestMessageId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.messages.length > 0) {
          // Reverse the array since backend returns newest first
          const reversedMessages = data.messages.reverse()
          setMessages(prev => [...reversedMessages, ...prev])
          
          // Check if we got fewer than 50 messages, meaning there are no more
          setHasMoreMessages(data.messages.length === 50)
        } else {
          setHasMoreMessages(false)
        }
      } else {
        console.error('Failed to fetch older messages:', response.status)
      }
    } catch (err) {
      console.error('Error fetching older messages:', err)
    } finally {
      setLoadingOlderMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: newMessage.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        scrollToBottom()
        // Refocus the input after sending message
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 50)
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to send message', 'error')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      showToast('Failed to send message', 'error')
    } finally {
      setSendingMessage(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Fetch messages when group loads or membership status changes
  useEffect(() => {
    if (group && (isMember || isOrganizer)) {
      fetchMessages()
      // Only scroll to bottom on initial load, not on 30s group data refreshes
      if (isInitialChatLoad) {
        scrollToBottom()
        setIsInitialChatLoad(false)
      }
    }
  }, [group, isMember, isOrganizer])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!group || (!isMember && !isOrganizer)) return

    const interval = setInterval(() => {
      fetchMessages(false) // Pass false for polling updates to avoid resetting state
    }, 5000)

    return () => clearInterval(interval)
  }, [group, isMember, isOrganizer])

  const ToastContainer = () => {
    if (toasts.length === 0) return null

    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.95)',
              borderColor: toast.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: toast.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              {toast.type === 'success' ? (
                <Check size={14} style={{ color: 'rgb(34, 197, 94)' }} />
              ) : (
                <X size={14} style={{ color: 'rgb(239, 68, 68)' }} />
              )}
            </div>
            <p 
              className="text-sm flex-1"
              style={{ color: 'rgb(238, 238, 238)' }}
            >
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
              style={{ color: 'rgb(156, 163, 175)' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    )
  }

  // Leave Group Confirmation Modal Component
  const LeaveConfirmationModal = () => {
    if (!leaveModalOpen) return null

    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(15, 20, 25, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setLeaveModalOpen(false)}
        >
          {/* Modal */}
          <div 
            className="rounded-lg border p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.98)',
              borderColor: 'rgba(249, 115, 22, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }}
              >
                <UserX size={24} style={{ color: 'rgb(249, 115, 22)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Leave Groop
                </h3>
                <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                  You can rejoin later if the groop is still active
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="mb-3" style={{ color: 'rgb(201, 209, 217)', lineHeight: '1.5' }}>
                Are you sure you want to leave <strong style={{ color: 'rgb(238, 238, 238)' }}>"{group?.name}"</strong>?
              </p>
              <p className="text-sm" style={{ color: 'rgb(156, 163, 175)', lineHeight: '1.5' }}>
                You will no longer receive updates about this groop and won't be able to participate in the event.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setLeaveModalOpen(false)}
                disabled={leaveLoading}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'rgb(107, 114, 128)',
                  color: 'rgb(156, 163, 175)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                disabled={leaveLoading}
                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: leaveLoading ? 'rgba(249, 115, 22, 0.5)' : 'rgb(249, 115, 22)',
                  color: 'white'
                }}
              >
                {leaveLoading ? (
                  <>
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                    />
                    Leaving...
                  </>
                ) : (
                  <>
                    <UserX size={16} />
                    Leave Groop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Remove Member Confirmation Modal Component
  const RemoveMemberConfirmationModal = () => {
    if (!removeModalOpen || !memberToRemove) return null

    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(15, 20, 25, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setRemoveModalOpen(false)}
        >
          {/* Modal */}
          <div 
            className="rounded-lg border p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.98)',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <UserX size={24} style={{ color: 'rgb(239, 68, 68)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Remove Member
                </h3>
                <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                  This action will remove them from the groop
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="mb-3" style={{ color: 'rgb(201, 209, 217)', lineHeight: '1.5' }}>
                Are you sure you want to remove <strong style={{ color: 'rgb(238, 238, 238)' }}>{memberToRemove}</strong> from this groop?
              </p>
              <p className="text-sm" style={{ color: 'rgb(156, 163, 175)', lineHeight: '1.5' }}>
                They will no longer be able to participate in the event and will lose access to the groop chat.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRemoveModalOpen(false)
                  setMemberToRemove(null)
                }}
                disabled={removeLoading}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'rgb(107, 114, 128)',
                  color: 'rgb(156, 163, 175)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveMember(memberToRemove)}
                disabled={removeLoading}
                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: removeLoading ? 'rgba(239, 68, 68, 0.5)' : 'rgb(239, 68, 68)',
                  color: 'white'
                }}
              >
                {removeLoading ? (
                  <>
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <UserX size={16} />
                    Remove Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

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

  const approvedMembers = group.members?.filter(m => m.status === 'approved') || []
  const nonOrganizerMembers = approvedMembers.filter(m => m.username !== group.organizer_username)
  const skillStyle = getSkillLevelStyle(group.skill_level)

  // Member Profile Modal Component
  const MemberProfileModal = () => {
    if (!memberProfileModalOpen) return null

    // Calculate modal position with bounds checking
    const modalWidth = 320 // max-w-md is approximately 320px
    const modalHeight = 400 // estimated modal height
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Adjust position to keep modal within viewport
    let adjustedX = modalPosition.x - modalWidth / 2 // Center horizontally on click point
    let adjustedY = modalPosition.y - 350// Use the position that's already calculated to be above the avatar
    
    // Keep modal within horizontal bounds
    if (adjustedX < 10) adjustedX = 10
    if (adjustedX + modalWidth > viewportWidth - 10) adjustedX = viewportWidth - modalWidth - 10
    
    // Keep modal within vertical bounds
    if (adjustedY < 10) {
      adjustedY = modalPosition.y + 80 // Position below avatar if no space above
    }
    if (adjustedY + modalHeight > viewportHeight - 10) {
      adjustedY = viewportHeight - modalHeight - 10
    }

    return (
      <>
        {/* Invisible overlay for click-outside-to-close */}
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setMemberProfileModalOpen(false)}
        />
        
        {/* Modal box */}
        <div 
          className="rounded-lg border p-6 w-80 shadow-2xl"
          style={{
            backgroundColor: 'rgba(25, 30, 35, 0.98)',
            borderColor: 'rgba(75, 85, 99, 0.5)',
            position: 'fixed',
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {memberProfileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div 
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : selectedMember ? (
            <div className="text-center">
              {/* Profile Image */}
              <div className="mb-4">
                <div className="w-24 h-24 rounded-full border-2 mx-auto overflow-hidden" style={{ borderColor: 'rgb(0, 173, 181)' }}>
                  {selectedMember.avatar_url ? (
                    <img
                      src={`${API_BASE_URL}/profiles/${selectedMember.username}/image`}
                      alt={selectedMember.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                      {selectedMember.username?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Username */}
              <h3 className="text-xl font-bold mb-1" style={{ color: 'rgb(238, 238, 238)' }}>
                {selectedMember.full_name || selectedMember.username}
              </h3>
              <p className="text-sm mb-3" style={{ color: 'rgb(156, 163, 175)' }}>
                @{selectedMember.username}
              </p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-yellow-400">★</span>
                <span className="font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                  {selectedMember.rating || '5.0'}
                </span>
              </div>

              {/* Bio */}
              {selectedMember.bio && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2" style={{ color: 'rgb(238, 238, 238)' }}>
                    About
                  </h4>
                  <p className="text-sm" style={{ color: 'rgb(201, 209, 217)', lineHeight: '1.5' }}>
                    {selectedMember.bio}
                  </p>
                </div>
              )}

              {/* Date Joined */}
              <div className="text-xs" style={{ color: 'rgb(156, 163, 175)' }}>
                Member since {new Date(selectedMember.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p style={{ color: 'rgb(156, 163, 175)' }}>
                Failed to load profile
              </p>
            </div>
          )}
        </div>
      </>
    )
  }

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => {
    if (!deleteModalOpen) return null

    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(15, 20, 25, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          {/* Modal */}
          <div 
            className="rounded-lg border p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.98)',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <Trash2 size={24} style={{ color: 'rgb(239, 68, 68)' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'rgb(238, 238, 238)' }}>
                  Delete Groop
                </h3>
                <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="mb-3" style={{ color: 'rgb(201, 209, 217)', lineHeight: '1.5' }}>
                Are you sure you want to delete <strong style={{ color: 'rgb(238, 238, 238)' }}>"{group?.name}"</strong>?
              </p>
              <p className="text-sm" style={{ color: 'rgb(156, 163, 175)', lineHeight: '1.5' }}>
                This will permanently remove:
              </p>
              <ul className="text-sm mt-2 space-y-1" style={{ color: 'rgb(156, 163, 175)' }}>
                <li>• All groop data and settings</li>
                <li>• All member information</li>
                <li>• All notifications and activity logs</li>
                <li>• The event and location details</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'rgb(107, 114, 128)',
                  color: 'rgb(156, 163, 175)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: deleteLoading ? 'rgba(239, 68, 68, 0.5)' : 'rgb(239, 68, 68)',
                  color: 'white'
                }}
              >
                {deleteLoading ? (
                  <>
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Groop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{ backgroundColor: 'rgb(15, 20, 25)', minHeight: '100vh' }}>
      <MemberProfileModal />
      <ToastContainer />
      <DeleteConfirmationModal />
      <LeaveConfirmationModal />
      <RemoveMemberConfirmationModal />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
            <div className="flex-1">
              {/* Group Name and Badges */}
              <div className="mb-4">
                <h1 
                  ref={groupNameRef}
                  className={`text-3xl font-bold break-words ${!isGroupNameExpanded && showGroupNameButton ? 'line-clamp-2' : ''}`}
                  style={{ 
                    color: 'rgb(238, 238, 238)',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                    overflow: !isGroupNameExpanded && showGroupNameButton ? 'hidden' : 'visible',
                    display: !isGroupNameExpanded && showGroupNameButton ? '-webkit-box' : 'block',
                    WebkitLineClamp: !isGroupNameExpanded && showGroupNameButton ? 2 : 'none',
                    WebkitBoxOrient: 'vertical',
                    hyphens: 'auto'
                  }}>
                  {group.name}
                </h1>
                {showGroupNameButton && (
                  <button
                    onClick={() => setIsGroupNameExpanded(!isGroupNameExpanded)}
                    className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ color: 'rgb(0, 173, 181)' }}
                  >
                    {isGroupNameExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              
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
                <div 
                  className="w-16 h-16 rounded-full border-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ borderColor: 'rgb(0, 173, 181)' }}
                  onClick={(event) => handleMemberClick(group.organizer_username, event)}
                >
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
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200"
                    style={{
                      borderColor: isEventTooSoon() ? 'rgb(75, 85, 99)' : 'rgb(107, 114, 128)',
                      color: isEventTooSoon() ? 'rgb(75, 85, 99)' : 'rgb(156, 163, 175)',
                      backgroundColor: 'transparent',
                      cursor: isEventTooSoon() ? 'not-allowed' : 'pointer',
                      opacity: isEventTooSoon() ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isEventTooSoon()) {
                        e.target.style.borderColor = 'rgb(0, 173, 181)'
                        e.target.style.color = 'rgb(0, 173, 181)'
                        e.target.style.backgroundColor = 'rgba(0, 173, 181, 0.1)'
                        e.target.style.transform = 'scale(1.05)'
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isEventTooSoon()) {
                        e.target.style.borderColor = 'rgb(107, 114, 128)'
                        e.target.style.color = 'rgb(156, 163, 175)'
                        e.target.style.backgroundColor = 'transparent'
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                    onClick={() => {
                      if (!isEventTooSoon()) {
                        navigate(`/groups/${groupId}/edit`)
                      }
                    }}
                    disabled={isEventTooSoon()}
                    title={isEventTooSoon() ? "Cannot edit groop within 1 hour of the event" : "Edit groop details"}
                  >
                    <Edit size={16} />
                    Edit
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200"
                    style={{
                      borderColor: isEventTooSoon() ? 'rgb(75, 85, 99)' : 'rgb(185, 28, 28)',
                      color: isEventTooSoon() ? 'rgb(75, 85, 99)' : 'rgb(185, 28, 28)',
                      backgroundColor: 'transparent',
                      cursor: isEventTooSoon() ? 'not-allowed' : 'pointer',
                      opacity: isEventTooSoon() ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isEventTooSoon()) {
                        e.target.style.borderColor = 'rgb(220, 38, 38)'
                        e.target.style.color = 'rgb(220, 38, 38)'
                        e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'
                        e.target.style.transform = 'scale(1.05)'
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isEventTooSoon()) {
                        e.target.style.borderColor = 'rgb(185, 28, 28)'
                        e.target.style.color = 'rgb(185, 28, 28)'
                        e.target.style.backgroundColor = 'transparent'
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                    onClick={() => {
                      if (!isEventTooSoon()) {
                        showDeleteModal()
                      }
                    }}
                    disabled={isEventTooSoon()}
                    title={isEventTooSoon() ? "Cannot delete groop within 1 hour of the event" : "Delete groop permanently"}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
              
              {isNonMember && (
                <button
                  onClick={user?.authenticated ? handleJoinGroup : signIn}
                  disabled={joinLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: joinLoading ? 'rgba(0, 173, 181, 0.5)' : 'rgb(0, 173, 181)',
                    color: 'white'
                  }}
                >
                  <UserPlus size={16} />
                  {joinLoading 
                    ? 'Joining...' 
                    : user?.authenticated 
                      ? 'Join Groop' 
                      : 'Sign in and Join Now'
                  }
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
                  onClick={showLeaveModal}
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
                    {/* About/Description Section - Now first */}
                    {group.description && (
                      <div>
                        <h3 className="font-semibold mb-3" style={{ color: 'rgb(238, 238, 238)' }}>
                          Description:
                        </h3>
                        <div className="relative">
                          <p 
                            ref={descriptionRef}
                            className={`break-words ${!isDescriptionExpanded && showDescriptionButton ? 'line-clamp-3' : ''}`}
                            style={{ 
                              color: 'rgb(201, 209, 217)', 
                              lineHeight: '1.6',
                              wordWrap: 'break-word',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              maxWidth: '100%',
                              overflow: !isDescriptionExpanded && showDescriptionButton ? 'hidden' : 'visible',
                              display: !isDescriptionExpanded && showDescriptionButton ? '-webkit-box' : 'block',
                              WebkitLineClamp: !isDescriptionExpanded && showDescriptionButton ? 3 : 'none',
                              WebkitBoxOrient: 'vertical'
                            }}>
                            {group.description}
                          </p>
                          {showDescriptionButton && (
                            <button
                              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
                              style={{ color: 'rgb(0, 173, 181)' }}
                            >
                              {isDescriptionExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Event Details Section - Now after description */}
                    <div>
                      <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="flex-shrink-0" style={{ color: 'rgb(0, 173, 181)' }} />
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
                          <MapPin size={16} className="flex-shrink-0" style={{ color: 'rgb(0, 173, 181)' }} />
                          <span style={{ color: 'rgb(238, 238, 238)' }}>
                            {group.location?.formatted_address || group.location?.name || group.location}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <IndianRupee size={16} className="flex-shrink-0" style={{ color: 'rgb(0, 173, 181)' }} />
                          <span style={{ color: 'rgb(238, 238, 238)' }}>
                            {group.cost === 0 ? 'Free' : `₹${group.cost}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Location/Map */}
                <div>
                  {group.location?.latitude && group.location?.longitude ? (
                    <div 
                      className="relative w-full rounded-lg"
                      style={{ 
                        height: '240px',
                        backgroundColor: '#0f1419' // Dark background to prevent white flash during loading
                      }}
                    >
                      {/* Map container */}
                      <div 
                        ref={mapRef}
                        className="w-full h-full rounded-lg"
                      />
                      
                      {/* Loading overlay */}
                      {mapLoading && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center rounded-lg"
                          style={{ backgroundColor: '#0f1419' }}
                        >
                          <div 
                            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: 'rgb(0, 173, 181)', borderTopColor: 'transparent' }}
                          />
                        </div>
                      )}
                    </div>
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
                      <div 
                        className="w-16 h-16 rounded-full border-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" 
                        style={{ borderColor: 'rgb(0, 173, 181)' }}
                        onClick={(event) => handleMemberClick(group.organizer_username, event)}
                      >
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
                        <div 
                          className="w-16 h-16 rounded-full border-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" 
                          style={{ borderColor: 'rgba(75, 85, 99, 0.5)' }}
                          onClick={(event) => handleMemberClick(member.username, event)}
                        >
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
                            onClick={() => showRemoveModal(member.username)}
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
                    <div 
                      className="w-10 h-10 rounded-full border-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" 
                      style={{ borderColor: 'rgb(0, 173, 181)' }}
                      onClick={(event) => handleMemberClick(member.username, event)}
                    >
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

        {/* Chat Section */}
        {(isMember || isOrganizer) && (
          <div 
            className="p-6 rounded-lg border mt-6"
            style={{
              backgroundColor: 'rgba(25, 30, 35, 0.8)',
              borderColor: 'rgba(75, 85, 99, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: 'rgb(238, 238, 238)' }}>
                <MessageCircle size={20} style={{ color: 'rgb(0, 173, 181)' }} />
                Groop Chat
              </h3>
            </div>

            {/* Messages Container */}
            <div 
              className="bg-gray-900/50 rounded-lg p-4 mb-4 max-h-80 overflow-y-auto"
              style={{ 
                backgroundColor: 'rgba(15, 20, 25, 0.8)',
                border: '1px solid rgba(75, 85, 99, 0.2)'
              }}
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={48} style={{ color: 'rgba(75, 85, 99, 0.5)' }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Load More Messages Button */}
                  {hasMoreMessages && (
                    <div className="text-center pb-3">
                      <button
                        onClick={loadOlderMessages}
                        disabled={loadingOlderMessages}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: loadingOlderMessages ? 'rgba(75, 85, 99, 0.3)' : 'rgba(0, 173, 181, 0.2)',
                          color: loadingOlderMessages ? 'rgb(156, 163, 175)' : 'rgb(0, 173, 181)',
                          border: `1px solid ${loadingOlderMessages ? 'rgba(75, 85, 99, 0.5)' : 'rgba(0, 173, 181, 0.3)'}`,
                          cursor: loadingOlderMessages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {loadingOlderMessages ? (
                          <>
                            <div 
                              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin inline-block mr-2"
                              style={{ borderColor: 'rgb(156, 163, 175)', borderTopColor: 'transparent' }}
                            />
                            Loading...
                          </>
                        ) : (
                          'Load More Messages'
                        )}
                      </button>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      {/* Avatar */}
                      <div 
                        className="w-8 h-8 rounded-full border overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ borderColor: message.username === group.organizer_username ? 'rgb(0, 173, 181)' : 'rgba(75, 85, 99, 0.5)' }}
                        onClick={(event) => handleMemberClick(message.username, event)}
                      >
                        {memberProfiles[message.username]?.avatar_url ? (
                          <img
                            src={`${API_BASE_URL}/profiles/${message.username}/image`}
                            alt={message.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-xs font-medium"
                            style={{ 
                              backgroundColor: message.username === group.organizer_username ? 'rgba(0, 173, 181, 0.2)' : 'rgba(75, 85, 99, 0.3)',
                              color: message.username === group.organizer_username ? 'rgb(0, 173, 181)' : 'rgb(156, 163, 175)'
                            }}
                          >
                            {message.username?.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium" style={{ color: 'rgb(238, 238, 238)' }}>
                            {memberProfiles[message.username]?.full_name || message.username}
                          </span>
                          {message.username === group.organizer_username && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0, 173, 181, 0.2)', color: 'rgb(0, 173, 181)' }}>
                              Organizer
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'rgb(107, 114, 128)' }}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                        <p 
                          className="text-sm break-words"
                          style={{ 
                            color: 'rgb(201, 209, 217)',
                            wordWrap: 'break-word',
                            lineHeight: '1.4'
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 sm:gap-3">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={2}
                    disabled={sendingMessage}
                    className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.8)',
                      borderColor: 'rgba(107, 114, 128, 0.5)',
                      color: 'rgb(238, 238, 238)',
                      fontSize: '14px',
                      minHeight: '80px' // Ensures consistent height
                    }}
                    maxLength={1000}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-2 sm:px-4 rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors flex-shrink-0"
                    style={{
                      backgroundColor: (!newMessage.trim() || sendingMessage) ? 'rgba(75, 85, 99, 0.5)' : 'rgb(0, 173, 181)',
                      color: 'white',
                      cursor: (!newMessage.trim() || sendingMessage) ? 'not-allowed' : 'pointer',
                      height: '80px', // Match textarea height
                      minWidth: '60px', // Smaller minimum width for mobile
                      width: 'auto' // Allow button to size based on content
                    }}
                  >
                    {sendingMessage ? (
                      <>
                        <div 
                          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                        />
                        <span className="hidden md:inline text-sm">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} className="flex-shrink-0" />
                        <span className="hidden md:inline text-sm">Send</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <div className="text-xs" style={{ color: 'rgb(107, 114, 128)' }}>
                    <span className="hidden sm:inline">Press Enter to send</span>
                    <span className="sm:hidden">Tap to send</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupDetails