import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, User as UserIcon, Settings, Store, CreditCard, LogOut, UserPlus, Trash2, Edit, Plus, Minus, Menu } from 'lucide-react'
import { User } from '../types'

const Admin: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'comptes' | 'parametres'>('comptes')
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingEmploye, setEditingEmploye] = useState<any>(null)
  const [tables, setTables] = useState<any[]>([])
  const [showCreateTableForm, setShowCreateTableForm] = useState(false)
  const [newTable, setNewTable] = useState({ numero: '', capacite: 4 })
  const [employes, setEmployes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEmploye, setNewEmploye] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'serveur',
    username: '',
    password: '',
    salaire: ''
  })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          if (data.role !== 'admin') {
            navigate('/login')
            return
          }
          setUser(data)
          fetchEmployes()
          fetchTables()
        } else {
          navigate('/login')
        }
      })
  }, [navigate])

  const fetchEmployes = () => {
    fetch('/api/employes/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const allEmployes = [
          ...(data.admins || []).map((e: any) => ({ ...e, role: 'admin' })),
          ...(data.managers || []).map((e: any) => ({ ...e, role: 'manager' })),
          ...(data.serveurs || []).map((e: any) => ({ ...e, role: 'serveur' })),
          ...(data.caissiers || []).map((e: any) => ({ ...e, role: 'caissier' }))
        ]
        setEmployes(allEmployes)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const fetchTables = () => {
    fetch('/api/tables/admin/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setTables(data.tables || [])
      })
      .catch(() => setTables([]))
  }

  const handleLogout = () => {
    fetch('/api/auth/logout/', {
      method: 'POST',
      credentials: 'include'
    }).then(() => navigate('/login'))
  }

  const handleCreateEmploye = (e: React.FormEvent) => {
    e.preventDefault()
    fetch('/api/employes/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newEmploye)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('Employé créé avec succès !')
          setShowCreateForm(false)
          setNewEmploye({
            nom: '', prenom: '', email: '', telephone: '',
            role: 'serveur', username: '', password: '', salaire: ''
          })
          fetchEmployes()
          setTimeout(() => setMessage(''), 3000)
        } else {
          setMessage(data.message || 'Erreur lors de la création')
        }
      })
  }

  const handleDeleteEmploye = (id: number, role: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return
    fetch(`/api/employes/${id}/delete/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type: role })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('Employé supprimé avec succès !')
          fetchEmployes()
          setTimeout(() => setMessage(''), 3000)
        }
      })
  }

  const handleEditEmploye = (emp: any) => {
    setEditingEmploye(emp)
    setShowEditForm(true)
  }

  const handleUpdateEmploye = (e: React.FormEvent) => {
    e.preventDefault()
    fetch(`/api/employes/${editingEmploye.id}/update/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...editingEmploye, type: editingEmploye.role })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('Employé modifié avec succès !')
          setShowEditForm(false)
          setEditingEmploye(null)
          fetchEmployes()
          setTimeout(() => setMessage(''), 3000)
        } else {
          setMessage(data.message || 'Erreur lors de la modification')
        }
      })
  }

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault()
    fetch('/api/tables/admin/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newTable)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('Table créée avec succès !')
          setShowCreateTableForm(false)
          setNewTable({ numero: '', capacite: 4 })
          fetchTables()
          setTimeout(() => setMessage(''), 3000)
        } else {
          setMessage(data.message || 'Erreur lors de la création')
        }
      })
  }

  const handleDeleteTable = (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) return
    fetch(`/api/tables/admin/${id}/delete/`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('Table supprimée avec succès !')
          fetchTables()
          setTimeout(() => setMessage(''), 3000)
        }
      })
  }

  if (loading) {
    return <div className="min-h-screen bg-dark flex items-center justify-center text-white">Chargement...</div>
  }

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
                <span className="text-sm">{user?.username} (Admin)</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[100px] py-8">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('succès') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('comptes')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'comptes' ? 'bg-primary text-white' : 'bg-card text-text-gray hover:text-white'
            }`}
          >
            <Users className="mr-2" size={20} />
            Gestion des Comptes
          </button>
          <button
            onClick={() => setActiveTab('parametres')}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'parametres' ? 'bg-primary text-white' : 'bg-card text-text-gray hover:text-white'
            }`}
          >
            <Settings className="mr-2" size={20} />
            Configuration
          </button>
        </div>

        {/* Gestion des Comptes */}
        {activeTab === 'comptes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestion des Comptes</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <UserPlus className="mr-2" size={20} />
                {showCreateForm ? 'Annuler' : 'Nouveau Compte'}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-card rounded-xl p-6 border border-card-light">
                <h3 className="text-lg font-semibold text-white mb-4">Créer un nouveau compte</h3>
                <form onSubmit={handleCreateEmploye} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newEmploye.nom}
                    onChange={e => setNewEmploye({...newEmploye, nom: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={newEmploye.prenom}
                    onChange={e => setNewEmploye({...newEmploye, prenom: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmploye.email}
                    onChange={e => setNewEmploye({...newEmploye, email: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={newEmploye.telephone}
                    onChange={e => setNewEmploye({...newEmploye, telephone: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                  <select
                    value={newEmploye.role}
                    onChange={e => setNewEmploye({...newEmploye, role: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="serveur">Serveur</option>
                    <option value="caissier">Caissier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Salaire mensuel"
                    value={newEmploye.salaire}
                    onChange={e => setNewEmploye({...newEmploye, salaire: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={newEmploye.username}
                    onChange={e => setNewEmploye({...newEmploye, username: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={newEmploye.password}
                    onChange={e => setNewEmploye({...newEmploye, password: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Créer le compte
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showEditForm && editingEmploye && (
              <div className="bg-card rounded-xl p-6 border border-card-light">
                <h3 className="text-lg font-semibold text-white mb-4">Modifier le compte</h3>
                <form onSubmit={handleUpdateEmploye} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={editingEmploye.nom}
                    onChange={e => setEditingEmploye({...editingEmploye, nom: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={editingEmploye.prenom}
                    onChange={e => setEditingEmploye({...editingEmploye, prenom: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editingEmploye.email}
                    onChange={e => setEditingEmploye({...editingEmploye, email: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={editingEmploye.telephone}
                    onChange={e => setEditingEmploye({...editingEmploye, telephone: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                  <input
                    type="number"
                    placeholder="Salaire mensuel"
                    value={editingEmploye.salaire_mensuel}
                    onChange={e => setEditingEmploye({...editingEmploye, salaire_mensuel: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                  <div className="md:col-span-2 flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditForm(false); setEditingEmploye(null) }}
                      className="flex-1 px-4 py-2 bg-card-light text-white rounded-lg hover:bg-card transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-card rounded-xl overflow-hidden border border-card-light">
              <table className="w-full">
                <thead className="bg-card-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-gray uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-gray uppercase">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-gray uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-gray uppercase">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-gray uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-light">
                  {employes.map((emp) => (
                    <tr key={`emp-${emp.id}`} className="hover:bg-card-light">
                      <td className="px-6 py-4 text-white">{emp.nom} {emp.prenom}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                          emp.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                          emp.role === 'caissier' ? 'bg-green-500/20 text-green-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-gray">{emp.email}</td>
                      <td className="px-6 py-4 text-text-gray">{emp.telephone}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEmploye(emp)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmploye(emp.id, emp.role)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuration */}
        {activeTab === 'parametres' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-card-light">
              <div className="flex items-center mb-4">
                <Store className="text-primary mr-3" size={24} />
                <h3 className="text-lg font-semibold text-white">Paramètres du Restaurant</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-gray mb-1">Nom du restaurant</label>
                  <input
                    type="text"
                    defaultValue="KOOL.MA"
                    className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-gray mb-1">Adresse</label>
                  <textarea
                    defaultValue="123 Rue de Paris, Casablanca"
                    className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-gray mb-1">Téléphone</label>
                  <input
                    type="tel"
                    defaultValue="+212 5XX-XXXXXX"
                    className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                </div>
                <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-card-light">
              <div className="flex items-center mb-4">
                <CreditCard className="text-primary mr-3" size={24} />
                <h3 className="text-lg font-semibold text-white">Paramètres de la Caisse</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-gray mb-1">TVA (%)</label>
                  <input
                    type="number"
                    defaultValue="20"
                    className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-gray mb-1">Devise</label>
                  <select className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white">
                    <option value="MAD">MAD (Dirham Marocain)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-gray">Impression automatique des tickets</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white" />
                  </button>
                </div>
                <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                  Sauvegarder
                </button>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-card-light md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Store className="text-primary mr-3" size={24} />
                  <h3 className="text-lg font-semibold text-white">Gestion des Tables</h3>
                </div>
                <button
                  onClick={() => setShowCreateTableForm(!showCreateTableForm)}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="mr-2" size={20} />
                  Nouvelle Table
                </button>
              </div>

              {showCreateTableForm && (
                <form onSubmit={handleCreateTable} className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Numéro de table"
                    value={newTable.numero}
                    onChange={e => setNewTable({...newTable, numero: e.target.value})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Nombre de places"
                    value={newTable.capacite}
                    onChange={e => setNewTable({...newTable, capacite: parseInt(e.target.value)})}
                    className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    min="1"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Ajouter
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div key={`table-${table.id}`} className="bg-card-light rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Table {table.numero}</h4>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-text-gray">
                      <p>Places: {table.capacite}</p>
                      <p>Statut: {table.statut}</p>
                      <p>Clients: {table.nombre_clients}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
