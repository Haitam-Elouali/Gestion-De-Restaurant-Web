from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models

from decimal import Decimal

from menus.models import Plat


class Commande(models.Model):
    """
    Modele pour les commandes du restaurant.
    """

    TYPE_CHOICES = [
        ('a_emporter', 'A emporter'),
        ('livraison', 'Livraison'),
        ('sur_place_generique', 'Sur place'),
    ]

    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('preparee', 'Preparee'),
        ('servie', 'Servie'),
        ('payee', 'Payee'),
        ('annulee', 'Annulee'),
    ]

    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='sur_place_generique',
        verbose_name="Type de commande"
    )
    nom_clt = models.CharField(max_length=200, verbose_name="Nom du client")
    adresse_liv = models.TextField(blank=True, null=True, verbose_name="Adresse de livraison")
    date_creation_h = models.DateTimeField(auto_now_add=True, verbose_name="Date de creation")
    date_maj_h = models.DateTimeField(auto_now=True, verbose_name="Date de modification")
    status = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_cours',
        verbose_name="Statut"
    )
    employe = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commandes_geres',
        verbose_name="Employe responsable"
    )
    table = models.ForeignKey(
        'core.Table',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commandes',
        verbose_name="Table assignee"
    )
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
        super().save(*args, **kwargs)
        if self.table and self.table.statut != 'occupee':
            self.table.assigner_commande(self)

    def calculer_total(self):
        total = sum(ligne.montant_ligne for ligne in self.lignes.all())
        self.montant_total = total
        self.save()
        return total

    @property
    def nombre_plats(self):
        return sum(ligne.quantite for ligne in self.lignes.all())

    @property
    def est_livraison(self):
        return self.type == 'livraison'

    @property
    def duree_service(self):
        from django.utils import timezone
        diff = timezone.now() - self.date_creation_h
        return int(diff.total_seconds() / 60)

    @property
    def duree_formatee(self):
        duree = self.duree_service
        if duree < 60:
            return f"{duree} min"
        heures = duree // 60
        minutes = duree % 60
        return f"{heures}h {minutes}min"


class LigneDeCommande(models.Model):
    """
    Modele pour les lignes de commande.
    """

    quantite = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="Quantite"
    )
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
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Prix unitaire"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notes speciales")

    class Meta:
        verbose_name = "Ligne de commande"
        verbose_name_plural = "Lignes de commande"
        unique_together = ['commande', 'plat']

    def __str__(self):
        return f"{self.quantite}x {self.plat.nom} - Commande #{self.commande.id}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        previous_quantite = 0
        if not is_new:
            previous_quantite = LigneDeCommande.objects.get(pk=self.pk).quantite

        if not self.prix_unitaire:
            self.prix_unitaire = self.plat.prix

        super().save(*args, **kwargs)

        quantite_a_decrementer = self.quantite if is_new else max(self.quantite - previous_quantite, 0)
        if quantite_a_decrementer > 0:
            self.decrementer_stocks(quantite_a_decrementer)

        self.commande.calculer_total()

    def decrementer_stocks(self, quantite_commande=None):
        from menus.models import PlatIngredient

        quantite_reference = quantite_commande or self.quantite
        plat_ingredients = PlatIngredient.objects.filter(plat=self.plat)

        for plat_ingredient in plat_ingredients:
            quantite_a_decrementer = plat_ingredient.quantite_necessaire * quantite_reference
            if not plat_ingredient.ingredient.decrementer_stock(quantite_a_decrementer):
                self.plat.disponible = False
                self.plat.save()
                return False
        return True

    @property
    def montant_ligne(self):
        return self.prix_unitaire * self.quantite

    @property
    def montant_ligne_formate(self):
        return f"{self.montant_ligne} DH"
