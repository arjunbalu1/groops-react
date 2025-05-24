import React from 'react'
import Header from '@/components/Header'

const App = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(15, 20, 25)' }}>
      <Header />
      
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'rgb(238, 238, 238)' }}>
          Welcome to Groops
        </h1>
        <p className="text-lg" style={{ color: 'rgb(238, 238, 238)' }}>
          Find and connect with people in your area.
        </p>
      </main>
    </div>
  )
}

export default App
