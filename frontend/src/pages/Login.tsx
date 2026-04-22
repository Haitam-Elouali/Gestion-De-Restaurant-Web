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
          // Rediriger selon le type de compte
          if (data.role === 'manager') {
            navigate('/dashboard')
          } else if (data.role === 'serveur') {
            navigate('/commandes')
          } else if (data.role === 'cuisinier') {
            navigate('/dashboard')
          } else {
            navigate('/dashboard')
          }
        } else {
          setError(data.message || 'Erreur de connexion.')
        }
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Connexion</h1>
          <p className="text-gray-600">Accédez à votre espace</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Entrez votre mot de passe"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Comptes de test: manager_test/manager123, serveur_test/serveur123, cuisinier_test/cuisinier123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
