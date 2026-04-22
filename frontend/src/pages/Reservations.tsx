import React from 'react'
import { Plus, Calendar, Phone, Edit, X } from 'lucide-react'

const Reservations: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Gestion des Réservations</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Nouvelle réservation</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
                <Plus size={16} />
                <span>Créer</span>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client</label>
                <input type="text" placeholder="Nom complet" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input type="tel" placeholder="Numéro de téléphone" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                  <input type="time" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de personnes</label>
                <input type="number" min={1} max={20} defaultValue={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea rows={3} placeholder="Notes spéciales (allergies, préférences...)" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"></textarea>
              </div>
              <button type="submit" className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full">
                <Plus size={18} />
                <span>Créer la réservation</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Réservations à venir</h2>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg">Ahmed Benali</p>
                  <p className="text-gray-600 text-sm flex items-center">
                    <Phone size={14} className="mr-1" />
                    +212 6 12 34 56 78
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg flex items-center">
                    <Calendar size={16} className="mr-1" />
                    22/04/2026 à 20:00
                  </p>
                  <p className="text-gray-600">4 personnes</p>
                </div>
              </div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Confirmée</span>
              <div className="flex space-x-2 mt-3">
                <button className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                  <Edit size={14} />
                  <span>Modifier</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm">
                  <X size={14} />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Historique des réservations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Heure</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Personnes</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">Ahmed Benali</td>
                  <td className="py-3 px-4">22/04/2026</td>
                  <td className="py-3 px-4">20:00</td>
                  <td className="py-3 px-4">4</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Confirmée</span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
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
