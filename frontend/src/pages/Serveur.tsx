import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock3, LogOut, Plus, Trash2, UtensilsCrossed, XCircle } from 'lucide-react'
import { fetchAuthStatus, logout } from '../lib/auth'
import { cn, formatCurrency, formatDateTime } from '../lib/utils'
import { Commande, Plat, TableSummary, User } from '../types'

const Serveur: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [tables, setTables] = useState<TableSummary[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [editingCommandeId, setEditingCommandeId] = useState<number | null>(null)
  const [newOrder, setNewOrder] = useState({
    type: 'sur_place_generique',
    table_id: '',
    nom_clt: '',
    adresse_liv: '',
    nombre_clients: 2,
  })
  const [panier, setPanier] = useState<Record<number, number>>({})
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    const auth = await fetchAuthStatus()
    if (!auth.authenticated) {
      navigate('/login')
      return
    }
    if (auth.role !== 'serveur') {
      navigate('/login')
      return
    }
    setUser(auth)

    const [tablesRes, commandesRes, platsRes] = await Promise.all([
      fetch('/api/tables/', { credentials: 'include' }),
      fetch('/api/commandes/', { credentials: 'include' }),
      fetch('/api/plats/', { credentials: 'include' }),
    ])
    const [tablesData, commandesData, platsData] = await Promise.all([
      tablesRes.json(),
      commandesRes.json(),
      platsRes.json(),
    ])
    setTables(tablesData.tables ?? [])
    setCommandes(commandesData.commandes ?? [])
    setPlats(platsData.plats ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = window.setInterval(loadData, 30000)
    return () => window.clearInterval(interval)
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const selectedItems = Object.entries(panier)
    .filter(([, quantity]) => quantity > 0)
    .map(([platId, quantity]) => ({ plat_id: Number(platId), quantite: quantity }))

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedItems.length) {
      setMessage('Ajoutez au moins un produit avant validation.')
      return
    }

    const payload = {
      nom_clt: newOrder.nom_clt || (newOrder.table_id ? `Table ${newOrder.table_id}` : 'Client comptoir'),
      type: newOrder.type,
      adresse_liv: newOrder.adresse_liv,
      table_id: newOrder.type === 'sur_place_generique' ? newOrder.table_id || null : null,
      plats: selectedItems,
    }

    const response = await fetch('/api/commandes/nouvelle/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok || !data.success) {
      setMessage(data.message || 'Erreur lors de la creation de la commande.')
      return
    }

    if (newOrder.type === 'sur_place_generique' && newOrder.table_id) {
      await fetch(`/api/tables/${newOrder.table_id}/assigner/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          commande_id: data.commande_id,
          nombre_clients: newOrder.nombre_clients,
        }),
      })
    }

    setMessage('Commande creee et transmise en cuisine.')
    setPanier({})
    setNewOrder({
      type: 'sur_place_generique',
      table_id: '',
      nom_clt: '',
      adresse_liv: '',
      nombre_clients: 2,
    })
    await loadData()
  }

  const updateCommandeStatus = async (commandeId: number, statut: 'servie' | 'annulee') => {
    const response = await fetch(`/api/commandes/${commandeId}/modifier-statut/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ statut }),
    })
    const data = await response.json()
    setMessage(data.message || 'Statut mis a jour.')
    await loadData()
  }

  const removeLine = async (lineId: number) => {
    const response = await fetch(`/api/lignes/${lineId}/supprimer/`, {
      method: 'POST',
      credentials: 'include',
    })
    const data = await response.json()
    setMessage(data.message || 'Ligne retiree de la commande.')
    await loadData()
  }

  const addDishToCommande = async (commandeId: number, platId: number) => {
    const response = await fetch(`/api/commandes/${commandeId}/ajouter-plat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plat_id: platId, quantite: 1 }),
    })
    const data = await response.json()
    setMessage(data.message || 'Plat ajoute a la commande.')
    await loadData()
  }

  const activeCommandes = useMemo(
    () => commandes.filter((commande) => !['payee', 'annulee'].includes(commande.status)),
    [commandes],
  )

  const historique = useMemo(
    () => commandes.filter((commande) => ['payee', 'annulee', 'servie'].includes(commande.status)),
    [commandes],
  )

  const availableTables = tables.filter((table) => table.statut === 'libre')

  if (loading) {
    return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Chargement...</div>
  }

  return (
    <div className="w-full min-h-screen bg-dark">
      <nav className="fixed w-full top-0 z-50 bg-dark border-b border-card-light">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between h-[80px]">
            <a className="flex items-center space-x-2 shrink-0" href="/dashboard">
              <img src="/logo.png" alt="Logo Restaurant" className="h-[120px] w-auto object-contain brightness-0 invert" />
            </a>
            <div className="flex items-center gap-4 text-white">
              <span className="text-sm">{user?.username} (Serveur)</span>
              <button onClick={handleLogout} className="hover:text-primary transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-[110px] px-4 pb-16">
        <div className="max-w-7xl mx-auto space-y-6">
          {message && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h1 className="text-3xl font-bold text-white mb-2">Pilotage salle & tables</h1>
              <p className="text-text-gray text-sm mb-6">Etat temps reel, capacite des tables et ticket associe.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      'rounded-xl border p-4',
                      table.statut === 'occupee'
                        ? 'border-red-500/25 bg-red-500/10'
                        : table.statut === 'reservee'
                          ? 'border-yellow-500/25 bg-yellow-500/10'
                          : 'border-green-500/25 bg-green-500/10',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Table {table.numero}</p>
                        <p className="text-sm text-text-gray mt-1">{table.nombre_clients}/{table.capacite} clients</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-dark/40 text-white">
                        {table.statut_display ?? table.statut}
                      </span>
                    </div>
                    {table.commande_actuelle && (
                      <div className="mt-4 rounded-lg bg-dark/30 p-3 text-sm">
                        <p className="text-white">Commande #{table.commande_actuelle.id}</p>
                        <p className="text-text-gray mt-1">{table.commande_actuelle.nom_clt}</p>
                        <p className="text-primary mt-1">{formatCurrency(table.commande_actuelle.montant_total)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-3xl font-bold text-white mb-2">Nouvelle commande</h2>
              <p className="text-text-gray text-sm mb-6">Sur place ou a emporter, avec panier editable et assignation de table.</p>

              <form onSubmit={createOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, type: 'sur_place_generique' })}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left',
                      newOrder.type === 'sur_place_generique'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-card-light bg-card-light text-text-gray',
                    )}
                  >
                    Sur place
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, type: 'a_emporter', table_id: '' })}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left',
                      newOrder.type === 'a_emporter'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-card-light bg-card-light text-text-gray',
                    )}
                  >
                    A emporter
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newOrder.nom_clt}
                    onChange={(event) => setNewOrder({ ...newOrder, nom_clt: event.target.value })}
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    placeholder="Nom du client"
                  />
                  {newOrder.type === 'sur_place_generique' ? (
                    <select
                      value={newOrder.table_id}
                      onChange={(event) => setNewOrder({ ...newOrder, table_id: event.target.value })}
                      className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                      required
                    >
                      <option value="">Selectionner une table libre</option>
                      {availableTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.numero} - {table.capacite} places
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newOrder.adresse_liv}
                      onChange={(event) => setNewOrder({ ...newOrder, adresse_liv: event.target.value })}
                      className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                      placeholder="Reference ou retrait comptoir"
                    />
                  )}
                </div>

                {newOrder.type === 'sur_place_generique' && (
                  <input
                    type="number"
                    min={1}
                    value={newOrder.nombre_clients}
                    onChange={(event) => setNewOrder({ ...newOrder, nombre_clients: Number(event.target.value) })}
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    placeholder="Nombre de clients"
                  />
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {plats.filter((plat) => plat.disponible).map((plat) => (
                    <div key={plat.id} className="flex items-center justify-between rounded-xl bg-card-light p-3">
                      <div>
                        <p className="text-white font-medium">{plat.nom}</p>
                        <p className="text-sm text-text-gray mt-1">{plat.categorie_nom}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-semibold">{formatCurrency(plat.prix)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPanier((current) => ({ ...current, [plat.id]: Math.max((current[plat.id] ?? 0) - 1, 0) }))}
                            className="w-8 h-8 rounded-lg bg-dark text-white"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-white">{panier[plat.id] ?? 0}</span>
                          <button
                            type="button"
                            onClick={() => setPanier((current) => ({ ...current, [plat.id]: (current[plat.id] ?? 0) + 1 }))}
                            className="w-8 h-8 rounded-lg bg-primary text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-card-light bg-card-light p-4">
                  <div className="flex items-center justify-between text-white">
                    <span>Total panier</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        plats.reduce((sum, plat) => sum + plat.prix * (panier[plat.id] ?? 0), 0),
                      )}
                    </span>
                  </div>
                </div>

                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90">
                  <Plus size={18} />
                  Valider la commande
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Commandes en cours</h2>
              <div className="space-y-4">
                {activeCommandes.map((commande) => (
                  <div key={commande.id} className="rounded-xl border border-card-light bg-card-light p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">Commande #{commande.id} - {commande.nom_clt}</p>
                        <p className="text-sm text-text-gray mt-1">
                          {commande.table ? `Table ${commande.table.numero}` : commande.type_display}
                          {' - '}
                          {commande.status_display}
                        </p>
                        <p className={cn(
                          'mt-2 text-sm flex items-center gap-2',
                          (commande.duree_service ?? 0) > 15 ? 'text-red-300' : 'text-text-gray',
                        )}>
                          <Clock3 size={14} />
                          {commande.duree_formatee ?? '0 min'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-semibold">{formatCurrency(commande.montant_total)}</p>
                        <button
                          onClick={() => setEditingCommandeId(editingCommandeId === commande.id ? null : commande.id)}
                          className="text-sm text-white mt-2 hover:text-primary"
                        >
                          {editingCommandeId === commande.id ? 'Fermer' : 'Modifier'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {commande.lignes.map((ligne) => (
                        <div key={ligne.id} className="flex items-center justify-between rounded-lg bg-dark/30 px-3 py-2">
                          <div>
                            <p className="text-white text-sm">{ligne.plat_nom}</p>
                            <p className="text-xs text-text-gray mt-1">x{ligne.quantite}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-primary text-sm">{formatCurrency(ligne.montant_ligne)}</span>
                            {commande.status !== 'servie' && (
                              <button onClick={() => removeLine(ligne.id)} className="text-red-300 hover:text-red-200">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {editingCommandeId === commande.id && commande.status !== 'servie' && (
                      <div className="mt-4 space-y-2 rounded-xl border border-card-light p-3">
                        <p className="text-sm font-medium text-white">Ajouter un plat</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {plats.filter((plat) => plat.disponible).slice(0, 8).map((plat) => (
                            <button
                              key={plat.id}
                              type="button"
                              onClick={() => addDishToCommande(commande.id, plat.id)}
                              className="inline-flex items-center justify-between rounded-lg bg-card-light border border-card-light px-3 py-2 text-sm text-white"
                            >
                              <span>{plat.nom}</span>
                              <UtensilsCrossed size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => updateCommandeStatus(commande.id, 'servie')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 text-green-300 hover:bg-green-500/25"
                      >
                        <CheckCircle2 size={16} />
                        Marquer servie
                      </button>
                      <button
                        onClick={() => updateCommandeStatus(commande.id, 'annulee')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                      >
                        <XCircle size={16} />
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
                {activeCommandes.length === 0 && (
                  <div className="rounded-xl border border-dashed border-card-light p-6 text-center text-text-gray">
                    Aucune commande active.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Historique & transmission caisse</h2>
              <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
                {historique.map((commande) => (
                  <div key={commande.id} className="rounded-xl border border-card-light bg-card-light p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">#{commande.id} - {commande.nom_clt}</p>
                        <p className="text-sm text-text-gray mt-1">{formatDateTime(commande.date_creation)}</p>
                        <p className="text-sm text-text-gray mt-1">
                          {commande.table ? `Table ${commande.table.numero}` : commande.type_display}
                        </p>
                      </div>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs',
                        commande.status === 'payee'
                          ? 'bg-green-500/15 text-green-300'
                          : commande.status === 'servie'
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-red-500/15 text-red-300',
                      )}>
                        {commande.status_display}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {commande.lignes.map((ligne) => (
                        <p key={ligne.id} className="text-sm text-text-gray">
                          {ligne.plat_nom} x{ligne.quantite}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {historique.length === 0 && (
                  <div className="rounded-xl border border-dashed border-card-light p-6 text-center text-text-gray">
                    Aucun historique disponible.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Serveur
