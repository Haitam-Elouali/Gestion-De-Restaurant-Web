from django.contrib import admin
from .models import Categorie, Plat, Promotion


class PlatInline(admin.TabularInline):
    """Inline pour afficher les plats dans une catégorie"""
    model = Plat
    extra = 0
    fields = ['nom', 'prix', 'disponible']


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Catégories"""
    list_display = ['nom', 'nombre_plats', 'date_creation']
    search_fields = ['nom', 'description']
    readonly_fields = ['date_creation', 'date_modification']
    inlines = [PlatInline]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom', 'description')
        }),
        ('Informations système', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def nombre_plats(self, obj):
        """Retourne le nombre de plats dans cette catégorie"""
        return obj.plats.count()
    nombre_plats.short_description = "Nombre de plats"


@admin.register(Plat)
class PlatAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Plats"""
    list_display = ['nom', 'categorie', 'prix_formate', 'disponible', 'date_creation']
    list_filter = ['categorie', 'disponible', 'date_creation']
    search_fields = ['nom', 'description', 'categorie__nom']
    readonly_fields = ['date_creation', 'date_modification']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom', 'description', 'categorie')
        }),
        ('Prix et disponibilité', {
            'fields': ('prix', 'disponible')
        }),
        ('Image', {
            'fields': ('image',)
        }),
        ('Informations système', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    def prix_formate(self, obj):
        """Retourne le prix formaté"""
        return obj.prix_formate
    prix_formate.short_description = "Prix"


class PlatInlinePromotion(admin.TabularInline):
    """Inline pour afficher les plats dans une promotion"""
    model = Promotion.plats.through
    extra = 1


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Promotions"""
    list_display = ['nom', 'reduction_pourcentage', 'date_debut', 'date_fin', 'active', 'est_active']
    list_filter = ['active', 'date_debut', 'date_fin']
    search_fields = ['nom', 'description']
    readonly_fields = ['date_creation', 'date_modification', 'est_active']
    inlines = [PlatInlinePromotion]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom', 'description')
        }),
        ('Paramètres de réduction', {
            'fields': ('reduction_pourcentage',)
        }),
        ('Période de validité', {
            'fields': ('date_debut', 'date_fin', 'active')
        }),
        ('Informations système', {
            'fields': ('date_creation', 'date_modification', 'est_active'),
            'classes': ('collapse',)
        }),
    )
    
    def est_active(self, obj):
        """Affiche si la promotion est actuellement active"""
        return obj.est_active
    est_active.boolean = True
    est_active.short_description = "Actuellement active"
