from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Categorie(models.Model):
    """
    Modèle pour les catégories de plats
    """
    nom = models.CharField(max_length=100, unique=True, verbose_name="Nom de la catégorie")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['nom']
    
    def __str__(self):
        return self.nom


class Plat(models.Model):
    """
    Modèle pour les plats du restaurant
    """
    nom = models.CharField(max_length=200, verbose_name="Nom du plat")
    description = models.TextField(verbose_name="Description")
    prix = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Prix",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    disponible = models.BooleanField(default=True, verbose_name="Disponible")
    image = models.ImageField(
        upload_to='plats/', 
        blank=True, 
        null=True, 
        verbose_name="Image du plat"
    )
    
    # Relation Many-to-One avec Categorie
    categorie = models.ForeignKey(
        Categorie, 
        on_delete=models.CASCADE, 
        related_name='plats',
        verbose_name="Catégorie"
    )
    
    # Attributs de suivi
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Plat"
        verbose_name_plural = "Plats"
        ordering = ['categorie', 'nom']
    
    def __str__(self):
        return f"{self.nom} - {self.categorie.nom}"
    
    @property
    def prix_formate(self):
        """Retourne le prix formaté en dirhams"""
        return f"{self.prix} DH"
    
    def verifier_disponibilite_ingredients(self):
        """RG11: Vérifie si tous les ingrédients nécessaires sont disponibles en stock"""
        from .models import PlatIngredient
        
        plat_ingredients = PlatIngredient.objects.filter(plat=self)
        
        for pi in plat_ingredients:
            if not pi.ingredient.est_disponible:
                # RG11: Un produit dont le stock est à zéro doit apparaître comme "Indisponible"
                self.disponible = False
                self.save()
                return False
        
        # Si tous les ingrédients sont disponibles, marquer comme disponible
        if not self.disponible:
            self.disponible = True
            self.save()
        return True
    
    @property
    def est_disponible_en_stock(self):
        """RG11: Retourne True si tous les ingrédients sont disponibles"""
        return self.verifier_disponibilite_ingredients()


class Promotion(models.Model):
    """
    Modèle pour les promotions du restaurant
    """
    nom = models.CharField(max_length=200, verbose_name="Nom de la promotion")
    description = models.TextField(verbose_name="Description")
    reduction_pourcentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        verbose_name="Réduction (%)",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date_debut = models.DateField(verbose_name="Date de début")
    date_fin = models.DateField(verbose_name="Date de fin")
    active = models.BooleanField(default=True, verbose_name="Active")
    
    # Plats concernés par la promotion (Many-to-Many)
    plats = models.ManyToManyField(
        Plat, 
        blank=True, 
        related_name='promotions',
        verbose_name="Plats concernés"
    )
    
    # Attributs de suivi
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Promotion"
        verbose_name_plural = "Promotions"
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"{self.nom} (-{self.reduction_pourcentage}%)"
    
    @property
    def est_active(self):
        """Vérifie si la promotion est actuellement active"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.active and self.date_debut <= today <= self.date_fin


class Ingredient(models.Model):
    """
    Modèle pour les ingrédients en stock
    RG10: Gestion et mise à jour des niveaux d'inventaire
    RG11: Produit à stock zéro apparaît comme "Indisponible"
    """
    nom = models.CharField(max_length=200, verbose_name="Nom de l'ingrédient")
    unite = models.CharField(max_length=50, verbose_name="Unité (kg, L, unité, etc.)")
    quantite_stock = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Quantité en stock"
    )
    seuil_alerte = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=10,
        verbose_name="Seuil d'alerte"
    )
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Ingrédient"
        verbose_name_plural = "Ingrédients"
        ordering = ['nom']
    
    def __str__(self):
        return f"{self.nom} ({self.quantite_stock} {self.unite})"
    
    @property
    def est_disponible(self):
        """RG11: Vérifie si l'ingrédient est disponible (stock > 0)"""
        return self.quantite_stock > 0
    
    def decrementer_stock(self, quantite):
        """RG10: Décrémente le stock d'une certaine quantité"""
        if self.quantite_stock >= quantite:
            self.quantite_stock -= quantite
            self.save()
            return True
        return False
    
    def est_en_alerte(self):
        """Vérifie si le stock est sous le seuil d'alerte"""
        return self.quantite_stock <= self.seuil_alerte


class PlatIngredient(models.Model):
    """
    Modèle de liaison entre Plat et Ingredient
    Définit la quantité d'ingrédient nécessaire pour un plat
    """
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE, related_name='ingredients_necessaires')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='plats_utilisant')
    quantite_necessaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Quantité nécessaire",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    class Meta:
        verbose_name = "Ingrédient du plat"
        verbose_name_plural = "Ingrédients des plats"
        unique_together = ['plat', 'ingredient']
    
    def __str__(self):
        return f"{self.plat.nom} - {self.ingredient.nom} ({self.quantite_necessaire} {self.ingredient.unite})"
