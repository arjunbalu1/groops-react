import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from '@/components/Header'
import HomePage from '@/components/HomePage'
import CreateProfile from '@/components/CreateProfile'
import CreateGroup from '@/components/CreateGroup'
import EditGroup from '@/components/EditGroup'
import GroupDetails from '@/components/GroupDetails'
import Dashboard from '@/components/Dashboard'
import Groops from '@/components/Groops'
import { AuthProvider } from '@/context/AuthContext'

const AppContent = () => {
  return (
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
          path="/groops" 
          element={
            <>
              <Header />
              <Groops />
            </>
          } 
        />
        <Route 
          path="/create-profile" 
          element={<CreateProfile />} 
        />
        <Route 
          path="/create-group" 
          element={
            <>
              <Header />
              <CreateGroup />
            </>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <>
              <Header />
              <Dashboard />
            </>
          } 
        />
        <Route 
          path="/groups/:groupId/edit" 
          element={
            <>
              <Header />
              <EditGroup />
            </>
          } 
        />
        <Route 
          path="/groups/:groupId" 
          element={
            <>
              <Header />
              <GroupDetails key={`${window.location.pathname}-${Date.now()}`} />
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
