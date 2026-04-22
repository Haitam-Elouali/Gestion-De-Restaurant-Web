from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Categorie, Plat, Promotion


def api_categories(request):
    """API: liste des categories"""
    categories = list(Categorie.objects.values('id', 'nom', 'description'))
    return JsonResponse({'categories': categories})


def api_plats(request):
    """API: liste des plats"""
    plats = []
    for plat in Plat.objects.select_related('categorie').all():
        plats.append({
            'id': plat.id,
            'nom': plat.nom,
            'description': plat.description,
            'prix': float(plat.prix),
            'disponible': plat.disponible,
            'image': plat.image.url if plat.image else None,
            'categorie_id': plat.categorie_id,
            'categorie_nom': plat.categorie.nom,
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
