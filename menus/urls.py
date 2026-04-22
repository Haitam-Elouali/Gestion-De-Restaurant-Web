from django.urls import path
from . import views

app_name = 'menus'

urlpatterns = [
    # Menu public
    path('menu/', views.menu_public, name='menu_public'),
    
    # Gestion des menus (Manager uniquement)
    path('gestion/', views.gestion_menus, name='gestion_menus'),
    
    # Gestion des catégories
    path('categorie/creer/', views.creer_categorie, name='creer_categorie'),
    path('categorie/<int:categorie_id>/modifier/', views.modifier_categorie, name='modifier_categorie'),
    path('categorie/<int:categorie_id>/supprimer/', views.supprimer_categorie, name='supprimer_categorie'),
    
    # Gestion des plats
    path('plat/creer/', views.creer_plat, name='creer_plat'),
    path('plat/<int:plat_id>/modifier/', views.modifier_plat, name='modifier_plat'),
    path('plat/<int:plat_id>/supprimer/', views.supprimer_plat, name='supprimer_plat'),
    path('plat/<int:plat_id>/toggle-disponibilite/', views.toggle_disponibilite_plat, name='toggle_disponibilite_plat'),
    
    # Gestion des promotions
    path('promotion/creer/', views.creer_promotion, name='creer_promotion'),
    path('promotion/<int:promotion_id>/modifier/', views.modifier_promotion, name='modifier_promotion'),
    path('promotion/<int:promotion_id>/supprimer/', views.supprimer_promotion, name='supprimer_promotion'),
    path('promotion/<int:promotion_id>/toggle-activite/', views.toggle_activite_promotion, name='toggle_activite_promotion'),
] 