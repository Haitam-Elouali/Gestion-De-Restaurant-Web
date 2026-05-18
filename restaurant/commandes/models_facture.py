"""
Modèles pour la gestion des factures et paiements (RG08)
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Facture(models.Model):
    """
    Modèle pour les factures
    RG08: La facture doit mentionner le mode de paiement utilisé
    """
    MODE_PAIEMENT_CHOICES = [
        ('cash', 'Espèces'),
        ('carte_bancaire', 'Carte bancaire'),
        ('cheque', 'Chèque'),
        ('mobile', 'Paiement mobile'),
    ]
    
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('payee', 'Payée'),
        ('annulee', 'Annulée'),
    ]
    
    # Relations
    commande = models.OneToOneField(
        'Commande',
        on_delete=models.CASCADE,
        related_name='facture',
        verbose_name="Commande associée"
    )
    
    # Attributs de facturation
    numero_facture = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Numéro de facture"
    )
    date_facture = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de facturation"
    )
    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant total"
    )
    montant_tva = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Montant TVA"
    )
    montant_ht = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant HT"
    )
    
    # RG08: Mode de paiement
    mode_paiement = models.CharField(
        max_length=20,
        choices=MODE_PAIEMENT_CHOICES,
        verbose_name="Mode de paiement"
    )
    
    # Informations de paiement
    reference_paiement = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Référence de paiement"
    )
    date_paiement = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de paiement"
    )
    
    # Attributs de suivi
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_cours',
        verbose_name="Statut"
    )
    
    # Employé qui a traité la facture
    caissier = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factures_traitees',
        verbose_name="Caissier"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes"
    )
    
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )
    
    class Meta:
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
        ordering = ['-date_facture']
    
    def __str__(self):
        return f"Facture {self.numero_facture} - {self.montant_total} DH"
    
    def save(self, *args, **kwargs):
        """Calcul automatique des montants HT et TVA"""
        if self.montant_total:
            # Supposer 20% de TVA (à adapter selon pays)
            self.montant_ht = self.montant_total / Decimal('1.2')
            self.montant_tva = self.montant_total - self.montant_ht
        super().save(*args, **kwargs)
    
    @property
    def est_payee(self):
        """Vérifie si la facture est payée"""
        return self.statut == 'payee'
    
    @property
    def mode_paiement_display(self):
        """Retourne le mode de paiement formaté"""
        return dict(self.MODE_PAIEMENT_CHOICES).get(self.mode_paiement, self.mode_paiement)


class LigneFacture(models.Model):
    """
    Modèle pour les lignes de facture
    """
    facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        related_name='lignes',
        verbose_name="Facture"
    )
    
    # Détails du plat facturé
    nom_plat = models.CharField(
        max_length=200,
        verbose_name="Nom du plat"
    )
    quantite = models.PositiveIntegerField(
        verbose_name="Quantité",
        validators=[MinValueValidator(1)]
    )
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Prix unitaire"
    )
    
    # Montants de la ligne
    montant_ht = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant HT"
    )
    montant_tva = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Montant TVA"
    )
    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Montant total"
    )
    
    class Meta:
        verbose_name = "Ligne de facture"
        verbose_name_plural = "Lignes de facture"
    
    def save(self, *args, **kwargs):
        """Calcul automatique des montants"""
        if self.prix_unitaire and self.quantite:
            self.montant_ht = self.prix_unitaire * self.quantite
            self.montant_tva = self.montant_ht * Decimal('0.2')  # 20% TVA
            self.montant_total = self.montant_ht + self.montant_tva
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantite}x {self.nom_plat} - {self.montant_total} DH"
