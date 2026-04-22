import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Manager, Serveur, Cuisinier


def api_auth_status(request):
    """API: statut de l'authentification"""
    user = request.user
    if user.is_authenticated:
        role = None
        if hasattr(user, 'manager_profile'):
            role = 'manager'
        elif hasattr(user, 'serveur_profile'):
            role = 'serveur'
        elif hasattr(user, 'cuisinier_profile'):
            role = 'cuisinier'

        return JsonResponse({
            'authenticated': True,
            'username': user.username,
            'role': role,
            'email': user.email,
        })
    return JsonResponse({'authenticated': False})


@csrf_exempt
def api_login(request):
    """API: connexion (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        role = None
        if hasattr(user, 'manager_profile'):
            role = 'manager'
        elif hasattr(user, 'serveur_profile'):
            role = 'serveur'
        elif hasattr(user, 'cuisinier_profile'):
            role = 'cuisinier'
        return JsonResponse({
            'success': True,
            'username': user.username,
            'role': role,
        })
    return JsonResponse({'success': False, 'message': 'Nom d\'utilisateur ou mot de passe incorrect.'})


@csrf_exempt
def api_logout(request):
    """API: deconnexion (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    logout(request)
    return JsonResponse({'success': True})


def api_employes(request):
    """API: liste des employes"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    managers = []
    for m in Manager.objects.all():
        managers.append({
            'id': m.id,
            'nom': m.nom,
            'prenom': m.prenom,
            'telephone': m.telephone,
            'email': m.email,
            'salaire_mensuel': float(m.salaire_mensuel),
            'date_embauche': str(m.date_embauche),
            'type': 'manager',
        })

    serveurs = []
    for s in Serveur.objects.all():
        serveurs.append({
            'id': s.id,
            'nom': s.nom,
            'prenom': s.prenom,
            'telephone': s.telephone,
            'email': s.email,
            'salaire_mensuel': float(s.salaire_mensuel),
            'date_embauche': str(s.date_embauche),
            'type': 'serveur',
        })

    cuisiniers = []
    for c in Cuisinier.objects.all():
        cuisiniers.append({
            'id': c.id,
            'nom': c.nom,
            'prenom': c.prenom,
            'telephone': c.telephone,
            'email': c.email,
            'salaire_mensuel': float(c.salaire_mensuel),
            'date_embauche': str(c.date_embauche),
            'status': c.status,
            'type': 'cuisinier',
        })

    return JsonResponse({
        'managers': managers,
        'serveurs': serveurs,
        'cuisiniers': cuisiniers,
    })
