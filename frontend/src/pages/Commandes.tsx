import React from 'react'
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

const Commandes: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Gestion des Commandes</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Nouvelle commande</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
              <Plus size={16} />
              <span>Créer</span>
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client</label>
              <input type="text" placeholder="Entrez le nom du client" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de commande</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                <option value="sur_place">Sur place</option>
                <option value="a_emporter">À emporter</option>
                <option value="livraison">Livraison</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse (livraison)</label>
              <input type="text" placeholder="Adresse de livraison" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Commandes en cours</h2>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-bold text-lg">#001</span> - Client Test
                <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">En cours</span>
              </div>
              <span className="font-bold text-xl">150 DH</span>
            </div>
            <p className="text-gray-600 text-sm">Type: Sur place | Date: 21/04/2026 18:30</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Historique des commandes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">#001</td>
                  <td className="py-3 px-4">Client Test</td>
                  <td className="py-3 px-4">Sur place</td>
                  <td className="py-3 px-4"><span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">En cours</span></td>
                  <td className="py-3 px-4 font-semibold">150 DH</td>
                  <td className="py-3 px-4">21/04/2026 18:30</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Clock size={16} />
                      </button>
                      <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                        <CheckCircle size={16} />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Commandes
