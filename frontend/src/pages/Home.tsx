import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User } from '../types'

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          setUser(data)
          // Rediriger vers le dashboard si connecté
          navigate('/dashboard')
        }
      })
  }, [navigate])

  return (
    <div className="min-h-screen bg-[url('/blur-coffee-cafe-shop-restaurant-with-bokeh-background-xd.jpg')] bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-black/60 flex items-center justify-center">
        {/* Hero Section */}
        <section className="flex items-center justify-center py-20">
          <div className="text-center flex flex-col items-center gap-8 px-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-[73px] h-0 border-2 border-primary"></div>
            </div>
            <h1 className="text-white font-semibold text-4xl md:text-6xl leading-tight text-center">
              BIENVENUE DANS KOOL.MA
            </h1>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link to="/login" className="flex items-center justify-center px-8 py-3 bg-primary text-white rounded font-semibold text-base hover:opacity-90 transition-opacity">
                SE CONNECTER
              </Link>
              <Link to="/menu" className="flex items-center justify-center px-8 py-3 border border-white rounded text-white font-semibold text-base hover:bg-white hover:text-dark transition-colors">
                VOIR LE MENU
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
