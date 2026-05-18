export interface User {
  authenticated: boolean
  username: string
  role: string
  email: string
}

export interface Categorie {
  id: number
  nom: string
  description: string
}

export interface IngredientLink {
  id?: number
  ingredient_id: number
  ingredient_nom?: string
  quantite_necessaire: number
  unite?: string
}

export interface Plat {
  id: number
  nom: string
  description: string
  prix: number
  disponible: boolean
  image: string | null
  categorie_id: number
  categorie_nom: string
  ingredients?: IngredientLink[]
}

export interface Promotion {
  id: number
  nom: string
  description: string
  reduction_pourcentage: number
  date_debut: string
  date_fin: string
  plats_ids: number[]
}

export interface LigneDeCommande {
  id: number
  plat_id: number
  plat_nom: string
  quantite: number
  prix_unitaire: number
  montant_ligne: number
}

export interface TableSummary {
  id: number
  numero: string
  capacite: number
  statut: 'libre' | 'occupee' | 'reservee'
  statut_display?: string
  nombre_clients: number
  commande_actuelle?: {
    id: number
    nom_clt: string
    status: string
    montant_total: number
  } | null
}

export interface Commande {
  id: number
  type: string
  type_display: string
  nom_clt: string
  adresse_liv: string
  status: string
  status_display: string
  date_creation: string
  montant_total: number
  nombre_plats: number
  employe: string | null
  lignes: LigneDeCommande[]
  duree_service?: number
  duree_formatee?: string
  table?: TableSummary | null
}

export interface Employe {
  id: number
  nom: string
  prenom: string
  telephone: string
  email: string
  salaire_mensuel: number
  date_embauche: string
  type: string
  status?: string
}

export interface Reservation {
  id: number
  nom_client: string
  email?: string | null
  telephone: string
  date: string
  heure: string
  nombre_personnes: number
  notes: string
  statut: string
  statut_display?: string
  table_id?: number | null
  table_numero?: string | null
  table_capacite?: number | null
}

export interface Paiement {
  id: number
  commande_id: number
  montant: number
  type: 'cash' | 'carte' | 'cheque'
  date: string
}

export interface Facture {
  id: number
  numero_facture: string
  commande_id: number
  date_facture: string
  date_paiement?: string | null
  montant_total: number
  montant_ht: number
  montant_tva: number
  mode_paiement: string
  mode_paiement_display: string
  reference_paiement?: string | null
  statut: string
  statut_display: string
  caissier?: string | null
  notes?: string | null
  lignes: {
    id: number
    nom_plat: string
    quantite: number
    prix_unitaire: number
    montant_ht: number
    montant_tva: number
    montant_total: number
  }[]
  commande?: {
    id: number
    nom_clt: string
    status: string
    status_display: string
    table_numero?: string | null
  }
}

export interface StockItem {
  id: number
  nom: string
  quantite_stock: number
  unite: string
  seuil_alerte: number
  est_disponible: boolean
  est_en_alerte: boolean
}
