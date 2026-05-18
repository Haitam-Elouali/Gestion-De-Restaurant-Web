import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, User as UserIcon, Shield, CreditCard, CheckCircle, Crown } from 'lucide-react'
import { User } from '../types'

interface Employe {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  type: string
}

const Users: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [employes, setEmployes] = useState<{managers: Employe[], serveurs: Employe[], caissiers: Employe[], admins: Employe[]}>({
    managers: [],
    serveurs: [],
    caissiers: [],
    admins: []
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Champs du formulaire
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    type: 'serveur',
    salaire_mensuel: 0
  })

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          setUser(data)
        }
      })
    
    fetchEmployes()
  }, [])

  const fetchEmployes = () => {
    fetch('/api/employes/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEmployes({
          managers: data.managers || [],
          serveurs: data.serveurs || [],
          caissiers: data.caissiers || [],
          admins: data.admins || []
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    // RG02: Seul l'admin peut créer des managers
    if (formData.type === 'manager' && user?.role !== 'admin') {
      setMessage('❌ Seul l\'administrateur peut créer des comptes Manager (RG02)')
      return
    }

    fetch('/api/employes/create/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('✅ ' + data.message)
          setFormData({ username: '', password: '', nom: '', prenom: '', email: '', telephone: '', type: 'serveur', salaire_mensuel: 0 })
          fetchEmployes()
        } else {
          setMessage('❌ ' + data.message)
        }
      })
  }

  const handleDelete = (id: number, type: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return

    // RG02: Seul l'admin peut supprimer des managers
    if (type === 'manager' && user?.role !== 'admin') {
      setMessage('❌ Seul l\'administrateur peut supprimer des comptes Manager (RG02)')
      return
    }

    fetch(`/api/employes/${id}/delete/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessage('✅ ' + data.message)
          fetchEmployes()
        } else {
          setMessage('❌ ' + data.message)
        }
      })
  }

  // RG02: Seul l'admin voit l'option Manager dans le select
  const canCreateManager = user?.role === 'admin'
  const canSeeManagers = user?.role === 'admin'

  if (loading) return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Chargement...</div>

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Gestion des Utilisateurs</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <h2 className="text-2xl font-bold mb-4 text-white">Créer un nouvel utilisateur</h2>
            {message && (
              <div className={`mb-4 p-3 rounded ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nom d'utilisateur</label>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Mot de passe" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nom</label>
                <input 
                  type="text" 
                  placeholder="Nom de famille" 
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Prénom</label>
                <input 
                  type="text" 
                  placeholder="Prénom" 
                  value={formData.prenom}
                  onChange={e => setFormData({...formData, prenom: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Téléphone</label>
                <input 
                  type="tel" 
                  placeholder="+212 6 XX XX XX XX" 
                  value={formData.telephone}
                  onChange={e => setFormData({...formData, telephone: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Rôle</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white"
                >
                  <option value="serveur">Serveur</option>
                  <option value="caissier">Caissier</option>
                  {/* RG02: Seul l'admin voit l'option Manager */}
                  {canCreateManager && <option value="manager">Manager</option>}
                  {canCreateManager && <option value="admin">Administrateur</option>}
                </select>
              </div>
              <button type="submit" className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity w-full">
                <Plus size={18} />
                <span>Créer l'utilisateur</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* RG02: Seul l'administrateur peut voir les managers */}
            {canSeeManagers && (
              <>
                <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
                  <div className="flex items-center mb-4">
                    <Shield className="text-purple-400 mr-2" size={24} />
                    <h2 className="text-2xl font-bold text-white">Managers</h2>
                    <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Visible uniquement par Admin</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-card-light">
                          <th className="text-left py-3 px-4 font-semibold text-white">Nom</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Prénom</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Téléphone</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employes.managers.map(m => (
                          <tr key={m.id} className="border-b border-card-light hover:bg-card-light">
                            <td className="py-3 px-4 text-white">{m.nom}</td>
                            <td className="py-3 px-4 text-white">{m.prenom}</td>
                            <td className="py-3 px-4 text-white">{m.email}</td>
                            <td className="py-3 px-4 text-white">{m.telephone}</td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(m.id, 'manager')}
                                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {employes.managers.length === 0 && (
                          <tr><td colSpan={5} className="py-4 text-text-gray text-center">Aucun manager</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section Admin - visible uniquement par les admins */}
                <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
                  <div className="flex items-center mb-4">
                    <Crown className="text-yellow-400 mr-2" size={24} />
                    <h2 className="text-2xl font-bold text-white">Administrateurs</h2>
                    <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Visible uniquement par Admin</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-card-light">
                          <th className="text-left py-3 px-4 font-semibold text-white">Nom</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Prénom</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-white">Téléphone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employes.admins.map(a => (
                          <tr key={a.id} className="border-b border-card-light hover:bg-card-light">
                            <td className="py-3 px-4 text-white">{a.nom}</td>
                            <td className="py-3 px-4 text-white">{a.prenom}</td>
                            <td className="py-3 px-4 text-white">{a.email}</td>
                            <td className="py-3 px-4 text-white">{a.telephone}</td>
                          </tr>
                        ))}
                        {employes.admins.length === 0 && (
                          <tr><td colSpan={4} className="py-4 text-text-gray text-center">Aucun administrateur</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
              <div className="flex items-center mb-4">
                <UserIcon className="text-blue-400 mr-2" size={24} />
                <h2 className="text-2xl font-bold text-white">Serveurs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-card-light">
                      <th className="text-left py-3 px-4 font-semibold text-white">Nom</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Prénom</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Téléphone</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employes.serveurs.map(s => (
                      <tr key={s.id} className="border-b border-card-light hover:bg-card-light">
                        <td className="py-3 px-4 text-white">{s.nom}</td>
                        <td className="py-3 px-4 text-white">{s.prenom}</td>
                        <td className="py-3 px-4 text-white">{s.email}</td>
                        <td className="py-3 px-4 text-white">{s.telephone}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id, 'serveur')}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employes.serveurs.length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-text-gray text-center">Aucun serveur</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
              <div className="flex items-center mb-4">
                <CreditCard className="text-green-400 mr-2" size={24} />
                <h2 className="text-2xl font-bold text-white">Caissiers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-card-light">
                      <th className="text-left py-3 px-4 font-semibold text-white">Nom</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Prénom</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Téléphone</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employes.caissiers.map(c => (
                      <tr key={c.id} className="border-b border-card-light hover:bg-card-light">
                        <td className="py-3 px-4 text-white">{c.nom}</td>
                        <td className="py-3 px-4 text-white">{c.prenom}</td>
                        <td className="py-3 px-4 text-white">{c.email}</td>
                        <td className="py-3 px-4 text-white">{c.telephone}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(c.id, 'caissier')}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employes.caissiers.length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-text-gray text-center">Aucun caissier</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Users
