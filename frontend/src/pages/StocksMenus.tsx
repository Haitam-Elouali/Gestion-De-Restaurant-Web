import React from 'react'
import { Plus, Edit, Trash2, AlertTriangle, Check } from 'lucide-react'

const StocksMenus: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Stocks & Menus</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestion du menu</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
              <Plus size={16} />
              <span>Ajouter un plat</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Prix</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Disponible</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">Thé à la menthe</td>
                  <td className="py-3 px-4">Boissons</td>
                  <td className="py-3 px-4 font-semibold">20 DH</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Oui</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">Brochettes de viande hachée</td>
                  <td className="py-3 px-4">Plats principaux</td>
                  <td className="py-3 px-4 font-semibold">45 DH</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Oui</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestion des stocks</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
              <Plus size={16} />
              <span>Ajouter un article</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Article</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantité</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Unité</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Seuil alerte</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">État</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">Thé vert</td>
                  <td className="py-3 px-4">5 kg</td>
                  <td className="py-3 px-4">kg</td>
                  <td className="py-3 px-4">2 kg</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <Check size={12} className="mr-1" /> OK
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">Sucre</td>
                  <td className="py-3 px-4">1 kg</td>
                  <td className="py-3 px-4">kg</td>
                  <td className="py-3 px-4">3 kg</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      <AlertTriangle size={12} className="mr-1" /> Alerte
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestion des catégories</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouvelle catégorie</label>
              <input type="text" placeholder="Nom de la catégorie" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input type="text" placeholder="Description de la catégorie" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StocksMenus
