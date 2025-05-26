import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from '@/components/Header'
import HomePage from '@/components/HomePage'
import CreateProfile from '@/components/CreateProfile'
import GroupDetails from '@/components/GroupDetails'
import { AuthProvider } from '@/context/AuthContext'

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
          <Routes>
            <Route 
              path="/" 
              element={
                <>
                  <Header />
                  <HomePage />
                </>
              } 
            />
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
      </Router>
    </AuthProvider>
  )
}

export default App
