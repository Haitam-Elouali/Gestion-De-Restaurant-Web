from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Categorie, Plat, Promotion
from .forms import CategorieForm, PlatForm, PromotionForm


def menu_public(request):
    """Vue pour afficher le menu public"""
    categories = Categorie.objects.prefetch_related('plats').all()
    promotions = Promotion.objects.filter(active=True)
    
    context = {
        'categories': categories,
        'promotions': promotions,
    }
    return render(request, 'menus/menu_public.html', context)


@login_required
def gestion_menus(request):
    """Vue pour la gestion des menus (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    categories = Categorie.objects.all()
    plats = Plat.objects.select_related('categorie').all()
    promotions = Promotion.objects.all()
    
    context = {
        'categories': categories,
        'plats': plats,
        'promotions': promotions,
    }
    return render(request, 'menus/gestion_menus.html', context)


# Gestion des catégories
@login_required
def creer_categorie(request):
    """Vue pour créer une nouvelle catégorie (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = CategorieForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Catégorie créée avec succès.')
            return redirect('menus:gestion_menus')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = CategorieForm()
    
    return render(request, 'menus/creer_categorie.html', {'form': form})


@login_required
def modifier_categorie(request, categorie_id):
    """Vue pour modifier une catégorie (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    categorie = get_object_or_404(Categorie, id=categorie_id)
    
    if request.method == 'POST':
        form = CategorieForm(request.POST, instance=categorie)
        if form.is_valid():
            form.save()
            messages.success(request, 'Catégorie modifiée avec succès.')
            return redirect('menus:gestion_menus')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = CategorieForm(instance=categorie)
    
    return render(request, 'menus/modifier_categorie.html', {'form': form, 'categorie': categorie})


@login_required
@require_http_methods(["POST"])
def supprimer_categorie(request, categorie_id):
    """Vue pour supprimer une catégorie (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        categorie = get_object_or_404(Categorie, id=categorie_id)
        
        # Vérifier s'il y a des plats dans cette catégorie
        if categorie.plats.exists():
            return JsonResponse({
                'success': False, 
                'message': 'Impossible de supprimer cette catégorie car elle contient des plats.'
            })
        
        categorie.delete()
        return JsonResponse({'success': True, 'message': 'Catégorie supprimée avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur lors de la suppression: {str(e)}'})


# Gestion des plats
@login_required
def creer_plat(request):
    """Vue pour créer un nouveau plat (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = PlatForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Plat créé avec succès.')
            return redirect('menus:gestion_menus')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = PlatForm()
    
    return render(request, 'menus/creer_plat.html', {'form': form})


@login_required
def modifier_plat(request, plat_id):
    """Vue pour modifier un plat (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    plat = get_object_or_404(Plat, id=plat_id)
    
    if request.method == 'POST':
        form = PlatForm(request.POST, request.FILES, instance=plat)
        if form.is_valid():
            form.save()
            messages.success(request, 'Plat modifié avec succès.')
            return redirect('menus:gestion_menus')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = PlatForm(instance=plat)
    
    return render(request, 'menus/modifier_plat.html', {'form': form, 'plat': plat})


@login_required
@require_http_methods(["POST"])
def supprimer_plat(request, plat_id):
    """Vue pour supprimer un plat (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        plat = get_object_or_404(Plat, id=plat_id)
        plat.delete()
        return JsonResponse({'success': True, 'message': 'Plat supprimé avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur lors de la suppression: {str(e)}'})


@login_required
@require_http_methods(["POST"])
def toggle_disponibilite_plat(request, plat_id):
    """Vue pour basculer la disponibilité d'un plat (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        plat = get_object_or_404(Plat, id=plat_id)
        plat.disponible = not plat.disponible
        plat.save()
        
        status = "disponible" if plat.disponible else "indisponible"
        return JsonResponse({
            'success': True, 
            'message': f'Plat marqué comme {status}.',
            'disponible': plat.disponible
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})


# Gestion des promotions
@login_required
def creer_promotion(request):
    """Vue pour créer une nouvelle promotion (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = PromotionForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Promotion créée avec succès.')
            return redirect('menus:gestion_menus')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = PromotionForm()
    
    return render(request, 'menus/creer_promotion.html', {'form': form})


@login_required
def modifier_promotion(request, promotion_id):
    """Vue pour modifier une promotion (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    promotion = get_object_or_404(Promotion, id=promotion_id)
    
    if request.method == 'POST':
        form = PromotionForm(request.POST, instance=promotion)
        if form.is_valid():
            form.save()
            messages.success(request, 'Promotion modifiée avec succès.')
            return redirect('menus:gestion_menus')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = PromotionForm(instance=promotion)
    
    return render(request, 'menus/modifier_promotion.html', {'form': form, 'promotion': promotion})


@login_required
@require_http_methods(["POST"])
def supprimer_promotion(request, promotion_id):
    """Vue pour supprimer une promotion (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        promotion = get_object_or_404(Promotion, id=promotion_id)
        promotion.delete()
        return JsonResponse({'success': True, 'message': 'Promotion supprimée avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur lors de la suppression: {str(e)}'})


@login_required
@require_http_methods(["POST"])
def toggle_activite_promotion(request, promotion_id):
    """Vue pour basculer l'activité d'une promotion (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        promotion = get_object_or_404(Promotion, id=promotion_id)
        promotion.active = not promotion.active
        promotion.save()
        
        status = "active" if promotion.active else "inactive"
        return JsonResponse({
            'success': True, 
            'message': f'Promotion marquée comme {status}.',
            'active': promotion.active
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})
