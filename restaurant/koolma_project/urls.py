"""
URL configuration for koolma_project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path

from commandes import api as commandes_api
from commandes import facture_api as commandes_facture_api
from core import api as core_api
from core import stats_api as core_stats_api
from core import tables_api as core_tables_api
from core.views import react_app
from menus import api as menus_api
from menus import stock_api as menus_stock_api
from reservations import api as reservations_api


urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/status/', core_api.api_auth_status, name='api_auth_status'),
    path('api/auth/login/', core_api.api_login, name='api_login'),
    path('api/auth/logout/', core_api.api_logout, name='api_logout'),
    path('api/employes/', core_api.api_employes, name='api_employes'),
    path('api/employes/create/', core_api.api_create_employe, name='api_create_employe'),
    path('api/employes/<int:employe_id>/delete/', core_api.api_delete_employe, name='api_delete_employe'),
    path('api/employes/<int:employe_id>/update/', core_api.api_update_employe, name='api_update_employe'),
    path('api/employes/diagnostic/', core_api.api_diagnostic_employes, name='api_diagnostic_employes'),
    path('api/employes/nettoyer-orphelins/', core_api.api_nettoyer_utilisateurs_orphelins, name='api_nettoyer_utilisateurs_orphelins'),
    path('api/employes/creer-caissier-defaut/', core_api.api_creer_caissier_defaut, name='api_creer_caissier_defaut'),

    path('api/configuration/', core_api.api_configuration, name='api_configuration'),
    path('api/configuration/update/', core_api.api_update_configuration, name='api_update_configuration'),
    path('api/configuration/public/', core_api.api_configuration_public, name='api_configuration_public'),
    path('api/caisse/mouvement/', core_api.api_caisse_mouvement, name='api_caisse_mouvement'),

    path('api/tables/admin/', core_api.api_tables, name='api_tables_admin'),
    path('api/tables/admin/create/', core_api.api_create_table, name='api_create_table'),
    path('api/tables/admin/<int:table_id>/', core_api.api_update_table, name='api_update_table'),
    path('api/tables/admin/<int:table_id>/delete/', core_api.api_delete_table, name='api_delete_table'),

    path('api/tables/', core_tables_api.api_tables, name='api_tables'),
    path('api/tables/create/', core_tables_api.api_creer_table, name='api_creer_table'),
    path('api/tables/<int:table_id>/assigner/', core_tables_api.api_assigner_table, name='api_assigner_table'),
    path('api/tables/<int:table_id>/liberer/', core_tables_api.api_liberer_table, name='api_liberer_table'),
    path('api/tables/<int:table_id>/assigner-serveur/', core_tables_api.api_assigner_serveur_table, name='api_assigner_serveur_table'),

    path('api/menu/', menus_api.api_menu, name='api_menu'),
    path('api/plats/', menus_api.api_plats, name='api_plats'),
    path('api/plats/create/', menus_api.api_creer_plat, name='api_creer_plat'),
    path('api/plats/<int:plat_id>/update/', menus_api.api_modifier_plat, name='api_modifier_plat'),
    path('api/plats/<int:plat_id>/delete/', menus_api.api_supprimer_plat, name='api_supprimer_plat'),
    path('api/categories/', menus_api.api_categories, name='api_categories'),
    path('api/categories/create/', menus_api.api_creer_categorie, name='api_creer_categorie'),
    path('api/categories/<int:categorie_id>/update/', menus_api.api_modifier_categorie, name='api_modifier_categorie'),
    path('api/categories/<int:categorie_id>/delete/', menus_api.api_supprimer_categorie, name='api_supprimer_categorie'),
    path('api/promotions/', menus_api.api_promotions, name='api_promotions'),

    path('api/ingredients/', menus_stock_api.api_ingredients, name='api_ingredients'),
    path('api/ingredients/create/', menus_stock_api.api_creer_ingredient, name='api_creer_ingredient'),
    path('api/ingredients/<int:ingredient_id>/ajouter-stock/', menus_stock_api.api_ajouter_stock, name='api_ajouter_stock'),
    path('api/ingredients/<int:ingredient_id>/retirer-stock/', menus_stock_api.api_retirer_stock, name='api_retirer_stock'),
    path('api/ingredients/<int:ingredient_id>/update/', menus_stock_api.api_modifier_ingredient, name='api_modifier_ingredient'),
    path('api/ingredients/<int:ingredient_id>/delete/', menus_stock_api.api_supprimer_ingredient, name='api_supprimer_ingredient'),
    path('api/plats/<int:plat_id>/ingredients/', menus_stock_api.api_plat_ingredients, name='api_plat_ingredients'),
    path('api/plats/<int:plat_id>/ingredients/ajouter/', menus_stock_api.api_ajouter_ingredient_plat, name='api_ajouter_ingredient_plat'),
    path('api/plats/verifier-disponibilite/', menus_stock_api.api_verifier_disponibilite_plats, name='api_verifier_disponibilite_plats'),

    path('api/reservations/', reservations_api.api_reservations, name='api_reservations'),
    path('api/reservations/create/', reservations_api.api_creer_reservation, name='api_creer_reservation'),
    path('api/reservations/<int:reservation_id>/modifier/', reservations_api.api_modifier_reservation, name='api_modifier_reservation'),
    path('api/reservations/<int:reservation_id>/supprimer/', reservations_api.api_supprimer_reservation, name='api_supprimer_reservation'),

    path('api/statistiques/', core_stats_api.api_statistiques, name='api_statistiques'),
    path('api/statistiques/verification/', core_stats_api.api_stats_verifier_actualisation, name='api_stats_verif'),

    path('api/commandes/', commandes_api.api_commandes, name='api_commandes'),
    path('api/commandes/<int:commande_id>/', commandes_api.api_commande_detail, name='api_commande_detail'),
    path('api/commandes/nouvelle/', commandes_api.api_nouvelle_commande, name='api_nouvelle_commande'),
    path('api/commandes/<int:commande_id>/ajouter-plat/', commandes_api.api_ajouter_plat_commande, name='api_ajouter_plat_commande'),
    path('api/commandes/<int:commande_id>/modifier-statut/', commandes_api.api_modifier_statut_commande, name='api_modifier_statut_commande'),
    path('api/commandes/supprimer-toutes/', commandes_api.api_supprimer_commandes, name='api_supprimer_commandes'),
    path('api/commandes/liberer-toutes-tables/', commandes_api.api_liberer_toutes_tables, name='api_liberer_toutes_tables'),
    path('api/lignes/<int:ligne_id>/supprimer/', commandes_api.api_supprimer_ligne, name='api_supprimer_ligne'),
    path('api/lignes/<int:ligne_id>/modifier-quantite/', commandes_api.api_modifier_quantite_ligne, name='api_modifier_quantite_ligne'),

    path('api/factures/', commandes_facture_api.api_factures, name='api_factures'),
    path('api/factures/<int:commande_id>/creer/', commandes_facture_api.api_creer_facture, name='api_creer_facture'),
    path('api/factures/<int:facture_id>/valider-paiement/', commandes_facture_api.api_valider_paiement, name='api_valider_paiement'),
    path('api/factures/<int:facture_id>/annuler/', commandes_facture_api.api_annuler_facture, name='api_annuler_facture'),
    path('api/factures/<int:facture_id>/imprimer/', commandes_facture_api.api_imprimer_facture, name='api_imprimer_facture'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += [
    path('', react_app, name='react_app'),
    path('<path:path>', react_app, name='react_app_catchall'),
]
