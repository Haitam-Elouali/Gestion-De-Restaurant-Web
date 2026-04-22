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
