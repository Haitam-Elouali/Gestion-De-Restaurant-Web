import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  DollarSign,
  FileText,
  LogOut,
  Printer,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";
import { fetchAuthStatus, logout } from "../lib/auth";
import { cn, formatCurrency, formatDateTime } from "../lib/utils";
import { Commande, Facture, User } from "../types";
import BrowserTabs from "../components/BrowserTabs";
import FlashMessage from "../components/FlashMessage";

const Caisse: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [selectedCommandeId, setSelectedCommandeId] = useState<number | "">("");
  const [modePaiement, setModePaiement] = useState<
    "cash" | "carte_bancaire" | "cheque"
  >("cash");
  const [montantRecu, setMontantRecu] = useState("");
  const [referencePaiement, setReferencePaiement] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [facturePreview, setFacturePreview] = useState<Facture | null>(null);
  const [filterMode, setFilterMode] = useState("tous");
  const [activeTab, setActiveTab] = useState("paiement");

  // UC 4.5 — Modifier l'état de la caisse
  const [typeMouvement, setTypeMouvement] = useState("ouverture");
  const [montantMouvement, setMontantMouvement] = useState("");
  const [notesMouvement, setNotesMouvement] = useState("");

  const navigate = useNavigate();

  // ─── Chargement des données ───────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    const auth = await fetchAuthStatus();
    if (!auth.authenticated) {
      navigate("/login");
      return;
    }
    if (!["caissier", "admin", "manager"].includes(auth.role)) {
      navigate("/dashboard");
      return;
    }
    setUser(auth);
    const [commandesRes, facturesRes] = await Promise.all([
      fetch("/api/commandes/", { credentials: "include" }),
      fetch("/api/factures/", { credentials: "include" }),
    ]);
    const [commandesData, facturesData] = await Promise.all([
      commandesRes.json(),
      facturesRes.json(),
    ]);
    setCommandes(commandesData.commandes ?? []);
    setFactures(facturesData.factures ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ─── Calculs dérivés ──────────────────────────────────────────────────────
  const commandesServies = useMemo(
    () => commandes.filter((c) => ["servie", "preparee"].includes(c.status)),
    [commandes],
  );

  const selectedCommande = commandes.find((c) => c.id === selectedCommandeId);
  const montantCommande = selectedCommande?.montant_total ?? 0;
  const renduMonnaie =
    modePaiement === "cash" && montantRecu
      ? Number(montantRecu) - montantCommande
      : 0;

  const today = new Date().toLocaleDateString("en-CA");
  const parseFactureDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-CA") : "";
  const facturesPayeesDuJour = factures.filter(
    (f) =>
      f.statut === "payee" &&
      parseFactureDate(f.date_paiement ?? f.date_facture) === today,
  );
  const soldeTotal = facturesPayeesDuJour.reduce(
    (sum, f) => sum + f.montant_total,
    0,
  );
  const totalCash = facturesPayeesDuJour
    .filter((f) => f.mode_paiement === "cash")
    .reduce((sum, f) => sum + f.montant_total, 0);
  const totalCarte = facturesPayeesDuJour
    .filter((f) => f.mode_paiement === "carte_bancaire")
    .reduce((sum, f) => sum + f.montant_total, 0);
  const totalCheque = facturesPayeesDuJour
    .filter((f) => f.mode_paiement === "cheque")
    .reduce((sum, f) => sum + f.montant_total, 0);
  const facturesFiltrees = factures.filter(
    (f) => filterMode === "tous" || f.mode_paiement === filterMode,
  );

  // ─── Helpers facture ──────────────────────────────────────────────────────
  const ensureFacture = async (commandeId: number) => {
    const existing = factures.find((f) => f.commande_id === commandeId);
    if (existing) return existing;
    const response = await fetch(`/api/factures/${commandeId}/creer/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success)
      throw new Error(data.message || "Impossible de créer la facture.");
    await loadData();
    return data.facture_id;
  };

  const fetchFacturePreview = async (factureId: number) => {
    const printResponse = await fetch(`/api/factures/${factureId}/imprimer/`, {
      credentials: "include",
    });
    const printData = await printResponse.json();
    if (!printData.success)
      throw new Error(printData.message || "Impossible de charger la facture.");
    const detail = factures.find((f) => f.id === factureId);
    if (detail) setFacturePreview(detail);
    return printData.html_content as string;
  };

  const handlePrint = async (factureId: number) => {
    try {
      const html = await fetchFacturePreview(factureId);
      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        setMessage("Autorisez l'ouverture de la fenêtre d'impression.");
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erreur d'impression",
      );
    }
  };

  // ─── Soumission du paiement ───────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCommande) {
      setMessage("Sélectionnez une commande à encaisser.");
      return;
    }
    if (modePaiement === "cash" && Number(montantRecu) < montantCommande) {
      setMessage("Montant reçu insuffisant pour un paiement cash.");
      return;
    }
    try {
      const factureRef = await ensureFacture(selectedCommande.id);
      const factureId =
        typeof factureRef === "number" ? factureRef : factureRef.id;
      const response = await fetch(
        `/api/factures/${factureId}/valider-paiement/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reference_paiement: referencePaiement,
            montant_recu: montantRecu ? Number(montantRecu) : null,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Paiement invalide.");
      setMessage(
        modePaiement === "cash" && renduMonnaie > 0
          ? `Paiement validé. Rendu monnaie : ${formatCurrency(renduMonnaie)}.`
          : "Paiement validé et ticket clôturé.",
      );
      setSelectedCommandeId("");
      setMontantRecu("");
      setReferencePaiement("");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erreur lors du paiement.",
      );
    }
  };

  // ─── UC 4.5 — Modifier l'état de la caisse ───────────────────────────────
  const handleModifierEtatCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/caisse/mouvement/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type_mouvement: typeMouvement,
        montant: montantMouvement,
        notes: notesMouvement,
      }),
    });
    const data = await response.json();
    setMessage(
      data.message || (data.success ? "Mouvement enregistré." : "Erreur."),
    );
    if (data.success) {
      setMontantMouvement("");
      setNotesMouvement("");
    }
  };

  // ─── Écran de chargement ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center text-white">
        Chargement...
      </div>
    );
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-dark">
      {/* ── Navigation custom ── */}
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
            <div className="flex items-center space-x-3 text-white">
              <span className="text-sm">
                {user?.username} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-white hover:text-primary transition-colors"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Contenu principal ── */}
      <div className="pt-[110px] pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <FlashMessage message={message} onClose={() => setMessage("")} />

          <BrowserTabs
            tabs={[
              {
                id: "paiement",
                label: "Paiement & clôture",
                icon: <Receipt size={15} />,
              },
              {
                id: "historique",
                label: "Historique des paiements",
                icon: <FileText size={15} />,
              },
              {
                id: "caisse",
                label: "État de la caisse",
                icon: <Wallet size={15} />,
              },
              {
                id: "modifier",
                label: "Modifier l'état de la caisse",
                icon: <Settings size={15} />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {/* ════════════════════════════════
                Onglet 1 — Paiement & clôture
            ════════════════════════════════ */}
            {activeTab === "paiement" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Sélection de la commande */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Commande servie
                  </label>
                  <select
                    value={selectedCommandeId}
                    onChange={(e) =>
                      setSelectedCommandeId(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="">Sélectionner une commande</option>
                    {commandesServies.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.id} - {c.nom_clt} -{" "}
                        {formatCurrency(c.montant_total)}
                        {c.table ? ` - Table ${c.table.numero}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection du mode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Mode de paiement
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          key: "cash",
                          label: "Valider par Cash",
                          icon: DollarSign,
                        },
                        {
                          key: "carte_bancaire",
                          label: "Valider par Carte Bancaire",
                          icon: CreditCard,
                        },
                        {
                          key: "cheque",
                          label: "Valider par Chèque",
                          icon: FileText,
                        },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setModePaiement(key)}
                        className={cn(
                          "rounded-xl border px-4 py-2 text-left transition-colors",
                          modePaiement === key
                            ? "border-primary bg-primary/10 text-white"
                            : "border-card-light bg-card-light text-text-gray hover:text-white",
                        )}
                      >
                        <Icon size={18} className="mb-1.5" />
                        <p className="font-semibold text-sm">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Montant ticket + montant reçu / référence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Montant du ticket
                    </label>
                    <div className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white">
                      {formatCurrency(montantCommande)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      {modePaiement === "cash"
                        ? "Montant reçu"
                        : "Référence paiement"}
                    </label>
                    {modePaiement === "cash" ? (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={montantRecu}
                        onChange={(e) => setMontantRecu(e.target.value)}
                        className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                        placeholder="Ex : 300"
                      />
                    ) : (
                      <input
                        type="text"
                        value={referencePaiement}
                        onChange={(e) => setReferencePaiement(e.target.value)}
                        className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                        placeholder={
                          modePaiement === "cheque"
                            ? "Numéro de chèque"
                            : "Numéro de transaction"
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Rendu monnaie (cash uniquement) */}
                {modePaiement === "cash" && montantRecu && (
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-medium",
                      renduMonnaie >= 0
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-red-500/30   bg-red-500/10   text-red-300",
                    )}
                  >
                    {renduMonnaie >= 0
                      ? `Rendu monnaie : ${formatCurrency(renduMonnaie)}`
                      : `Montant manquant : ${formatCurrency(Math.abs(renduMonnaie))}`}
                  </div>
                )}

                {/* Bouton submit */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
                >
                  <Wallet size={18} />
                  Valider le paiement
                </button>
              </form>
            )}

            {/* ════════════════════════════════
                Onglet 2 — Historique des paiements
            ════════════════════════════════ */}
            {activeTab === "historique" && (
              <div className="space-y-4">
                {/* Filtre mode */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-text-gray text-sm">
                    {facturesFiltrees.length} facture
                    {facturesFiltrees.length !== 1 ? "s" : ""} affichée
                    {facturesFiltrees.length !== 1 ? "s" : ""}
                  </p>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="tous">Tous les modes</option>
                    <option value="cash">Cash</option>
                    <option value="carte_bancaire">Carte bancaire</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>

                {/* Table — colonnes fixes */}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[18%]" />
                      <col className="w-[20%]" />
                      <col className="w-[16%]" />
                      <col className="w-[14%]" />
                      <col className="w-[20%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-card-light">
                        <th className="text-left py-3 px-3 text-text-gray font-medium text-sm">
                          Facture
                        </th>
                        <th className="text-left py-3 px-3 text-text-gray font-medium text-sm">
                          Commande
                        </th>
                        <th className="text-left py-3 px-3 text-text-gray font-medium text-sm">
                          Mode
                        </th>
                        <th className="text-left py-3 px-3 text-text-gray font-medium text-sm">
                          Montant
                        </th>
                        <th className="text-left py-3 px-3 text-text-gray font-medium text-sm">
                          Date
                        </th>
                        <th className="text-left py-3 px-3 text-text-gray font-medium text-sm">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturesFiltrees.map((facture) => (
                        <tr
                          key={facture.id}
                          className="border-b border-card-light hover:bg-card-light/60"
                        >
                          <td className="py-3 px-3 text-white text-sm break-words">
                            {facture.numero_facture}
                          </td>
                          <td className="py-3 px-3 text-white text-sm">
                            #{facture.commande_id}
                            {facture.commande?.table_numero
                              ? ` — T.${facture.commande.table_numero}`
                              : ""}
                          </td>
                          <td className="py-3 px-3 text-white text-sm">
                            {facture.mode_paiement_display}
                          </td>
                          <td className="py-3 px-3 text-white font-semibold text-sm">
                            {formatCurrency(facture.montant_total)}
                          </td>
                          <td className="py-3 px-3 text-text-gray text-sm break-words">
                            {formatDateTime(
                              facture.date_paiement ?? facture.date_facture,
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handlePrint(facture.id)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 text-sm"
                            >
                              <Printer size={13} /> Imprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                      {facturesFiltrees.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-10 text-center text-text-gray text-sm"
                          >
                            Aucun paiement enregistré.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                Onglet 3 — État de la caisse
            ════════════════════════════════ */}
            {activeTab === "caisse" && (
              <div className="space-y-6">
                {/* KPI 2×2 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Résumé du jour
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-5">
                      <p className="text-sm text-text-gray">Solde du jour</p>
                      <p className="text-2xl font-bold text-green-300 mt-2">
                        {formatCurrency(soldeTotal)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-card-light bg-card-light p-5">
                      <p className="text-sm text-text-gray">Transactions</p>
                      <p className="text-2xl font-bold text-white mt-2">
                        {facturesPayeesDuJour.length}
                      </p>
                    </div>

                    <div className="rounded-xl border border-card-light bg-card-light p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={15} className="text-text-gray" />
                        <p className="text-sm text-text-gray">Cash</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(totalCash)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-card-light bg-card-light p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={15} className="text-text-gray" />
                        <p className="text-sm text-text-gray">Carte + Chèque</p>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(totalCarte + totalCheque)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aperçu du dernier ticket imprimé */}
                {facturePreview && (
                  <div className="rounded-xl border border-card-light bg-card-light p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt size={16} className="text-primary" />
                      <h3 className="text-base font-semibold text-white">
                        Aperçu du ticket
                      </h3>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="text-white font-semibold">
                        {facturePreview.numero_facture}
                      </p>
                      <p className="text-text-gray">
                        {facturePreview.commande?.nom_clt}
                      </p>
                      <p className="text-text-gray">
                        {facturePreview.mode_paiement_display}
                      </p>
                      <p className="text-primary font-semibold">
                        {formatCurrency(facturePreview.montant_total)}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePrint(facturePreview.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition-colors text-sm mt-1"
                    >
                      <Printer size={14} />
                      Réimprimer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════
                Onglet 4 — Modifier l'état de la caisse (UC 4.5)
            ════════════════════════════════ */}
            {activeTab === "modifier" && (
              <form onSubmit={handleModifierEtatCaisse} className="space-y-4">
                {/* Type de mouvement */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Type de mouvement
                  </label>
                  <select
                    value={typeMouvement}
                    onChange={(e) => setTypeMouvement(e.target.value)}
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  >
                    <option value="ouverture">Ouverture de caisse</option>
                    <option value="entree">Entrée de fonds</option>
                    <option value="sortie">Sortie de fonds</option>
                    <option value="fermeture">Fermeture de caisse</option>
                  </select>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Montant (XOF)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    required
                    value={montantMouvement}
                    onChange={(e) => setMontantMouvement(e.target.value)}
                    placeholder="Ex : 50000"
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notesMouvement}
                    onChange={(e) => setNotesMouvement(e.target.value)}
                    placeholder="Remarques optionnelles..."
                    className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-semibold"
                >
                  <Settings size={18} />
                  Enregistrer le mouvement
                </button>
              </form>
            )}
          </BrowserTabs>
        </div>
      </div>
    </div>
  );
};

export default Caisse;
