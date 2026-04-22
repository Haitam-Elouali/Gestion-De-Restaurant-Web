import React from 'react'
import { Users, Edit } from 'lucide-react'

const Tables: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Gestion des Tables</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">État des tables</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 text-center border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Table {i + 1}</h3>
                <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-3">
                  Libre
                </span>
                <p className="text-gray-600 text-sm flex items-center justify-center">
                  <Users size={16} className="mr-1" />
                  Capacité: 4 personnes
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Détail de la table</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une table</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                <option>Table 1</option>
                <option>Table 2</option>
                <option>Table 3</option>
                <option>Table 4</option>
                <option>Table 5</option>
                <option>Table 6</option>
                <option>Table 7</option>
                <option>Table 8</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de clients</label>
              <input type="number" min={1} max={10} defaultValue={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commande assignée</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                <option>Non assignée</option>
                <option>#001 - Client Test</option>
              </select>
            </div>
            <button type="submit" className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
              <Edit size={18} />
              <span>Mettre à jour</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Tables
