import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table2, ClipboardList, CheckCircle, X, Clock, LogOut, Plus, User as UserIcon, Menu } from 'lucide-react'
import { User as UserType } from '../types'

interface Table {
  id: number
  numero: string
  capacite: number
  statut: string
  statut_display: string
  nombre_clients: number
  commande_actuelle?: {
    id: number
    nom_clt: string
    status: string
    montant_total: number
  }
}

interface Commande {
  id: number
  type: string
  type_display: string
  nom_clt: string
  status: string
  status_display: string
  montant_total: number
  lignes: LigneCommande[]
  table?: Table
}

interface LigneCommande {
  id: number
  plat_id: number
  plat_nom: string
  quantite: number
  prix_unitaire: number
  montant_ligne: number
  statut?: string
}

interface Plat {
  id: number
  nom: string
  description: string
  prix: number
  categorie: string
  disponible: boolean
}

const Serveur: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null)
  const [activeTab, setActiveTab] = useState<'tables' | 'commandes'>('tables')
  const [tables, setTables] = useState<Table[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showNewOrderForm, setShowNewOrderForm] = useState(false)
  const [newOrder, setNewOrder] = useState({
    table_id: '',
    nom_clt: '',
    nombre_clients: 2
  })
  const [commandesServies, setCommandesServies] = useState<Set<number>>(new Set())
  const [commandesAnnulees, setCommandesAnnulees] = useState<Set<number>>(new Set())
  const [plats, setPlats] = useState<Plat[]>([])
  const [selectedPlats, setSelectedPlats] = useState<{[key: number]: number}>({})
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: UserType) => {
        if (data.authenticated) {
          if (data.role !== 'serveur') {
            navigate('/login')
            return
          }
          setUser(data)
          fetchData()
        } else {
          navigate('/login')
        }
      })
  }, [navigate])

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/tables/', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/commandes/', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/plats/', { credentials: 'include' }).then(r => r.json())
    ]).then(([tablesData, commandesData, platsData]) => {
      setTables(tablesData.tables || [])
      setCommandes(commandesData.commandes || [])
      setPlats(platsData.plats || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const handleLogout = () => {
    fetch('/api/auth/logout/', {
      method: 'POST',
      credentials: 'include'
    }).then(() => navigate('/login'))
  }

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault()
    const platIds = Object.keys(selectedPlats)
      .filter(id => selectedPlats[parseInt(id)] > 0)
      .map(id => parseInt(id))
    
    fetch('/api/commandes/nouvelle/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nom_clt: newOrder.nom_clt,
        type: 'sur_place',
        table_id: newOrder.table_id,
        plats: platIds.map(id => ({
          plat_id: id,
          quantite: selectedPlats[id]
        }))
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (newOrder.table_id) {
            fetch(`/api/tables/${newOrder.table_id}/assigner/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                commande_id: data.commande_id,
                nombre_clients: newOrder.nombre_clients
              })
            }).then(() => {
              setShowNewOrderForm(false)
              setNewOrder({ table_id: '', nom_clt: '', nombre_clients: 2 })
              setSelectedPlats({})
              fetchData()
            })
          }
        }
      })
  }

  if (loading) {
    return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Chargement...</div>
  }

  const marquerServi = (cmdId: number) => {
    setCommandesServies(prev => new Set(prev).add(cmdId))
    setCommandesAnnulees(prev => {
      const next = new Set(prev)
      next.delete(cmdId)
      return next
    })
  }

  const annulerCommande = (cmdId: number) => {
    setCommandesAnnulees(prev => new Set(prev).add(cmdId))
    setCommandesServies(prev => {
      const next = new Set(prev)
      next.delete(cmdId)
      return next
    })
  }

  const supprimerHistorique = () => {
    setCommandesServies(new Set())
    setCommandesAnnulees(new Set())
  }

  const commandesEnCours = commandes.filter(c =>
    c.status !== 'payee' && !commandesServies.has(c.id) && !commandesAnnulees.has(c.id)
  )
  // Historique: commandes servies et annulées par le serveur
  const commandesHistory = commandes.filter(c => commandesServies.has(c.id) || commandesAnnulees.has(c.id))

  return (
    <div className="w-full min-h-screen bg-dark">
      <nav className="fixed w-full top-0 z-50 bg-dark">
        <div className="max-w-[1440px] mx-auto px-2">
          <div className="flex items-center justify-between h-[80px]">
            <a className="flex items-center space-x-2 shrink-0" href="/dashboard">
              <img src="/logo.png" alt="Logo Restaurant" className="h-[160px] w-auto object-contain brightness-0 invert" />
            </a>
            <div className="hidden md:flex items-center space-x-3 shrink-0">
              <div className="flex items-center space-x-2 text-white">
                <UserIcon size={18} />
                <span className="text-sm">{user?.username} (Serveur)</span>
                <button 
                  onClick={handleLogout}
                  className="ml-2 text-white hover:text-primary transition-colors" 
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
            <button className="md:hidden text-white">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-[100px] p-6">
        <div className="flex gap-6">
          {/* Left side - Tables */}
          <div className="w-1/2 bg-card rounded-xl p-6 border border-card-light">
            <h2 className="text-2xl font-bold text-white mb-6">Visuel Global des Tables</h2>
            
            {/* Tables Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {tables.map((table) => {
                // Forcer la table 1 a etre libre
                const isTable1 = table.numero === '1'
                const statut = isTable1 ? 'libre' : table.statut
                const nombre_clients = isTable1 ? 0 : table.nombre_clients
                const statut_display = isTable1 ? 'Libre' : table.statut_display
                return (
                  <div
                    key={table.id}
                    className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
                      statut === 'libre' ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' :
                      statut === 'occupee' ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' :
                      'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
                    }`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">Table {table.numero}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statut === 'libre' ? 'bg-green-500/20 text-green-400' :
                        statut === 'occupee' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {statut_display}
                      </span>
                    </div>
                    <div className="text-sm text-text-gray mb-2">
                      <p>Capacite: {table.capacite} places</p>
                      <p>Clients: {nombre_clients}/{table.capacite}</p>
                    </div>
                    {/* Places visualization */}
                    <div className="grid grid-cols-4 gap-1">
                      {Array.from({ length: table.capacite }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-6 rounded ${
                            i < nombre_clients ? 'bg-red-500' : 'bg-green-500/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* New Order Card at bottom */}
            <div className="bg-card-light rounded-xl p-6 border border-card-light">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Ajouter une Commande</h3>
                <button
                  onClick={() => setShowNewOrderForm(!showNewOrderForm)}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  <Plus className="mr-2" size={18} />
                  {showNewOrderForm ? 'Annuler' : 'Nouvelle Commande'}
                </button>
              </div>

              {showNewOrderForm && (
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newOrder.table_id}
                      onChange={e => setNewOrder({...newOrder, table_id: e.target.value})}
                      className="px-4 py-2 bg-card border border-card-light rounded-lg text-white"
                      required
                    >
                      <option value="">Selectionner une table</option>
                      {tables.filter(t => t.statut === 'libre' || t.numero === '1').map(t => (
                        <option key={t.id} value={t.id}>Table {t.numero} (Cap: {t.capacite})</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Nom du client"
                      value={newOrder.nom_clt}
                      onChange={e => setNewOrder({...newOrder, nom_clt: e.target.value})}
                      className="px-4 py-2 bg-card border border-card-light rounded-lg text-white"
                      required
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Nombre de clients"
                    value={newOrder.nombre_clients}
                    onChange={e => setNewOrder({...newOrder, nombre_clients: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-card border border-card-light rounded-lg text-white"
                    min="1"
                    max={newOrder.table_id ? tables.find(t => t.id === parseInt(newOrder.table_id))?.capacite || 10 : 10}
                  />
                  
                  {/* Sélection des plats */}
                  <div className="space-y-2">
                    <label className="text-white font-medium">Sélectionner les plats:</label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {plats.filter(p => p.disponible).length === 0 ? (
                        <p className="text-text-gray text-sm">Aucun plat disponible</p>
                      ) : (
                        plats.filter(p => p.disponible).map(plat => (
                        <div key={plat.id} className="flex items-center justify-between bg-card-light p-2 rounded">
                          <div className="flex-1">
                            <span className="text-white text-sm">{plat.nom}</span>
                            <span className="text-primary text-xs ml-2">{plat.prix.toFixed(2)} DH</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const current = selectedPlats[plat.id] || 0
                                if (current > 0) {
                                  setSelectedPlats({...selectedPlats, [plat.id]: current - 1})
                                }
                              }}
                              className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="text-white w-8 text-center">{selectedPlats[plat.id] || 0}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlats({...selectedPlats, [plat.id]: (selectedPlats[plat.id] || 0) + 1})
                              }}
                              className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                  >
                    Creer la commande
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right side - Commandes & Historique */}
          <div className="w-1/2 bg-card rounded-xl p-6 border border-card-light">
            <h2 className="text-2xl font-bold text-white mb-6">Commandes Recentes & Historique</h2>
            
            {/* Commandes en cours */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Commandes en Cours ({commandesEnCours.length})</h3>
              <div className="space-y-4">
                {commandesEnCours.map(cmd => (
                  <div key={cmd.id} className="bg-card-light rounded-xl p-4 border border-card-light">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">Commande #{cmd.id} - {cmd.nom_clt}</h4>
                        {cmd.table && <p className="text-sm text-primary">Table {cmd.table.numero}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cmd.status === 'en_cours' ? 'bg-yellow-500/20 text-yellow-400' :
                        cmd.status === 'prete' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {cmd.status_display}
                      </span>
                    </div>
                    
                    {cmd.lignes && (
                      <div className="mt-3 space-y-1">
                        {cmd.lignes.map((ligne, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-text-gray">{ligne.plat_nom} x{ligne.quantite}</span>
                            <span className="text-primary">{ligne.montant_ligne.toFixed(2)} DH</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-card-light flex justify-end">
                      {/* Boutons d'action à droite */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => marquerServi(cmd.id)}
                          className="p-2 text-green-400 hover:text-green-300 transition-colors"
                          title="Marquer comme servi"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => annulerCommande(cmd.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Annuler"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {commandesEnCours.length === 0 && (
                <p className="text-text-gray text-center py-8">Aucune commande en cours</p>
              )}
            </div>

            {/* Historique */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Historique ({commandesHistory.length})</h3>
                {commandesHistory.length > 0 && (
                  <button
                    onClick={supprimerHistorique}
                    className="flex items-center px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                    title="Supprimer l'historique"
                  >
                    <X size={14} className="mr-1" />
                    Supprimer
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {commandesHistory.slice(0, 10).map(cmd => (
                  <div key={cmd.id} className="bg-card-light rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">#{cmd.id}</span>
                          <span className="text-text-gray">- {cmd.nom_clt}</span>
                        </div>
                        {cmd.table && <p className="text-sm text-text-gray mt-1">Table {cmd.table.numero}</p>}
                        {/* Afficher les plats */}
                        {cmd.lignes && cmd.lignes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {cmd.lignes.map((ligne, idx) => (
                              <div key={idx} className="text-xs text-text-gray">
                                • {ligne.plat_nom} x{ligne.quantite}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Statut */}
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          commandesServies.has(cmd.id) ? 'bg-green-500/20 text-green-400' :
                          commandesAnnulees.has(cmd.id) ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {commandesServies.has(cmd.id) ? 'Servi' :
                           commandesAnnulees.has(cmd.id) ? 'Annulé' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {commandesHistory.length === 0 && (
                <p className="text-text-gray text-center py-8">Aucune commande dans l'historique</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Serveur
