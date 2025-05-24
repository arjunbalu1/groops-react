import { useState, useEffect } from 'react'

function App() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch('https://groops.fun/groups', {
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch groups')
        }
        
        const data = await response.json()
        setGroups(data)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-amber-300">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-amber-300 font-bold text-3xl mb-6">Groops Data</h2>
      <pre className="text-amber-300 text-sm overflow-auto max-w-full">
        {JSON.stringify(groups, null, 2)}
      </pre>
    </div>
  )
}

export default App
