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
    
    # Relation avec Table pour RG04
    table = models.ForeignKey(
        'core.Table',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commandes',
        verbose_name="Table assignée"
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
    
    def save(self, *args, **kwargs):
        """RG04: Lorsqu'une commande est assignée à une table, la table passe automatiquement à Occupée"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # RG04: Si une table est assignée, la marquer comme occupée
        if self.table and self.table.statut != 'occupee':
            self.table.assigner_commande(self)
    
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
    
    @property
    def duree_service(self):
        """SERVEUR4: Calcule la durée de service en minutes"""
        from django.utils import timezone
        now = timezone.now()
        diff = now - self.date_creation_h
        return int(diff.total_seconds() / 60)
    
    @property
    def duree_formatee(self):
        """SERVEUR4: Retourne la durée formatée pour l'affichage"""
        duree = self.duree_service
        if duree < 60:
            return f"{duree} min"
        else:
            heures = duree // 60
            minutes = duree % 60
            return f"{heures}h {minutes}min"


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
        """RG10: Décrémente les stocks + calcul du prix unitaire"""
        is_new = self.pk is None
        
        # Définir le prix unitaire si non défini
        if not self.prix_unitaire:
            self.prix_unitaire = self.plat.prix
        
        super().save(*args, **kwargs)
        
        # RG10: Si nouvelle ligne de commande, décrémenter les stocks des ingrédients
        if is_new:
            self.decrementer_stocks()
        
        # Recalculer le total de la commande
        self.commande.calculer_total()
    
    def decrementer_stocks(self):
        """RG10: Décrémente les stocks des ingrédients nécessaires pour ce plat"""
        from menus.models import PlatIngredient
        
        # Récupérer les ingrédients nécessaires pour ce plat
        plat_ingredients = PlatIngredient.objects.filter(plat=self.plat)
        
        for pi in plat_ingredients:
            quantite_a_decrementer = pi.quantite_necessaire * self.quantite
            if not pi.ingredient.decrementer_stock(quantite_a_decrementer):
                # Stock insuffisant - marquer le plat comme indisponible (RG11)
                self.plat.disponible = False
                self.plat.save()
                return False
        return True
    
    @property
    def montant_ligne(self):
        """Calcule le montant total de cette ligne"""
        return self.prix_unitaire * self.quantite
    
    @property
    def montant_ligne_formate(self):
        """Retourne le montant de la ligne formaté"""
        return f"{self.montant_ligne} DH"
