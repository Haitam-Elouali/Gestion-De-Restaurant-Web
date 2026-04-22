# Kool.ma - Application Web de Gestion de Restaurant

Application web interne robuste et intuitive pour le restaurant "Kool.ma" à Salé, Maroc. Cette plateforme centralise et automatise la gestion des commandes, le suivi de la préparation en cuisine, l'administration du personnel et du menu.

## 🎯 Objectifs

- Minimiser les erreurs de commande
- Accroître la productivité du personnel
- Fournir des outils de suivi en temps réel
- Générer des rapports de performance
- Améliorer le pilotage global du restaurant

## 🛠️ Technologies Utilisées

- **Backend**: Python 3.x, Django 4.2.7
- **Base de Données**: MySQL
- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Images**: Pillow pour la gestion des images

## 📋 Prérequis

- Python 3.8 ou supérieur
- MySQL 5.7 ou supérieur
- pip (gestionnaire de paquets Python)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd restaurant
```

### 2. Créer un environnement virtuel

```bash
python -m venv venv

# Sur Windows
venv\Scripts\activate

# Sur macOS/Linux
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configuration de la base de données MySQL

1. Créer une base de données MySQL :
```sql
CREATE DATABASE koolma_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Modifier les paramètres de connexion dans `koolma_project/settings.py` :
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'koolma_db',
        'USER': 'votre_utilisateur',
        'PASSWORD': 'votre_mot_de_passe',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}
```

### 5. Effectuer les migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Créer un superuser

```bash
python manage.py createsuperuser
```

### 7. Collecter les fichiers statiques

```bash
python manage.py collectstatic
```

### 8. Lancer le serveur de développement

```bash
python manage.py runserver
```

L'application sera accessible à l'adresse : http://127.0.0.1:8000/

## 👥 Types d'Utilisateurs

### 1. Client (Public)
- Accès aux pages publiques sans authentification
- Consultation du menu et des promotions
- Pas d'interactions de commande (hors ligne)

### 2. Employé (Base)
- Authentification requise
- Accès aux fonctionnalités selon le rôle

### 3. Manager
- Gestion complète du personnel
- Gestion des menus et promotions
- Rapports financiers
- Assignation des commandes

### 4. Serveur
- Prise de nouvelles commandes
- Ajout/modification de plats
- Gestion du statut des commandes

### 5. Cuisinier
- Suivi des commandes à préparer
- Marquage des plats comme préparés
- Signalement des ruptures de stock

### 6. SuperUser (Admin Django)
- Accès exclusif à l'interface d'administration Django
- Création depuis le terminal uniquement

## 📁 Structure du Projet

```
restaurant/
├── koolma_project/          # Configuration principale Django
├── core/                    # Gestion des utilisateurs et authentification
│   ├── models.py           # Modèles Employé, Manager, Serveur, Cuisinier
│   ├── views.py            # Vues d'authentification et gestion personnel
│   ├── forms.py            # Formulaires d'authentification
│   └── admin.py            # Interface d'administration
├── menus/                   # Gestion des menus et promotions
│   ├── models.py           # Modèles Categorie, Plat, Promotion
│   ├── views.py            # Vues de gestion des menus
│   ├── forms.py            # Formulaires de menus
│   └── admin.py            # Interface d'administration
├── commandes/               # Gestion des commandes
│   ├── models.py           # Modèles Commande, LigneDeCommande
│   ├── views.py            # Vues de gestion des commandes
│   ├── forms.py            # Formulaires de commandes
│   └── admin.py            # Interface d'administration
├── templates/               # Templates HTML
│   ├── base.html           # Template de base
│   ├── core/               # Templates pour l'app core
│   ├── menus/              # Templates pour l'app menus
│   └── commandes/          # Templates pour l'app commandes
├── static/                  # Fichiers statiques (CSS, JS, images)
├── media/                   # Fichiers uploadés (images des plats)
├── requirements.txt         # Dépendances Python
└── README.md               # Documentation
```

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
SECRET_KEY=votre-clé-secrète-django
DEBUG=True
DATABASE_URL=mysql://user:password@localhost:3306/koolma_db
```

### Paramètres de production

Pour la production, modifier `settings.py` :

```python
DEBUG = False
ALLOWED_HOSTS = ['votre-domaine.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## 📊 Fonctionnalités Principales

### Interface Publique
- Page d'accueil avec présentation du restaurant
- Menu public avec catégories et plats
- Promotions actives
- Informations de contact et localisation

### Interface Manager
- Dashboard avec statistiques en temps réel
- Gestion complète du personnel
- Gestion des menus et promotions
- Rapports de ventes et analyses
- Suivi des commandes

### Interface Serveur
- Prise de nouvelles commandes
- Ajout de plats à une commande
- Modification du statut des commandes
- Historique des commandes

### Interface Cuisinier
- Liste des commandes à préparer
- Marquage des plats comme préparés
- Signalement des ruptures de stock
- Statut de disponibilité

## 🔐 Sécurité

- Authentification sécurisée par rôle
- Protection CSRF sur tous les formulaires
- Validation des données côté serveur
- Accès restreint selon les permissions
- Interface d'administration protégée

## 📱 Responsive Design

L'interface est entièrement responsive et s'adapte à tous les écrans :
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🎨 Design

- Style moderne inspiré de Deepsite
- Palette de couleurs dorée et élégante
- Animations fluides et transitions
- Interface intuitive et professionnelle

## 🚀 Déploiement

### Sur un serveur VPS

1. Installer les prérequis système :
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv mysql-server nginx
```

2. Configurer MySQL et créer la base de données

3. Cloner le projet et configurer l'environnement virtuel

4. Configurer Gunicorn :
```bash
pip install gunicorn
```

5. Configurer Nginx comme proxy inverse

6. Configurer les fichiers statiques et media

### Sur Heroku

1. Créer un compte Heroku
2. Installer Heroku CLI
3. Configurer les variables d'environnement
4. Déployer avec Git

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion MySQL** :
   - Vérifier les paramètres de connexion
   - S'assurer que MySQL est démarré
   - Vérifier les permissions utilisateur

2. **Erreur de migration** :
   - Supprimer les fichiers de migration existants
   - Recréer les migrations : `python manage.py makemigrations`

3. **Problème de fichiers statiques** :
   - Exécuter : `python manage.py collectstatic`
   - Vérifier la configuration STATIC_ROOT

4. **Erreur d'import** :
   - Vérifier que l'environnement virtuel est activé
   - Réinstaller les dépendances : `pip install -r requirements.txt`

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur le repository
- Contacter l'équipe de développement

## 📄 Licence

Ce projet est développé pour le restaurant Kool.ma. Tous droits réservés.

## 🔄 Mises à jour

Pour mettre à jour l'application :

```bash
git pull origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic
```

---

**Développé avec ❤️ pour Kool.ma** 