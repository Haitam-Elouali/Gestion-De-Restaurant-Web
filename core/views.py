from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from pathlib import Path
from .models import Manager, Serveur, Cuisinier
from .forms import LoginForm, ManagerForm, ServeurForm, CuisinierForm, UserCreationFormWithProfile


def home(request):
    """Vue pour la page d'accueil publique"""
    from menus.models import Plat, Promotion
    
    # Récupérer les plats mis en avant et les promotions actives
    plats_featured = Plat.objects.filter(disponible=True)[:6]
    promotions = Promotion.objects.filter(active=True)[:2]
    
    context = {
        'plats_featured': plats_featured,
        'promotions': promotions,
    }
    return render(request, 'core/home.html', context)


def login_view(request):
    """Vue pour la page de connexion"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            
            if user is not None:
                login(request, user)
                messages.success(request, f'Bienvenue {user.username}!')
                return redirect('dashboard')
            else:
                messages.error(request, 'Nom d\'utilisateur ou mot de passe incorrect.')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = LoginForm()
    
    return render(request, 'core/login.html', {'form': form})


@login_required
def logout_view(request):
    """Vue pour la déconnexion"""
    logout(request)
    messages.success(request, 'Vous avez été déconnecté avec succès.')
    return redirect('home')


@login_required
def dashboard(request):
    """Vue pour le dashboard principal après connexion"""
    user = request.user
    
    # Déterminer le type d'employé et rediriger vers l'interface appropriée
    try:
        if hasattr(user, 'manager_profile'):
            return redirect('manager_dashboard')
        elif hasattr(user, 'serveur_profile'):
            return redirect('serveur_dashboard')
        elif hasattr(user, 'cuisinier_profile'):
            return redirect('cuisinier_dashboard')
        else:
            # Si l'utilisateur n'a pas de profil employé, afficher une page d'erreur
            messages.error(request, 'Votre compte n\'est pas configuré correctement.')
            return render(request, 'core/error.html')
    except Exception as e:
        messages.error(request, f'Erreur lors de la détermination de votre rôle : {e}')
        return render(request, 'core/error.html')


@login_required
def profile_view(request):
    """Vue pour afficher et modifier le profil de l'utilisateur"""
    user = request.user
    employe = None
    form = None
    role = None

    try:
        if hasattr(user, 'manager_profile'):
            employe = user.manager_profile
            form = ManagerForm(instance=employe)
            role = 'manager'
        elif hasattr(user, 'serveur_profile'):
            employe = user.serveur_profile
            form = ServeurForm(instance=employe)
            role = 'serveur'
        elif hasattr(user, 'cuisinier_profile'):
            employe = user.cuisinier_profile
            form = CuisinierForm(instance=employe)
            role = 'cuisinier'
    except Exception:
        employe = None
        form = None

    if not employe:
        messages.error(request, "Profil non trouvé. Votre profil employé n'a pas été trouvé. Veuillez contacter l'administrateur.")
        return redirect('dashboard')

    if request.method == 'POST' and form:
        form = form.__class__(request.POST, instance=employe)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profil mis à jour avec succès.')
            return redirect('core:profile')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')

    context = {
        'employe': employe,
        'form': form,
        'role': role,
    }
    return render(request, 'core/profile.html', context)


# Vues pour la gestion des employés (Manager uniquement)
@login_required
def gestion_personnel(request):
    """Vue pour la gestion du personnel (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    managers = Manager.objects.all()
    serveurs = Serveur.objects.all()
    cuisiniers = Cuisinier.objects.all()
    
    context = {
        'managers': managers,
        'serveurs': serveurs,
        'cuisiniers': cuisiniers,
    }
    return render(request, 'core/gestion_personnel.html', context)


@login_required
def creer_employe(request):
    """Vue pour créer un nouvel employé (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')

    if request.method == 'POST':
        form = UserCreationFormWithProfile(request.POST)
    else:
        form = UserCreationFormWithProfile()

    # Restriction : seul un superuser peut créer un manager
    if not request.user.is_superuser:
        form.fields['type_employe'].choices = [
            (k, v) for k, v in form.fields['type_employe'].choices if k != 'manager'
        ]

    if request.method == 'POST':
        if form.is_valid():
            form.save()
            messages.success(request, 'Employé créé avec succès.')
            return redirect('core:gestion_personnel')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    
    return render(request, 'core/creer_employe.html', {'form': form})


@login_required
def modifier_employe(request, employe_id, type_employe):
    """Vue pour modifier un employé (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Récupérer l'employé selon son type
    if type_employe == 'manager':
        employe = get_object_or_404(Manager, id=employe_id)
        form_class = ManagerForm
    elif type_employe == 'serveur':
        employe = get_object_or_404(Serveur, id=employe_id)
        form_class = ServeurForm
    elif type_employe == 'cuisinier':
        employe = get_object_or_404(Cuisinier, id=employe_id)
        form_class = CuisinierForm
    else:
        messages.error(request, 'Type d\'employé invalide.')
        return redirect('core:gestion_personnel')
    
    if request.method == 'POST':
        form = form_class(request.POST, instance=employe)
        if form.is_valid():
            form.save()
            messages.success(request, 'Employé modifié avec succès.')
            return redirect('core:gestion_personnel')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = form_class(instance=employe)
    
    context = {
        'employe': employe,
        'form': form,
        'type_employe': type_employe,
    }
    return render(request, 'core/modifier_employe.html', context)


@login_required
@require_http_methods(["POST"])
def supprimer_employe(request, employe_id, type_employe):
    """Vue pour supprimer un employé (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        # Récupérer l'employé selon son type
        if type_employe == 'manager':
            employe = get_object_or_404(Manager, id=employe_id)
        elif type_employe == 'serveur':
            employe = get_object_or_404(Serveur, id=employe_id)
        elif type_employe == 'cuisinier':
            employe = get_object_or_404(Cuisinier, id=employe_id)
        else:
            return JsonResponse({'success': False, 'message': 'Type d\'employé invalide.'})
        
        # Supprimer l'utilisateur associé
        user = employe.user
        employe.delete()
        user.delete()
        
        return JsonResponse({'success': True, 'message': 'Employé supprimé avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur lors de la suppression: {str(e)}'})


def react_app(request, path=None):
    """Vue pour servir l'application React buildée"""
    index_path = Path(settings.BASE_DIR) / 'frontend' / 'dist' / 'index.html'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    return render(request, 'core/error.html', {'message': 'Application React non buildée. Lancez npm run build dans le dossier frontend.'})
