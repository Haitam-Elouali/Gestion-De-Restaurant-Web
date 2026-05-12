import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from core.api import get_user_role
from .models import Categorie, Plat, PlatIngredient, Promotion


def _can_manage_catalogue(user):
    return get_user_role(user) in ['admin', 'manager']


def api_categories(request):
    """API: liste des categories"""
    categories = list(Categorie.objects.values('id', 'nom', 'description'))
    return JsonResponse({'categories': categories})


def api_plats(request):
    """API: liste des plats"""
    plats = []
    for plat in Plat.objects.select_related('categorie').prefetch_related('ingredients_necessaires__ingredient').all():
        plats.append({
            'id': plat.id,
            'nom': plat.nom,
            'description': plat.description,
            'prix': float(plat.prix),
            'disponible': plat.disponible,
            'image': plat.image.url if plat.image else None,
            'categorie_id': plat.categorie_id,
            'categorie_nom': plat.categorie.nom,
            'ingredients': [
                {
                    'id': liaison.id,
                    'ingredient_id': liaison.ingredient.id,
                    'ingredient_nom': liaison.ingredient.nom,
                    'quantite_necessaire': float(liaison.quantite_necessaire),
                    'unite': liaison.ingredient.unite,
                }
                for liaison in plat.ingredients_necessaires.all()
            ],
        })
    return JsonResponse({'plats': plats})


def api_menu(request):
    """API: menu public avec categories et plats"""
    categories = []
    for cat in Categorie.objects.prefetch_related('plats').all():
        plats = []
        for plat in cat.plats.all():
            plats.append({
                'id': plat.id,
                'nom': plat.nom,
                'description': plat.description,
                'prix': float(plat.prix),
                'disponible': plat.disponible,
                'image': plat.image.url if plat.image else None,
            })
        categories.append({
            'id': cat.id,
            'nom': cat.nom,
            'description': cat.description,
            'plats': plats,
        })
    return JsonResponse({'categories': categories})


def api_promotions(request):
    """API: promotions actives"""
    promotions = []
    for promo in Promotion.objects.filter(active=True):
        plats_ids = list(promo.plats.values_list('id', flat=True))
        promotions.append({
            'id': promo.id,
            'nom': promo.nom,
            'description': promo.description,
            'reduction_pourcentage': float(promo.reduction_pourcentage),
            'date_debut': str(promo.date_debut),
            'date_fin': str(promo.date_fin),
            'plats_ids': plats_ids,
        })
    return JsonResponse({'promotions': promotions})


@csrf_exempt
def api_creer_categorie(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_catalogue(request.user):
        return JsonResponse({'success': False, 'message': 'Acces non autorise.'}, status=403)

    data = json.loads(request.body)
    categorie = Categorie.objects.create(
        nom=data.get('nom', '').strip(),
        description=data.get('description', '').strip(),
    )
    return JsonResponse({
        'success': True,
        'categorie': {
            'id': categorie.id,
            'nom': categorie.nom,
            'description': categorie.description,
        }
    })


@csrf_exempt
def api_modifier_categorie(request, categorie_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_catalogue(request.user):
        return JsonResponse({'success': False, 'message': 'Acces non autorise.'}, status=403)

    categorie = get_object_or_404(Categorie, id=categorie_id)
    data = json.loads(request.body)
    categorie.nom = data.get('nom', categorie.nom).strip()
    categorie.description = data.get('description', categorie.description or '').strip()
    categorie.save()
    return JsonResponse({'success': True, 'message': 'Categorie mise a jour avec succes.'})


@csrf_exempt
def api_supprimer_categorie(request, categorie_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_catalogue(request.user):
        return JsonResponse({'success': False, 'message': 'Acces non autorise.'}, status=403)

    categorie = get_object_or_404(Categorie, id=categorie_id)
    categorie.delete()
    return JsonResponse({'success': True, 'message': 'Categorie supprimee avec succes.'})


def _sync_plat_ingredients(plat, ingredients):
    PlatIngredient.objects.filter(plat=plat).exclude(
        ingredient_id__in=[item['ingredient_id'] for item in ingredients]
    ).delete()

    for item in ingredients:
        ingredient_id = item.get('ingredient_id')
        quantite = item.get('quantite_necessaire', 0)
        if not ingredient_id or not quantite:
            continue
        PlatIngredient.objects.update_or_create(
            plat=plat,
            ingredient_id=ingredient_id,
            defaults={'quantite_necessaire': quantite},
        )

    plat.verifier_disponibilite_ingredients()


@csrf_exempt
def api_creer_plat(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_catalogue(request.user):
        return JsonResponse({'success': False, 'message': 'Acces non autorise.'}, status=403)

    data = json.loads(request.body)
    plat = Plat.objects.create(
        nom=data.get('nom', '').strip(),
        description=data.get('description', '').strip(),
        prix=data.get('prix', 0),
        categorie_id=data.get('categorie_id'),
        disponible=data.get('disponible', True),
    )
    _sync_plat_ingredients(plat, data.get('ingredients', []))
    return JsonResponse({'success': True, 'message': 'Plat cree avec succes.', 'plat_id': plat.id})


@csrf_exempt
def api_modifier_plat(request, plat_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_catalogue(request.user):
        return JsonResponse({'success': False, 'message': 'Acces non autorise.'}, status=403)

    plat = get_object_or_404(Plat, id=plat_id)
    data = json.loads(request.body)

    plat.nom = data.get('nom', plat.nom).strip()
    plat.description = data.get('description', plat.description).strip()
    plat.prix = data.get('prix', plat.prix)
    plat.disponible = data.get('disponible', plat.disponible)
    if data.get('categorie_id'):
        plat.categorie_id = data['categorie_id']
    plat.save()

    if 'ingredients' in data:
        _sync_plat_ingredients(plat, data.get('ingredients', []))

    return JsonResponse({'success': True, 'message': 'Plat mis a jour avec succes.'})


@csrf_exempt
def api_supprimer_plat(request, plat_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if not _can_manage_catalogue(request.user):
        return JsonResponse({'success': False, 'message': 'Acces non autorise.'}, status=403)

    plat = get_object_or_404(Plat, id=plat_id)
    plat.delete()
    return JsonResponse({'success': True, 'message': 'Plat supprime avec succes.'})
