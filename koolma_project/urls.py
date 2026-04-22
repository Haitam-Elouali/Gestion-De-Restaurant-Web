"""
URL configuration for koolma_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import home, login_view, logout_view, dashboard, react_app
from menus.views import menu_public
from commandes.views import serveur_dashboard, cuisinier_dashboard, manager_dashboard
from core import api as core_api
from menus import api as menus_api
from commandes import api as commandes_api

urlpatterns = [
    path('admin/', admin.site.urls),

    # API pour le frontend React
    path('api/auth/status/', core_api.api_auth_status, name='api_auth_status'),
    path('api/auth/login/', core_api.api_login, name='api_login'),
    path('api/auth/logout/', core_api.api_logout, name='api_logout'),
    path('api/employes/', core_api.api_employes, name='api_employes'),

    path('api/menu/', menus_api.api_menu, name='api_menu'),
    path('api/plats/', menus_api.api_plats, name='api_plats'),
    path('api/categories/', menus_api.api_categories, name='api_categories'),
    path('api/promotions/', menus_api.api_promotions, name='api_promotions'),

    path('api/commandes/', commandes_api.api_commandes, name='api_commandes'),
    path('api/commandes/<int:commande_id>/', commandes_api.api_commande_detail, name='api_commande_detail'),
    path('api/commandes/nouvelle/', commandes_api.api_nouvelle_commande, name='api_nouvelle_commande'),
    path('api/commandes/<int:commande_id>/ajouter-plat/', commandes_api.api_ajouter_plat_commande, name='api_ajouter_plat_commande'),
    path('api/commandes/<int:commande_id>/modifier-statut/', commandes_api.api_modifier_statut_commande, name='api_modifier_statut_commande'),
    path('api/lignes/<int:ligne_id>/supprimer/', commandes_api.api_supprimer_ligne, name='api_supprimer_ligne'),

    # Legacy Django template routes (toujours accessibles)
    path('legacy/', home, name='home'),
    path('legacy/menu/', menu_public, name='menu_public'),
    path('legacy/login/', login_view, name='login'),
    path('legacy/logout/', logout_view, name='logout'),
    path('legacy/dashboard/', dashboard, name='dashboard'),
    path('legacy/serveur/', serveur_dashboard, name='serveur_dashboard'),
    path('legacy/cuisinier/', cuisinier_dashboard, name='cuisinier_dashboard'),
    path('legacy/manager/', manager_dashboard, name='manager_dashboard'),
    path('legacy/core/', include('core.urls')),
    path('legacy/menus/', include('menus.urls')),
    path('legacy/commandes/', include('commandes.urls')),

    # Catch-all pour l'application React (doit etre en dernier)
    # Ces routes servent l'index.html pour que React Router fonctionne
    path('', react_app, name='react_app'),
    path('<path:path>', react_app, name='react_app_catchall'),
]

# Configuration pour les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
