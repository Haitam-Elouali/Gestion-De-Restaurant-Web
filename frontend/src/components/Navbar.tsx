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
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-8xl mx-auto lg:px-4" >
        <div className="relative flex items-center h-16">
          <Link to="/" className="flex items-center space-x-2 shrink-0 z-10">
            <span className="text-2xl font-bold text-primary">RESTAURANT</span>
          </Link>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-3">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">Accueil</Link>
            <Link to="/menu" className="text-gray-700 hover:text-primary transition-colors">Menu</Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary transition-colors">Dashboard</Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors">
                    <span>Opérations</span>
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to="/commandes" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg">Commandes</Link>
                    <Link to="/tables" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Tables</Link>
                    <Link to="/caisse" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg">Caisse</Link>
                  </div>
                </div>

                <div className="relative group">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors">
                    <span>Administration</span>
                    <ChevronDown size={16} />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to="/stocks-menus" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg">Stocks</Link>
                    <Link to="/reservations" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Réservations</Link>
                    <Link to="/statistiques" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Statistiques</Link>
                    {user.role === 'manager' && <Link to="/utilisateurs" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg">Utilisateurs</Link>}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3 shrink-0 ml-auto">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-gray-700">
                  <UserIcon size={18} />
                  <span>{user.username} ({user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
                Connexion
              </Link>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" className="block py-2 text-gray-700 hover:text-primary">Accueil</Link>
            <Link to="/menu" className="block py-2 text-gray-700 hover:text-primary">Menu</Link>
            {user && (
              <>
                <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-primary">Dashboard</Link>
                <div className="py-2">
                  <p className="font-semibold text-gray-700 mb-1">Opérations</p>
                  <Link to="/commandes" className="block py-1 pl-4 text-gray-600 hover:text-primary">Commandes</Link>
                  <Link to="/tables" className="block py-1 pl-4 text-gray-600 hover:text-primary">Tables</Link>
                  <Link to="/caisse" className="block py-1 pl-4 text-gray-600 hover:text-primary">Caisse</Link>
                </div>
                <div className="py-2">
                  <p className="font-semibold text-gray-700 mb-1">Administration</p>
                  <Link to="/stocks-menus" className="block py-1 pl-4 text-gray-600 hover:text-primary">Stocks</Link>
                  <Link to="/reservations" className="block py-1 pl-4 text-gray-600 hover:text-primary">Réservations</Link>
                  <Link to="/statistiques" className="block py-1 pl-4 text-gray-600 hover:text-primary">Statistiques</Link>
                  {user.role === 'manager' && <Link to="/utilisateurs" className="block py-1 pl-4 text-gray-600 hover:text-primary">Utilisateurs</Link>}
                </div>
              </>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 py-2 text-gray-700 hover:text-primary"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            ) : (
              <Link to="/login" className="block py-2 text-primary">Connexion</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
