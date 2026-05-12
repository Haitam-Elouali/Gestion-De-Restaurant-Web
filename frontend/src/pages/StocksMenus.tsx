import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { fetchAuthStatus } from '../lib/auth'
import { formatCurrency } from '../lib/utils'
import { Categorie, IngredientLink, Plat, StockItem, User } from '../types'

const emptyIngredient = {
  nom: '',
  unite: 'kg',
  quantite_stock: 0,
  seuil_alerte: 5,
}

const emptyCategory = {
  nom: '',
  description: '',
}

const emptyPlat = {
  nom: '',
  description: '',
  prix: 0,
  categorie_id: '',
  disponible: true,
  ingredients: [] as IngredientLink[],
}

const StocksMenus: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [ingredients, setIngredients] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [plats, setPlats] = useState<Plat[]>([])
  const [ingredientForm, setIngredientForm] = useState(emptyIngredient)
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [platForm, setPlatForm] = useState(emptyPlat)
  const [editingIngredient, setEditingIngredient] = useState<StockItem | null>(null)
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null)
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

    const [ingredientsRes, categoriesRes, platsRes] = await Promise.all([
      fetch('/api/ingredients/', { credentials: 'include' }),
      fetch('/api/categories/', { credentials: 'include' }),
      fetch('/api/plats/', { credentials: 'include' }),
    ])

    const [ingredientsData, categoriesData, platsData] = await Promise.all([
      ingredientsRes.json(),
      categoriesRes.json(),
      platsRes.json(),
    ])

    setIngredients(ingredientsData.ingredients ?? [])
    setCategories(categoriesData.categories ?? [])
    setPlats(platsData.plats ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [navigate])

  const ingredientOptions = useMemo(
    () => ingredients.map((ingredient) => ({ value: ingredient.id, label: `${ingredient.nom} (${ingredient.unite})` })),
    [ingredients],
  )

  const updatePlatIngredient = (index: number, patch: Partial<IngredientLink>) => {
    const next = [...platForm.ingredients]
    next[index] = { ...next[index], ...patch }
    setPlatForm({ ...platForm, ingredients: next })
  }

  const submitIngredient = async (event: React.FormEvent) => {
    event.preventDefault()
    const endpoint = editingIngredient
      ? `/api/ingredients/${editingIngredient.id}/update/`
      : '/api/ingredients/create/'
    const method = editingIngredient ? 'PUT' : 'POST'
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editingIngredient ?? ingredientForm),
    })
    const data = await response.json()
    setMessage(data.message || (editingIngredient ? 'Ingredient mis a jour.' : 'Ingredient cree.'))
    setEditingIngredient(null)
    setIngredientForm(emptyIngredient)
    await loadData()
  }

  const removeIngredient = async (ingredient: StockItem) => {
    if (!window.confirm(`Supprimer ${ingredient.nom} ?`)) return
    const response = await fetch(`/api/ingredients/${ingredient.id}/delete/`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await response.json()
    setMessage(data.message || 'Ingredient supprime.')
    await loadData()
  }

  const adjustStock = async (ingredient: StockItem, kind: 'add' | 'remove') => {
    const input = window.prompt(
      kind === 'add'
        ? `Quantite a ajouter pour ${ingredient.nom} (${ingredient.unite})`
        : `Quantite a retirer pour ${ingredient.nom} (${ingredient.unite})`,
      '1',
    )
    if (!input) return
    const endpoint = kind === 'add'
      ? `/api/ingredients/${ingredient.id}/ajouter-stock/`
      : `/api/ingredients/${ingredient.id}/retirer-stock/`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantite: Number(input) }),
    })
    const data = await response.json()
    setMessage(data.message || 'Stock mis a jour.')
    await loadData()
  }

  const submitCategory = async (event: React.FormEvent) => {
    event.preventDefault()
    const response = await fetch('/api/categories/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(categoryForm),
    })
    const data = await response.json()
    setMessage(data.message || 'Categorie creee.')
    setCategoryForm(emptyCategory)
    await loadData()
  }

  const deleteCategory = async (categorie: Categorie) => {
    if (!window.confirm(`Supprimer la categorie ${categorie.nom} ?`)) return
    const response = await fetch(`/api/categories/${categorie.id}/delete/`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await response.json()
    setMessage(data.message || 'Categorie supprimee.')
    await loadData()
  }

  const submitPlat = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      ...(editingPlat ?? platForm),
      categorie_id: Number((editingPlat?.categorie_id ?? platForm.categorie_id) || 0),
      ingredients: (editingPlat?.ingredients ?? platForm.ingredients).filter((ingredient) => ingredient.ingredient_id && ingredient.quantite_necessaire > 0),
    }

    const response = await fetch(
      editingPlat ? `/api/plats/${editingPlat.id}/update/` : '/api/plats/create/',
      {
        method: editingPlat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      },
    )
    const data = await response.json()
    setMessage(data.message || (editingPlat ? 'Plat mis a jour.' : 'Plat cree.'))
    setEditingPlat(null)
    setPlatForm(emptyPlat)
    await loadData()
  }

  const deletePlat = async (plat: Plat) => {
    if (!window.confirm(`Supprimer le plat ${plat.nom} ?`)) return
    const response = await fetch(`/api/plats/${plat.id}/delete/`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await response.json()
    setMessage(data.message || 'Plat supprime.')
    await loadData()
  }

  if (loading) {
    return <div className="pt-32 pb-16 px-4 bg-dark min-h-screen text-white">Chargement des stocks et menus...</div>
  }

  const ingredientDraft = editingIngredient ?? ingredientForm
  const platDraft = editingPlat ?? platForm

  return (
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Stocks & Menus</h1>
            <p className="text-text-gray mt-2">CRUD ingredients, categories et plats avec liaison recette/stock.</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-card-light bg-card text-white hover:bg-card-light"
          >
            <RefreshCw size={16} />
            Rafraichir
          </button>
        </div>

        {message && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Catalogue des plats</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlat(null)
                    setPlatForm(emptyPlat)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
                >
                  <Plus size={16} />
                  Nouveau plat
                </button>
              </div>

              <form onSubmit={submitPlat} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nom du plat"
                    value={platDraft.nom}
                    onChange={(event) =>
                      editingPlat
                        ? setEditingPlat({ ...editingPlat, nom: event.target.value })
                        : setPlatForm({ ...platForm, nom: event.target.value })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <select
                    value={platDraft.categorie_id}
                    onChange={(event) =>
                      editingPlat
                        ? setEditingPlat({ ...editingPlat, categorie_id: Number(event.target.value) })
                        : setPlatForm({ ...platForm, categorie_id: event.target.value })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  >
                    <option value="">Selectionner une categorie</option>
                    {categories.map((categorie) => (
                      <option key={categorie.id} value={categorie.id}>{categorie.nom}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={platDraft.description}
                  onChange={(event) =>
                    editingPlat
                      ? setEditingPlat({ ...editingPlat, description: event.target.value })
                      : setPlatForm({ ...platForm, description: event.target.value })
                  }
                  className="w-full px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={platDraft.prix}
                    onChange={(event) =>
                      editingPlat
                        ? setEditingPlat({ ...editingPlat, prix: Number(event.target.value) })
                        : setPlatForm({ ...platForm, prix: Number(event.target.value) })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    placeholder="Prix"
                    required
                  />
                  <label className="flex items-center gap-3 px-4 py-3 bg-card-light border border-card-light rounded-lg text-white">
                    <input
                      type="checkbox"
                      checked={platDraft.disponible}
                      onChange={(event) =>
                        editingPlat
                          ? setEditingPlat({ ...editingPlat, disponible: event.target.checked })
                          : setPlatForm({ ...platForm, disponible: event.target.checked })
                      }
                    />
                    Disponible
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Ingredients de la recette</h3>
                    <button
                      type="button"
                      onClick={() =>
                        editingPlat
                          ? setEditingPlat({ ...editingPlat, ingredients: [...(editingPlat.ingredients ?? []), { ingredient_id: 0, quantite_necessaire: 1 }] })
                          : setPlatForm({ ...platForm, ingredients: [...platForm.ingredients, { ingredient_id: 0, quantite_necessaire: 1 }] })
                      }
                      className="text-sm text-primary"
                    >
                      Ajouter un ingredient
                    </button>
                  </div>
                  {(platDraft.ingredients ?? []).map((ingredient, index) => (
                    <div key={`${ingredient.ingredient_id}-${index}`} className="grid grid-cols-[1fr_140px_80px] gap-3">
                      <select
                        value={ingredient.ingredient_id}
                        onChange={(event) => {
                          const selectedId = Number(event.target.value)
                          if (editingPlat) {
                            const next = [...(editingPlat.ingredients ?? [])]
                            next[index] = { ...next[index], ingredient_id: selectedId }
                            setEditingPlat({ ...editingPlat, ingredients: next })
                          } else {
                            updatePlatIngredient(index, { ingredient_id: selectedId })
                          }
                        }}
                        className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                      >
                        <option value={0}>Choisir un ingredient</option>
                        {ingredientOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={ingredient.quantite_necessaire}
                        onChange={(event) => {
                          const value = Number(event.target.value)
                          if (editingPlat) {
                            const next = [...(editingPlat.ingredients ?? [])]
                            next[index] = { ...next[index], quantite_necessaire: value }
                            setEditingPlat({ ...editingPlat, ingredients: next })
                          } else {
                            updatePlatIngredient(index, { quantite_necessaire: value })
                          }
                        }}
                        className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editingPlat) {
                            setEditingPlat({
                              ...editingPlat,
                              ingredients: (editingPlat.ingredients ?? []).filter((_, itemIndex) => itemIndex !== index),
                            })
                          } else {
                            setPlatForm({
                              ...platForm,
                              ingredients: platForm.ingredients.filter((_, itemIndex) => itemIndex !== index),
                            })
                          }
                        }}
                        className="rounded-lg bg-red-500/15 text-red-300"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90">
                    {editingPlat ? 'Mettre a jour le plat' : 'Creer le plat'}
                  </button>
                  {editingPlat && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlat(null)
                        setPlatForm(emptyPlat)
                      }}
                      className="px-6 py-3 rounded-lg border border-card-light text-white"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card-light">
                      <th className="text-left py-3 px-4 text-text-gray font-medium">Nom</th>
                      <th className="text-left py-3 px-4 text-text-gray font-medium">Categorie</th>
                      <th className="text-left py-3 px-4 text-text-gray font-medium">Prix</th>
                      <th className="text-left py-3 px-4 text-text-gray font-medium">Disponibilite</th>
                      <th className="text-left py-3 px-4 text-text-gray font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plats.map((plat) => (
                      <tr key={plat.id} className="border-b border-card-light hover:bg-card-light/50">
                        <td className="py-3 px-4 text-white">{plat.nom}</td>
                        <td className="py-3 px-4 text-white">{plat.categorie_nom}</td>
                        <td className="py-3 px-4 text-white">{formatCurrency(plat.prix)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${plat.disponible ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                            {plat.disponible ? 'Disponible' : 'Indisponible'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => setEditingPlat(plat)} className="p-2 rounded-lg bg-blue-500/15 text-blue-300">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => deletePlat(plat)} className="p-2 rounded-lg bg-red-500/15 text-red-300">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Categories</h2>
              <form onSubmit={submitCategory} className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_auto] gap-3 mb-5">
                <input
                  type="text"
                  placeholder="Nom de la categorie"
                  value={categoryForm.nom}
                  onChange={(event) => setCategoryForm({ ...categoryForm, nom: event.target.value })}
                  className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                  className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                />
                <button type="submit" className="px-4 py-3 bg-primary text-white rounded-lg">Ajouter</button>
              </form>
              <div className="space-y-3">
                {categories.map((categorie) => (
                  <div key={categorie.id} className="flex items-center justify-between rounded-xl bg-card-light p-4">
                    <div>
                      <p className="text-white font-medium">{categorie.nom}</p>
                      <p className="text-sm text-text-gray mt-1">{categorie.description}</p>
                    </div>
                    <button onClick={() => deleteCategory(categorie)} className="p-2 rounded-lg bg-red-500/15 text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-card-light p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Gestion des stocks</h2>
              <form onSubmit={submitIngredient} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nom de l'ingredient"
                    value={ingredientDraft.nom}
                    onChange={(event) =>
                      editingIngredient
                        ? setEditingIngredient({ ...editingIngredient, nom: event.target.value })
                        : setIngredientForm({ ...ingredientForm, nom: event.target.value })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Unite"
                    value={ingredientDraft.unite}
                    onChange={(event) =>
                      editingIngredient
                        ? setEditingIngredient({ ...editingIngredient, unite: event.target.value })
                        : setIngredientForm({ ...ingredientForm, unite: event.target.value })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={ingredientDraft.quantite_stock}
                    onChange={(event) =>
                      editingIngredient
                        ? setEditingIngredient({ ...editingIngredient, quantite_stock: Number(event.target.value) })
                        : setIngredientForm({ ...ingredientForm, quantite_stock: Number(event.target.value) })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    placeholder="Quantite en stock"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={ingredientDraft.seuil_alerte}
                    onChange={(event) =>
                      editingIngredient
                        ? setEditingIngredient({ ...editingIngredient, seuil_alerte: Number(event.target.value) })
                        : setIngredientForm({ ...ingredientForm, seuil_alerte: Number(event.target.value) })
                    }
                    className="px-4 py-3 bg-card-light border border-card-light rounded-lg text-white"
                    placeholder="Seuil d'alerte"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-3 bg-primary text-white rounded-lg">
                    {editingIngredient ? 'Mettre a jour' : 'Creer l ingredient'}
                  </button>
                  {editingIngredient && (
                    <button type="button" onClick={() => setEditingIngredient(null)} className="px-6 py-3 rounded-lg border border-card-light text-white">
                      Annuler
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-3 max-h-[980px] overflow-y-auto pr-1">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="rounded-xl border border-card-light bg-card-light p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{ingredient.nom}</p>
                        <p className="text-sm text-text-gray mt-1">
                          {ingredient.quantite_stock} {ingredient.unite} - seuil {ingredient.seuil_alerte} {ingredient.unite}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                        ingredient.est_en_alerte ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'
                      }`}>
                        {ingredient.est_en_alerte ? <AlertTriangle size={12} /> : <Check size={12} />}
                        {ingredient.est_en_alerte ? 'Alerte' : 'OK'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => adjustStock(ingredient, 'add')} className="px-3 py-2 rounded-lg bg-green-500/15 text-green-300">
                        + Stock
                      </button>
                      <button onClick={() => adjustStock(ingredient, 'remove')} className="px-3 py-2 rounded-lg bg-yellow-500/15 text-yellow-300">
                        - Stock
                      </button>
                      <button onClick={() => setEditingIngredient(ingredient)} className="p-2 rounded-lg bg-blue-500/15 text-blue-300">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => removeIngredient(ingredient)} className="p-2 rounded-lg bg-red-500/15 text-red-300">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StocksMenus
