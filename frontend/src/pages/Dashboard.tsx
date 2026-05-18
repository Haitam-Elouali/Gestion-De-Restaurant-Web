import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Calendar, Clock3, LayoutGrid, Package, RefreshCw, ShoppingBag } from 'lucide-react'
import { fetchAuthStatus } from '../lib/auth'
import { formatCurrency } from '../lib/utils'
import { Commande, TableSummary, User } from '../types'

interface DashboardStats {
  total_gains: number
  gains_aujourdhui: number
  nombre_commandes: number
  ticket_moyen: number
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [tables, setTables] = useState<TableSummary[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      const auth = await fetchAuthStatus()
      if (!auth.authenticated) {
        navigate('/login')
        return
      }
      if (auth.role === 'admin') {
        navigate('/admin')
        return
      }
      if (auth.role === 'serveur') {
        navigate('/serveur')
        return
      }
      if (auth.role === 'caissier') {
        navigate('/caisse')
        return
      }
      setUser(auth)

      const [statsRes, commandesRes, tablesRes] = await Promise.all([
        fetch('/api/statistiques/', { credentials: 'include' }),
        fetch('/api/commandes/', { credentials: 'include' }),
        fetch('/api/tables/', { credentials: 'include' }),
      ])

      const [statsData, commandesData, tablesData] = await Promise.all([
        statsRes.json(),
        commandesRes.json(),
        tablesRes.json(),
      ])

      setStats(statsData.statistiques ?? null)
      setCommandes(commandesData.commandes ?? [])
      setTables(tablesData.tables ?? [])
      setLastUpdated(new Date().toLocaleTimeString('fr-FR'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = window.setInterval(loadData, 30000)
    return () => window.clearInterval(interval)
  }, [navigate])

  if (loading) {
    return <div className="pt-32 px-4 min-h-screen bg-dark text-white">Chargement du tableau de bord...</div>
  }

  if (!user || !stats) {
    return <div className="pt-32 px-4 min-h-screen bg-dark text-white">Impossible de charger le tableau de bord.</div>
  }

  const commandesActives = commandes.filter((commande) => !['payee', 'annulee'].includes(commande.status))
  const tablesOccupees = tables.filter((table) => table.statut === 'occupee')
  const durees = commandesActives.map((commande) => commande.duree_service ?? 0)
  const dureeMoyenne = durees.length ? Math.round(durees.reduce((sum, value) => sum + value, 0) / durees.length) : 0

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Tableau de bord manager</h1>
            <p className="text-text-gray mt-2">
              KPIs du jour, commandes actives et activite de la salle.
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-card-light bg-card text-white hover:bg-card-light"
          >
            <RefreshCw size={16} />
            Rafraichir
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="text-green-400" />
              <span className="text-xs uppercase tracking-[0.2em] text-text-gray">Jour</span>
            </div>
            <p className="text-text-gray text-sm">Chiffre d'affaires</p>
            <p className="text-3xl font-bold text-white mt-2">{formatCurrency(stats.gains_aujourdhui)}</p>
          </div>
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-3">
              <ShoppingBag className="text-blue-400" />
              <span className="text-xs uppercase tracking-[0.2em] text-text-gray">Actif</span>
            </div>
            <p className="text-text-gray text-sm">Commandes en cours</p>
            <p className="text-3xl font-bold text-white mt-2">{commandesActives.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-3">
              <LayoutGrid className="text-orange-400" />
              <span className="text-xs uppercase tracking-[0.2em] text-text-gray">Salle</span>
            </div>
            <p className="text-text-gray text-sm">Tables occupees</p>
            <p className="text-3xl font-bold text-white mt-2">{tablesOccupees.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-3">
              <Clock3 className="text-yellow-400" />
              <span className="text-xs uppercase tracking-[0.2em] text-text-gray">Service</span>
            </div>
            <p className="text-text-gray text-sm">Duree moyenne</p>
            <p className="text-3xl font-bold text-white mt-2">{dureeMoyenne} min</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-white">Flux en direct</h2>
                <p className="text-text-gray text-sm mt-1">Mise a jour automatique toutes les 30 secondes.</p>
              </div>
              <span className="text-xs text-text-gray">Derniere MAJ: {lastUpdated}</span>
            </div>
            <div className="space-y-3">
              {commandesActives.slice(0, 6).map((commande) => (
                <div key={commande.id} className="rounded-xl border border-card-light bg-card-light p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">
                        Commande #{commande.id} - {commande.nom_clt}
                      </p>
                      <p className="text-sm text-text-gray mt-1">
                        {commande.table ? `Table ${commande.table.numero}` : commande.type_display}
                        {' - '}
                        {commande.status_display}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-semibold">{formatCurrency(commande.montant_total)}</p>
                      <p className="text-xs text-text-gray mt-1">{commande.duree_formatee ?? '0 min'}</p>
                    </div>
                  </div>
                </div>
              ))}
              {commandesActives.length === 0 && (
                <div className="rounded-xl border border-dashed border-card-light p-6 text-text-gray text-center">
                  Aucune commande active pour le moment.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Acces rapide</h2>
              <div className="grid grid-cols-1 gap-3">
                <Link to="/stocks-menus" className="rounded-xl border border-card-light bg-card-light p-4 hover:border-primary transition-colors">
                  <div className="flex items-center gap-3 text-white">
                    <Package className="text-primary" />
                    <div>
                      <p className="font-semibold">Stocks & Menus</p>
                      <p className="text-sm text-text-gray">CRUD produits, ingredients et disponibilite</p>
                    </div>
                  </div>
                </Link>
                <Link to="/reservations" className="rounded-xl border border-card-light bg-card-light p-4 hover:border-primary transition-colors">
                  <div className="flex items-center gap-3 text-white">
                    <Calendar className="text-primary" />
                    <div>
                      <p className="font-semibold">Reservations</p>
                      <p className="text-sm text-text-gray">Planning client et capacite des tables</p>
                    </div>
                  </div>
                </Link>
                <Link to="/statistiques" className="rounded-xl border border-card-light bg-card-light p-4 hover:border-primary transition-colors">
                  <div className="flex items-center gap-3 text-white">
                    <BarChart3 className="text-primary" />
                    <div>
                      <p className="font-semibold">Statistiques detaillees</p>
                      <p className="text-sm text-text-gray">Plats vendus, CA et evolution mensuelle</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Salle</h2>
              <div className="space-y-3">
                {tables.slice(0, 6).map((table) => (
                  <div key={table.id} className="flex items-center justify-between rounded-xl bg-card-light p-3">
                    <div>
                      <p className="text-white font-medium">Table {table.numero}</p>
                      <p className="text-xs text-text-gray">
                        {table.nombre_clients}/{table.capacite} clients
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      table.statut === 'occupee'
                        ? 'bg-red-500/15 text-red-300'
                        : table.statut === 'reservee'
                          ? 'bg-yellow-500/15 text-yellow-300'
                          : 'bg-green-500/15 text-green-300'
                    }`}>
                      {table.statut_display ?? table.statut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
