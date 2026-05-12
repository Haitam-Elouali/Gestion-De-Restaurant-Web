"""
API pour la gestion des stocks (RG10 et RG11).
"""
import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from core.api import get_user_role
from .models import Ingredient, Plat, PlatIngredient


def _can_manage_stock(user):
    return get_user_role(user) in ['admin', 'manager']


def _serialize_ingredient(ingredient):
    return {
        'id': ingredient.id,
        'nom': ingredient.nom,
        'unite': ingredient.unite,
        'quantite_stock': float(ingredient.quantite_stock),
        'seuil_alerte': float(ingredient.seuil_alerte),
        'est_disponible': ingredient.est_disponible,
        'est_en_alerte': ingredient.est_en_alerte(),
    }


def api_ingredients(request):
    """API: liste des ingredients avec leur stock"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    ingredients = [_serialize_ingredient(ing) for ing in Ingredient.objects.all().order_by('nom')]
    return JsonResponse({'ingredients': ingredients})


@csrf_exempt
def api_ajouter_stock(request, ingredient_id):
    """API: ajouter du stock a un ingredient"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_stock(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent gerer les stocks.'
        }, status=403)

    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    data = json.loads(request.body)
    quantite = float(data.get('quantite', 0))

    if quantite <= 0:
        return JsonResponse({'success': False, 'message': 'La quantite doit etre positive.'}, status=400)

    ingredient.quantite_stock += quantite
    ingredient.save()

    return JsonResponse({
        'success': True,
        'message': f'Stock de {ingredient.nom} mis a jour.',
        'ingredient': _serialize_ingredient(ingredient),
    })


@csrf_exempt
def api_retirer_stock(request, ingredient_id):
    """API: retirer du stock a un ingredient"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_stock(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent gerer les stocks.'
        }, status=403)

    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    data = json.loads(request.body)
    quantite = float(data.get('quantite', 0))

    if quantite <= 0:
        return JsonResponse({'success': False, 'message': 'La quantite doit etre positive.'}, status=400)
    if quantite > float(ingredient.quantite_stock):
        return JsonResponse({'success': False, 'message': 'Stock insuffisant pour cette sortie.'}, status=400)

    ingredient.quantite_stock -= quantite
    ingredient.save()

    return JsonResponse({
        'success': True,
        'message': f'Stock de {ingredient.nom} diminue avec succes.',
        'ingredient': _serialize_ingredient(ingredient),
    })


@csrf_exempt
def api_creer_ingredient(request):
    """API: creer un nouvel ingredient"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_stock(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent creer des ingredients.'
        }, status=403)

    data = json.loads(request.body)
    ingredient = Ingredient.objects.create(
        nom=data.get('nom'),
        unite=data.get('unite', 'unite'),
        quantite_stock=data.get('quantite_stock', 0),
        seuil_alerte=data.get('seuil_alerte', 10),
    )

    return JsonResponse({
        'success': True,
        'message': f'Ingredient {ingredient.nom} cree avec succes.',
        'ingredient': _serialize_ingredient(ingredient),
    })


@csrf_exempt
def api_modifier_ingredient(request, ingredient_id):
    """API: modifier un ingredient"""
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_stock(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent modifier les ingredients.'
        }, status=403)

    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    data = json.loads(request.body)
    ingredient.nom = data.get('nom', ingredient.nom)
    ingredient.unite = data.get('unite', ingredient.unite)
    ingredient.quantite_stock = data.get('quantite_stock', ingredient.quantite_stock)
    ingredient.seuil_alerte = data.get('seuil_alerte', ingredient.seuil_alerte)
    ingredient.save()

    return JsonResponse({
        'success': True,
        'message': 'Ingredient mis a jour avec succes.',
        'ingredient': _serialize_ingredient(ingredient),
    })


@csrf_exempt
def api_supprimer_ingredient(request, ingredient_id):
    """API: supprimer un ingredient"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_stock(request.user):
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent supprimer les ingredients.'
        }, status=403)

    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    ingredient.delete()
    return JsonResponse({'success': True, 'message': 'Ingredient supprime avec succes.'})


def api_plat_ingredients(request, plat_id):
    """API: liste des ingredients necessaires pour un plat"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    plat = get_object_or_404(Plat, id=plat_id)
    plat_ingredients = []

    for pi in PlatIngredient.objects.filter(plat=plat).select_related('ingredient'):
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
    """API: ajouter un ingredient a un plat"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_stock(request.user):
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

    plat.verifier_disponibilite_ingredients()

    return JsonResponse({
        'success': True,
        'message': f'{ingredient.nom} ajoute au plat {plat.nom}.',
    })


@csrf_exempt
def api_verifier_disponibilite_plats(request):
    """API: verifier et mettre a jour la disponibilite de tous les plats"""
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
