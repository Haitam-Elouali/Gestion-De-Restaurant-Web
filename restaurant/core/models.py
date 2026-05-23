from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal


class Employe(models.Model):
    """
    Modèle de base pour tous les employés du restaurant
    Hérite des attributs et méthodes communes
    """
    # Relation OneToOne avec le modèle User de Django pour l'authentification
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Attributs publics (+)
    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    telephone = models.CharField(max_length=20, verbose_name="Téléphone")
    email = models.EmailField(verbose_name="Email")
    salaire_mensuel = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Salaire mensuel",
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00')
    )
    date_embauche = models.DateField(auto_now_add=True, verbose_name="Date d'embauche")
    
    # Attributs protégés (#)
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Employé"
        verbose_name_plural = "Employés"
        abstract = True
    
    def getNomComplet(self):
        """Retourne le nom complet de l'employé"""
        return f"{self.prenom} {self.nom}"
    
    def __str__(self):
        return self.getNomComplet()


class Manager(Employe):
    """
    Modèle pour les managers du restaurant
    Hérite de Employe et ajoute des fonctionnalités de gestion
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='manager_profile')
    
    class Meta:
        verbose_name = "Manager"
        verbose_name_plural = "Managers"
    
    def gererPersonnel(self):
        """Méthode pour gérer le personnel"""
        return f"Manager {self.getNomComplet()} gère le personnel"
    
    def ModifierPrixPlat(self):
        """Méthode pour modifier les prix des plats"""
        return f"Manager {self.getNomComplet()} peut modifier les prix"
    
    def GererPromotions(self):
        """Méthode pour gérer les promotions"""
        return f"Manager {self.getNomComplet()} gère les promotions"


class Serveur(Employe):
    """
    Modèle pour les serveurs du restaurant
    Hérite de Employe et ajoute des fonctionnalités de service
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='serveur_profile')
    
    class Meta:
        verbose_name = "Serveur"
        verbose_name_plural = "Serveurs"
    
    def PrendreCommande(self):
        """Méthode pour prendre une commande"""
        return f"Serveur {self.getNomComplet()} prend une commande"
    
    def AjouterPlatCmd(self):
        """Méthode pour ajouter un plat à une commande"""
        return f"Serveur {self.getNomComplet()} ajoute un plat à la commande"
    
    def ModifierStatutCmd(self):
        """Méthode pour modifier le statut d'une commande"""
        return f"Serveur {self.getNomComplet()} modifie le statut de la commande"
    
    def ModifierPrixPlat(self):
        """Méthode pour modifier le prix d'un plat (héritée)"""
        return f"Serveur {self.getNomComplet()} peut modifier les prix"


class Caissier(Employe):
    """
    Modèle pour les caissiers du restaurant
    Hérite de Employe et ajoute des fonctionnalités de caisse
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='caissier_profile')
    
    class Meta:
        verbose_name = "Caissier"
        verbose_name_plural = "Caissiers"
    
    def GererPaiements(self):
        """Méthode pour gérer les paiements"""
        return f"Caissier {self.getNomComplet()} gère les paiements"
    
    def Encaisser(self):
        """Méthode pour encaisser"""
        return f"Caissier {self.getNomComplet()} encaisse"
    
    def VoirHistoriqueVentes(self):
        """Méthode pour voir l'historique des ventes"""
        return f"Caissier {self.getNomComplet()} consulte l'historique des ventes"


class Administrateur(Employe):
    """
    Modèle pour les administrateurs du système
    Hérite de Employe et a tous les droits de gestion
    Seul l'administrateur peut créer/supprimer des comptes Manager (RG02)
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    
    class Meta:
        verbose_name = "Administrateur"
        verbose_name_plural = "Administrateurs"
    
    def peutGererManagers(self):
        """Vérifie si l'admin peut gérer les managers - RG02"""
        return True
    
    def peutGererTousUtilisateurs(self):
        """L'admin peut gérer tous les types d'utilisateurs"""
        return True


class Table(models.Model):
    """
    Modèle pour les tables du restaurant
    RG04: Une table passe automatiquement à l'état "Occupée" dès qu'une commande lui est assignée
    RG09: Une table ne peut être libérée (état "Libre") qu'après la validation du paiement total de la facture
    """
    STATUT_CHOICES = [
        ('libre', 'Libre'),
        ('occupee', 'Occupée'),
        ('reservee', 'Réservée'),
    ]
    
    numero = models.CharField(max_length=10, verbose_name="Numéro de table")
    emplacement = models.CharField(max_length=100, blank=True, default='', verbose_name="Emplacement")
    capacite = models.PositiveIntegerField(default=4, verbose_name="Capacité")
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='libre',
        verbose_name="Statut"
    )
    nombre_clients = models.PositiveIntegerField(default=0, verbose_name="Nombre de clients")
    commande_actuelle = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='table_assignee',
        verbose_name="Commande actuelle"
    )
    # ── Serveur assigné à cette table ─────────────────────────────────────────
    serveur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tables_assignees',
        verbose_name="Serveur assigné",
        help_text="Serveur responsable de cette table. Vide = tous les serveurs peuvent y accéder."
    )
    
    class Meta:
        verbose_name = "Table"
        verbose_name_plural = "Tables"
    
    def __str__(self):
        return f"Table {self.numero} ({self.get_statut_display()})"
    
    def assigner_commande(self, commande, nombre_clients=None):
        """RG04: Assigne une commande et passe automatiquement à Occupée"""
        # RG05: Vérifier que le nombre de clients ne dépasse pas la capacité
        if nombre_clients and nombre_clients > self.capacite:
            raise ValueError(f"RG05: Le nombre de clients ({nombre_clients}) ne peut pas dépasser la capacité de la table ({self.capacite}).")
        
        self.commande_actuelle = commande
        self.statut = 'occupee'
        if nombre_clients:
            self.nombre_clients = nombre_clients
        self.save()
    
    def liberer(self):
        """RG09: Ne libère la table que si la commande est payée"""
        if self.commande_actuelle and self.commande_actuelle.status == 'payee':
            self.commande_actuelle = None
            self.statut = 'libre'
            self.nombre_clients = 0
            self.save()
            return True
        return False
    
    def est_disponible(self):
        """Vérifie si la table est disponible"""
        return self.statut == 'libre'


class Configuration(models.Model):
    restaurant_nom = models.CharField(max_length=150, default='KOOL.MA', verbose_name="Nom du restaurant")
    restaurant_adresse = models.TextField(blank=True, default='', verbose_name="Adresse")
    restaurant_telephone = models.CharField(max_length=30, blank=True, default='', verbose_name="Téléphone")
    restaurant_email = models.EmailField(blank=True, default='', verbose_name="Email")
    restaurant_horaires = models.TextField(blank=True, default='', verbose_name="Horaires d'ouverture")

    caisse_fonds_depart = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Fonds de départ"
    )
    caisse_modes_paiement = models.JSONField(default=list, verbose_name="Modes de paiement acceptés")

    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")

    class Meta:
        verbose_name = "Configuration"
        verbose_name_plural = "Configuration"
