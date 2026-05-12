import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Edit, Plus, Trash2, Users } from 'lucide-react'
import { fetchAuthStatus } from '../lib/auth'
import { formatDate, formatTime } from '../lib/utils'
import { Reservation, TableSummary, User } from '../types'

const emptyReservation = {
  nom_client: '',
  email: '',
  telephone: '',
  date: '',
  heure: '',
  nombre_personnes: 2,
  notes: '',
  table_id: '',
  statut: 'en_attente',
}

const Reservations: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tables, setTables] = useState<TableSummary[]>([])
  const [form, setForm] = useState(emptyReservation)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('tous')
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    const auth = await fetchAuthStatus()
    if (!auth.authenticated) {
      navigate('/login')
      return
    }
    if (!['manager', 'admin'].includes(auth.role)) {
      navigate('/dashboard')
      return
    }
    setUser(auth)

    const [reservationsRes, tablesRes] = await Promise.all([
      fetch('/api/reservations/', { credentials: 'include' }),
      fetch('/api/tables/', { credentials: 'include' }),
    ])
    const [reservationsData, tablesData] = await Promise.all([
      reservationsRes.json(),
      tablesRes.json(),
    ])

    setReservations(reservationsData.reservations ?? [])
    setTables(tablesData.tables ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [navigate])

  const availableTables = useMemo(
    () =>
      tables.filter((table) => {
        const guests = editingReservation?.nombre_personnes ?? form.nombre_personnes
        return table.capacite >= guests
      }),
    [editingReservation?.nombre_personnes, form.nombre_personnes, tables],
  )

  const filteredReservations = reservations.filter((reservation) => (
    filterStatus === 'tous' || reservation.statut === filterStatus
  ))

  const upcomingReservations = filteredReservations.filter((reservation) => reservation.date >= new Date().toISOString().slice(0, 10))

  const submitReservation = async (event: React.FormEvent) => {
    event.preventDefault()
    const endpoint = editingReservation
      ? `/api/reservations/${editingReservation.id}/modifier/`
      : '/api/reservations/create/'

    const payload = editingReservation
      ? {
          ...editingReservation,
          table_id: editingReservation.table_id ?? null,
        }
      : {
          ...form,
          table_id: form.table_id ? Number(form.table_id) : null,
        }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok || !data.success) {
      setMessage(data.message || 'Erreur lors de la sauvegarde.')
      return
    }

    setMessage(editingReservation ? 'Reservation mise a jour.' : 'Reservation creee avec succes.')
    setForm(emptyReservation)
    setEditingReservation(null)
    await loadData()
  }

  const deleteReservation = async (reservation: Reservation) => {
    if (!window.confirm(`Supprimer la reservation de ${reservation.nom_client} ?`)) return
    const response = await fetch(`/api/reservations/${reservation.id}/supprimer/`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await response.json()
    setMessage(data.message || 'Reservation supprimee.')
    await loadData()
  }

  if (loading) {
    return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Chargement des reservations...</div>
  }

  const draft = editingReservation ?? form

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {message && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {editingReservation ? 'Modifier la reservation' : 'Nouvelle reservation'}
                </h1>
                <p className="text-text-gray text-sm mt-1">Controle date, capacite de table et disponibilite du creneau.</p>
              </div>
            </div>

            <form onSubmit={submitReservation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nom du client</label>
                  <input
                    type="text"
                    value={draft.nom_client}
                    onChange={(event) =>
                      editingReservation
                        ? setEditingReservation({ ...editingReservation, nom_client: event.target.value })
                        : setForm({ ...form, nom_client: event.target.value })
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Telephone</label>
                  <input
                    type="tel"
                    value={draft.telephone}
                    onChange={(event) =>
                      editingReservation
                        ? setEditingReservation({ ...editingReservation, telephone: event.target.value })
                        : setForm({ ...form, telephone: event.target.value })
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Date</label>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) =>
                      editingReservation
                        ? setEditingReservation({ ...editingReservation, date: event.target.value })
                        : setForm({ ...form, date: event.target.value })
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Heure</label>
                  <input
                    type="time"
                    value={draft.heure}
                    onChange={(event) =>
                      editingReservation
                        ? setEditingReservation({ ...editingReservation, heure: event.target.value })
                        : setForm({ ...form, heure: event.target.value })
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Couverts</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.nombre_personnes}
                    onChange={(event) =>
                      editingReservation
                        ? setEditingReservation({ ...editingReservation, nombre_personnes: Number(event.target.value) })
                        : setForm({ ...form, nombre_personnes: Number(event.target.value) })
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">Table</label>
                  <select
                    value={draft.table_id ?? ''}
                    onChange={(event) =>
                      editingReservation
                        ? setEditingReservation({ ...editingReservation, table_id: event.target.value ? Number(event.target.value) : null })
                        : setForm({ ...form, table_id: event.target.value })
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="">Sans table attribuee</option>
                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        Table {table.numero} - capacite {table.capacite}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={draft.notes ?? ''}
                  onChange={(event) =>
                    editingReservation
                      ? setEditingReservation({ ...editingReservation, notes: event.target.value })
                      : setForm({ ...form, notes: event.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                />
              </div>

              {editingReservation && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Statut</label>
                  <select
                    value={editingReservation.statut}
                    onChange={(event) => setEditingReservation({ ...editingReservation, statut: event.target.value })}
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmee</option>
                    <option value="annulee">Annulee</option>
                    <option value="terminee">Terminee</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  <Plus size={18} />
                  {editingReservation ? 'Sauvegarder' : 'Creer la reservation'}
                </button>
                {editingReservation && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReservation(null)
                      setMessage('')
                    }}
                    className="px-6 py-3 rounded-lg border border-card-light bg-card-light text-white"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-card rounded-2xl border border-card-light p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Reservations a venir</h2>
                <p className="text-text-gray text-sm mt-1">Historique filtrable par statut.</p>
              </div>
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              >
                <option value="tous">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="confirmee">Confirmees</option>
                <option value="annulee">Annulees</option>
                <option value="terminee">Terminees</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {upcomingReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-xl border border-card-light bg-card-light p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{reservation.nom_client}</p>
                      <p className="text-sm text-text-gray mt-1">{formatDate(reservation.date)} a {formatTime(reservation.heure)}</p>
                      <p className="text-sm text-text-gray mt-1 flex items-center gap-2">
                        <Users size={14} />
                        {reservation.nombre_personnes} personnes
                        {reservation.table_numero ? ` - Table ${reservation.table_numero}` : ' - Table non attribuee'}
                      </p>
                    </div>
                    <span className="text-xs rounded-full px-3 py-1 bg-primary/20 text-primary">
                      {reservation.statut_display ?? reservation.statut}
                    </span>
                  </div>
                  {reservation.notes && <p className="text-sm text-text-gray mt-3">{reservation.notes}</p>}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setEditingReservation(reservation)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                    >
                      <Edit size={14} />
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteReservation(reservation)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {upcomingReservations.length === 0 && (
                <div className="rounded-xl border border-dashed border-card-light p-6 text-center text-text-gray">
                  Aucune reservation a afficher pour ce filtre.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-card-light p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Historique complet</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-light">
                  <th className="text-left py-3 px-4 text-text-gray font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-text-gray font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-text-gray font-medium">Table</th>
                  <th className="text-left py-3 px-4 text-text-gray font-medium">Couverts</th>
                  <th className="text-left py-3 px-4 text-text-gray font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-card-light hover:bg-card-light/60">
                    <td className="py-3 px-4 text-white">{reservation.nom_client}</td>
                    <td className="py-3 px-4 text-white">{formatDate(reservation.date)} - {formatTime(reservation.heure)}</td>
                    <td className="py-3 px-4 text-white">{reservation.table_numero ? `Table ${reservation.table_numero}` : 'Non attribuee'}</td>
                    <td className="py-3 px-4 text-white">{reservation.nombre_personnes}</td>
                    <td className="py-3 px-4 text-white">{reservation.statut_display ?? reservation.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reservations
