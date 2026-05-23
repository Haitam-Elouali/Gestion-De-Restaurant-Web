import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  User as UserIcon,
  Settings,
  Store,
  CreditCard,
  LogOut,
  UserPlus,
  Trash2,
  Edit,
  Plus,
  Menu,
} from "lucide-react";
import { User } from "../types";
import Modal from "../components/Modal";
import BrowserTabs from "../components/BrowserTabs";
import FlashMessage from "../components/FlashMessage";

const Admin: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"comptes" | "parametres">(
    "comptes",
  );
  const [configTab, setConfigTab] = useState<
    "caisse" | "tables" | "restaurant"
  >("restaurant");
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalDelete, setModalDelete] = useState<any>(null);
  const [editingEmploye, setEditingEmploye] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [modalCreateTable, setModalCreateTable] = useState(false);
  const [modalEditTable, setModalEditTable] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [newTable, setNewTable] = useState({
    numero: "",
    capacite: 4,
    emplacement: "",
    serveur_id: "",
  });
  const [employes, setEmployes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantSettings, setRestaurantSettings] = useState({
    restaurant_nom: "",
    restaurant_adresse: "",
    restaurant_telephone: "",
    restaurant_email: "",
    restaurant_horaires: "",
  });
  const [caisseSettings, setCaisseSettings] = useState({
    caisse_fonds_depart: "0.00",
    caisse_modes_paiement: ["cash", "carte", "cheque"] as string[],
  });
  const [newEmploye, setNewEmploye] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "serveur",
    username: "",
    password: "",
    salaire: "",
    tables_ids: [] as string[],
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/auth/status/", { credentials: "include" })
      .then((res) => res.json())
      .then((data: User) => {
        if (data.authenticated) {
          if (data.role !== "admin") {
            navigate("/login");
            return;
          }
          setUser(data);
          fetchEmployes();
          fetchTables();
          fetchConfiguration();
        } else {
          navigate("/login");
        }
      });
  }, [navigate]);

  const fetchEmployes = () => {
    fetch("/api/employes/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const all = [
          ...(data.admins || []).map((e: any) => ({ ...e, role: "admin" })),
          ...(data.managers || []).map((e: any) => ({ ...e, role: "manager" })),
          ...(data.serveurs || []).map((e: any) => ({ ...e, role: "serveur" })),
          ...(data.caissiers || []).map((e: any) => ({
            ...e,
            role: "caissier",
          })),
        ];
        setEmployes(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchTables = () => {
    fetch("/api/tables/admin/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setTables(data.tables || []);
      })
      .catch(() => setTables([]));
  };

  const fetchConfiguration = () => {
    fetch("/api/configuration/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;
        setRestaurantSettings({
          restaurant_nom: data.configuration.restaurant_nom || "",
          restaurant_adresse: data.configuration.restaurant_adresse || "",
          restaurant_telephone: data.configuration.restaurant_telephone || "",
          restaurant_email: data.configuration.restaurant_email || "",
          restaurant_horaires: data.configuration.restaurant_horaires || "",
        });
        setCaisseSettings({
          caisse_fonds_depart: data.configuration.caisse_fonds_depart || "0.00",
          caisse_modes_paiement: data.configuration.caisse_modes_paiement || [],
        });
      })
      .catch(() => {});
  };

  const handleLogout = () => {
    fetch("/api/auth/logout/", { method: "POST", credentials: "include" }).then(
      () => navigate("/login"),
    );
  };

  const handleCreateEmploye = (e: React.FormEvent) => {
    e.preventDefault();
    const employeData = {
      ...newEmploye,
      type: newEmploye.role,
      salaire_mensuel: newEmploye.salaire || 0,
      tables_ids: newEmploye.role === "serveur" ? newEmploye.tables_ids : [],
    };
    fetch("/api/employes/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(employeData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage(data.message || "Compte créé avec succès.");
          setModalCreate(false);
          setNewEmploye({
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            role: "serveur",
            username: "",
            password: "",
            salaire: "",
            tables_ids: [],
          });
          setTimeout(() => {
            fetchEmployes();
            fetchTables();
          }, 100);
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(data.message || "Erreur lors de la création");
        }
      });
  };

  const handleDeleteEmploye = (id: number, role: string) => {
    fetch(`/api/employes/${id}/delete/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ type: role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage(data.message || "Compte supprimé avec succès.");
          setModalDelete(null);
          fetchEmployes();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(data.message || "Erreur lors de la suppression");
          setTimeout(() => setMessage(""), 3000);
        }
      })
      .catch(() => {
        setMessage("Erreur lors de la suppression de l'employé");
        setTimeout(() => setMessage(""), 3000);
      });
  };

  const handleEditEmploye = (emp: any) => {
    const assignedTableIds = tables
      .filter((table) => table.serveur_id === emp.user_id)
      .map((table) => String(table.id));
    setEditingEmploye({ ...emp, tables_ids: assignedTableIds });
    setModalEdit(true);
  };

  const toggleNewEmployeTable = (tableId: string) => {
    setNewEmploye((prev) => {
      const selected = prev.tables_ids.includes(tableId);
      return {
        ...prev,
        tables_ids: selected
          ? prev.tables_ids.filter((id) => id !== tableId)
          : [...prev.tables_ids, tableId],
      };
    });
  };

  const toggleEditingEmployeTable = (tableId: string) => {
    setEditingEmploye((prev: any) => {
      if (!prev) return prev;
      const selected = prev.tables_ids?.includes(tableId);
      return {
        ...prev,
        tables_ids: selected
          ? prev.tables_ids.filter((id: string) => id !== tableId)
          : [...(prev.tables_ids || []), tableId],
      };
    });
  };

  const handleUpdateEmploye = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/employes/${editingEmploye.id}/update/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...editingEmploye, type: editingEmploye.role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage(data.message || "Compte mis à jour avec succès.");
          setModalEdit(false);
          setEditingEmploye(null);
          fetchEmployes();
          fetchTables();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(data.message || "Erreur lors de la mise à jour");
        }
      });
  };

  const handleSaveConfiguration = () => {
    fetch("/api/configuration/update/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...restaurantSettings, ...caisseSettings }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage(data.message || "Configuration mise à jour avec succès.");
          fetchConfiguration();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(
            data.message ||
              "Paramètres invalides. Veuillez vérifier les champs.",
          );
          setTimeout(() => setMessage(""), 3000);
        }
      })
      .catch(() => {
        setMessage("Erreur lors de la sauvegarde de la configuration");
        setTimeout(() => setMessage(""), 3000);
      });
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/tables/admin/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        numero: newTable.numero,
        capacite: newTable.capacite,
        emplacement: newTable.emplacement,
        serveur_id: newTable.serveur_id ? Number(newTable.serveur_id) : null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage("Table créée avec succès.");
          setModalCreateTable(false);
          setNewTable({ numero: "", capacite: 4, emplacement: "", serveur_id: "" });
          fetchTables();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(data.message || "Erreur lors de la création");
        }
      });
  };

  const handleEditTable = (table: any) => {
    setEditingTable({ ...table });
    setModalEditTable(true);
  };

  const handleUpdateTable = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/tables/admin/${editingTable.id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        numero: editingTable.numero,
        capacite: editingTable.capacite,
        emplacement: editingTable.emplacement,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage(data.message || "Table modifiée avec succès.");
          setModalEditTable(false);
          setEditingTable(null);
          fetchTables();
          setTimeout(() => setMessage(""), 3000);
        } else {
          setMessage(data.message || "Erreur lors de la modification");
          setTimeout(() => setMessage(""), 3000);
        }
      });
  };

  const handleDeleteTable = (id: number) => {
    fetch(`/api/tables/admin/${id}/delete/`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage("Table supprimée avec succès !");
          fetchTables();
          setTimeout(() => setMessage(""), 3000);
        }
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center text-white">
        Chargement...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-dark">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-dark">
        <div className="max-w-[1440px] mx-auto px-2">
          <div className="flex items-center justify-between h-[80px]">
            <a
              className="flex items-center space-x-2 shrink-0"
              href="/dashboard"
            >
              <img
                src="/logo.png"
                alt="Logo Restaurant"
                className="h-[160px] w-auto object-contain brightness-0 invert"
              />
            </a>
            <div className="hidden md:flex items-center space-x-3 shrink-0">
              <div className="flex items-center space-x-2 text-white">
                <UserIcon size={18} />
                <span className="text-sm">{user?.username} (Admin)</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[100px] py-8">
        <FlashMessage message={message} onClose={() => setMessage("")} />

        <BrowserTabs
          tabs={[
            {
              id: "comptes",
              label: "Gestion des Comptes",
              icon: <Users size={16} />,
            },
            {
              id: "parametres",
              label: "Paramètres",
              icon: <Settings size={16} />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as "comptes" | "parametres")}
        >
          {/* ─── Onglet Gestion des Comptes ─── */}
          {activeTab === "comptes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Gestion des Employés
                </h2>
                <button
                  onClick={() => setModalCreate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  <UserPlus size={18} />
                  Créer un compte
                </button>
              </div>

              {[
                { role: "admin", title: "Admins" },
                { role: "manager", title: "Managers" },
                { role: "serveur", title: "Serveurs" },
                { role: "caissier", title: "Caissiers" },
              ].map((section) => {
                const sectionEmployes = employes.filter(
                  (emp) => emp.role === section.role,
                );
                if (sectionEmployes.length === 0) return null;
                return (
                  <div key={section.role} className="space-y-3">
                    <h3 className="text-lg font-semibold text-white border-b border-card-light pb-2">
                      {section.title}
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-card-light">
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          <colgroup>
                            <col className="w-[28%]" />
                            <col className="w-[16%]" />
                            <col className="w-[30%]" />
                            <col className="w-[16%]" />
                            <col className="w-[10%]" />
                          </colgroup>
                          <thead className="bg-card-light">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-gray uppercase">
                                Nom
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-gray uppercase">
                                Rôle
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-gray uppercase">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-gray uppercase">
                                Téléphone
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-text-gray uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-card-light">
                            {sectionEmployes.map((emp) => {
                              const badgeClass =
                                emp.role === "admin"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : emp.role === "manager"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : emp.role === "caissier"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-orange-500/20 text-orange-400";
                              const roleLabel =
                                emp.role === "admin"
                                  ? "Administrateur"
                                  : emp.role === "manager"
                                    ? "Manager"
                                    : emp.role === "caissier"
                                      ? "Caissier"
                                      : "Serveur";
                              return (
                                <tr
                                  key={`emp-${emp.id}-${emp.role}`}
                                  className="hover:bg-card-light/50"
                                >
                                  <td className="px-4 py-3 text-white break-words">
                                    {emp.nom} {emp.prenom}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center ${badgeClass}`}
                                    >
                                      {roleLabel}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-text-gray text-sm break-words">
                                    {emp.email}
                                  </td>
                                  <td className="px-4 py-3 text-text-gray text-sm">
                                    {emp.telephone}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEditEmploye(emp)}
                                        className="p-2 text-blue-400 hover:text-blue-300"
                                        title="Modifier"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => setModalDelete(emp)}
                                        className="p-2 text-red-400 hover:text-red-300"
                                        title="Supprimer"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Onglet Paramètres ─── */}
          {activeTab === "parametres" && (
            <div className="space-y-6">
              {/* Sous-onglets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfigTab("restaurant")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    configTab === "restaurant"
                      ? "bg-primary text-white"
                      : "bg-card-light text-text-gray hover:text-white"
                  }`}
                >
                  Modifier les paramètres du restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setConfigTab("caisse")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    configTab === "caisse"
                      ? "bg-primary text-white"
                      : "bg-card-light text-text-gray hover:text-white"
                  }`}
                >
                  Modifier les paramètres de la caisse
                </button>
                <button
                  type="button"
                  onClick={() => setConfigTab("tables")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    configTab === "tables"
                      ? "bg-primary text-white"
                      : "bg-card-light text-text-gray hover:text-white"
                  }`}
                >
                  Gérer les tables
                </button>
              </div>

              {/* Paramètres restaurant */}
              {configTab === "restaurant" && (
                <div className="space-y-4">
                  <div className="flex items-center mb-2">
                    <Store className="text-primary mr-3" size={24} />
                    <h3 className="text-lg font-semibold text-white">
                      Paramètres du Restaurant
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Nom du restaurant
                    </label>
                    <input
                      type="text"
                      value={restaurantSettings.restaurant_nom}
                      onChange={(e) =>
                        setRestaurantSettings({
                          ...restaurantSettings,
                          restaurant_nom: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Adresse
                    </label>
                    <textarea
                      value={restaurantSettings.restaurant_adresse}
                      onChange={(e) =>
                        setRestaurantSettings({
                          ...restaurantSettings,
                          restaurant_adresse: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={restaurantSettings.restaurant_telephone}
                      onChange={(e) =>
                        setRestaurantSettings({
                          ...restaurantSettings,
                          restaurant_telephone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={restaurantSettings.restaurant_email}
                      onChange={(e) =>
                        setRestaurantSettings({
                          ...restaurantSettings,
                          restaurant_email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Horaires d'ouverture
                    </label>
                    <textarea
                      value={restaurantSettings.restaurant_horaires}
                      onChange={(e) =>
                        setRestaurantSettings({
                          ...restaurantSettings,
                          restaurant_horaires: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveConfiguration}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Enregistrer
                  </button>
                </div>
              )}

              {/* Paramètres caisse */}
              {configTab === "caisse" && (
                <div className="space-y-4">
                  <div className="flex items-center mb-2">
                    <CreditCard className="text-primary mr-3" size={24} />
                    <h3 className="text-lg font-semibold text-white">
                      Paramètres de la Caisse
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Fonds de départ
                    </label>
                    <input
                      type="number"
                      value={caisseSettings.caisse_fonds_depart}
                      onChange={(e) =>
                        setCaisseSettings({
                          ...caisseSettings,
                          caisse_fonds_depart: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-gray mb-1">
                      Modes de paiement acceptés
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { key: "cash", label: "Espèces" },
                        { key: "carte", label: "Carte" },
                        { key: "cheque", label: "Chèque" },
                      ].map((mode) => (
                        <label
                          key={mode.key}
                          className="flex items-center gap-2 text-white text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={caisseSettings.caisse_modes_paiement.includes(
                              mode.key,
                            )}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(
                                    new Set([
                                      ...caisseSettings.caisse_modes_paiement,
                                      mode.key,
                                    ]),
                                  )
                                : caisseSettings.caisse_modes_paiement.filter(
                                    (v) => v !== mode.key,
                                  );
                              setCaisseSettings({
                                ...caisseSettings,
                                caisse_modes_paiement: next,
                              });
                            }}
                          />
                          <span>{mode.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveConfiguration}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Enregistrer
                  </button>
                </div>
              )}

              {/* Gestion des tables */}
              {configTab === "tables" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Store className="text-primary mr-3" size={24} />
                      <h3 className="text-lg font-semibold text-white">
                        Gestion des Tables
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalCreateTable(true)}
                      className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus className="mr-2" size={20} />
                      Nouvelle Table
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map((table) => (
                      <div
                        key={`table-${table.id}`}
                        className="bg-card-light rounded-lg p-4 border border-card-light"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">
                            Table {table.numero}
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditTable(table)}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTable(table.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-text-gray">
                          <p>Places: {table.capacite}</p>
                          <p>Emplacement: {table.emplacement || "-"}</p>
                          <p>Statut: {table.statut}</p>
                          <p>Clients: {table.nombre_clients}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </BrowserTabs>

        {/* ─── Modale : Créer un compte ─── */}
        <Modal
          open={modalCreate}
          onClose={() => setModalCreate(false)}
          title="Créer un compte utilisateur"
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setModalCreate(false)}
                className="px-4 py-2 rounded-lg bg-card-light text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="form-create-employe"
                className="px-4 py-2 rounded-lg bg-primary text-white"
              >
                Enregistrer
              </button>
            </>
          }
        >
          <form
            id="form-create-employe"
            onSubmit={handleCreateEmploye}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="Nom"
              value={newEmploye.nom}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, nom: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
            <input
              type="text"
              placeholder="Prénom"
              value={newEmploye.prenom}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, prenom: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmploye.email}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={newEmploye.telephone}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, telephone: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
            <select
              value={newEmploye.role}
              onChange={(e) =>
                setNewEmploye({
                  ...newEmploye,
                  role: e.target.value,
                  tables_ids:
                    e.target.value === "serveur" ? newEmploye.tables_ids : [],
                })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
            >
              <option value="serveur">Serveur</option>
              <option value="caissier">Caissier</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>
            {newEmploye.role === "serveur" && (
              <div className="md:col-span-2">
                <label className="block text-sm text-text-gray mb-2">
                  Tables disponibles
                </label>
                <div className="grid gap-2 max-h-72 overflow-y-auto rounded-lg border border-card-light p-3 bg-card-light/20">
                  {tables.map((table) => {
                    const tableId = String(table.id);
                    const isAssignedElsewhere =
                      table.serveur_id && table.serveur_id !== null;
                    const isChecked = newEmploye.tables_ids.includes(tableId);
                    return (
                      <label
                        key={table.id}
                        className={`flex items-center justify-between gap-3 rounded-lg p-3 text-white transition-colors ${
                          isAssignedElsewhere
                            ? "opacity-60 cursor-not-allowed bg-card"
                            : "hover:bg-card"
                        }`}
                      >
                        <div className="space-y-1 text-sm">
                          <div>
                            Table {table.numero} — {table.capacite} places
                          </div>
                          <div className="text-xs text-text-gray">
                            {table.emplacement || "Sans emplacement"}
                            {isAssignedElsewhere ? " — assignée" : ""}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={Boolean(isAssignedElsewhere)}
                          onChange={() => toggleNewEmployeTable(tableId)}
                          className="h-4 w-4 rounded border-white text-primary accent-primary"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <input
              type="number"
              placeholder="Salaire mensuel"
              value={newEmploye.salaire}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, salaire: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={newEmploye.username}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, username: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={newEmploye.password}
              onChange={(e) =>
                setNewEmploye({ ...newEmploye, password: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
          </form>
        </Modal>

        {/* ─── Modale : Modifier un compte ─── */}
        <Modal
          open={modalEdit && !!editingEmploye}
          onClose={() => {
            setModalEdit(false);
            setEditingEmploye(null);
          }}
          title="Modifier un compte utilisateur"
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setModalEdit(false);
                  setEditingEmploye(null);
                }}
                className="px-4 py-2 rounded-lg bg-card-light text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="form-edit-employe"
                className="px-4 py-2 rounded-lg bg-primary text-white"
              >
                Enregistrer
              </button>
            </>
          }
        >
          {editingEmploye && (
            <form
              id="form-edit-employe"
              onSubmit={handleUpdateEmploye}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={editingEmploye.username || ""}
                onChange={(e) =>
                  setEditingEmploye({
                    ...editingEmploye,
                    username: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                required
              />
              <select
                value={editingEmploye.role}
                onChange={(e) =>
                  setEditingEmploye({
                    ...editingEmploye,
                    role: e.target.value,
                    tables_ids:
                      e.target.value === "serveur" ? editingEmploye.tables_ids : [],
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              >
                <option value="serveur">Serveur</option>
                <option value="caissier">Caissier</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
              {editingEmploye.role === "serveur" && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-text-gray mb-2">
                    Tables disponibles
                  </label>
                  <div className="grid gap-2 max-h-72 overflow-y-auto rounded-lg border border-card-light p-3 bg-card-light/20">
                    {tables.map((table) => {
                      const tableId = String(table.id);
                      const isAssignedToCurrent =
                        table.serveur_id === editingEmploye.user_id;
                      const isAssignedElsewhere =
                        table.serveur_id && table.serveur_id !== editingEmploye.user_id;
                      const isChecked = editingEmploye.tables_ids?.includes(tableId);
                      return (
                        <label
                          key={table.id}
                          className={`flex items-center justify-between gap-3 rounded-lg p-3 text-white transition-colors ${
                            isAssignedElsewhere
                              ? "opacity-60 cursor-not-allowed bg-card"
                              : "hover:bg-card"
                          }`}
                        >
                          <div className="space-y-1 text-sm">
                            <div>
                              Table {table.numero} — {table.capacite} places
                            </div>
                            <div className="text-xs text-text-gray">
                              {table.emplacement || "Sans emplacement"}
                              {isAssignedToCurrent
                                ? " — assignée à ce serveur"
                                : isAssignedElsewhere
                                ? " — assignée à un autre serveur"
                                : " — libre"}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            disabled={Boolean(isAssignedElsewhere)}
                            onChange={() => toggleEditingEmployeTable(tableId)}
                            className="h-4 w-4 rounded border-white text-primary accent-primary"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <input
                type="text"
                placeholder="Nom"
                value={editingEmploye.nom}
                onChange={(e) =>
                  setEditingEmploye({ ...editingEmploye, nom: e.target.value })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                required
              />
              <input
                type="text"
                placeholder="Prénom"
                value={editingEmploye.prenom}
                onChange={(e) =>
                  setEditingEmploye({
                    ...editingEmploye,
                    prenom: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={editingEmploye.email}
                onChange={(e) =>
                  setEditingEmploye({
                    ...editingEmploye,
                    email: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                required
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={editingEmploye.telephone}
                onChange={(e) =>
                  setEditingEmploye({
                    ...editingEmploye,
                    telephone: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                required
              />
              <input
                type="number"
                placeholder="Salaire mensuel"
                value={editingEmploye.salaire_mensuel}
                onChange={(e) =>
                  setEditingEmploye({
                    ...editingEmploye,
                    salaire_mensuel: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white md:col-span-2"
              />
            </form>
          )}
        </Modal>

        {/* ─── Modale : Supprimer un compte ─── */}
        <Modal
          open={!!modalDelete}
          onClose={() => setModalDelete(null)}
          title="Supprimer un compte utilisateur"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setModalDelete(null)}
                className="px-4 py-2 rounded-lg bg-card-light text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() =>
                  modalDelete &&
                  handleDeleteEmploye(modalDelete.id, modalDelete.role)
                }
                className="px-4 py-2 rounded-lg bg-red-500/80 text-white"
              >
                Confirmer la suppression
              </button>
            </>
          }
        >
          <p className="text-text-gray text-sm">
            Êtes-vous sûr de vouloir supprimer définitivement ce compte ? Cette
            action est irréversible.
          </p>
        </Modal>

        {/* ─── Modale : Créer une table ─── */}
        <Modal
          open={modalCreateTable}
          onClose={() => setModalCreateTable(false)}
          title="Nouvelle table"
          size="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setModalCreateTable(false)}
                className="px-4 py-2 rounded-lg bg-card-light text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="form-create-table"
                className="px-4 py-2 rounded-lg bg-primary text-white"
              >
                Enregistrer
              </button>
            </>
          }
        >
          <form
            id="form-create-table"
            onSubmit={handleCreateTable}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Numéro de table"
              value={newTable.numero}
              onChange={(e) =>
                setNewTable({ ...newTable, numero: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              required
            />
            <input
              type="number"
              placeholder="Nombre de places"
              value={newTable.capacite}
              onChange={(e) =>
                setNewTable({
                  ...newTable,
                  capacite: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              min={1}
              required
            />
            <input
              type="text"
              placeholder="Emplacement"
              value={newTable.emplacement}
              onChange={(e) =>
                setNewTable({ ...newTable, emplacement: e.target.value })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
            />
            <select
              value={newTable.serveur_id}
              onChange={(e) =>
                setNewTable({
                  ...newTable,
                  serveur_id: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
            >
              <option value="">Sans serveur assigné</option>
              {employes
                .filter((emp: any) => emp.role === "serveur")
                .map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.prenom} {emp.nom}
                  </option>
                ))}
            </select>
          </form>
        </Modal>

        {/* ─── Modale : Modifier une table ─── */}
        <Modal
          open={modalEditTable && !!editingTable}
          onClose={() => {
            setModalEditTable(false);
            setEditingTable(null);
          }}
          title="Modifier la table"
          size="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setModalEditTable(false);
                  setEditingTable(null);
                }}
                className="px-4 py-2 rounded-lg bg-card-light text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="form-edit-table"
                className="px-4 py-2 rounded-lg bg-primary text-white"
              >
                Enregistrer
              </button>
            </>
          }
        >
          {editingTable && (
            <form
              id="form-edit-table"
              onSubmit={handleUpdateTable}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Numéro de table"
                value={editingTable.numero}
                onChange={(e) =>
                  setEditingTable({ ...editingTable, numero: e.target.value })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                required
              />
              <input
                type="number"
                placeholder="Nombre de places"
                value={editingTable.capacite}
                onChange={(e) =>
                  setEditingTable({
                    ...editingTable,
                    capacite: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
                min={1}
                required
              />
              <input
                type="text"
                placeholder="Emplacement"
                value={editingTable.emplacement || ""}
                onChange={(e) =>
                  setEditingTable({
                    ...editingTable,
                    emplacement: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-card-light border border-card-light rounded-lg text-white"
              />
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Admin;
