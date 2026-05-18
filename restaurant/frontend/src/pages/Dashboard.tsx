import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  Calendar,
  CalendarRange,
  Clock3,
  LayoutGrid,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { fetchAuthStatus } from "../lib/auth";
import { cn, formatCurrency } from "../lib/utils";
import { Commande, TableSummary, User } from "../types";
import BrowserTabs from "../components/BrowserTabs";

interface Statistiques {
  total_gains: number;
  gains_aujourdhui: number;
  nombre_commandes: number;
  ticket_moyen: number;
  ventes_par_jour: { date: string; montant: number; commandes: number }[];
  ventes_par_mois: { mois: string; montant: number; commandes: number }[];
  plats_plus_vendus: {
    plat_id: number;
    plat_nom: string;
    quantite_vendue: number;
    montant_total: number;
  }[];
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState<"jour" | "mois">("mois");
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const auth = await fetchAuthStatus();
      if (!auth.authenticated) {
        navigate("/login");
        return;
      }
      if (auth.role === "admin") {
        navigate("/admin");
        return;
      }
      if (auth.role === "serveur") {
        navigate("/serveur");
        return;
      }
      if (auth.role === "caissier") {
        navigate("/caisse");
        return;
      }
      setUser(auth);

      const [statsRes, commandesRes, tablesRes] = await Promise.all([
        fetch("/api/statistiques/", { credentials: "include" }),
        fetch("/api/commandes/", { credentials: "include" }),
        fetch("/api/tables/", { credentials: "include" }),
      ]);
      const [statsData, commandesData, tablesData] = await Promise.all([
        statsRes.json(),
        commandesRes.json(),
        tablesRes.json(),
      ]);
      setStats(statsData.statistiques ?? null);
      setCommandes(commandesData.commandes ?? []);
      setTables(tablesData.tables ?? []);
      setLastUpdated(new Date().toLocaleTimeString("fr-FR"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, 30000);
    return () => window.clearInterval(interval);
  }, [navigate]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return period === "jour" ? stats.ventes_par_jour : stats.ventes_par_mois;
  }, [period, stats]);

  const maxValue = Math.max(...chartData.map((item) => item.montant), 1);

  if (loading)
    return (
      <div className="pt-32 px-4 min-h-screen bg-dark text-white">
        Chargement du tableau de bord...
      </div>
    );
  if (!user || !stats)
    return (
      <div className="pt-32 px-4 min-h-screen bg-dark text-white">
        Impossible de charger le tableau de bord.
      </div>
    );

  const commandesActives = commandes.filter(
    (c) => !["payee", "annulee"].includes(c.status),
  );
  const tablesOccupees = tables.filter((t) => t.statut === "occupee");
  const durees = commandesActives.map((c) => c.duree_service ?? 0);
  const dureeMoyenne = durees.length
    ? Math.round(durees.reduce((s, v) => s + v, 0) / durees.length)
    : 0;

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <BrowserTabs
          tabs={[
            {
              id: "dashboard",
              label: "Consulter le tableau de bord",
              icon: <LayoutGrid size={15} />,
            },
            {
              id: "statistiques",
              label: "Consulter les statistiques de vente",
              icon: <BarChart3 size={15} />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {/* ───── Onglet 1 : Tableau de bord ───── */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white">
                    Tableau de bord manager
                  </h1>
                  <p className="text-text-gray mt-2">
                    KPIs du jour, commandes actives et activite de la salle.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-card-light bg-card text-white hover:bg-card-light"
                >
                  <RefreshCw size={16} />
                  Rafraichir
                </button>
              </div>

              {/* 4 KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 className="text-green-400" />
                    <span className="text-xs uppercase tracking-[0.2em] text-text-gray">
                      Jour
                    </span>
                  </div>
                  <p className="text-text-gray text-sm">Chiffre d'affaires</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {formatCurrency(stats.gains_aujourdhui)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between mb-3">
                    <ShoppingBag className="text-blue-400" />
                    <span className="text-xs uppercase tracking-[0.2em] text-text-gray">
                      Actif
                    </span>
                  </div>
                  <p className="text-text-gray text-sm">Commandes en cours</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {commandesActives.length}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between mb-3">
                    <LayoutGrid className="text-orange-400" />
                    <span className="text-xs uppercase tracking-[0.2em] text-text-gray">
                      Salle
                    </span>
                  </div>
                  <p className="text-text-gray text-sm">Places occupées</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {tables.reduce((sum, t) => sum + (t.nombre_clients || 0), 0)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Clock3 className="text-yellow-400" />
                    <span className="text-xs uppercase tracking-[0.2em] text-text-gray">
                      Service
                    </span>
                  </div>
                  <p className="text-text-gray text-sm">Duree moyenne</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {dureeMoyenne} min
                  </p>
                </div>
              </div>

              {/* Flux en direct + Accès rapide + Salle */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                {/* Flux en direct */}
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Flux en direct
                      </h2>
                      <p className="text-text-gray text-sm mt-1">
                        Mise a jour automatique toutes les 30 secondes.
                      </p>
                    </div>
                    <span className="text-xs text-text-gray">
                      Derniere MAJ : {lastUpdated}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {commandesActives.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-card-light bg-card-light p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-white font-semibold">
                              Commande #{c.id} - {c.nom_clt}
                            </p>
                            <p className="text-sm text-text-gray mt-1">
                              {c.table
                                ? `Table ${c.table.numero}`
                                : c.type_display}{" "}
                              - {c.status_display}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-semibold">
                              {formatCurrency(c.montant_total)}
                            </p>
                            <p className="text-xs text-text-gray mt-1">
                              {c.duree_formatee ?? "0 min"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {commandesActives.length === 0 && (
                      <div className="rounded-xl border border-dashed border-card-light p-6 text-text-gray text-center">
                        Aucune commande active pour le moment.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Accès rapide */}
                  <div className="bg-card rounded-2xl border border-card-light p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Acces rapide
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                      <Link
                        to="/stocks-menus"
                        className="rounded-xl border border-card-light bg-card-light p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-3 text-white">
                          <Package className="text-primary" />
                          <div>
                            <p className="font-semibold">Stocks & Menus</p>
                            <p className="text-sm text-text-gray">
                              CRUD produits, ingredients et disponibilite
                            </p>
                          </div>
                        </div>
                      </Link>
                      <Link
                        to="/reservations"
                        className="rounded-xl border border-card-light bg-card-light p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-3 text-white">
                          <Calendar className="text-primary" />
                          <div>
                            <p className="font-semibold">Reservations</p>
                            <p className="text-sm text-text-gray">
                              Planning client et capacite des tables
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Salle */}
                  <div className="bg-card rounded-2xl border border-card-light p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Salle
                    </h2>
                    <div className="space-y-3">
                      {tables.slice(0, 6).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-xl bg-card-light p-3"
                        >
                          <div>
                            <p className="text-white font-medium">
                              Table {t.numero}
                            </p>
                            <p className="text-xs text-text-gray">
                              {t.nombre_clients}/{t.capacite} clients
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs inline-flex items-center ${
                              t.statut === "occupee"
                                ? "bg-red-500/15 text-red-300"
                                : t.statut === "reservee"
                                  ? "bg-yellow-500/15 text-yellow-300"
                                  : "bg-green-500/15 text-green-300"
                            }`}
                          >
                            {t.statut_display ?? t.statut}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── Onglet 2 : Statistiques de vente ───── */}
          {activeTab === "statistiques" && (
            <div className="space-y-8">
              {/* Header avec toggle période + Rafraîchir */}
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Statistiques de vente
                  </h2>
                  <p className="text-text-gray text-sm mt-1">
                    Vue temps reel du chiffre d'affaires et des plats les plus
                    performants.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex rounded-lg border border-card-light overflow-hidden">
                    {(["jour", "mois"] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => setPeriod(item)}
                        className={cn(
                          "px-4 py-2 text-sm",
                          period === item
                            ? "bg-primary text-white"
                            : "bg-card text-text-gray hover:text-white",
                        )}
                      >
                        {item === "jour" ? "7 jours" : "6 mois"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={loadData}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-card-light bg-card text-white hover:bg-card-light"
                  >
                    <RefreshCw size={16} />
                    Rafraichir
                  </button>
                </div>
              </div>

              {/* 4 KPI cards statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="text-green-400" />
                    <span className="text-xs text-text-gray">Aujourd'hui</span>
                  </div>
                  <p className="text-text-gray text-sm mt-4">Ventes du jour</p>
                  <p className="text-white text-3xl font-bold mt-2">
                    {formatCurrency(stats.gains_aujourdhui)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between">
                    <BarChart3 className="text-blue-400" />
                    <span className="text-xs text-text-gray">Global</span>
                  </div>
                  <p className="text-text-gray text-sm mt-4">
                    Commandes payees
                  </p>
                  <p className="text-white text-3xl font-bold mt-2">
                    {stats.nombre_commandes}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between">
                    <CalendarRange className="text-yellow-400" />
                    <span className="text-xs text-text-gray">Moyenne</span>
                  </div>
                  <p className="text-text-gray text-sm mt-4">Ticket moyen</p>
                  <p className="text-white text-3xl font-bold mt-2">
                    {formatCurrency(stats.ticket_moyen)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between">
                    <Award className="text-orange-400" />
                    <span className="text-xs text-text-gray">Cumule</span>
                  </div>
                  <p className="text-text-gray text-sm mt-4">Total des gains</p>
                  <p className="text-white text-3xl font-bold mt-2">
                    {formatCurrency(stats.total_gains)}
                  </p>
                </div>
              </div>

              {/* Graphe + Plats les plus vendus */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
                {/* Graphe en barres */}
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Evolution du chiffre d'affaires
                      </h2>
                      <p className="text-sm text-text-gray mt-1">
                        {period === "jour"
                          ? "Suivi quotidien des 7 derniers jours."
                          : "Synthese mensuelle glissante sur 6 mois."}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-3 items-end h-72 rounded-2xl bg-card-light p-5">
                    {chartData.map((item) => (
                      <div
                        key={"date" in item ? item.date : item.mois}
                        className="flex flex-col items-center justify-end h-full"
                      >
                        <span className="text-[11px] text-text-gray mb-2">
                          {formatCurrency(item.montant)}
                        </span>
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-primary to-secondary hover:opacity-80 transition-opacity"
                          style={{
                            height: `${Math.max(24, (item.montant / maxValue) * 190)}px`,
                          }}
                        />
                        <p className="mt-3 text-xs text-white">
                          {"date" in item
                            ? new Date(item.date).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : item.mois}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plats les plus vendus */}
                <div className="bg-card rounded-2xl border border-card-light p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Plats les plus vendus
                  </h2>
                  <div className="space-y-3">
                    {stats.plats_plus_vendus.map((plat, index) => (
                      <div
                        key={plat.plat_id}
                        className="rounded-xl border border-card-light bg-card-light p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white font-semibold">
                              {plat.plat_nom}
                            </p>
                            <p className="text-sm text-text-gray mt-1">
                              {plat.quantite_vendue} vente(s)
                            </p>
                          </div>
                          <span className="text-xs rounded-full px-3 py-1 bg-primary/20 text-primary inline-flex items-center justify-center">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-dark overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                            style={{
                              width: `${Math.max(
                                14,
                                (plat.quantite_vendue /
                                  Math.max(
                                    stats.plats_plus_vendus[0]
                                      ?.quantite_vendue || 1,
                                    1,
                                  )) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-sm text-text-gray mt-3">
                          {formatCurrency(plat.montant_total)}
                        </p>
                      </div>
                    ))}
                    {stats.plats_plus_vendus.length === 0 && (
                      <div className="rounded-xl border border-dashed border-card-light p-6 text-center text-text-gray">
                        Aucune vente payee sur la periode suivie.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </BrowserTabs>
      </div>
    </div>
  );
};

export default Dashboard;
