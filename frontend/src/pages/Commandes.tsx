import React from 'react'
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

const Commandes: React.FC = () => {
  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Gestion des Commandes</h1>

        <div className="bg-card rounded-xl shadow-lg p-6 mb-6 border border-card-light">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Nouvelle commande</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
              <Plus size={16} />
              <span>Créer</span>
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Nom du client</label>
              <input type="text" placeholder="Entrez le nom du client" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Type de commande</label>
              <select className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white">
                <option value="sur_place">Sur place</option>
                <option value="a_emporter">À emporter</option>
                <option value="livraison">Livraison</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Adresse (livraison)</label>
              <input type="text" placeholder="Adresse de livraison" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" />
            </div>
          </form>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 mb-6 border border-card-light">
          <h2 className="text-2xl font-bold mb-4 text-white">Commandes en cours</h2>
          <div className="bg-card-light rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-bold text-lg text-white">#001</span> - <span className="text-white">Client Test</span>
                <span className="ml-3 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">En cours</span>
              </div>
              <span className="font-bold text-xl text-white">150 DH</span>
            </div>
            <p className="text-text-gray text-sm">Type: Sur place | Date: 21/04/2026 18:30</p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
          <h2 className="text-2xl font-bold mb-4 text-white">Historique des commandes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-card-light">
                  <th className="text-left py-3 px-4 font-semibold text-white">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">#001</td>
                  <td className="py-3 px-4 text-white">Client Test</td>
                  <td className="py-3 px-4 text-white">Sur place</td>
                  <td className="py-3 px-4"><span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">En cours</span></td>
                  <td className="py-3 px-4 font-semibold text-white">150 DH</td>
                  <td className="py-3 px-4 text-white">21/04/2026 18:30</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                        <Clock size={16} />
                      </button>
                      <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                        <CheckCircle size={16} />
                      </button>
                      <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
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
