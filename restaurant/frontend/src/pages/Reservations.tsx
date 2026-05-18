import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Edit, Plus, Trash2, Users, Clock } from "lucide-react";
import { fetchAuthStatus } from "../lib/auth";
import { formatDate, formatTime } from "../lib/utils";
import { Reservation, TableSummary, User } from "../types";
import Modal from "../components/Modal";
import BrowserTabs from "../components/BrowserTabs";
import FlashMessage from "../components/FlashMessage";

const emptyReservation = {
  nom_client: "",
  telephone: "",
  date: "",
  heure: "",
  nombre_personnes: 2,
  table_id: "",
  notes: "",
  statut: "en_attente",
};

const Reservations: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [form, setForm] = useState<{
    nom_client: string;
    telephone: string;
    date: string;
    heure: string;
    nombre_personnes: number;
    table_id: string;
    notes: string;
    statut: string;
  }>(emptyReservation);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCancel, setModalCancel] = useState<Reservation | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("actives");
  const navigate = useNavigate();

  // ── Filtres onglet Historique ──────────────────────────────────────────────
  const [filterStatut, setFilterStatut] = useState<"tous" | "en_attente" | "confirmee" | "annulee" | "terminee">("tous");
  const [filterDate, setFilterDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    const auth = await fetchAuthStatus();
    if (!auth.authenticated) {
      navigate("/login");
      return;
    }
    if (!["manager", "admin"].includes(auth.role)) {
      navigate("/dashboard");
      return;
    }
    setUser(auth);
    const [resRes, tablesRes] = await Promise.all([
      fetch("/api/reservations/", { credentials: "include" }),
      fetch("/api/tables/", { credentials: "include" }),
    ]);
    const [resData, tablesData] = await Promise.all([
      resRes.json(),
      tablesRes.json(),
    ]);
    setReservations(resData.reservations ?? []);
    setTables(tablesData.tables ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // ── Listes dérivées pour l'onglet "Réservations actives" ───────────────────
  const activeReservations = useMemo(
    () =>
      reservations
        .filter(
          (r) =>
            r.date >= today &&
            (r.statut === "en_attente" || r.statut === "confirmee"),
        )
        .sort(
          (a, b) =>
            `${a.date}T${a.heure}`.localeCompare(`${b.date}T${b.heure}`),
        ),
    [reservations, today],
  );

  // ── Liste dérivée pour l'onglet "Historique" ───────────────────────────────
  // Toutes les réservations PASSÉES (quel que soit le statut) pour UC 6.2
  const historyReservations = useMemo(() => {
    let list = reservations.filter((r) => r.date < today);
    if (filterStatut !== "tous") {
      list = list.filter((r) => r.statut === filterStatut);
    }
    if (filterDate) {
      list = list.filter((r) => r.date === filterDate);
    }
    return list.sort(
      (a, b) =>
        `${b.date}T${b.heure}`.localeCompare(`${a.date}T${a.heure}`),
    );
  }, [reservations, today, filterStatut, filterDate]);

  const availableTables = useMemo(
    () =>
      tables.filter((table) => {
        return table.capacite >= (editingReservation?.nombre_personnes ?? form.nombre_personnes);
      }),
    [editingReservation?.nombre_personnes, form.nombre_personnes, tables],
  );

  const draft = editingReservation ?? form;

  // ── Créer / Modifier (modale) ──────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingReservation(null);
    setForm(emptyReservation);
    setModalOpen(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setForm({
      nom_client: reservation.nom_client,
      telephone: reservation.telephone,
      date: reservation.date,
      heure: reservation.heure,
      nombre_personnes: reservation.nombre_personnes,
      table_id: reservation.table_id != null ? String(reservation.table_id) : "",
      notes: reservation.notes ?? "",
      statut: reservation.statut,
    });
    setModalOpen(true);
  };

  const submitReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    const isEdit = !!editingReservation;
    const endpoint = isEdit
      ? `/api/reservations/${editingReservation!.id}/modifier/`
      : "/api/reservations/create/";

    const payload = isEdit
      ? { ...form, table_id: form.table_id ? Number(form.table_id) : null }
      : { ...form, table_id: form.table_id ? Number(form.table_id) : null };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.message || "Erreur lors de la sauvegarde.");
      return;
    }
    setMessage(
      isEdit
        ? "Réservation modifiée avec succès."
        : "Réservation créée avec succès.",
    );
    setModalOpen(false);
    setEditingReservation(null);
    setForm(emptyReservation);
    await loadData();
  };

  // ── Confirmer une réservation ───────────────────────────────────────────────
  const confirmReservation = async (reservation: Reservation) => {
    const response = await fetch(
      `/api/reservations/${reservation.id}/modifier/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...reservation, statut: "confirmee" }),
      },
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.message || "Erreur lors de la confirmation.");
      return;
    }
    setMessage("Réservation confirmée avec succès.");
    await loadData();
  };

  // ── Annuler ────────────────────────────────────────────────────────────────
  const cancelReservation = async () => {
    if (!modalCancel) return;
    const response = await fetch(
      `/api/reservations/${modalCancel.id}/supprimer/`,
      { method: "DELETE", credentials: "include" },
    );
    const data = await response.json();
    setMessage(data.message || "Réservation annulée avec succès.");
    setModalCancel(null);
    await loadData();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const availableTablesFor = (tableId: number | undefined) =>
    availableTables.filter((t) => t.id === tableId);

  if (loading) {
    return (
      <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">
        Chargement des réservations...
      </div>
    );
  }

  const mainTabs = [
    {
      id: "actives",
      label: "Réservations actives",
      icon: <Clock size={16} />,
    },
    {
      id: "historique",
      label: "Consulter l'historique des réservations",
      icon: <Calendar size={16} />,
    },
  ];

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <FlashMessage message={message} onClose={() => setMessage("")} />

        <BrowserTabs
          tabs={mainTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {/* ══════════════════════════════════════════════════════════════
              Onglet 1 — Réservations actives  (UC 6.1 / 6.3 / 6.4)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === "actives" && (
            <div className="space-y-5">
              {/* Barre : filtre statut + bouton Créer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <select
                  value={filterStatut}
                  onChange={(e) =>
                    setFilterStatut(e.target.value as "tous" | "en_attente" | "confirmee" | "annulee" | "terminee")
                  }
                  className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="confirmee">Confirmée</option>
                  <option value="annulee">Annulée</option>
                  <option value="terminee">Terminée</option>
                </select>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  <Plus size={18} />
                  Créer une réservation
                </button>
              </div>

              {/* Liste */}
              <div className="space-y-3">
                {activeReservations.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-card-light bg-card-light p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{r.nom_client}</p>
                        <p className="text-sm text-text-gray mt-1">
                          {formatDate(r.date)} à {formatTime(r.heure)}
                        </p>
                        <p className="text-sm text-text-gray mt-1 flex items-center gap-2">
                          <Users size={14} />
                          {r.nombre_personnes} personne(s)
                          {r.table_numero
                            ? ` — Table ${r.table_numero}`
                            : " — Table non attribuée"}
                        </p>
                        {r.notes && (
                          <p className="text-sm text-text-gray mt-2 italic">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs rounded-full px-3 py-1 shrink-0 inline-flex items-center justify-center ${
                          r.statut === "confirmee"
                            ? "bg-green-500/15 text-green-300"
                            : r.statut === "annulee"
                              ? "bg-red-500/15 text-red-300"
                              : r.statut === "terminee"
                                ? "bg-card-light text-text-gray border border-card-light"
                                : "bg-primary/20 text-primary"
                        }`}
                      >
                        {r.statut_display ?? r.statut}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(r)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                      >
                        <Edit size={14} />
                        Modifier
                      </button>
                      {r.statut === "en_attente" && (
                        <button
                          type="button"
                          onClick={() => confirmReservation(r)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/15 text-green-300 hover:bg-green-500/25"
                        >
                          Confirmer
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setModalCancel(r)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                      >
                        <Trash2 size={14} />
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
                {activeReservations.length === 0 && (
                  <div className="rounded-xl border border-dashed border-card-light p-8 text-center text-text-gray">
                    Aucune réservation active.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Onglet 2 — Historique  (UC 6.2)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === "historique" && (
            <div className="space-y-5">
              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={filterStatut}
                  onChange={(e) =>
                    setFilterStatut(e.target.value as "tous" | "en_attente" | "confirmee" | "annulee" | "terminee")
                  }
                  className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="confirmee">Confirmée</option>
                  <option value="annulee">Annulée</option>
                  <option value="terminee">Terminée</option>
                </select>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                />
                {filterDate && (
                  <button
                    type="button"
                    onClick={() => setFilterDate("")}
                    className="px-4 py-2 text-sm text-text-gray hover:text-white transition-colors self-center"
                  >
                    Effacer la date
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {historyReservations.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-card-light bg-card-light p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{r.nom_client}</p>
                        <p className="text-sm text-text-gray mt-1">
                          {formatDate(r.date)} à {formatTime(r.heure)}
                        </p>
                        <p className="text-sm text-text-gray mt-1 flex items-center gap-2">
                          <Users size={14} />
                          {r.nombre_personnes} personne(s)
                          {r.table_numero
                            ? ` — Table ${r.table_numero}`
                            : " — Table non attribuée"}
                        </p>
                        {r.notes && (
                          <p className="text-sm text-text-gray mt-2 italic">
                            {r.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs rounded-full px-3 py-1 shrink-0 inline-flex items-center justify-center ${
                          r.statut === "confirmee"
                            ? "bg-green-500/15 text-green-300"
                            : r.statut === "annulee"
                              ? "bg-red-500/15 text-red-300"
                              : r.statut === "terminee"
                                ? "bg-card-light text-text-gray border border-card-light"
                                : "bg-primary/20 text-primary"
                        }`}
                      >
                        {r.statut_display ?? r.statut}
                      </span>
                    </div>
                  </div>
                ))}
                {historyReservations.length === 0 && (
                  <div className="rounded-xl border border-dashed border-card-light p-8 text-center text-text-gray">
                    Aucune réservation trouvée pour les critères sélectionnés.
                  </div>
                )}
              </div>
            </div>
          )}
        </BrowserTabs>

        {/* ── Modale : Créer / Modifier une réservation ── */}
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingReservation(null);
            setForm(emptyReservation);
          }}
          title={
            editingReservation
              ? "Modifier une réservation"
              : "Créer une réservation"
          }
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingReservation(null);
                }}
                className="px-4 py-2 rounded-lg bg-card-light text-white hover:bg-card-light/80"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="form-reservation"
                className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
              >
                Valider
              </button>
            </>
          }
        >
          <form
            id="form-reservation"
            onSubmit={submitReservation}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nom du client
                </label>
                <input
                  type="text"
                  placeholder="Ex : Dupont Jean"
                  value={draft.nom_client}
                  onChange={(e) =>
                    editingReservation
                      ? setEditingReservation({
                          ...editingReservation,
                          nom_client: e.target.value,
                        })
                      : setForm({ ...form, nom_client: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="Ex : +212 6xx xxx xxx"
                  value={draft.telephone}
                  onChange={(e) =>
                    editingReservation
                      ? setEditingReservation({
                          ...editingReservation,
                          telephone: e.target.value,
                        })
                      : setForm({ ...form, telephone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) =>
                    editingReservation
                      ? setEditingReservation({
                          ...editingReservation,
                          date: e.target.value,
                        })
                      : setForm({ ...form, date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Heure
                </label>
                <input
                  type="time"
                  value={draft.heure}
                  onChange={(e) =>
                    editingReservation
                      ? setEditingReservation({
                          ...editingReservation,
                          heure: e.target.value,
                        })
                      : setForm({ ...form, heure: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre de couverts
                </label>
                <input
                  type="number"
                  min={1}
                  value={draft.nombre_personnes}
                  onChange={(e) =>
                    editingReservation
                      ? setEditingReservation({
                          ...editingReservation,
                          nombre_personnes: Number(e.target.value),
                        })
                      : setForm({
                          ...form,
                          nombre_personnes: Number(e.target.value),
                        })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Table
                </label>
                <select
                  value={draft.table_id ?? ""}
                  onChange={(e) =>
                    editingReservation
                      ? setEditingReservation({
                          ...editingReservation,
                          table_id: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      : setForm({ ...form, table_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                >
                  <option value="">Sans table attribuée</option>
                  {availableTablesFor(
                    editingReservation?.table_id ?? Number(form.table_id),
                  ).length > 0
                    ? availableTablesFor(
                        editingReservation?.table_id ?? Number(form.table_id),
                      ).map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.numero} — {table.capacite} places
                        </option>
                      ))
                    : availableTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.numero} — {table.capacite} places
                        </option>
                      ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="Allergies, occasion spéciale…"
                value={draft.notes ?? ""}
                onChange={(e) =>
                  editingReservation
                    ? setEditingReservation({
                        ...editingReservation,
                        notes: e.target.value,
                      })
                    : setForm({ ...form, notes: e.target.value })
                }
                className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
              />
            </div>
          </form>
        </Modal>

        {/* ── Modale : Confirmer l'annulation ── */}
        <Modal
          open={!!modalCancel}
          onClose={() => setModalCancel(null)}
          title="Annuler la réservation"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setModalCancel(null)}
                className="px-4 py-2 rounded-lg bg-card-light text-white hover:bg-card-light/80"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={cancelReservation}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90"
              >
                Confirmer l'annulation
              </button>
            </>
          }
        >
          <p className="text-text-gray">
            Confirmez-vous l'annulation de la réservation de{" "}
            <span className="text-white font-semibold">
              « {modalCancel?.nom_client} »
            </span>{" "}
            ?
          </p>
        </Modal>
      </div>
    </div>
  );
};

export default Reservations;
