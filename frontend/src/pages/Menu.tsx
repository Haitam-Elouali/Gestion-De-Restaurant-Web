import React, { useState, useEffect } from 'react'
import { Categorie, Plat } from '../types'

const Menu: React.FC = () => {
  const [categories, setCategories] = useState<{ id: number; nom: string; description: string; plats: Plat[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/menu/')
      .then(res => res.json())
      .then((data: { categories: { id: number; nom: string; description: string; plats: Plat[] }[] }) => {
        setCategories(data.categories)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement du menu...</div>
  }

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Notre Menu</h1>
        {categories.map(cat => (
          <div key={cat.id} className="mb-12">
            <div className="border-b-4 border-primary mb-6 pb-2">
              <h2 className="text-3xl font-bold text-gray-800">{cat.nom}</h2>
              {cat.description && <p className="text-gray-600 mt-2">{cat.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.plats.filter(p => p.disponible).map(plat => (
                <div key={plat.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {plat.image && (
                    <img
                      src={`http://127.0.0.1:8000${plat.image}`}
                      alt={plat.nom}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{plat.nom}</h3>
                    <p className="text-gray-600 mb-4">{plat.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">{plat.prix} DH</span>
                      <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors">
                        Commander
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cat.plats.filter(p => p.disponible).length === 0 && (
              <p className="text-gray-400 italic text-center py-8">Aucun plat disponible dans cette catégorie.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Menu
