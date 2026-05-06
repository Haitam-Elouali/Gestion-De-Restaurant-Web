import React, { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, DollarSign, LayoutGrid, Award, PieChart } from 'lucide-react'

interface Statistiques {
  total_gains: number
  gains_aujourdhui: number
  nombre_commandes: number
  ticket_moyen: number
  ventes_par_jour: { date: string; montant: number; commandes: number }[]
  ventes_par_mois: { mois: string; montant: number; commandes: number }[]
  plats_plus_vendus: { plat_id: number; plat_nom: string; quantite_vendue: number; montant_total: number }[]
}

const Stats: React.FC = () => {
  const [stats, setStats] = useState<Statistiques | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    fetch('/api/statistiques/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.statistiques) {
          setStats(data.statistiques)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Chargement des statistiques...</div>
  if (!stats) return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Erreur de chargement</div>

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Statistiques</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-green-400" size={32} />
              <span className="text-sm text-text-gray">Aujourd'hui</span>
            </div>
            <p className="text-text-gray text-sm mb-1">Ventes du jour</p>
            <p className="text-3xl font-bold text-green-400">{stats.gains_aujourdhui.toFixed(2)} DH</p>
          </div>
          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="text-blue-400" size={32} />
              <span className="text-sm text-text-gray">Total</span>
            </div>
            <p className="text-text-gray text-sm mb-1">Commandes payées</p>
            <p className="text-3xl font-bold text-blue-400">{stats.nombre_commandes}</p>
          </div>
          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-purple-400" size={32} />
              <span className="text-sm text-text-gray">Moyenne</span>
            </div>
            <p className="text-text-gray text-sm mb-1">Ticket moyen</p>
            <p className="text-3xl font-bold text-purple-400">{stats.ticket_moyen.toFixed(2)} DH</p>
          </div>
          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <div className="flex items-center justify-between mb-4">
              <LayoutGrid className="text-orange-400" size={32} />
              <span className="text-sm text-text-gray">Total</span>
            </div>
            <p className="text-text-gray text-sm mb-1">Total des gains</p>
            <p className="text-3xl font-bold text-orange-400">{stats.total_gains.toFixed(2)} DH</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <h2 className="text-2xl font-bold mb-4 text-white">Plats les plus vendus</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-card-light">
                    <th className="text-left py-3 px-4 font-semibold text-white">Rang</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Plat</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Quantité</th>
                    <th className="text-left py-3 px-4 font-semibold text-white">Revenu</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.plats_plus_vendus.map((plat, index) => (
                    <tr key={plat.plat_id} className="border-b border-card-light hover:bg-card-light">
                      <td className="py-3 px-4">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-500/20 text-gray-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">{plat.plat_nom}</td>
                      <td className="py-3 px-4 font-semibold text-white">{plat.quantite_vendue}</td>
                      <td className="py-3 px-4 font-semibold text-white">{plat.montant_total.toFixed(2)} DH</td>
                    </tr>
                  ))}
                  {stats.plats_plus_vendus.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-text-gray text-center">
                        Aucune vente enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <h2 className="text-2xl font-bold mb-4 text-white">Répartition par type de commande</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 rounded-xl p-6 text-center border border-green-500/30">
                <PieChart className="mx-auto mb-2 text-green-400" size={32} />
                <p className="text-text-gray text-sm mb-1">Sur place</p>
                <p className="text-3xl font-bold text-green-400">65%</p>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-6 text-center border border-blue-500/30">
                <PieChart className="mx-auto mb-2 text-blue-400" size={32} />
                <p className="text-text-gray text-sm mb-1">À emporter</p>
                <p className="text-3xl font-bold text-blue-400">25%</p>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-6 text-center border border-purple-500/30">
                <PieChart className="mx-auto mb-2 text-purple-400" size={32} />
                <p className="text-text-gray text-sm mb-1">Livraison</p>
                <p className="text-3xl font-bold text-purple-400">10%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
          <h2 className="text-2xl font-bold mb-6 text-white">Évolution des gains mensuels</h2>
          <div className="flex items-end justify-around h-64 bg-card-light rounded-xl p-6">
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
                <p className="mt-3 font-semibold text-white">{item.mois}</p>
                <p className="text-sm text-text-gray">{item.valeur * 100} DH</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats
