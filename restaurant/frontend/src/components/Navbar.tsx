import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User } from '../types'
import { Menu, X, User as UserIcon, LogOut, ChevronDown } from 'lucide-react'

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          setUser(data)
        }
      })
  }, [])

  function handleLogout() {
    fetch('/api/auth/logout/', {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        setUser(null)
        navigate('/login')
      })
  }

  return (
    <nav className="fixed w-full top-0 z-50 bg-dark">
      <div className="max-w-[1440px] mx-auto px-2">
        <div className="flex items-center justify-between h-[80px]">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 shrink-0">
            <img src="/234942918-removebg-preview.png" alt="Logo Restaurant" className="h-[160px] w-auto object-contain brightness-0 invert" />
          </Link>

          <div className="hidden md:flex items-center space-x-3 shrink-0">
            {user && (
              <div className="flex items-center space-x-2 text-white">
                <UserIcon size={18} />
                <span className="text-sm">{user.username} ({user.role})</span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-white hover:text-primary transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t">
          <div className="px-4 py-3 space-y-2">
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 py-2 text-white hover:text-primary w-full"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
