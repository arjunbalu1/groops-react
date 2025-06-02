import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomePage from '@/components/HomePage'
import CreateProfile from '@/components/CreateProfile'
import AccountSettings from '@/components/AccountSettings'
import CreateGroup from '@/components/CreateGroup'
import EditGroup from '@/components/EditGroup'
import GroupDetails from '@/components/GroupDetails'
import Dashboard from '@/components/Dashboard'
import Groops from '@/components/Groops'
import { AuthProvider } from '@/context/AuthContext'

const GroupDetailsWrapper = () => {
  const location = useLocation()
  const key = `${location.pathname}-${location.state?.timestamp || 'default'}`
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <Header />
      <div className="flex-grow">
        <GroupDetails key={key} />
      </div>
      <Footer />
    </div>
  )
}

const AppContent = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <Header />
              <div className="flex-grow">
                <HomePage />
              </div>
            </>
          } 
        />
        <Route 
          path="/groops" 
          element={
            <>
              <Header />
              <div className="flex-grow">
                <Groops />
              </div>
              <Footer />
            </>
          } 
        />
        <Route 
          path="/create-profile" 
          element={
            <>
              <div className="flex-grow">
                <CreateProfile />
              </div>
              <Footer />
            </>
          } 
        />
        <Route 
          path="/account-settings" 
          element={
            <>
              <Header />
              <div className="flex-grow">
                <AccountSettings />
              </div>
              <Footer />
            </>
          } 
        />
        <Route 
          path="/create-group" 
          element={
            <>
              <Header />
              <div className="flex-grow">
                <CreateGroup />
              </div>
              <Footer />
            </>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <>
              <Header />
              <div className="flex-grow">
                <Dashboard />
              </div>
              <Footer />
            </>
          } 
        />
        <Route 
          path="/groups/:groupId/edit" 
          element={
            <>
              <Header />
              <div className="flex-grow">
                <EditGroup />
              </div>
              <Footer />
            </>
          } 
        />
        <Route 
          path="/groups/:groupId" 
          element={<GroupDetailsWrapper />}
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
