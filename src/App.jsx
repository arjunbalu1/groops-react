import React from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import GroupCards from '@/components/GroupCards'
import { AuthProvider } from '@/context/AuthContext'

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
        <Header />
        <Hero />
        <GroupCards />
      </div>
    </AuthProvider>
  )
}

export default App
