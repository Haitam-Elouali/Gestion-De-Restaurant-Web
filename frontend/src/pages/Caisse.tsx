import React from 'react'
import { DollarSign, CreditCard, FileText, Printer } from 'lucide-react'

const Caisse: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Caisse & Facturation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Nouvelle opération de caisse</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commande</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                  <option>Sélectionner une commande</option>
                  <option>#001 - Client Test - 150 DH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de paiement</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                  <option value="cash">Cash</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
                <input type="number" defaultValue={150} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              </div>
              <button type="submit" className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full">
                <DollarSign size={18} />
                <span>Valider le paiement</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">État de la caisse</h2>
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Total Cash</p>
                <p className="text-2xl font-bold text-green-600">2,500 DH</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Total Carte</p>
                <p className="text-2xl font-bold text-blue-600">1,800 DH</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm mb-1">Total Chèque</p>
                <p className="text-2xl font-bold text-purple-600">500 DH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Opérations récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Commande</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">#OP001</td>
                  <td className="py-3 px-4">#001</td>
                  <td className="py-3 px-4 flex items-center">
                    <DollarSign size={16} className="mr-1 text-green-600" /> Cash
                  </td>
                  <td className="py-3 px-4 font-semibold">150 DH</td>
                  <td className="py-3 px-4">21/04/2026 18:30</td>
                  <td className="py-3 px-4">
                    <button className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                      <Printer size={14} />
                      <span>Facture</span>
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">#OP002</td>
                  <td className="py-3 px-4">#002</td>
                  <td className="py-3 px-4 flex items-center">
                    <CreditCard size={16} className="mr-1 text-blue-600" /> Carte
                  </td>
                  <td className="py-3 px-4 font-semibold">200 DH</td>
                  <td className="py-3 px-4">21/04/2026 18:45</td>
                  <td className="py-3 px-4">
                    <button className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                      <Printer size={14} />
                      <span>Facture</span>
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

export default Caisse
