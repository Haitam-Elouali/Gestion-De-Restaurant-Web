from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Pages publiques
    path('', views.home, name='home'),
    
    # Authentification
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Dashboard et profil
    path('dashboard/', views.dashboard, name='dashboard'),
    path('profile/', views.profile_view, name='profile'),
    
    # Gestion du personnel (Manager uniquement)
    path('gestion-personnel/', views.gestion_personnel, name='gestion_personnel'),
    path('creer-employe/', views.creer_employe, name='creer_employe'),
    path('modifier-employe/<int:employe_id>/<str:type_employe>/', views.modifier_employe, name='modifier_employe'),
    path('supprimer-employe/<int:employe_id>/<str:type_employe>/', views.supprimer_employe, name='supprimer_employe'),
] 