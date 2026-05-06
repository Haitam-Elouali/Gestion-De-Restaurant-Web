import React from 'react'
import { Plus, Calendar, Phone, Edit, X } from 'lucide-react'

const Reservations: React.FC = () => {
  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Gestion des Réservations</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Nouvelle réservation</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                <Plus size={16} />
                <span>Créer</span>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nom du client</label>
                <input type="text" placeholder="Nom complet" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Téléphone</label>
                <input type="tel" placeholder="Numéro de téléphone" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Date</label>
                  <input type="date" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Heure</label>
                  <input type="time" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nombre de personnes</label>
                <input type="number" min={1} max={20} defaultValue={2} className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Notes</label>
                <textarea rows={3} placeholder="Notes spéciales (allergies, préférences...)" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray"></textarea>
              </div>
              <button type="submit" className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity w-full">
                <Plus size={18} />
                <span>Créer la réservation</span>
              </button>
            </form>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <h2 className="text-2xl font-bold mb-4 text-white">Réservations à venir</h2>
            <div className="bg-green-500/10 rounded-lg p-4 border-l-4 border-green-500 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg text-white">Ahmed Benali</p>
                  <p className="text-text-gray text-sm flex items-center">
                    <Phone size={14} className="mr-1" />
                    +212 6 12 34 56 78
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-white flex items-center">
                    <Calendar size={16} className="mr-1" />
                    22/04/2026 à 20:00
                  </p>
                  <p className="text-text-gray">4 personnes</p>
                </div>
              </div>
              <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Confirmée</span>
              <div className="flex space-x-2 mt-3">
                <button className="flex items-center space-x-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                  <Edit size={14} />
                  <span>Modifier</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm">
                  <X size={14} />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
          <h2 className="text-2xl font-bold mb-4 text-white">Historique des réservations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-card-light">
                  <th className="text-left py-3 px-4 font-semibold text-white">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Heure</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Personnes</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">Ahmed Benali</td>
                  <td className="py-3 px-4 text-white">22/04/2026</td>
                  <td className="py-3 px-4 text-white">20:00</td>
                  <td className="py-3 px-4 text-white">4</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Confirmée</span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                      Détails
                    </button>
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

export default Reservations
