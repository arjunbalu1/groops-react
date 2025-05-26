import { useState, useEffect } from 'react'

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.groops.fun'

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count || 0)
      } else if (response.status === 401) {
        // User not authenticated, reset count
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for updates every 30 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchUnreadCount()
      }
    }, 30000)

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { unreadCount, loading }
} 