import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from '@/components/Header'
import HomePage from '@/components/HomePage'
import CreateProfile from '@/components/CreateProfile'
import GroupDetails from '@/components/GroupDetails'
import { AuthProvider } from '@/context/AuthContext'

const AppContent = () => {
  const location = useLocation()
  const [homePageCached, setHomePageCached] = useState(false)

  // Cache HomePage once it's visited
  useEffect(() => {
    if (location.pathname === '/') {
      setHomePageCached(true)
    }
  }, [location.pathname])

  const isHomePage = location.pathname === '/'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      {/* Home Page - keep mounted once visited, hide when not active */}
      {homePageCached && (
        <div style={{ display: isHomePage ? 'block' : 'none' }}>
          <Header />
          <HomePage />
        </div>
      )}

      {/* Standard Routes for other pages */}
      <Routes>
        <Route path="/" element={null} /> {/* Handled by cached component above */}
        <Route 
          path="/create-profile" 
          element={<CreateProfile />} 
        />
        <Route 
          path="/groups/:groupId" 
          element={
            <>
              <Header />
              <GroupDetails />
            </>
          } 
        />
      </Routes>
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
