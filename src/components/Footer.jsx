import React from 'react'
import { Github } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="border-t mt-auto"
      style={{ 
        backgroundColor: 'rgba(15, 20, 25, 0.95)',
        borderColor: 'rgba(75, 85, 99, 0.3)'
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          {/* Left side - Branding */}
          <div className="flex items-center gap-2">
            <span 
              className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent"
              style={{ 
                textShadow: '0 0 20px rgba(34, 211, 238, 0.4)'
              }}
            >
              Groops
            </span>
            <span className="text-sm" style={{ color: 'rgb(156, 163, 175)' }}>
              Bringing people together
            </span>
          </div>

          {/* Right side - Social & Copyright */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/arjunbalu1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-pointer"
                style={{ color: 'rgb(156, 163, 175)' }}
                title="GitHub Profile"
              >
                <Github size={20} />
                <span className="text-sm">github</span>
              </a>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'rgb(107, 114, 128)' }}>
              <span>made by arjun balu</span>
              <span>© {currentYear} Groops</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 