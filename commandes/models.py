from django.db import models
from django.contrib.auth.models import User
from menus.models import Plat
from core.models import Employe
from django.core.validators import MinValueValidator


class Commande(models.Model):
    """
    Modèle pour les commandes du restaurant
    """
    TYPE_CHOICES = [
        ('a_emporter', 'À emporter'),
        ('livraison', 'Livraison'),
        ('sur_place_generique', 'Sur place'),
    ]
    
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('preparee', 'Préparée'),
        ('servie', 'Servie'),
        ('payee', 'Payée'),
        ('annulee', 'Annulée'),
    ]
    
    # Attributs privés (-) - ID automatique géré par Django
    type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='sur_place_generique',
        verbose_name="Type de commande"
    )
    nom_clt = models.CharField(max_length=200, verbose_name="Nom du client")
    adresse_liv = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Adresse de livraison"
    )
    date_creation_h = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Date de création"
    )
    date_maj_h = models.DateTimeField(
        auto_now=True, 
        verbose_name="Date de modification"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='en_cours',
        verbose_name="Statut"
    )
    
    # Relation Many-to-One avec Employe (qui gère la commande)
    employe = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='commandes_geres',
        verbose_name="Employé responsable"
    )
    
    # Attributs additionnels pour le suivi
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    montant_total = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        verbose_name="Montant total"
    )
    
    class Meta:
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"
        ordering = ['-date_creation_h']
    
    def __str__(self):
        return f"Commande #{self.id} - {self.nom_clt} ({self.get_status_display()})"
    
    def calculer_total(self):
        """Calcule le montant total de la commande"""
        total = sum(ligne.montant_ligne for ligne in self.lignes.all())
        self.montant_total = total
        self.save()
        return total
    
    @property
    def nombre_plats(self):
        """Retourne le nombre total de plats dans la commande"""
        return sum(ligne.quantite for ligne in self.lignes.all())
    
    @property
    def est_livraison(self):
        """Vérifie si c'est une commande de livraison"""
        return self.type == 'livraison'


class LigneDeCommande(models.Model):
    """
    Modèle pour les lignes de commande (détails des plats commandés)
    """
    # Attributs publics (+)
    quantite = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="Quantité"
    )
    
    # Relations
    commande = models.ForeignKey(
        Commande, 
        on_delete=models.CASCADE, 
        related_name='lignes',
        verbose_name="Commande"
    )
    plat = models.ForeignKey(
        Plat, 
        on_delete=models.CASCADE, 
        related_name='lignes_commande',
        verbose_name="Plat"
    )
    
    # Attributs additionnels
    prix_unitaire = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Prix unitaire"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notes spéciales")
    
    class Meta:
        verbose_name = "Ligne de commande"
        verbose_name_plural = "Lignes de commande"
        unique_together = ['commande', 'plat']  # Un plat par commande
    
    def __str__(self):
        return f"{self.quantite}x {self.plat.nom} - Commande #{self.commande.id}"
    
    def save(self, *args, **kwargs):
        """Surcharge de save pour calculer automatiquement le prix unitaire"""
        if not self.prix_unitaire:
            self.prix_unitaire = self.plat.prix
        super().save(*args, **kwargs)
        # Recalculer le total de la commande
        self.commande.calculer_total()
    
    @property
    def montant_ligne(self):
        """Calcule le montant total de cette ligne"""
        return self.prix_unitaire * self.quantite
    
    @property
    def montant_ligne_formate(self):
        """Retourne le montant de la ligne formaté"""
        return f"{self.montant_ligne} DH"
