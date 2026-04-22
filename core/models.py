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
        validators=[MinValueValidator(Decimal('0.01'))]
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


class Cuisinier(Employe):
    """
    Modèle pour les cuisiniers du restaurant
    Hérite de Employe et ajoute des fonctionnalités de cuisine
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cuisinier_profile')
    
    # Attributs publics (+)
    status = models.CharField(
        max_length=50, 
        default="disponible",
        choices=[
            ('disponible', 'Disponible'),
            ('occupe', 'Occupé'),
            ('pause', 'En pause'),
        ],
        verbose_name="Statut"
    )
    
    class Meta:
        verbose_name = "Cuisinier"
        verbose_name_plural = "Cuisiniers"
    
    def RecevoirCmd(self):
        """Méthode pour recevoir une commande"""
        return f"Cuisinier {self.getNomComplet()} reçoit une commande"
    
    def MarquerPlatPrepare(self):
        """Méthode pour marquer un plat comme préparé"""
        return f"Cuisinier {self.getNomComplet()} marque un plat comme préparé"
    
    def ConsulterListeCmd_a_Prepare(self):
        """Méthode pour consulter la liste des commandes à préparer"""
        return f"Cuisinier {self.getNomComplet()} consulte les commandes à préparer"
    
    def SignalerRuptureStock(self):
        """Méthode pour signaler une rupture de stock"""
        return f"Cuisinier {self.getNomComplet()} signale une rupture de stock"
