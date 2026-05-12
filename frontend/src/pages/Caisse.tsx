import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, DollarSign, FileText, LogOut, Printer, RefreshCw, Receipt, Wallet } from 'lucide-react'
import { fetchAuthStatus, logout } from '../lib/auth'
import { cn, formatCurrency, formatDateTime } from '../lib/utils'
import { Commande, Facture, User } from '../types'

const Caisse: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [selectedCommandeId, setSelectedCommandeId] = useState<number | ''>('')
  const [modePaiement, setModePaiement] = useState<'cash' | 'carte_bancaire' | 'cheque'>('cash')
  const [montantRecu, setMontantRecu] = useState('')
  const [referencePaiement, setReferencePaiement] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [facturePreview, setFacturePreview] = useState<Facture | null>(null)
  const [filterMode, setFilterMode] = useState('tous')
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    const auth = await fetchAuthStatus()
    if (!auth.authenticated) {
      navigate('/login')
      return
    }
    if (!['caissier', 'admin', 'manager'].includes(auth.role)) {
      navigate('/dashboard')
      return
    }
    setUser(auth)

    const [commandesRes, facturesRes] = await Promise.all([
      fetch('/api/commandes/', { credentials: 'include' }),
      fetch('/api/factures/', { credentials: 'include' }),
    ])

    const [commandesData, facturesData] = await Promise.all([
      commandesRes.json(),
      facturesRes.json(),
    ])

    setCommandes(commandesData.commandes ?? [])
    setFactures(facturesData.factures ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const commandesServies = useMemo(
    () => commandes.filter((commande) => ['servie', 'preparee'].includes(commande.status)),
    [commandes],
  )

  const selectedCommande = commandes.find((commande) => commande.id === selectedCommandeId)
  const montantCommande = selectedCommande?.montant_total ?? 0
  const renduMonnaie = modePaiement === 'cash' && montantRecu
    ? Number(montantRecu) - montantCommande
    : 0

  const today = new Date().toISOString().slice(0, 10)
  const facturesPayeesDuJour = factures.filter((facture) => facture.date_paiement?.slice(0, 10) === today && facture.statut === 'payee')
  const soldeTotal = facturesPayeesDuJour.reduce((sum, facture) => sum + facture.montant_total, 0)
  const totalCash = facturesPayeesDuJour
    .filter((facture) => facture.mode_paiement === 'cash')
    .reduce((sum, facture) => sum + facture.montant_total, 0)
  const totalCarte = facturesPayeesDuJour
    .filter((facture) => facture.mode_paiement === 'carte_bancaire')
    .reduce((sum, facture) => sum + facture.montant_total, 0)
  const totalCheque = facturesPayeesDuJour
    .filter((facture) => facture.mode_paiement === 'cheque')
    .reduce((sum, facture) => sum + facture.montant_total, 0)

  const facturesFiltrees = factures.filter((facture) => filterMode === 'tous' || facture.mode_paiement === filterMode)

  const ensureFacture = async (commandeId: number) => {
    const existing = factures.find((facture) => facture.commande_id === commandeId)
    if (existing) return existing

    const response = await fetch(`/api/factures/${commandeId}/creer/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement,
      }),
    })
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Impossible de creer la facture.')
    }

    await loadData()
    return data.facture_id
  }

  const fetchFacturePreview = async (factureId: number) => {
    const printResponse = await fetch(`/api/factures/${factureId}/imprimer/`, {
      credentials: 'include',
    })
    const printData = await printResponse.json()
    if (!printData.success) {
      throw new Error(printData.message || 'Impossible de charger la facture.')
    }

    const detail = factures.find((facture) => facture.id === factureId)
    if (detail) setFacturePreview(detail)
    return printData.html_content as string
  }

  const handlePrint = async (factureId: number) => {
    try {
      const html = await fetchFacturePreview(factureId)
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        setMessage("Autorisez l'ouverture de la fenetre d'impression.")
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur d'impression")
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCommande) {
      setMessage('Selectionnez une commande a encaisser.')
      return
    }
    if (modePaiement === 'cash' && Number(montantRecu) < montantCommande) {
      setMessage('Montant recu insuffisant pour un paiement cash.')
      return
    }

    try {
      const factureRef = await ensureFacture(selectedCommande.id)
      const factureId = typeof factureRef === 'number' ? factureRef : factureRef.id

      const response = await fetch(`/api/factures/${factureId}/valider-paiement/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reference_paiement: referencePaiement,
          montant_recu: montantRecu ? Number(montantRecu) : null,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Paiement invalide.')
      }

      setMessage(
        modePaiement === 'cash' && renduMonnaie > 0
          ? `Paiement valide. Rendu monnaie: ${formatCurrency(renduMonnaie)}.`
          : 'Paiement valide et ticket cloture.',
      )
      setSelectedCommandeId('')
      setMontantRecu('')
      setReferencePaiement('')
      await loadData()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors du paiement.')
    }
  }

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
            <div className="flex items-center space-x-3 text-white">
              <span className="text-sm">{user?.username} ({user?.role})</span>
              <button onClick={loadData} className="text-white hover:text-primary transition-colors" title="Rafraichir">
                <RefreshCw size={18} />
              </button>
              <button onClick={handleLogout} className="text-white hover:text-primary transition-colors" title="Deconnexion">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-[110px] pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {message && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">
              <div className="flex items-center gap-3 mb-6">
                <Receipt className="text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Paiement & cloture de ticket</h1>
                  <p className="text-text-gray text-sm mt-1">Validation multi-mode avec facture et liberation de table.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Commande servie</label>
                  <select
                    value={selectedCommandeId}
                    onChange={(event) => setSelectedCommandeId(event.target.value ? Number(event.target.value) : '')}
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="">Selectionner une commande</option>
                    {commandesServies.map((commande) => (
                      <option key={commande.id} value={commande.id}>
                        #{commande.id} - {commande.nom_clt} - {formatCurrency(commande.montant_total)}
                        {commande.table ? ` - Table ${commande.table.numero}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'cash', label: 'Cash', icon: DollarSign },
                    { key: 'carte_bancaire', label: 'Carte bancaire', icon: CreditCard },
                    { key: 'cheque', label: 'Cheque', icon: FileText },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setModePaiement(key as 'cash' | 'carte_bancaire' | 'cheque')}
                      className={cn(
                        'rounded-xl border px-4 py-4 text-left transition-colors',
                        modePaiement === key
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-card-light bg-card-light text-text-gray hover:text-white',
                      )}
                    >
                      <Icon size={18} className="mb-3" />
                      <p className="font-semibold">{label}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Montant du ticket</label>
                    <div className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white">
                      {formatCurrency(montantCommande)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      {modePaiement === 'cash' ? 'Montant recu' : 'Reference paiement'}
                    </label>
                    {modePaiement === 'cash' ? (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={montantRecu}
                        onChange={(event) => setMontantRecu(event.target.value)}
                        className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                        placeholder="Ex: 300"
                      />
                    ) : (
                      <input
                        type="text"
                        value={referencePaiement}
                        onChange={(event) => setReferencePaiement(event.target.value)}
                        className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                        placeholder={modePaiement === 'cheque' ? 'Numero de cheque' : 'Numero de transaction'}
                      />
                    )}
                  </div>
                </div>

                {modePaiement === 'cash' && montantRecu && (
                  <div className={`rounded-xl border px-4 py-3 ${
                    renduMonnaie >= 0 ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}>
                    {renduMonnaie >= 0
                      ? `Rendu monnaie: ${formatCurrency(renduMonnaie)}`
                      : `Montant manquant: ${formatCurrency(Math.abs(renduMonnaie))}`}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  <Wallet size={18} />
                  Valider le paiement
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-card-light p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Etat de la caisse</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                    <p className="text-sm text-text-gray">Solde du jour</p>
                    <p className="text-2xl font-bold text-green-300 mt-2">{formatCurrency(soldeTotal)}</p>
                  </div>
                  <div className="rounded-xl border border-card-light bg-card-light p-4">
                    <p className="text-sm text-text-gray">Transactions</p>
                    <p className="text-2xl font-bold text-white mt-2">{facturesPayeesDuJour.length}</p>
                  </div>
                  <div className="rounded-xl border border-card-light bg-card-light p-4">
                    <p className="text-sm text-text-gray">Cash</p>
                    <p className="text-xl font-bold text-white mt-2">{formatCurrency(totalCash)}</p>
                  </div>
                  <div className="rounded-xl border border-card-light bg-card-light p-4">
                    <p className="text-sm text-text-gray">Carte + cheque</p>
                    <p className="text-xl font-bold text-white mt-2">{formatCurrency(totalCarte + totalCheque)}</p>
                  </div>
                </div>
              </div>

              {facturePreview && (
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Apercu du ticket</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-white font-semibold">{facturePreview.numero_facture}</p>
                    <p className="text-text-gray">{facturePreview.commande?.nom_clt}</p>
                    <p className="text-text-gray">{facturePreview.mode_paiement_display}</p>
                    <p className="text-primary font-semibold">{formatCurrency(facturePreview.montant_total)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Historique des paiements</h2>
              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value)}
                className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              >
                <option value="tous">Tous les modes</option>
                <option value="cash">Cash</option>
                <option value="carte_bancaire">Carte bancaire</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-light">
                    <th className="text-left py-3 px-4 text-text-gray font-medium">Facture</th>
                    <th className="text-left py-3 px-4 text-text-gray font-medium">Commande</th>
                    <th className="text-left py-3 px-4 text-text-gray font-medium">Mode</th>
                    <th className="text-left py-3 px-4 text-text-gray font-medium">Montant</th>
                    <th className="text-left py-3 px-4 text-text-gray font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-text-gray font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {facturesFiltrees.map((facture) => (
                    <tr key={facture.id} className="border-b border-card-light hover:bg-card-light/60">
                      <td className="py-3 px-4 text-white">{facture.numero_facture}</td>
                      <td className="py-3 px-4 text-white">
                        #{facture.commande_id}
                        {facture.commande?.table_numero ? ` - Table ${facture.commande.table_numero}` : ''}
                      </td>
                      <td className="py-3 px-4 text-white">{facture.mode_paiement_display}</td>
                      <td className="py-3 px-4 text-white font-semibold">{formatCurrency(facture.montant_total)}</td>
                      <td className="py-3 px-4 text-text-gray">
                        {facture.date_paiement ? formatDateTime(facture.date_paiement) : formatDateTime(facture.date_facture)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handlePrint(facture.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                        >
                          <Printer size={14} />
                          Imprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {facturesFiltrees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-gray">
                        Aucun paiement enregistre pour le filtre selectionne.
                      </td>
                    </tr>
                  )}
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
