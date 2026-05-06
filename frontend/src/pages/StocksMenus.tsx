import React from 'react'
import { Plus, Edit, Trash2, AlertTriangle, Check } from 'lucide-react'

const StocksMenus: React.FC = () => {
  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Stocks & Menus</h1>

        <div className="bg-card rounded-xl shadow-lg p-6 mb-6 border border-card-light">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gestion du menu</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
              <Plus size={16} />
              <span>Ajouter un plat</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-card-light">
                  <th className="text-left py-3 px-4 font-semibold text-white">Nom</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Catégorie</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Prix</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Disponible</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">Thé à la menthe</td>
                  <td className="py-3 px-4 text-white">Boissons</td>
                  <td className="py-3 px-4 font-semibold text-white">20 DH</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Oui</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">Brochettes de viande hachée</td>
                  <td className="py-3 px-4 text-white">Plats principaux</td>
                  <td className="py-3 px-4 font-semibold text-white">45 DH</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Oui</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 mb-6 border border-card-light">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gestion des stocks</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
              <Plus size={16} />
              <span>Ajouter un article</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-card-light">
                  <th className="text-left py-3 px-4 font-semibold text-white">Article</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Quantité</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Unité</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Seuil alerte</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">État</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">Thé vert</td>
                  <td className="py-3 px-4 text-white">5 kg</td>
                  <td className="py-3 px-4 text-white">kg</td>
                  <td className="py-3 px-4 text-white">2 kg</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      <Check size={12} className="mr-1" /> OK
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">Sucre</td>
                  <td className="py-3 px-4 text-white">1 kg</td>
                  <td className="py-3 px-4 text-white">kg</td>
                  <td className="py-3 px-4 text-white">3 kg</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                      <AlertTriangle size={12} className="mr-1" /> Alerte
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gestion des catégories</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Nouvelle catégorie</label>
              <input type="text" placeholder="Nom de la catégorie" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <input type="text" placeholder="Description de la catégorie" className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StocksMenus
