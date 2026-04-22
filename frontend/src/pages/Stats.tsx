import React from 'react'
import { TrendingUp, ShoppingBag, DollarSign, LayoutGrid, Award, PieChart } from 'lucide-react'

const Stats: React.FC = () => {
  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Tableau de bord & Statistiques</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-green-600" size={32} />
              <span className="text-sm text-gray-500">Aujourd'hui</span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Ventes du jour</p>
            <p className="text-3xl font-bold text-green-600">4,800 DH</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="text-blue-600" size={32} />
              <span className="text-sm text-gray-500">Aujourd'hui</span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Commandes du jour</p>
            <p className="text-3xl font-bold text-blue-600">32</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-purple-600" size={32} />
              <span className="text-sm text-gray-500">Moyenne</span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Moyenne commande</p>
            <p className="text-3xl font-bold text-purple-600">150 DH</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <LayoutGrid className="text-orange-600" size={32} />
              <span className="text-sm text-gray-500">Actuel</span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Tables occupées</p>
            <p className="text-3xl font-bold text-orange-600">6/8</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Plats les plus vendus</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rang</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Plat</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantité</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full font-bold">1</span>
                    </td>
                    <td className="py-3 px-4">Brochettes de viande hachée</td>
                    <td className="py-3 px-4">Plats principaux</td>
                    <td className="py-3 px-4 font-semibold">45</td>
                    <td className="py-3 px-4 font-semibold">2,025 DH</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-800 rounded-full font-bold">2</span>
                    </td>
                    <td className="py-3 px-4">Thé à la menthe</td>
                    <td className="py-3 px-4">Boissons</td>
                    <td className="py-3 px-4 font-semibold">38</td>
                    <td className="py-3 px-4 font-semibold">760 DH</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 rounded-full font-bold">3</span>
                    </td>
                    <td className="py-3 px-4">Couscous royal</td>
                    <td className="py-3 px-4">Plats principaux</td>
                    <td className="py-3 px-4 font-semibold">22</td>
                    <td className="py-3 px-4 font-semibold">1,980 DH</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Répartition par type de commande</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <PieChart className="mx-auto mb-2 text-green-600" size={32} />
                <p className="text-gray-600 text-sm mb-1">Sur place</p>
                <p className="text-3xl font-bold text-green-600">65%</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <PieChart className="mx-auto mb-2 text-blue-600" size={32} />
                <p className="text-gray-600 text-sm mb-1">À emporter</p>
                <p className="text-3xl font-bold text-blue-600">25%</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <PieChart className="mx-auto mb-2 text-purple-600" size={32} />
                <p className="text-gray-600 text-sm mb-1">Livraison</p>
                <p className="text-3xl font-bold text-purple-600">10%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Évolution des gains mensuels</h2>
          <div className="flex items-end justify-around h-64 bg-gray-50 rounded-xl p-6">
            {[
              { mois: 'Jan', valeur: 80 },
              { mois: 'Fév', valeur: 110 },
              { mois: 'Mar', valeur: 140 },
              { mois: 'Avr', valeur: 170 }
            ].map((item, i) => (
              <div key={item.mois} className="flex flex-col items-center">
                <div 
                  className="w-16 bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${item.valeur}px` }}
                ></div>
                <p className="mt-3 font-semibold text-gray-700">{item.mois}</p>
                <p className="text-sm text-gray-500">{item.valeur * 100} DH</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats
