import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Edit,
  LogOut,
  Plus,
  Trash2,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { fetchAuthStatus, logout } from "../lib/auth";
import { cn, formatCurrency, formatDateTime } from "../lib/utils";
import { Commande, Plat, TableSummary, User } from "../types";
import Modal from "../components/Modal";
import BrowserTabs from "../components/BrowserTabs";
import FlashMessage from "../components/FlashMessage";

const Serveur: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mainTab, setMainTab] = useState("tables");
  const [commandesSubTab, setCommandesSubTab] = useState("en_cours");
  const [modalCreateOrder, setModalCreateOrder] = useState(false);
  const [modalEditOrder, setModalEditOrder] = useState<Commande | null>(null);
  const [modalCancel, setModalCancel] = useState<Commande | null>(null);
  const [modalTicket, setModalTicket] = useState<TableSummary | null>(null);
  const [libererTable, setLibererTable] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [filterTable, setFilterTable] = useState("");
  const [newOrder, setNewOrder] = useState({
    type: "sur_place_generique",
    table_id: "",
    nom_clt: "",
    adresse_liv: "",
    nombre_clients: 2,
  });
  const [panier, setPanier] = useState<Record<number, number>>({});
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const auth = await fetchAuthStatus();
    if (!auth.authenticated) {
      navigate("/login");
      return;
    }
    if (auth.role !== "serveur") {
      navigate("/login");
      return;
    }
    setUser(auth);

    const [tablesRes, commandesRes, platsRes] = await Promise.all([
      fetch("/api/tables/", { credentials: "include" }),
      fetch("/api/commandes/", { credentials: "include" }),
      fetch("/api/plats/", { credentials: "include" }),
    ]);
    const [tablesData, commandesData, platsData] = await Promise.all([
      tablesRes.json(),
      commandesRes.json(),
      platsRes.json(),
    ]);
    setTables(tablesData.tables ?? []);
    setCommandes(commandesData.commandes ?? []);
    setPlats(platsData.plats ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 30000);
    return () => window.clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const selectedItems = Object.entries(panier)
    .filter(([, quantity]) => quantity > 0)
    .map(([platId, quantity]) => ({
      plat_id: Number(platId),
      quantite: quantity,
    }));

  const resetOrderForm = () => {
    setPanier({});
    setNewOrder({
      type: "sur_place_generique",
      table_id: "",
      nom_clt: "",
      adresse_liv: "",
      nombre_clients: 2,
    });
  };

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItems.length) {
      setMessage("Ajoutez au moins un produit avant validation.");
      return;
    }

    const payload = {
      nom_clt:
        newOrder.nom_clt ||
        (newOrder.table_id ? `Table ${newOrder.table_id}` : "Client comptoir"),
      type: newOrder.type,
      adresse_liv: newOrder.adresse_liv,
      table_id:
        newOrder.type === "sur_place_generique"
          ? newOrder.table_id || null
          : null,
      plats: selectedItems,
    };

    const response = await fetch("/api/commandes/nouvelle/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.message || "Erreur lors de la création de la commande.");
      return;
    }

    if (newOrder.type === "sur_place_generique" && newOrder.table_id) {
      await fetch(`/api/tables/${newOrder.table_id}/assigner/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          commande_id: data.commande_id,
          nombre_clients: newOrder.nombre_clients,
        }),
      });
    }

    setMessage("Commande créée et transmise en cuisine.");
    setModalCreateOrder(false);
    resetOrderForm();
    await loadData();
  };

  const updateCommandeStatus = async (
    commandeId: number,
    statut: "servie" | "annulee",
    liberer?: boolean,
  ) => {
    const response = await fetch(
      `/api/commandes/${commandeId}/modifier-statut/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ statut, liberer_table: liberer ?? false }),
      },
    );
    const data = await response.json();
    setMessage(data.message || "Statut mis à jour.");
    setModalCancel(null);
    await loadData();
  };

  const removeLine = async (lineId: number, commandeId: number) => {
    const response = await fetch(`/api/lignes/${lineId}/supprimer/`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    setMessage(data.message || "Ligne retirée de la commande.");
    await loadData();
    await refreshModalCommande(commandeId);
  };

  const addDishToCommande = async (commandeId: number, platId: number) => {
    const response = await fetch(`/api/commandes/${commandeId}/ajouter-plat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plat_id: platId, quantite: 1 }),
    });
    const data = await response.json();
    setMessage(data.message || "Plat ajouté à la commande.");
    await loadData();
    await refreshModalCommande(commandeId);
  };

  // Commandes actives = ni payées, ni annulées, ni servies
  // (une commande servie passe en attente de paiement à la caisse)
  const activeCommandes = useMemo(
    () =>
      commandes.filter(
        (commande) => !["payee", "annulee", "servie"].includes(commande.status),
      ),
    [commandes],
  );

  // Rafraîchit la modale de modification avec les données à jour d'une commande
  const refreshModalCommande = async (commandeId: number) => {
    try {
      const res = await fetch(`/api/commandes/${commandeId}/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.commande) setModalEditOrder(data.commande);
      }
    } catch {}
  };

  const historique = useMemo(() => {
    return commandes
      .filter((commande) =>
        ["payee", "annulee", "servie"].includes(commande.status),
      )
      .filter(
        (commande) =>
          filterStatut === "tous" || commande.status === filterStatut,
      )
      .filter(
        (commande) =>
          !filterDate || commande.date_creation?.slice(0, 10) === filterDate,
      )
      .filter(
        (commande) =>
          !filterTable || String(commande.table?.id ?? "") === filterTable,
      );
  }, [commandes, filterDate, filterStatut, filterTable]);

  const availableTables = tables.filter((table) => table.statut === "libre");

  const orderForm = (
    <form id="form-new-order" onSubmit={createOrder} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            setNewOrder({ ...newOrder, type: "sur_place_generique" })
          }
          className={cn(
            "rounded-xl border px-4 py-3 text-left",
            newOrder.type === "sur_place_generique"
              ? "border-primary bg-primary/10 text-white"
              : "border-card-light bg-card-light text-text-gray",
          )}
        >
          Sur place
        </button>
        <button
          type="button"
          onClick={() =>
            setNewOrder({ ...newOrder, type: "a_emporter", table_id: "" })
          }
          className={cn(
            "rounded-xl border px-4 py-3 text-left",
            newOrder.type === "a_emporter"
              ? "border-primary bg-primary/10 text-white"
              : "border-card-light bg-card-light text-text-gray",
          )}
        >
          À emporter
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={newOrder.nom_clt}
          onChange={(event) =>
            setNewOrder({ ...newOrder, nom_clt: event.target.value })
          }
          className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
          placeholder="Nom du client"
        />
        {newOrder.type === "sur_place_generique" ? (
          <select
            value={newOrder.table_id}
            onChange={(event) =>
              setNewOrder({ ...newOrder, table_id: event.target.value })
            }
            className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
            required
          >
            <option value="">Sélectionner une table libre</option>
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
            onChange={(event) =>
              setNewOrder({ ...newOrder, adresse_liv: event.target.value })
            }
            className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
            placeholder="Référence ou retrait comptoir"
          />
        )}
      </div>
      {newOrder.type === "sur_place_generique" && (
        <input
          type="number"
          min={1}
          value={newOrder.nombre_clients}
          onChange={(event) =>
            setNewOrder({
              ...newOrder,
              nombre_clients: Number(event.target.value),
            })
          }
          className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
          placeholder="Nombre de clients"
        />
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {plats
          .filter((plat) => plat.disponible)
          .map((plat) => (
            <div
              key={plat.id}
              className="flex items-center justify-between rounded-xl bg-card-light p-3"
            >
              <div>
                <p className="text-white font-medium">{plat.nom}</p>
                <p className="text-sm text-text-gray mt-1">
                  {plat.categorie_nom}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-semibold">
                  {formatCurrency(plat.prix)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPanier((current) => ({
                        ...current,
                        [plat.id]: Math.max((current[plat.id] ?? 0) - 1, 0),
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-dark text-white"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-white">
                    {panier[plat.id] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPanier((current) => ({
                        ...current,
                        [plat.id]: (current[plat.id] ?? 0) + 1,
                      }))
                    }
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
              plats.reduce(
                (sum, plat) => sum + plat.prix * (panier[plat.id] ?? 0),
                0,
              ),
            )}
          </span>
        </div>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center text-white">
        Chargement...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-dark">
      <nav className="fixed w-full top-0 z-50 bg-dark border-b border-card-light">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between h-[80px]">
            <a
              className="flex items-center space-x-2 shrink-0"
              href="/dashboard"
            >
              <img
                src="/logo.png"
                alt="Logo Restaurant"
                className="h-[120px] w-auto object-contain brightness-0 invert"
              />
            </a>
            <div className="flex items-center gap-4 text-white">
              <span className="text-sm">{user?.username} (Serveur)</span>
              <button
                onClick={handleLogout}
                className="hover:text-primary transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-[110px] px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <FlashMessage message={message} onClose={() => setMessage("")} />

          <BrowserTabs
            tabs={[
              { id: "tables", label: "Gestion des Tables" },
              { id: "commandes", label: "Gestion des Commandes" },
            ]}
            activeTab={mainTab}
            onTabChange={setMainTab}
          >
            {mainTab === "tables" && (
              <div className="space-y-4">
                <p className="text-text-gray text-sm">
                  Visualiser l&apos;état des tables (Libre / Occupée) et le
                  nombre de clients par table.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      onClick={() => {
                        if (table.statut === "occupee" && table.commande_actuelle) {
                          setModalTicket(table);
                        }
                      }}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-opacity hover:opacity-90",
                        table.statut === "occupee"
                          ? "border-red-500/25 bg-red-500/10 cursor-pointer"
                          : table.statut === "reservee"
                            ? "border-yellow-500/25 bg-yellow-500/10 cursor-default"
                            : "border-green-500/25 bg-green-500/10 cursor-default",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">
                            Table {table.numero}
                          </p>
                          <p className="text-sm text-text-gray mt-1">
                            {table.nombre_clients}/{table.capacite} clients
                          </p>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-dark/40 text-white inline-flex items-center justify-center">
                          {table.statut_display ?? table.statut}
                        </span>
                      </div>
                      {table.commande_actuelle && (
                        <div className="mt-4 rounded-lg bg-dark/30 p-3 text-sm">
                          <p className="text-white">
                            Commande #{table.commande_actuelle.id}
                          </p>
                          <p className="text-primary mt-1">
                            {formatCurrency(
                              table.commande_actuelle.montant_total,
                            )}
                          </p>
                        </div>
                      )}

                      {/* Bouton dédié 'Nouvelle Commande' — accessible sur toutes les tables */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewOrder({
                            ...newOrder,
                            table_id: String(table.id),
                            type: "sur_place_generique",
                          });
                          setModalCreateOrder(true);
                        }}
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm hover:bg-primary/25 transition-colors"
                      >
                        <Plus size={14} />
                        Nouvelle Commande
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mainTab === "commandes" && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex rounded-lg border border-card-light overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCommandesSubTab("en_cours")}
                      className={cn(
                        "px-4 py-2 text-sm",
                        commandesSubTab === "en_cours"
                          ? "bg-primary text-white"
                          : "bg-card-light text-text-gray",
                      )}
                    >
                      Commandes en cours
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandesSubTab("historique")}
                      className={cn(
                        "px-4 py-2 text-sm",
                        commandesSubTab === "historique"
                          ? "bg-primary text-white"
                          : "bg-card-light text-text-gray",
                      )}
                    >
                      Historique des commandes
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetOrderForm();
                      setModalCreateOrder(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                  >
                    <Plus size={18} />
                    Saisir une commande
                  </button>
                </div>

                {commandesSubTab === "en_cours" && (
                  <div className="space-y-4">
                    {activeCommandes.map((commande) => (
                      <div
                        key={commande.id}
                        className="rounded-xl border border-card-light bg-card-light p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-semibold">
                              Commande #{commande.id} - {commande.nom_clt}
                            </p>
                            <p className="text-sm text-text-gray mt-1">
                              {commande.table
                                ? `Table ${commande.table.numero}`
                                : commande.type_display}{" "}
                              - {commande.status_display}
                            </p>
                            <p
                              className={cn(
                                "mt-2 text-sm flex items-center gap-2",
                                (commande.duree_service ?? 0) > 15
                                  ? "text-red-300"
                                  : "text-text-gray",
                              )}
                            >
                              <Clock3 size={14} />
                              {commande.duree_formatee ?? "0 min"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-semibold">
                              {formatCurrency(commande.montant_total)}
                            </p>
                            {commande.status !== "servie" && (
                              <button
                                type="button"
                                onClick={() => setModalEditOrder(commande)}
                                className="text-sm text-white mt-2 hover:text-primary inline-flex items-center gap-1"
                              >
                                <Edit size={14} />
                                Modifier la commande
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateCommandeStatus(commande.id, "servie")
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 text-green-300 hover:bg-green-500/25"
                          >
                            <CheckCircle2 size={16} />
                            Marquer comme servi
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalCancel(commande)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                          >
                            <XCircle size={16} />
                            Annuler la commande
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeCommandes.length === 0 && (
                      <p className="text-center text-text-gray py-8">
                        Aucune commande active.
                      </p>
                    )}
                  </div>
                )}

                {commandesSubTab === "historique" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                      />
                      <select
                        value={filterStatut}
                        onChange={(e) => setFilterStatut(e.target.value)}
                        className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                      >
                        <option value="tous">Tous les statuts</option>
                        <option value="servie">Servie</option>
                        <option value="payee">Payée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                      <select
                        value={filterTable}
                        onChange={(e) => setFilterTable(e.target.value)}
                        className="px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                      >
                        <option value="">Toutes les tables</option>
                        {tables.map((t) => (
                          <option key={t.id} value={String(t.id)}>
                            Table {t.numero}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {historique.map((commande) => (
                        <div
                          key={commande.id}
                          className="rounded-xl border border-card-light bg-card-light p-4"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="text-white font-semibold">
                                #{commande.id} - {commande.nom_clt}
                              </p>
                              <p className="text-sm text-text-gray">
                                {formatDateTime(commande.date_creation)}
                              </p>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary inline-flex items-center justify-center">
                              {commande.status_display}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </BrowserTabs>

          <Modal
            open={modalCreateOrder}
            onClose={() => setModalCreateOrder(false)}
            title="Saisir une commande (À emporter/Sur place)"
            size="xl"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setModalCreateOrder(false)}
                  className="px-4 py-2 rounded-lg bg-card-light text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="form-new-order"
                  className="px-4 py-2 rounded-lg bg-primary text-white"
                >
                  Valider
                </button>
              </>
            }
          >
            {orderForm}
          </Modal>

          <Modal
            open={!!modalEditOrder}
            onClose={() => setModalEditOrder(null)}
            title="Modifier une commande en cours"
            size="lg"
          >
            {modalEditOrder && (
              <div className="space-y-4">
                {modalEditOrder.lignes.map((ligne) => (
                  <div
                    key={ligne.id}
                    className="flex justify-between items-center bg-card-light rounded-lg px-3 py-2"
                  >
                    <span className="text-white text-sm">
                      {ligne.plat_nom} x{ligne.quantite}
                    </span>
                    {modalEditOrder.status !== "servie" && (
                      <button
                        type="button"
                        onClick={() => removeLine(ligne.id, modalEditOrder.id)}
                        className="text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <p className="text-sm font-medium text-white">
                  Ajouter un article
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {plats
                    .filter((p) => p.disponible)
                    .slice(0, 8)
                    .map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() =>
                          addDishToCommande(modalEditOrder.id, plat.id)
                        }
                        className="rounded-lg bg-card-light border border-card-light px-3 py-2 text-sm text-white text-left"
                      >
                        {plat.nom}
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setModalEditOrder(null)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg"
                >
                  Valider les modifications
                </button>
              </div>
            )}
          </Modal>

          <Modal
            open={!!modalCancel}
            onClose={() => setModalCancel(null)}
            title="Annuler la commande"
            size="sm"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setModalCancel(null)}
                  className="px-4 py-2 rounded-lg bg-card-light text-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() =>
                    modalCancel &&
                    updateCommandeStatus(
                      modalCancel.id,
                      "annulee",
                      libererTable,
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-red-500/80 text-white"
                >
                  Confirmer l&apos;annulation
                </button>
              </>
            }
          >
            <p className="text-text-gray text-sm mb-4">
              Confirmer l&apos;annulation de cette commande ?
            </p>
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={libererTable}
                onChange={(e) => setLibererTable(e.target.checked)}
              />
              Libérer la table
            </label>
          </Modal>

          <Modal
            open={!!modalTicket}
            onClose={() => setModalTicket(null)}
            title={`Détail du ticket - Table ${modalTicket?.numero}`}
            size="lg"
          >
            {modalTicket?.commande_actuelle && (
              <div className="space-y-3">
                <p className="text-white">
                  Commande #{modalTicket.commande_actuelle.id}
                </p>
                <p className="text-text-gray">
                  {modalTicket.commande_actuelle.nom_clt}
                </p>
                <p className="text-primary text-xl font-semibold">
                  {formatCurrency(modalTicket.commande_actuelle.montant_total)}
                </p>
                <p className="text-sm text-text-gray">
                  {modalTicket.nombre_clients}/{modalTicket.capacite} clients
                </p>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Serveur;
