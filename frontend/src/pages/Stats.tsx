import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, BarChart3, CalendarRange, RefreshCw, TrendingUp } from 'lucide-react'
import { fetchAuthStatus } from '../lib/auth'
import { cn, formatCurrency } from '../lib/utils'
import { User } from '../types'

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
  const [period, setPeriod] = useState<'jour' | 'mois'>('mois')
  const navigate = useNavigate()

  const fetchStats = async () => {
    setLoading(true)
    const auth = await fetchAuthStatus()
    if (!auth.authenticated) {
      navigate('/login')
      return
    }
    if (!['admin', 'manager'].includes(auth.role)) {
      navigate('/dashboard')
      return
    }

    const response = await fetch('/api/statistiques/', { credentials: 'include' })
    const data = await response.json()
    setStats(data.statistiques ?? null)
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [navigate])

  const chartData = useMemo(() => {
    if (!stats) return []
    return period === 'jour' ? stats.ventes_par_jour : stats.ventes_par_mois
  }, [period, stats])

  const maxValue = Math.max(...chartData.map((item) => item.montant), 1)

  if (loading) {
    return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Chargement des statistiques...</div>
  }
  if (!stats) {
    return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Erreur de chargement.</div>
  }

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Statistiques de vente</h1>
            <p className="text-text-gray mt-2">Vue temps reel du chiffre d'affaires et des plats les plus performants.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex rounded-lg border border-card-light overflow-hidden">
              {(['jour', 'mois'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={cn(
                    'px-4 py-2 text-sm',
                    period === item ? 'bg-primary text-white' : 'bg-card text-text-gray hover:text-white',
                  )}
                >
                  {item === 'jour' ? '7 jours' : '6 mois'}
                </button>
              ))}
            </div>
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-card-light bg-card text-white hover:bg-card-light"
            >
              <RefreshCw size={16} />
              Rafraichir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between">
              <TrendingUp className="text-green-400" />
              <span className="text-xs text-text-gray">Aujourd'hui</span>
            </div>
            <p className="text-text-gray text-sm mt-4">Ventes du jour</p>
            <p className="text-white text-3xl font-bold mt-2">{formatCurrency(stats.gains_aujourdhui)}</p>
          </div>
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between">
              <BarChart3 className="text-blue-400" />
              <span className="text-xs text-text-gray">Global</span>
            </div>
            <p className="text-text-gray text-sm mt-4">Commandes payees</p>
            <p className="text-white text-3xl font-bold mt-2">{stats.nombre_commandes}</p>
          </div>
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between">
              <CalendarRange className="text-yellow-400" />
              <span className="text-xs text-text-gray">Moyenne</span>
            </div>
            <p className="text-text-gray text-sm mt-4">Ticket moyen</p>
            <p className="text-white text-3xl font-bold mt-2">{formatCurrency(stats.ticket_moyen)}</p>
          </div>
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between">
              <Award className="text-orange-400" />
              <span className="text-xs text-text-gray">Cumule</span>
            </div>
            <p className="text-text-gray text-sm mt-4">Total des gains</p>
            <p className="text-white text-3xl font-bold mt-2">{formatCurrency(stats.total_gains)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Evolution du chiffre d'affaires</h2>
                <p className="text-sm text-text-gray mt-1">
                  {period === 'jour' ? 'Suivi quotidien des 7 derniers jours.' : 'Synthese mensuelle glissante sur 6 mois.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-3 items-end h-72 rounded-2xl bg-card-light p-5">
              {chartData.map((item) => (
                <div key={item.date ?? item.mois} className="flex flex-col items-center justify-end h-full">
                  <span className="text-[11px] text-text-gray mb-2">{formatCurrency(item.montant)}</span>
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-primary to-secondary transition-opacity hover:opacity-80"
                    style={{ height: `${Math.max(24, (item.montant / maxValue) * 190)}px` }}
                  />
                  <p className="mt-3 text-xs text-white">
                    {'date' in item
                      ? new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                      : item.mois}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-card-light p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Plats les plus vendus</h2>
            <div className="space-y-3">
              {stats.plats_plus_vendus.map((plat, index) => (
                <div key={plat.plat_id} className="rounded-xl border border-card-light bg-card-light p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{plat.plat_nom}</p>
                      <p className="text-sm text-text-gray mt-1">{plat.quantite_vendue} vente(s)</p>
                    </div>
                    <span className="text-xs rounded-full px-3 py-1 bg-primary/20 text-primary">#{index + 1}</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-dark overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{
                        width: `${Math.max(
                          14,
                          (plat.quantite_vendue / Math.max(stats.plats_plus_vendus[0]?.quantite_vendue || 1, 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-text-gray mt-3">{formatCurrency(plat.montant_total)}</p>
                </div>
              ))}
              {stats.plats_plus_vendus.length === 0 && (
                <div className="rounded-xl border border-dashed border-card-light p-6 text-center text-text-gray">
                  Aucune vente payee sur la periode suivie.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats
