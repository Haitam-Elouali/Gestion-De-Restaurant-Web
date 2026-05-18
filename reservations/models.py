"""
Modele pour la gestion des reservations (RG12).
"""
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Reservation(models.Model):
    """
    Modele pour les reservations clients.
    RG12: Une reservation ne peut etre enregistree pour une date passee.
    """

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmee'),
        ('annulee', 'Annulee'),
        ('terminee', 'Terminee'),
    ]

    nom_client = models.CharField(max_length=200, verbose_name="Nom du client")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, verbose_name="Telephone")
    date = models.DateField(verbose_name="Date de reservation")
    heure = models.TimeField(verbose_name="Heure de reservation")
    nombre_personnes = models.PositiveIntegerField(default=2, verbose_name="Nombre de personnes")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes speciales")
    table = models.ForeignKey(
        'core.Table',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservations',
        verbose_name="Table reservee"
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente',
        verbose_name="Statut"
    )
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de creation")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Date de modification")

    class Meta:
        verbose_name = "Reservation"
        verbose_name_plural = "Reservations"
        ordering = ['date', 'heure']

    def __str__(self):
        return f"Reservation {self.nom_client} - {self.date} {self.heure} ({self.nombre_personnes} pers.)"

    def clean(self):
        today = timezone.now().date()

        if self.date < today:
            raise ValidationError("RG12: Une reservation ne peut etre enregistree pour une date passee.")

        if self.date == today:
            current_time = timezone.now().time()
            if self.heure < current_time:
                raise ValidationError("RG12: L'heure de la reservation est deja passee.")

        if self.table:
            if self.nombre_personnes > self.table.capacite:
                raise ValidationError(
                    f"RG12/RG05: La table {self.table.numero} ne peut accueillir que {self.table.capacite} personnes."
                )

            conflit = Reservation.objects.filter(
                table=self.table,
                date=self.date,
                heure=self.heure,
            ).exclude(pk=self.pk).exclude(statut='annulee')

            if conflit.exists():
                raise ValidationError(
                    f"La table {self.table.numero} est deja reservee pour ce creneau."
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
