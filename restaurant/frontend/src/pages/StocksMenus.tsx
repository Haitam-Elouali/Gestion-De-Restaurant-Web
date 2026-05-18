import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  Edit,
  Package,
  Plus,
  Tag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { fetchAuthStatus } from "../lib/auth";
import { formatCurrency } from "../lib/utils";
import { Categorie, IngredientLink, Plat, StockItem, User } from "../types";
import BrowserTabs from "../components/BrowserTabs";
import Modal from "../components/Modal";
import FlashMessage from "../components/FlashMessage";

// ─── Valeurs par défaut des formulaires ──────────────────────────────────────

const emptyIngredient = {
  nom: "",
  unite: "kg",
  quantite_stock: 0,
  seuil_alerte: 5,
};
const emptyCategory = { nom: "", description: "" };
const emptyPlat = {
  nom: "",
  description: "",
  prix: 0,
  categorie_id: "",
  disponible: true,
  ingredients: [] as IngredientLink[],
};

// ─── Composant principal ──────────────────────────────────────────────────────

const StocksMenus: React.FC = () => {
  // ── Données ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [ingredients, setIngredients] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [plats, setPlats] = useState<Plat[]>([]);
  const navigate = useNavigate();

  // ── Navigation par onglets ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("stocks");
  const [menuSubTab, setMenuSubTab] = useState<"plats" | "categories">("plats");

  // ── Modal : ingrédient (créer / modifier) ────────────────────────────────
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<StockItem | null>(
    null,
  );
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient);

  // ── Modal : ajustement de stock ──────────────────────────────────────────
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{
    ingredient: StockItem;
    kind: "add" | "remove";
  } | null>(null);
  const [adjustQuantite, setAdjustQuantite] = useState(1);

  // ── Modal : confirmation suppression ingrédient ──────────────────────────
  const [deleteIngredientModalOpen, setDeleteIngredientModalOpen] =
    useState(false);
  const [deleteIngredientTarget, setDeleteIngredientTarget] =
    useState<StockItem | null>(null);

  // ── Modal : catégorie ────────────────────────────────────────────────────
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  // ── Modal : confirmation suppression catégorie ───────────────────────────
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<Categorie | null>(null);

  // ── Modal : plat (créer / modifier) ─────────────────────────────────────
  const [platModalOpen, setPlatModalOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  const [platForm, setPlatForm] = useState(emptyPlat);

  // ── Modal : confirmation suppression plat ────────────────────────────────
  const [deletePlatModalOpen, setDeletePlatModalOpen] = useState(false);
  const [deletePlatTarget, setDeletePlatTarget] = useState<Plat | null>(null);

  // ─── Chargement des données ───────────────────────────────────────────────

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

    const [ingredientsRes, categoriesRes, platsRes] = await Promise.all([
      fetch("/api/ingredients/", { credentials: "include" }),
      fetch("/api/categories/", { credentials: "include" }),
      fetch("/api/plats/", { credentials: "include" }),
    ]);
    const [ingredientsData, categoriesData, platsData] = await Promise.all([
      ingredientsRes.json(),
      categoriesRes.json(),
      platsRes.json(),
    ]);
    setIngredients(ingredientsData.ingredients ?? []);
    setCategories(categoriesData.categories ?? []);
    setPlats(platsData.plats ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  // ─── Options ingrédients pour le formulaire plat ──────────────────────────

  const ingredientOptions = useMemo(
    () =>
      ingredients.map((i) => ({ value: i.id, label: `${i.nom} (${i.unite})` })),
    [ingredients],
  );

  // ─── Helpers d'ouverture des modales ─────────────────────────────────────

  const openNewIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm(emptyIngredient);
    setIngredientModalOpen(true);
  };

  const openEditIngredient = (ingredient: StockItem) => {
    setEditingIngredient(ingredient);
    setIngredientForm({
      nom: ingredient.nom,
      unite: ingredient.unite,
      quantite_stock: ingredient.quantite_stock,
      seuil_alerte: ingredient.seuil_alerte,
    });
    setIngredientModalOpen(true);
  };

  const openAdjustStock = (ingredient: StockItem, kind: "add" | "remove") => {
    setAdjustTarget({ ingredient, kind });
    setAdjustQuantite(1);
    setAdjustModalOpen(true);
  };

  const openDeleteIngredient = (ingredient: StockItem) => {
    setDeleteIngredientTarget(ingredient);
    setDeleteIngredientModalOpen(true);
  };

  const openNewPlat = () => {
    setEditingPlat(null);
    setPlatForm(emptyPlat);
    setPlatModalOpen(true);
  };

  const openEditPlat = (plat: Plat) => {
    setEditingPlat(plat);
    setPlatForm({
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      categorie_id: String(plat.categorie_id),
      disponible: plat.disponible,
      ingredients: plat.ingredients ?? [],
    });
    setPlatModalOpen(true);
  };

  const openDeletePlat = (plat: Plat) => {
    setDeletePlatTarget(plat);
    setDeletePlatModalOpen(true);
  };

  const openDeleteCategory = (categorie: Categorie) => {
    setDeleteCategoryTarget(categorie);
    setDeleteCategoryModalOpen(true);
  };

  // ─── Handlers des formulaires ─────────────────────────────────────────────

  const submitIngredient = async (event: React.FormEvent) => {
    event.preventDefault();
    const endpoint = editingIngredient
      ? `/api/ingredients/${editingIngredient.id}/update/`
      : "/api/ingredients/create/";
    const method = editingIngredient ? "PUT" : "POST";
    let response;
    try {
      response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ingredientForm),
      });
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(
      data.message ||
        (editingIngredient
          ? "✅ Ingrédient mis à jour."
          : "✅ Ingrédient créé."),
    );
    setIngredientModalOpen(false);
    await loadData();
  };

  const submitAdjustStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adjustTarget) return;
    const endpoint =
      adjustTarget.kind === "add"
        ? `/api/ingredients/${adjustTarget.ingredient.id}/ajouter-stock/`
        : `/api/ingredients/${adjustTarget.ingredient.id}/retirer-stock/`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantite: adjustQuantite }),
      });
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(data.message || "✅ Stock mis a jour.");
    setAdjustModalOpen(false);
    await loadData();
  };

  const confirmDeleteIngredient = async () => {
    if (!deleteIngredientTarget) return;
    let response;
    try {
      response = await fetch(
        `/api/ingredients/${deleteIngredientTarget.id}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(data.message || "✅ Ingrédient supprimé.");
    setDeleteIngredientModalOpen(false);
    await loadData();
  };

  const submitCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    let response;
    try {
      response = await fetch("/api/categories/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(categoryForm),
      });
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(data.message || "✅ Catégorie créée.");
    setCategoryModalOpen(false);
    setCategoryForm(emptyCategory);
    await loadData();
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    let response;
    try {
      response = await fetch(
        `/api/categories/${deleteCategoryTarget.id}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(data.message || "✅ Catégorie supprimée.");
    setDeleteCategoryModalOpen(false);
    await loadData();
  };

  const submitPlat = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...platForm,
      categorie_id: Number(platForm.categorie_id) || 0,
      ingredients: platForm.ingredients.filter(
        (i) => i.ingredient_id && i.quantite_necessaire > 0,
      ),
    };
    let response;
    try {
      response = await fetch(
        editingPlat
          ? `/api/plats/${editingPlat.id}/update/`
          : "/api/plats/create/",
        {
          method: editingPlat ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(
      data.message || (editingPlat ? "✅ Plat mis à jour." : "✅ Plat créé."),
    );
    setPlatModalOpen(false);
    await loadData();
  };

  const confirmDeletePlat = async () => {
    if (!deletePlatTarget) return;
    let response;
    try {
      response = await fetch(`/api/plats/${deletePlatTarget.id}/delete/`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      setFlash("Erreur reseau. Veuillez reessayer.");
      return;
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Erreur serveur." }));
      setFlash(err.message || "Erreur serveur.");
      return;
    }
    const data = await response.json();
    setFlash(data.message || "✅ Plat supprimé.");
    setDeletePlatModalOpen(false);
    await loadData();
  };

  // ─── Helpers ingrédients du formulaire plat ───────────────────────────────

  const addPlatIngredient = () => {
    setPlatForm({
      ...platForm,
      ingredients: [
        ...platForm.ingredients,
        { ingredient_id: 0, quantite_necessaire: 1 },
      ],
    });
  };

  const updatePlatIngredient = (
    index: number,
    patch: Partial<IngredientLink>,
  ) => {
    const next = [...platForm.ingredients];
    next[index] = { ...next[index], ...patch };
    setPlatForm({ ...platForm, ingredients: next });
  };

  const removePlatIngredient = (index: number) => {
    setPlatForm({
      ...platForm,
      ingredients: platForm.ingredients.filter((_, i) => i !== index),
    });
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-text-gray">
        Chargement des stocks et menus…
      </div>
    );
  }

  const mainTabs = [
    { id: "stocks", label: "Gestion des stocks", icon: <Package size={16} /> },
    {
      id: "menus",
      label: "Catalogue des menus",
      icon: <UtensilsCrossed size={16} />,
    },
  ];

  // ─── Bouton Cancel réutilisable ───────────────────────────────────────────
  const CancelBtn = ({ onClose }: { onClose: () => void }) => (
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 rounded-lg border border-card-light text-white hover:bg-card-light transition-colors"
    >
      Annuler
    </button>
  );

  const SaveBtn = ({ form }: { form: string }) => (
    <button
      type="submit"
      form={form}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
    >
      Enregistrer
    </button>
  );

  const DeleteConfirmBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity"
    >
      <Trash2 size={15} />
      Supprimer
    </button>
  );

  const inputCls =
    "w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white placeholder:text-text-gray/50 focus:outline-none focus:ring-1 focus:ring-primary/50";
  const labelCls = "block text-sm text-text-gray mb-1.5";

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── En-tête ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Stocks &amp; Menus
            </h1>
            <p className="text-text-gray mt-2">
              Gestion des ingrédients, catégories et plats.
            </p>
          </div>
        </div> {/* 1. Correction : Fermeture de la div d'en-tête */}

        {/* ── Onglets principaux ── */}
        <BrowserTabs
          tabs={mainTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {/* ════════════ Onglet : Gestion des stocks ════════════ */}
          {activeTab === "stocks" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Ingrédients en stock
                  <span className="ml-2 text-sm font-normal text-text-gray">
                    ({ingredients.length})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={openNewIngredient}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} />
                  Ajouter un ingrédient
                </button>
              </div>

              {ingredients.length === 0 ? (
                <p className="text-center text-text-gray py-12">
                  Aucun ingrédient enregistré.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="rounded-xl border border-card-light bg-card-light p-4"
                    >
                      {/* Nom + badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">
                            {ingredient.nom}
                          </p>
                          <p className="text-sm text-text-gray mt-0.5">
                            {ingredient.quantite_stock}&nbsp;{ingredient.unite}
                            &nbsp;·&nbsp;seuil&nbsp;{ingredient.seuil_alerte}
                            &nbsp;{ingredient.unite}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            ingredient.est_en_alerte
                              ? "bg-red-500/15 text-red-300"
                              : "bg-green-500/15 text-green-300"
                          }`}
                        >
                          {ingredient.est_en_alerte ? (
                            <AlertTriangle size={11} />
                          ) : (
                            <Check size={11} />
                          )}
                          {ingredient.est_en_alerte ? "Alerte" : "OK"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => openAdjustStock(ingredient, "add")}
                          className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-300 text-sm hover:bg-green-500/25 transition-colors"
                        >
                          + Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => openAdjustStock(ingredient, "remove")}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-300 text-sm hover:bg-yellow-500/25 transition-colors"
                        >
                          – Stock
                        </button>
                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditIngredient(ingredient)}
                            className="p-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition-colors"
                            aria-label="Modifier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteIngredient(ingredient)}
                            className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════ Onglet : Catalogue des menus ════════════ */}
          {activeTab === "menus" && (
            <div className="space-y-6">
              {/* Sous-onglets internes */}
              <div className="flex items-center gap-2 border-b border-card-light pb-4">
                <button
                  type="button"
                  onClick={() => setMenuSubTab("plats")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    menuSubTab === "plats"
                      ? "bg-primary text-white"
                      : "bg-card-light/60 text-text-gray hover:text-white hover:bg-card-light"
                  }`}
                >
                  <UtensilsCrossed size={15} />
                  Plats
                </button>
                <button
                  type="button"
                  onClick={() => setMenuSubTab("categories")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    menuSubTab === "categories"
                      ? "bg-primary text-white"
                      : "bg-card-light/60 text-text-gray hover:text-white hover:bg-card-light"
                  }`}
                >
                  <Tag size={15} />
                  Catégories
                </button>
              </div>

              {/* ── Sous-onglet : Plats ── */}
              {menuSubTab === "plats" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      Catalogue des plats
                      <span className="ml-2 text-sm font-normal text-text-gray">
                        ({plats.length})
                      </span>
                    </h2>
                    <button
                      type="button"
                      onClick={openNewPlat}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus size={16} />
                      Créer un plat
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[32%]" />
                        <col className="w-[22%]" />
                        <col className="w-[16%]" />
                        <col className="w-[18%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-card-light">
                          <th className="text-left py-3 px-4 text-text-gray font-medium text-sm">
                            Nom
                          </th>
                          <th className="text-left py-3 px-4 text-text-gray font-medium text-sm">
                            Catégorie
                          </th>
                          <th className="text-left py-3 px-4 text-text-gray font-medium text-sm">
                            Prix
                          </th>
                          <th className="text-left py-3 px-4 text-text-gray font-medium text-sm">
                            Disponibilité
                          </th>
                          <th className="text-left py-3 px-4 text-text-gray font-medium text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plats.map((plat) => (
                          <tr
                            key={plat.id}
                            className="border-b border-card-light hover:bg-card-light/50"
                          >
                            <td className="py-3 px-4 text-white font-medium text-sm break-words">
                              {plat.nom}
                            </td>
                            <td className="py-3 px-4 text-text-gray text-sm break-words">
                              {plat.categorie_nom}
                            </td>
                            <td className="py-3 px-4 text-white text-sm">
                              {formatCurrency(plat.prix)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs inline-flex items-center justify-center ${plat.disponible ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}
                              >
                                {plat.disponible
                                  ? "Disponible"
                                  : "Indisponible"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditPlat(plat)}
                                  className="p-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                                  title="Modifier"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => openDeletePlat(plat)}
                                  className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {plats.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-8 text-center text-text-gray text-sm"
                            >
                              Aucun plat enregistré.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Sous-onglet : Catégories ── */}
              {menuSubTab === "categories" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      Catégories
                      <span className="ml-2 text-sm font-normal text-text-gray">
                        ({categories.length})
                      </span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryForm(emptyCategory);
                        setCategoryModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus size={16} />
                      Créer une catégorie
                    </button>
                  </div>

                  {categories.length === 0 ? (
                    <p className="text-center text-text-gray py-10">
                      Aucune catégorie enregistrée.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {categories.map((categorie) => (
                        <div
                          key={categorie.id}
                          className="flex items-center justify-between rounded-xl border border-card-light bg-card-light p-4"
                        >
                          <div>
                            <p className="text-white font-semibold">
                              {categorie.nom}
                            </p>
                            {categorie.description && (
                              <p className="text-sm text-text-gray mt-0.5">
                                {categorie.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openDeleteCategory(categorie)}
                            className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </BrowserTabs>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Flash message
      ══════════════════════════════════════════════════════════════ */}
      {flash && <FlashMessage message={flash} onClose={() => setFlash("")} />}

      {/* ══════════════════════════════════════════════════════════════
          Modale 1 — Ingrédient (créer / modifier)
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={ingredientModalOpen}
        onClose={() => setIngredientModalOpen(false)}
        title={
          editingIngredient ? "Modifier l'ingrédient" : "Ajouter un ingrédient"
        }
        size="md"
        footer={
          <>
            <CancelBtn onClose={() => setIngredientModalOpen(false)} />
            <SaveBtn form="ingredient-form" />
          </>
        }
      >
        <form
          id="ingredient-form"
          onSubmit={submitIngredient}
          className="space-y-4"
        >
          <div>
            <label className={labelCls}>Nom de l'ingrédient</label>
            <input
              type="text"
              required
              placeholder="Ex : Farine, Lait, Tomate…"
              value={ingredientForm.nom}
              onChange={(e) =>
                setIngredientForm({ ...ingredientForm, nom: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Unité de mesure</label>
            <input
              type="text"
              required
              placeholder="Ex : kg, L, unités, g…"
              value={ingredientForm.unite}
              onChange={(e) =>
                setIngredientForm({ ...ingredientForm, unite: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quantité en stock</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={ingredientForm.quantite_stock}
                onChange={(e) =>
                  setIngredientForm({
                    ...ingredientForm,
                    quantite_stock: Number(e.target.value),
                  })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Seuil d'alerte</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={ingredientForm.seuil_alerte}
                onChange={(e) =>
                  setIngredientForm({
                    ...ingredientForm,
                    seuil_alerte: Number(e.target.value),
                  })
                }
                className={inputCls}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Modale 2 — Ajustement de stock
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={
          adjustTarget?.kind === "add" ? "Ajouter du stock" : "Retirer du stock"
        }
        size="sm"
        footer={
          <>
            <CancelBtn onClose={() => setAdjustModalOpen(false)} />
            <SaveBtn form="adjust-form" />
          </>
        }
      >
        <form
          id="adjust-form"
          onSubmit={submitAdjustStock}
          className="space-y-4"
        >
          {adjustTarget && (
            <p className="text-text-gray text-sm">
              {adjustTarget.kind === "add"
                ? "Quantité à ajouter au stock de"
                : "Quantité à retirer du stock de"}{" "}
              <span className="text-white font-semibold">
                {adjustTarget.ingredient.nom}
              </span>{" "}
              <span className="text-text-gray">
                ({adjustTarget.ingredient.unite})
              </span>
            </p>
          )}
          <div>
            <label className={labelCls}>Quantité</label>
            <input
              type="number"
              required
              min={0.01}
              step="0.01"
              value={adjustQuantite}
              onChange={(e) => setAdjustQuantite(Number(e.target.value))}
              className={inputCls}
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Modale 3 — Confirmation suppression ingrédient
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={deleteIngredientModalOpen}
        onClose={() => setDeleteIngredientModalOpen(false)}
        title="Supprimer l'ingrédient"
        size="sm"
        footer={
          <>
            <CancelBtn onClose={() => setDeleteIngredientModalOpen(false)} />
            <DeleteConfirmBtn onClick={confirmDeleteIngredient} />
          </>
        }
      >
        <p className="text-text-gray leading-relaxed">
          Êtes-vous sûr de vouloir supprimer l'ingrédient{" "}
          <span className="text-white font-semibold">
            «&nbsp;{deleteIngredientTarget?.nom}&nbsp;»
          </span>{" "}
          ? Cette action est irréversible et peut affecter les recettes
          associées.
        </p>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Modale 4 — Catégorie (créer)
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Créer une catégorie"
        size="sm"
        footer={
          <>
            <CancelBtn onClose={() => setCategoryModalOpen(false)} />
            <SaveBtn form="category-form" />
          </>
        }
      >
        <form
          id="category-form"
          onSubmit={submitCategory}
          className="space-y-4"
        >
          <div>
            <label className={labelCls}>Nom de la catégorie</label>
            <input
              type="text"
              required
              placeholder="Ex : Entrées, Plats chauds, Desserts…"
              value={categoryForm.nom}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, nom: e.target.value })
              }
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>
              Description{" "}
              <span className="text-text-gray/60">(optionnelle)</span>
            </label>
            <input
              type="text"
              placeholder="Courte description de la catégorie"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  description: e.target.value,
                })
              }
              className={inputCls}
            />
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Modale 5 — Confirmation suppression catégorie
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={deleteCategoryModalOpen}
        onClose={() => setDeleteCategoryModalOpen(false)}
        title="Supprimer la catégorie"
        size="sm"
        footer={
          <>
            <CancelBtn onClose={() => setDeleteCategoryModalOpen(false)} />
            <DeleteConfirmBtn onClick={confirmDeleteCategory} />
          </>
        }
      >
        <p className="text-text-gray leading-relaxed">
          Êtes-vous sûr de vouloir supprimer la catégorie{" "}
          <span className="text-white font-semibold">
            «&nbsp;{deleteCategoryTarget?.nom}&nbsp;»
          </span>{" "}
          ? Les plats liés à cette catégorie seront impactés.
        </p>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Modale 6 — Plat (créer / modifier)
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={platModalOpen}
        onClose={() => setPlatModalOpen(false)}
        title={editingPlat ? "Modifier le plat" : "Créer un plat"}
        size="xl"
        footer={
          <>
            <CancelBtn onClose={() => setPlatModalOpen(false)} />
            <SaveBtn form="plat-form" />
          </>
        }
      >
        <form id="plat-form" onSubmit={submitPlat} className="space-y-5">
          {/* Nom + Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom du plat</label>
              <input
                type="text"
                required
                placeholder="Ex : Tajine d'agneau"
                value={platForm.nom}
                onChange={(e) =>
                  setPlatForm({ ...platForm, nom: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select
                required
                value={platForm.categorie_id}
                onChange={(e) =>
                  setPlatForm({ ...platForm, categorie_id: e.target.value })
                }
                className={inputCls}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={2}
              placeholder="Description du plat…"
              value={platForm.description}
              onChange={(e) =>
                setPlatForm({ ...platForm, description: e.target.value })
              }
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Prix + Disponibilité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prix (MAD)</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                placeholder="0.00"
                value={platForm.prix}
                onChange={(e) =>
                  setPlatForm({ ...platForm, prix: Number(e.target.value) })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Disponibilité</label>
              <label className="flex items-center gap-3 px-4 py-3 bg-card-light border border-card-light rounded-lg text-white cursor-pointer hover:bg-card-light/80 transition-colors">
                <input
                  type="checkbox"
                  checked={platForm.disponible}
                  onChange={(e) =>
                    setPlatForm({ ...platForm, disponible: e.target.checked })
                  }
                  className="w-4 h-4 accent-primary"
                />
                <span>
                  {platForm.disponible
                    ? "Disponible à la commande"
                    : "Indisponible"}
                </span>
              </label>
            </div>
          </div>

          {/* Ingrédients de la recette */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">
                Ingrédients de la recette
              </h3>
              <button
                type="button"
                onClick={addPlatIngredient}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity"
              >
                <Plus size={14} />
                Ajouter un ingrédient
              </button>
            </div>

            <div className="space-y-2">
              {platForm.ingredients.length === 0 ? (
                <p className="text-sm text-text-gray text-center py-4 rounded-lg border border-dashed border-card-light">
                  Aucun ingrédient ajouté. Cliquez sur «&nbsp;Ajouter un
                  ingrédient&nbsp;» pour commencer.
                </p>
              ) : (
                platForm.ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_160px_auto] gap-3 items-center"
                  >
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) =>
                        updatePlatIngredient(index, {
                          ingredient_id: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    >
                      <option value={0}>Choisir un ingrédient</option>
                      {ingredientOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Quantité"
                      value={ing.quantite_necessaire}
                      onChange={(e) =>
                        updatePlatIngredient(index, {
                          quantite_necessaire: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removePlatIngredient(index)}
                      className="p-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
                      aria-label="Retirer cet ingrédient"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Modale 7 — Confirmation suppression plat
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={deletePlatModalOpen}
        onClose={() => setDeletePlatModalOpen(false)}
        title="Supprimer le plat"
        size="sm"
        footer={
          <>
            <CancelBtn onClose={() => setDeletePlatModalOpen(false)} />
            <DeleteConfirmBtn onClick={confirmDeletePlat} />
          </>
        }
      >
        <p className="text-text-gray leading-relaxed">
          Êtes-vous sûr de vouloir supprimer le plat{" "}
          <span className="text-white font-semibold">
            «&nbsp;{deletePlatTarget?.nom}&nbsp;»
          </span>{" "}
          ? Cette action est irréversible.
        </p>
      </Modal>
    </div> /* 2. Correction : Fermeture de la div racine du return */
  );
}; // 3. Correction : Nettoyage de l'accolade superflue

export default StocksMenus;