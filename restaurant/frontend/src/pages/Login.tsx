import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User as UserIcon } from 'lucide-react'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })
      .then(res => res.json())
      .then((data: { success: boolean; message?: string; role?: string }) => {
        if (data.success) {
          // Rediriger selon le type de compte (3.2.1 et 3.3 du cahier des charges)
          if (data.role === 'admin') {
            navigate('/admin')  // Admin -> Panel d'administration
          } else if (data.role === 'manager') {
            navigate('/dashboard')  // Manager -> Dashboard limité
          } else if (data.role === 'serveur') {
            navigate('/serveur')  // Serveur -> Interface serveur (tables + commandes)
          } else if (data.role === 'caissier') {
            navigate('/caisse')  // Caissier -> Interface caisse uniquement
          } else {
            navigate('/dashboard')
          }
        } else {
          setError(data.message || 'Erreur de connexion.')
        }
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-card-light">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
          <p className="text-text-gray">Accédez à votre espace</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-gray" size={20} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray"
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-gray" size={20} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-text-gray"
                placeholder="Entrez votre mot de passe"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-text-gray text-sm">Comptes de test:</p>
          <div className="text-text-gray text-xs space-y-1">
            <p><span className="text-primary">Admin:</span> admin / admin123</p>
            <p><span className="text-primary">Manager:</span> manager / manager123</p>
            <p><span className="text-primary">Serveur:</span> serveur / serveur123</p>
            <p><span className="text-primary">Caissier:</span> caissier / caissier123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
