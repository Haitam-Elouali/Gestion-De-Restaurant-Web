from django.contrib import admin
from .models import Commande, LigneDeCommande


class LigneDeCommandeInline(admin.TabularInline):
    """Inline pour afficher les lignes de commande dans une commande"""
    model = LigneDeCommande
    extra = 1
    fields = ['plat', 'quantite', 'prix_unitaire', 'notes']


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Commandes"""
    list_display = ['id', 'nom_clt', 'type', 'status', 'montant_total', 'employe', 'date_creation_h']
    list_filter = ['type', 'status', 'date_creation_h', 'employe']
    search_fields = ['nom_clt', 'adresse_liv', 'notes']
    readonly_fields = ['date_creation_h', 'date_maj_h', 'montant_total']
    inlines = [LigneDeCommandeInline]
    
    fieldsets = (
        ('Informations client', {
            'fields': ('nom_clt', 'type', 'adresse_liv')
        }),
        ('Gestion de la commande', {
            'fields': ('status', 'employe', 'notes')
        }),
        ('Informations financières', {
            'fields': ('montant_total',)
        }),
        ('Informations système', {
            'fields': ('date_creation_h', 'date_maj_h'),
            'classes': ('collapse',)
        }),
    )
    
    def save_formset(self, request, form, formset, change):
        """Surcharge pour recalculer le total après modification des lignes"""
        instances = formset.save(commit=False)
        for instance in instances:
            instance.save()
        formset.save_m2m()
        
        # Recalculer le total de la commande
        if form.instance.pk:
            form.instance.calculer_total()


@admin.register(LigneDeCommande)
class LigneDeCommandeAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Lignes de Commande"""
    list_display = ['commande', 'plat', 'quantite', 'prix_unitaire', 'montant_ligne_formate']
    list_filter = ['commande__status', 'plat__categorie']
    search_fields = ['commande__nom_clt', 'plat__nom']
    readonly_fields = ['montant_ligne']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('commande', 'plat', 'quantite')
        }),
        ('Prix', {
            'fields': ('prix_unitaire', 'montant_ligne')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )
