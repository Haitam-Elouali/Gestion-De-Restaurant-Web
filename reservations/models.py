"""
Modèle pour la gestion des réservations (RG12)
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Reservation(models.Model):
    """
    Modèle pour les réservations clients
    RG12: Une réservation ne peut être enregistrée pour une date passée
    """
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('annulee', 'Annulée'),
        ('terminee', 'Terminée'),
    ]
    
    nom_client = models.CharField(max_length=200, verbose_name="Nom du client")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, verbose_name="Téléphone")
    date = models.DateField(verbose_name="Date de réservation")
    heure = models.TimeField(verbose_name="Heure de réservation")
    nombre_personnes = models.PositiveIntegerField(default=2, verbose_name="Nombre de personnes")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes spéciales")
    
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente',
        verbose_name="Statut"
    )
    
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    
    class Meta:
        verbose_name = "Réservation"
        verbose_name_plural = "Réservations"
        ordering = ['date', 'heure']
    
    def __str__(self):
        return f"Réservation {self.nom_client} - {self.date} {self.heure} ({self.nombre_personnes} pers.)"
    
    def clean(self):
        """RG12: Validation - empêcher les réservations pour des dates passées"""
        from django.utils import timezone
        
        # Combiner date et heure
        today = timezone.now().date()
        
        if self.date < today:
            raise ValidationError("RG12: Une réservation ne peut être enregistrée pour une date passée.")
        
        # Si c'est aujourd'hui, vérifier l'heure
        if self.date == today:
            current_time = timezone.now().time()
            if self.heure < current_time:
                raise ValidationError("RG12: L'heure de la réservation est déjà passée.")
    
    def save(self, *args, **kwargs):
        """Appeler clean() avant de sauvegarder"""
        self.clean()
        super().save(*args, **kwargs)
