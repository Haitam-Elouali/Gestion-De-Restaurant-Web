import React, { useState, useEffect } from 'react'
import { Categorie, Plat } from '../types'

// Mapping des noms de plats aux images locales
const getLocalImageForPlat = (platNom: string): string => {
  const normalized = platNom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // Mapping des plats aux images locales
  if (normalized.includes('couscous')) return '/Couscous_aux_Sept_Légumes.jpg'
  if (normalized.includes('harira')) return '/Harira.jpg'
  if (normalized.includes('kefta')) return '/Kefta-marocaine-11-1-683x1024.jpg'
  if (normalized.includes('pastilla')) return '/Pastilla-au-poulet..jpg'
  if (normalized.includes('tanjia')) return '/Tanjia_93ece5e9f0.jpg'
  if (normalized.includes('briouate')) return '/briouate.jpeg'
  if (normalized.includes('the') || normalized.includes('thé') || normalized.includes('menthe')) return '/i87129-the-marocain-a-la-menthe.jpg'
  if (normalized.includes('poulet') && normalized.includes('riz')) return '/polet_au_riz.webp'
  if (normalized.includes('tajine') || normalized.includes('tagine')) return '/tajine-poulet-olive-citron-768x512.webp'
  if (normalized.includes('zaalook') || normalized.includes('zaaalook')) return '/zaaalook.jpg'
  if (normalized.includes('caramel') || normalized.includes('caramel') || normalized.includes('glace')) return '/caramel-topped-ice-cream.jpg'
  
  // Image par défaut si aucune correspondance
  return '/logo.png'
}

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
    <div className="pt-32 pb-16 px-4 bg-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-white">Notre Menu</h1>
        {categories.map(cat => (
          <div key={cat.id} className="mb-12">
            <div className="border-b-4 border-primary mb-6 pb-2">
              <h2 className="text-3xl font-bold text-white">{cat.nom}</h2>
              {cat.description && <p className="text-text-gray mt-2">{cat.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.plats.filter(p => p.disponible).map(plat => (
                <div key={plat.id} className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-card-light">
                  <img
                    src={getLocalImageForPlat(plat.nom)}
                    alt={plat.nom}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png'
                    }}
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white">{plat.nom}</h3>
                    <p className="text-text-gray mb-4">{plat.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">{plat.prix} DH</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${plat.disponible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {plat.disponible ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cat.plats.filter(p => p.disponible).length === 0 && (
              <p className="text-text-gray italic text-center py-8">Aucun plat disponible dans cette catégorie.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Menu
