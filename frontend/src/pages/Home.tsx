import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plat, Promotion } from '../types'
import { Star, Clock, Utensils } from 'lucide-react'

const Home: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plats/')
      .then(res => res.json())
      .then((data: { plats: Plat[] }) => {
        setPlats(data.plats.filter(p => p.disponible).slice(0, 6))
      })
    fetch('/api/promotions/')
      .then(res => res.json())
      .then((data: { promotions: Promotion[] }) => {
        setPromotions(data.promotions)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>
  }

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-secondary text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Bienvenue à notre Restaurant</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">Découvrez nos plats délicieux et nos promotions spéciales</p>
          <Link to="/menu" className="inline-block px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg">
            Voir le Menu
          </Link>
        </div>
      </section>

      {/* Promotions Section */}
      {promotions.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-primary">Promotions en cours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map(promo => (
                <div key={promo.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary">
                  <h3 className="text-xl font-bold mb-2">{promo.nom}</h3>
                  <p className="text-gray-600 mb-4">{promo.description}</p>
                  <div className="flex items-center text-primary font-bold text-lg">
                    <span className="bg-red-100 text-primary px-3 py-1 rounded-full">
                      -{promo.reduction_pourcentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Plats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Plats en vedette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plats.map(plat => (
              <div key={plat.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {plat.image && (
                  <img
                    src={`http://127.0.0.1:8000${plat.image}`}
                    alt={plat.nom}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{plat.nom}</h3>
                  <p className="text-gray-600 mb-4">{plat.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">{plat.prix} DH</span>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
                      Commander
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi Nous Choisir</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Star size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Qualité Premium</h3>
              <p className="opacity-90">Des ingrédients frais et locaux pour une saveur authentique</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Clock size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Service Rapide</h3>
              <p className="opacity-90">Livraison rapide et service sur place efficace</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Utensils size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Menu Varié</h3>
              <p className="opacity-90">Large choix de plats pour tous les goûts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">RESTAURANT</h3>
              <p className="text-gray-400">Votre destination culinaire pour des moments inoubliables</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Liens Rapides</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Accueil</Link></li>
                <li><Link to="/menu" className="text-gray-400 hover:text-white">Menu</Link></li>
                <li><Link to="/reservations" className="text-gray-400 hover:text-white">Réservations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <p className="text-gray-400">Tél: +212 5 XX XX XX XX</p>
              <p className="text-gray-400">Email: contact@restaurant.ma</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 Restaurant. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
