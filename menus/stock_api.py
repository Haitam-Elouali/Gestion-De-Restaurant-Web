"""
API pour la gestion des stocks (RG10 et RG11)
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from .models import Ingredient, Plat, PlatIngredient


def api_ingredients(request):
    """API: liste des ingrédients avec leur stock"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    ingredients = []
    for ing in Ingredient.objects.all().order_by('nom'):
        ingredients.append({
            'id': ing.id,
            'nom': ing.nom,
            'unite': ing.unite,
            'quantite_stock': float(ing.quantite_stock),
            'seuil_alerte': float(ing.seuil_alerte),
            'est_disponible': ing.est_disponible,
            'est_en_alerte': ing.est_en_alerte(),
        })
    
    return JsonResponse({'ingredients': ingredients})


@csrf_exempt
def api_ajouter_stock(request, ingredient_id):
    """API: ajouter du stock à un ingrédient - POST (Manager/Admin uniquement)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin ou manager
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    
    if user_role not in ['admin', 'manager']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent gérer les stocks.'
        }, status=403)
    
    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    data = json.loads(request.body)
    quantite = data.get('quantite', 0)
    
    ingredient.quantite_stock += float(quantite)
    ingredient.save()
    
    return JsonResponse({
        'success': True,
        'message': f'Stock de {ingredient.nom} mis à jour: {ingredient.quantite_stock} {ingredient.unite}',
        'ingredient': {
            'id': ingredient.id,
            'nom': ingredient.nom,
            'quantite_stock': float(ingredient.quantite_stock),
        }
    })


@csrf_exempt
def api_creer_ingredient(request):
    """API: créer un nouvel ingrédient - POST (Manager/Admin uniquement)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin ou manager
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    
    if user_role not in ['admin', 'manager']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent créer des ingrédients.'
        }, status=403)
    
    data = json.loads(request.body)
    
    ingredient = Ingredient.objects.create(
        nom=data.get('nom'),
        unite=data.get('unite', 'unité'),
        quantite_stock=data.get('quantite_stock', 0),
        seuil_alerte=data.get('seuil_alerte', 10),
    )
    
    return JsonResponse({
        'success': True,
        'message': f'Ingrédient {ingredient.nom} créé avec succès.',
        'ingredient': {
            'id': ingredient.id,
            'nom': ingredient.nom,
            'unite': ingredient.unite,
            'quantite_stock': float(ingredient.quantite_stock),
        }
    })


def api_plat_ingredients(request, plat_id):
    """API: liste des ingrédients nécessaires pour un plat"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    plat = get_object_or_404(Plat, id=plat_id)
    plat_ingredients = []
    
    for pi in PlatIngredient.objects.filter(plat=plat):
        plat_ingredients.append({
            'id': pi.id,
            'ingredient_id': pi.ingredient.id,
            'ingredient_nom': pi.ingredient.nom,
            'quantite_necessaire': float(pi.quantite_necessaire),
            'unite': pi.ingredient.unite,
            'quantite_stock': float(pi.ingredient.quantite_stock),
            'ingredient_disponible': pi.ingredient.est_disponible,
        })
    
    return JsonResponse({
        'plat_id': plat.id,
        'plat_nom': plat.nom,
        'ingredients': plat_ingredients,
        'plat_disponible': plat.disponible,
    })


@csrf_exempt
def api_ajouter_ingredient_plat(request, plat_id):
    """API: ajouter un ingrédient à un plat - POST (Manager/Admin uniquement)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin ou manager
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    
    if user_role not in ['admin', 'manager']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent modifier les plats.'
        }, status=403)
    
    plat = get_object_or_404(Plat, id=plat_id)
    data = json.loads(request.body)
    ingredient_id = data.get('ingredient_id')
    quantite = data.get('quantite_necessaire', 1)
    
    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    
    pi, created = PlatIngredient.objects.get_or_create(
        plat=plat,
        ingredient=ingredient,
        defaults={'quantite_necessaire': quantite}
    )
    
    if not created:
        pi.quantite_necessaire = quantite
        pi.save()
    
    return JsonResponse({
        'success': True,
        'message': f'{ingredient.nom} ajouté au plat {plat.nom}.',
    })


@csrf_exempt
def api_verifier_disponibilite_plats(request):
    """API: vérifier et mettre à jour la disponibilité de tous les plats - RG11"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    plats_mis_a_jour = []
    plats_indisponibles = []
    
    for plat in Plat.objects.all():
        if plat.verifier_disponibilite_ingredients():
            if not plat.disponible:
                plat.disponible = True
                plat.save()
                plats_mis_a_jour.append(plat.nom)
        else:
            if plat.disponible:
                plat.disponible = False
                plat.save()
                plats_indisponibles.append(plat.nom)
    
    return JsonResponse({
        'success': True,
        'plats_rendus_disponibles': plats_mis_a_jour,
        'plats_rendus_indisponibles': plats_indisponibles,
        'message': f'RG11: {len(plats_mis_a_jour)} plats rendus disponibles, {len(plats_indisponibles)} plats rendus indisponibles.'
    })
