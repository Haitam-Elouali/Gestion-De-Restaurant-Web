from django.urls import path
from . import views

app_name = 'commandes'

urlpatterns = [
    # Dashboards par rôle
    path('serveur/', views.serveur_dashboard, name='serveur_dashboard'),
    path('cuisinier/', views.cuisinier_dashboard, name='cuisinier_dashboard'),
    path('manager/', views.manager_dashboard, name='manager_dashboard'),
    
    # Gestion des commandes (Serveur)
    path('nouvelle-commande/', views.nouvelle_commande, name='nouvelle_commande'),
    path('commande/<int:commande_id>/modifier/', views.modifier_commande, name='modifier_commande'),
    path('commande/<int:commande_id>/ajouter-plat/', views.ajouter_plat_commande, name='ajouter_plat_commande'),
    path('ligne/<int:ligne_id>/supprimer/', views.supprimer_ligne_commande, name='supprimer_ligne_commande'),
    path('commande/<int:commande_id>/modifier-statut/', views.modifier_statut_commande, name='modifier_statut_commande'),
    
    # Gestion des plats (Cuisinier)
    path('ligne/<int:ligne_id>/marquer-prepare/', views.marquer_plat_prepare, name='marquer_plat_prepare'),
    path('plat/<int:plat_id>/signaler-rupture/', views.signaler_rupture_stock, name='signaler_rupture_stock'),
    
    # Gestion des commandes (Manager)
    path('gestion-commandes/', views.gestion_commandes, name='gestion_commandes'),
    path('rapport-ventes/', views.rapport_ventes, name='rapport_ventes'),
] 