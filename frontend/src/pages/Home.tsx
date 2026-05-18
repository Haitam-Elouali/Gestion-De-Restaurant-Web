import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User } from '../types'

interface RestaurantSettings {
  nom: string
  adresse: string
  telephone: string
}

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    nom: 'KOOL.MA',
    adresse: '123 Rue de Paris, Casablanca',
    telephone: '+212 5XX-XXXXXX'
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Récupérer les paramètres du restaurant depuis localStorage
    const savedSettings = localStorage.getItem('restaurantSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setRestaurantSettings(settings)
      } catch (e) {
        console.error('Erreur lors de la récupération des paramètres:', e)
      }
    }

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

        {/* Informations du restaurant */}
        <div className="absolute bottom-0 left-0 right-0 text-center py-6 px-4">
          <div className="text-gray-600 text-sm space-y-1">
            <p className="font-medium">{restaurantSettings.nom}</p>
            <p>{restaurantSettings.adresse}</p>
            <p>{restaurantSettings.telephone}</p>
            <p className="text-xs text-gray-500 mt-2"> 2024 {restaurantSettings.nom} - Tous droits réservés</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
