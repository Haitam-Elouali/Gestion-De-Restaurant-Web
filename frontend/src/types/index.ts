export interface User {
  authenticated: boolean;
  username: string;
  role: string;
  email: string;
}

export interface Categorie {
  id: number;
  nom: string;
  description: string;
}

export interface Plat {
  id: number;
  nom: string;
  description: string;
  prix: number;
  disponible: boolean;
  image: string | null;
  categorie_id: number;
  categorie_nom: string;
}

export interface Promotion {
  id: number;
  nom: string;
  description: string;
  reduction_pourcentage: number;
  date_debut: string;
  date_fin: string;
  plats_ids: number[];
}

export interface LigneDeCommande {
  id: number;
  plat_id: number;
  plat_nom: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
}

export interface Commande {
  id: number;
  type: string;
  type_display: string;
  nom_clt: string;
  adresse_liv: string;
  status: string;
  status_display: string;
  date_creation: string;
  montant_total: number;
  nombre_plats: number;
  employe: string | null;
  lignes: LigneDeCommande[];
}

export interface Employe {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  salaire_mensuel: number;
  date_embauche: string;
  type: string;
  status?: string;
}

export interface Table {
  id: number;
  numero: number;
  capacite: number;
  statut: 'libre' | 'occupee';
  nombre_clients: number;
  commande_id?: number;
}

export interface Reservation {
  id: number;
  nom_client: string;
  telephone: string;
  date: string;
  heure: string;
  nombre_personnes: number;
  notes: string;
  statut: string;
}

export interface Paiement {
  id: number;
  commande_id: number;
  montant: number;
  type: 'cash' | 'carte' | 'cheque';
  date: string;
}

export interface Facture {
  id: number;
  commande_id: number;
  montant_total: number;
  date_creation: string;
}

export interface StockItem {
  id: number;
  nom: string;
  quantite: number;
  unite: string;
  seuil_alerte: number;
}
