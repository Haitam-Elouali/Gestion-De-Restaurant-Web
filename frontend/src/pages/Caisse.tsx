import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, CreditCard, FileText, Printer, LogOut, User as UserIcon, Menu } from 'lucide-react'
import { User } from '../types'

const Caisse: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          if (data.role !== 'caissier') {
            navigate('/login')
            return
          }
          setUser(data)
        } else {
          navigate('/login')
        }
      })
  }, [navigate])

  const handleLogout = () => {
    fetch('/api/auth/logout/', {
      method: 'POST',
      credentials: 'include'
    }).then(() => navigate('/login'))
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
                <span className="text-sm">{user?.username} (Caissier)</span>
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

      <div className="pt-[100px] pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-white">Caisse & Facturation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <h2 className="text-2xl font-bold mb-4 text-white">Nouvelle opération de caisse</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Commande</label>
                <select className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white">
                  <option>Sélectionner une commande</option>
                  <option>#001 - Client Test - 150 DH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Type de paiement</label>
                <select className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white">
                  <option value="cash">Cash</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Montant</label>
                <input type="number" defaultValue={150} className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white" />
              </div>
              <button type="submit" className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity w-full">
                <DollarSign size={18} />
                <span>Valider le paiement</span>
              </button>
            </form>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
            <h2 className="text-2xl font-bold mb-4 text-white">État de la caisse</h2>
            <div className="space-y-4">
              <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
                <p className="text-text-gray text-sm mb-1">Total Cash</p>
                <p className="text-2xl font-bold text-green-400">2,500 DH</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/30">
                <p className="text-text-gray text-sm mb-1">Total Carte</p>
                <p className="text-2xl font-bold text-blue-400">1,800 DH</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/30">
                <p className="text-text-gray text-sm mb-1">Total Chèque</p>
                <p className="text-2xl font-bold text-purple-400">500 DH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg p-6 border border-card-light">
          <h2 className="text-2xl font-bold mb-4 text-white">Opérations récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-card-light">
                  <th className="text-left py-3 px-4 font-semibold text-white">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Commande</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Montant</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">#OP001</td>
                  <td className="py-3 px-4 text-white">#001</td>
                  <td className="py-3 px-4 flex items-center text-white">
                    <DollarSign size={16} className="mr-1 text-green-400" /> Cash
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">150 DH</td>
                  <td className="py-3 px-4 text-white">21/04/2026 18:30</td>
                  <td className="py-3 px-4">
                    <button className="flex items-center space-x-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                      <Printer size={14} />
                      <span>Facture</span>
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-card-light hover:bg-card-light">
                  <td className="py-3 px-4 text-white">#OP002</td>
                  <td className="py-3 px-4 text-white">#002</td>
                  <td className="py-3 px-4 flex items-center text-white">
                    <CreditCard size={16} className="mr-1 text-blue-400" /> Carte
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">200 DH</td>
                  <td className="py-3 px-4 text-white">21/04/2026 18:45</td>
                  <td className="py-3 px-4">
                    <button className="flex items-center space-x-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">
                      <Printer size={14} />
                      <span>Facture</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Caisse
