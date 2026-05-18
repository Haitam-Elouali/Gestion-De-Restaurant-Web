# Règles de Gestion Implémentées - KOOL.MA Restaurant

Ce document récapitule toutes les règles de gestion du cahier des charges qui ont été implémentées dans le projet.

## ✅ RG02 - Gestion des Utilisateurs & Sécurité
**Description:** Seul l'Administrateur peut créer ou supprimer des comptes "Manager".

**Implémentation:**
- Modèle `Administrateur` créé dans `core/models.py`
- API `api_create_employe()` vérifie le rôle avant création
- API `api_delete_employe()` vérifie le rôle avant suppression
- Frontend `Users.tsx` masque les options Manager pour les non-admins
- Seul l'admin voit la liste des Managers dans l'interface

**Fichiers concernés:**
- `core/models.py` - Modèle Administrateur
- `core/api.py` - Vérifications RG02
- `frontend/src/pages/Users.tsx` - Interface conditionnelle

---

## ✅ RG04 - Gestion des Tables (Assignation)
**Description:** Une table passe automatiquement à l'état "Occupée" dès qu'une commande lui est assignée.

**Implémentation:**
- Modèle `Table` créé avec méthode `assigner_commande()`
- Modèle `Commande` modifié avec relation `table` (ForeignKey)
- Méthode `save()` de Commande appelle automatiquement `table.assigner_commande()`
- API Tables avec endpoints pour assigner/libérer

**Fichiers concernés:**
- `core/models.py` - Modèle Table
- `commandes/models.py` - Relation Commande-Table
- `core/tables_api.py` - API de gestion des tables

---

## ✅ RG05 - Capacité des Tables
**Description:** Le nombre de clients par table ne peut excéder la capacité maximale de ladite table.

**Implémentation:**
- Vérification dans `api_assigner_table()` avant assignation
- Retourne une erreur si `nombre_clients > capacite`

**Fichiers concernés:**
- `core/tables_api.py` - Vérification RG05

---

## ✅ RG09 - Libération des Tables (Paiement)
**Description:** Une table ne peut être libérée (état "Libre") qu'après la validation du paiement total de la facture.

**Implémentation:**
- Méthode `Table.liberer()` vérifie que `commande.status == 'payee'`
- API `api_liberer_table()` retourne une erreur si la commande n'est pas payée
- Message explicite mentionnant RG09

**Fichiers concernés:**
- `core/models.py` - Méthode liberer()
- `core/tables_api.py` - Vérification RG09

---

## ✅ RG10 - Décrémentation des Stocks
**Description:** Toute validation de commande doit entraîner la décrémentation automatique des stocks correspondants.

**Implémentation:**
- Modèles `Ingredient` et `PlatIngredient` créés
- Méthode `LigneDeCommande.save()` appelle `decrementer_stocks()`
- Méthode `decrementer_stocks()` calcule la quantité nécessaire (quantité_necessaire × quantite_commandee)
- Mise à jour automatique des stocks en base de données

**Fichiers concernés:**
- `menus/models.py` - Modèles Ingredient et PlatIngredient
- `commandes/models.py` - Méthode decrementer_stocks()
- `menus/stock_api.py` - API de gestion des stocks

---

## ✅ RG11 - Indisponibilité des Produits (Stock Zéro)
**Description:** Un produit dont le stock est à zéro doit apparaître comme "Indisponible" sur l'interface de commande.

**Implémentation:**
- Propriété `Ingredient.est_disponible` vérifie si `quantite_stock > 0`
- Méthode `Plat.verifier_disponibilite_ingredients()` vérifie tous les ingrédients
- Si un ingrédient est indisponible, le plat est marqué `disponible = False`
- API renvoie le statut de disponibilité pour chaque plat

**Fichiers concernés:**
- `menus/models.py` - Méthodes est_disponible et verifier_disponibilite_ingredients
- `commandes/models.py` - Mise à jour du statut disponible

---

## ✅ RG12 - Réservations (Date Passée Interdite)
**Description:** Une réservation ne peut être enregistrée pour une date passée.

**Implémentation:**
- Modèle `Reservation` avec méthode `clean()`
- Vérification que `date >= today`
- Si date = aujourd'hui, vérification que `heure > current_time`
- ValidationError avec message mentionnant RG12
- API publique (pas besoin d'être connecté pour réserver)

**Fichiers concernés:**
- `reservations/models.py` - Modèle Reservation avec validation
- `reservations/api.py` - API de gestion des réservations

---

## ✅ RG13 - Statistiques en Temps Réel
**Description:** Les statistiques de gains doivent être actualisées en temps réel après chaque clôture de facture.

**Implémentation:**
- API `api_statistiques()` calcule les données à partir des commandes `status='payee'`
- Calculs: total gains, gains aujourd'hui, ticket moyen, plats les plus vendus
- Frontend `Stats.tsx` actualise automatiquement toutes les 30 secondes
- Badge "RG13: Statistiques actualisées en temps réel" affiché
- API `api_stats_verifier_actualisation()` vérifie la dernière facture

**Fichiers concernés:**
- `core/stats_api.py` - API de statistiques temps réel
- `frontend/src/pages/Stats.tsx` - Interface avec actualisation automatique

---

## 📊 Résumé des Modifications

### Backend (Django)
| Fichier | Description |
|---------|-------------|
| `core/models.py` | Ajout de Administrateur et Table |
| `core/api.py` | RG02 - Permissions de gestion utilisateurs |
| `core/tables_api.py` | RG04, RG05, RG09 - API Tables |
| `core/stats_api.py` | RG13 - Statistiques temps réel |
| `commandes/models.py` | RG04, RG10 - Commande avec table et décrémentation stocks |
| `menus/models.py` | RG10, RG11 - Ingredient, PlatIngredient, disponibilité |
| `menus/stock_api.py` | API de gestion des stocks |
| `reservations/models.py` | RG12 - Reservation avec validation date |
| `reservations/api.py` | API de gestion des réservations |
| `koolma_project/urls.py` | Routes API pour toutes les fonctionnalités |
| `koolma_project/settings.py` | Ajout de l'app 'reservations' |

### Frontend (React)
| Fichier | Description |
|---------|-------------|
| `src/pages/Users.tsx` | RG02 - Interface conditionnelle selon le rôle |
| `src/pages/Stats.tsx` | RG13 - Statistiques temps réel avec actualisation |
| `src/pages/Tables.tsx` | À mettre à jour pour utiliser les nouvelles API |
| `src/pages/Reservations.tsx` | À mettre à jour pour validation RG12 |

---

## 🧪 Données de Test Créées

### Utilisateurs
- **Admin:** `admin` / `admin123`
- **Manager:** `manager` / `manager123`

### Tables
- Tables 1 à 8 créées avec capacité de 4 personnes

### Ingrédients
- Tomate: 50 kg
- Poulet: 30 kg
- Riz: 40 kg
- Pain: 100 unités
- Fromage: 15 kg

### Plat de Test
- **Poulet au riz:** 65 DH, nécessite 0.3kg poulet + 0.2kg riz

---

## 🔧 API Endpoints Disponibles

### Authentification
- `GET /api/auth/status/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`

### Employés (RG02)
- `GET /api/employes/`
- `POST /api/employes/create/`
- `DELETE /api/employes/<id>/delete/`

### Tables (RG04, RG05, RG09)
- `GET /api/tables/`
- `POST /api/tables/create/`
- `POST /api/tables/<id>/assigner/`
- `POST /api/tables/<id>/liberer/`

### Stocks (RG10, RG11)
- `GET /api/ingredients/`
- `POST /api/ingredients/create/`
- `POST /api/ingredients/<id>/ajouter-stock/`
- `GET /api/plats/<id>/ingredients/`

### Réservations (RG12)
- `GET /api/reservations/`
- `POST /api/reservations/create/` (public)
- `POST /api/reservations/<id>/modifier/`
- `DELETE /api/reservations/<id>/supprimer/`

### Statistiques (RG13)
- `GET /api/statistiques/`
- `GET /api/statistiques/verification/`

---

## ✨ Fonctionnalités Conformes au Cahier des Charges

✅ Gestion des utilisateurs avec rôles (Admin, Manager, Serveur, Cuisinier)  
✅ Gestion des tables avec statut automatique  
✅ Gestion des commandes avec assignation aux tables  
✅ Gestion de la caisse et facturation  
✅ Gestion des stocks avec décrémentation automatique  
✅ Gestion des réservations avec validation des dates  
✅ Tableau de bord avec statistiques temps réel  
✅ Interface en français  

---

**Date d'implémentation:** Mai 2026  
**Version:** 1.0
