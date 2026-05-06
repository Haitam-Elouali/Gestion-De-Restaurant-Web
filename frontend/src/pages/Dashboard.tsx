import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, LayoutGrid, DollarSign, Package, Calendar, BarChart3, Users } from 'lucide-react'
import { User } from '../types'

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          setUser(data)
          setLoading(false)
          // Redirect admin to /admin
          if (data.role === 'admin') {
            navigate('/admin')
          }
          // Redirect serveur to /serveur
          if (data.role === 'serveur') {
            navigate('/serveur')
          }
          // Redirect caissier to /caisse
          if (data.role === 'caissier') {
            navigate('/caisse')
          }
        } else {
          navigate('/login')
        }
      })
  }, [navigate])

  if (loading) {
    return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Chargement...</div>
  }

  const isManager = user?.role === 'manager'

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Dashboard</h1>
        <p className="text-text-gray mb-6">Bienvenue, {user?.username} ({user?.role})</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Manager: Stocks & Menus, Réservations, Statistiques uniquement */}
          {/* Others: Toutes les options sauf Utilisateurs */}
          
          {!isManager && (
            <>
              <Link to="/commandes" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                    <ShoppingBag size={40} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-white">Commandes</h2>
                  <p className="text-text-gray">Gérer les commandes clients</p>
                </div>
              </Link>

              <Link to="/tables" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                    <LayoutGrid size={40} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-white">Tables</h2>
                  <p className="text-text-gray">Gérer l'état des tables</p>
                </div>
              </Link>

              <Link to="/caisse" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                    <DollarSign size={40} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-white">Caisse</h2>
                  <p className="text-text-gray">Gérer les paiements</p>
                </div>
              </Link>
            </>
          )}

          <Link to="/stocks-menus" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                <Package size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Stocks & Menus</h2>
              <p className="text-text-gray">Gérer les produits et stocks</p>
            </div>
          </Link>

          <Link to="/reservations" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                <Calendar size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Réservations</h2>
              <p className="text-text-gray">Gérer les réservations clients</p>
            </div>
          </Link>

          <Link to="/statistiques" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                <BarChart3 size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Statistiques</h2>
              <p className="text-text-gray">Voir les rapports et statistiques</p>
            </div>
          </Link>

          {!isManager && (
            <Link to="/utilisateurs" className="bg-card rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group border border-card-light">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/20 rounded-full p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                  <Users size={40} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Utilisateurs</h2>
                <p className="text-text-gray">Gérer les comptes utilisateurs</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
