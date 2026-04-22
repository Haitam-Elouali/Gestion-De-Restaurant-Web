from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Manager, Serveur, Cuisinier


class ManagerAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Managers"""
    list_display = ['getNomComplet', 'telephone', 'email', 'salaire_mensuel', 'date_embauche']
    list_filter = ['date_embauche', 'date_creation']
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    readonly_fields = ['date_creation', 'date_modification', 'date_embauche']
    
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('user', 'nom', 'prenom', 'telephone', 'email')
        }),
        ('Informations professionnelles', {
            'fields': ('salaire_mensuel',)
        }),
        ('Informations système', {
            'fields': ('date_embauche', 'date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


class ServeurAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Serveurs"""
    list_display = ['getNomComplet', 'telephone', 'email', 'salaire_mensuel', 'date_embauche']
    list_filter = ['date_embauche', 'date_creation']
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    readonly_fields = ['date_creation', 'date_modification', 'date_embauche']
    
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('user', 'nom', 'prenom', 'telephone', 'email')
        }),
        ('Informations professionnelles', {
            'fields': ('salaire_mensuel',)
        }),
        ('Informations système', {
            'fields': ('date_embauche', 'date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


class CuisinierAdmin(admin.ModelAdmin):
    """Interface d'administration pour les Cuisiniers"""
    list_display = ['getNomComplet', 'telephone', 'email', 'salaire_mensuel', 'status', 'date_embauche']
    list_filter = ['status', 'date_embauche', 'date_creation']
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    readonly_fields = ['date_creation', 'date_modification', 'date_embauche']
    
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('user', 'nom', 'prenom', 'telephone', 'email')
        }),
        ('Informations professionnelles', {
            'fields': ('salaire_mensuel', 'status')
        }),
        ('Informations système', {
            'fields': ('date_embauche', 'date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )


# Enregistrement des modèles dans l'admin
admin.site.register(Manager, ManagerAdmin)
admin.site.register(Serveur, ServeurAdmin)
admin.site.register(Cuisinier, CuisinierAdmin)
