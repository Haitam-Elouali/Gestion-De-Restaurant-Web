import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, LayoutGrid, DollarSign, Package, Calendar, BarChart3, Users } from 'lucide-react'

const Dashboard: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Link to="/commandes" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <ShoppingBag size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Commandes</h2>
              <p className="text-gray-600">Gérer les commandes clients</p>
            </div>
          </Link>

          <Link to="/tables" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <LayoutGrid size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Tables</h2>
              <p className="text-gray-600">Gérer l'état des tables</p>
            </div>
          </Link>

          <Link to="/caisse" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <DollarSign size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Caisse</h2>
              <p className="text-gray-600">Gérer les paiements</p>
            </div>
          </Link>

          <Link to="/stocks-menus" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <Package size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Stocks & Menus</h2>
              <p className="text-gray-600">Gérer les produits et stocks</p>
            </div>
          </Link>

          <Link to="/reservations" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <Calendar size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Réservations</h2>
              <p className="text-gray-600">Gérer les réservations clients</p>
            </div>
          </Link>

          <Link to="/statistiques" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Statistiques</h2>
              <p className="text-gray-600">Voir les rapports et statistiques</p>
            </div>
          </Link>

          <Link to="/utilisateurs" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4 group-hover:bg-primary/20 transition-colors">
                <Users size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Utilisateurs</h2>
              <p className="text-gray-600">Gérer les comptes utilisateurs</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
