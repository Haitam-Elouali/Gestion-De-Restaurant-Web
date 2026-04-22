import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from .models import Commande, LigneDeCommande
from menus.models import Plat


def api_commandes(request):
    """API: liste des commandes"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    commandes = []
    for cmd in Commande.objects.select_related('employe').prefetch_related('lignes__plat').order_by('-date_creation_h'):
        lignes = []
        for ligne in cmd.lignes.all():
            lignes.append({
                'id': ligne.id,
                'plat_id': ligne.plat_id,
                'plat_nom': ligne.plat.nom,
                'quantite': ligne.quantite,
                'prix_unitaire': float(ligne.prix_unitaire),
                'montant_ligne': float(ligne.montant_ligne),
            })
        commandes.append({
            'id': cmd.id,
            'type': cmd.type,
            'type_display': cmd.get_type_display(),
            'nom_clt': cmd.nom_clt,
            'adresse_liv': cmd.adresse_liv,
            'status': cmd.status,
            'status_display': cmd.get_status_display(),
            'date_creation': cmd.date_creation_h.isoformat(),
            'montant_total': float(cmd.montant_total),
            'nombre_plats': cmd.nombre_plats,
            'employe': cmd.employe.username if cmd.employe else None,
            'lignes': lignes,
        })
    return JsonResponse({'commandes': commandes})


def api_commande_detail(request, commande_id):
    """API: detail d'une commande"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    cmd = get_object_or_404(Commande, id=commande_id)
    lignes = []
    for ligne in cmd.lignes.all():
        lignes.append({
            'id': ligne.id,
            'plat_id': ligne.plat_id,
            'plat_nom': ligne.plat.nom,
            'quantite': ligne.quantite,
            'prix_unitaire': float(ligne.prix_unitaire),
            'montant_ligne': float(ligne.montant_ligne),
        })
    data = {
        'id': cmd.id,
        'type': cmd.type,
        'type_display': cmd.get_type_display(),
        'nom_clt': cmd.nom_clt,
        'adresse_liv': cmd.adresse_liv,
        'status': cmd.status,
        'status_display': cmd.get_status_display(),
        'date_creation': cmd.date_creation_h.isoformat(),
        'montant_total': float(cmd.montant_total),
        'nombre_plats': cmd.nombre_plats,
        'employe': cmd.employe.username if cmd.employe else None,
        'notes': cmd.notes,
        'lignes': lignes,
    }
    return JsonResponse(data)


@csrf_exempt
def api_nouvelle_commande(request):
    """API: creer une nouvelle commande (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    data = json.loads(request.body)
    cmd = Commande.objects.create(
        nom_clt=data.get('nom_clt', ''),
        type=data.get('type', 'sur_place_generique'),
        adresse_liv=data.get('adresse_liv', ''),
        notes=data.get('notes', ''),
        employe=request.user,
    )
    return JsonResponse({
        'success': True,
        'commande_id': cmd.id,
        'message': 'Commande creee avec succes.',
    })


@csrf_exempt
def api_ajouter_plat_commande(request, commande_id):
    """API: ajouter un plat a une commande (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    cmd = get_object_or_404(Commande, id=commande_id)
    data = json.loads(request.body)
    plat = get_object_or_404(Plat, id=data.get('plat_id'))
    quantite = int(data.get('quantite', 1))

    ligne, created = LigneDeCommande.objects.get_or_create(
        commande=cmd,
        plat=plat,
        defaults={'quantite': quantite}
    )
    if not created:
        ligne.quantite += quantite
        ligne.save()

    return JsonResponse({
        'success': True,
        'total': float(cmd.calculer_total()),
        'message': f'{quantite}x {plat.nom} ajoute.',
    })


@csrf_exempt
def api_modifier_statut_commande(request, commande_id):
    """API: modifier le statut d'une commande (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    cmd = get_object_or_404(Commande, id=commande_id)
    data = json.loads(request.body)
    nouveau_statut = data.get('statut')

    if nouveau_statut in dict(Commande.STATUT_CHOICES):
        cmd.status = nouveau_statut
        cmd.save()
        return JsonResponse({
            'success': True,
            'message': f"Statut modifie: {cmd.get_status_display()}",
        })
    return JsonResponse({'success': False, 'message': 'Statut invalide.'})


@csrf_exempt
def api_supprimer_ligne(request, ligne_id):
    """API: supprimer une ligne de commande (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    ligne = get_object_or_404(LigneDeCommande, id=ligne_id)
    cmd = ligne.commande
    ligne.delete()
    cmd.calculer_total()
    return JsonResponse({
        'success': True,
        'total': float(cmd.montant_total),
    })
