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
    for cmd in Commande.objects.select_related('employe', 'table').prefetch_related('lignes__plat').order_by('-date_creation_h'):
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
            'duree_service': cmd.duree_service,
            'duree_formatee': cmd.duree_formatee,
            'table': {
                'id': cmd.table.id,
                'numero': cmd.table.numero,
                'capacite': cmd.table.capacite,
                'statut': cmd.table.statut,
                'nombre_clients': cmd.table.nombre_clients,
            } if cmd.table else None,
        })
    return JsonResponse({'commandes': commandes})


def api_commande_detail(request, commande_id):
    """API: detail d'une commande"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    cmd = get_object_or_404(Commande.objects.select_related('table'), id=commande_id)
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
        'duree_service': cmd.duree_service,
        'duree_formatee': cmd.duree_formatee,
        'table': {
            'id': cmd.table.id,
            'numero': cmd.table.numero,
            'capacite': cmd.table.capacite,
            'statut': cmd.table.statut,
            'nombre_clients': cmd.table.nombre_clients,
        } if cmd.table else None,
    }
    return JsonResponse(data)


@csrf_exempt
def api_nouvelle_commande(request):
    """API: creer une nouvelle commande (POST) - RG06: Validation impossible sans produit"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    data = json.loads(request.body)
    plats = data.get('plats', [])
    table_id = data.get('table_id')
    
    # RG06: Une commande ne peut être validée si aucun produit n'est sélectionné
    if not plats:
        return JsonResponse({
            'success': False,
            'message': 'RG06: Une commande doit contenir au moins un produit.',
        }, status=400)
    
    try:
        # Créer la commande
        cmd = Commande.objects.create(
            nom_clt=data.get('nom_clt', ''),
            type=data.get('type', 'sur_place_generique'),
            adresse_liv=data.get('adresse_liv', ''),
            notes=data.get('notes', ''),
            employe=request.user,
        )
        
        # Ajouter les plats à la commande
        from .models import LigneDeCommande
        for plat_data in plats:
            plat = Plat.objects.get(id=plat_data['plat_id'])
            LigneDeCommande.objects.create(
                commande=cmd,
                plat=plat,
                quantite=plat_data.get('quantite', 1),
                notes=plat_data.get('notes', ''),
            )
        
        # RG04: Assigner la table si spécifiée
        if table_id:
            from core.models import Table
            table = Table.objects.get(id=table_id)
            cmd.table = table
            cmd.save()
            # La table passe automatiquement à 'occupée' via la méthode save() du modèle
        
        # RG07: Le montant est calculé automatiquement via les lignes de commande
        cmd.calculer_total()
        
        return JsonResponse({
            'success': True,
            'commande_id': cmd.id,
            'montant_total': float(cmd.montant_total),
            'message': 'Commande créée avec succès.',
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


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
    """API: modifier le statut d'une commande (POST) - RG09: Libération table après paiement"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    cmd = get_object_or_404(Commande, id=commande_id)
    data = json.loads(request.body)
    nouveau_statut = data.get('statut')

    if nouveau_statut in dict(Commande.STATUT_CHOICES):
        ancien_statut = cmd.status
        cmd.status = nouveau_statut
        cmd.save()
        
        # RG09: Si la commande passe à 'payee', vérifier si on peut libérer la table
        if nouveau_statut == 'payee' and cmd.table:
            if cmd.table.liberer():
                return JsonResponse({
                    'success': True,
                    'message': f"Statut modifié: {cmd.get_status_display()}. Table {cmd.table.numero} libérée (RG09).",
                })
            else:
                return JsonResponse({
                    'success': True,
                    'message': f"Statut modifié: {cmd.get_status_display()}. Table non libérée (conditions non remplies).",
                })
        
        return JsonResponse({
            'success': True,
            'message': f"Statut modifié: {cmd.get_status_display()}",
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


@csrf_exempt
def api_modifier_quantite_ligne(request, ligne_id):
    """API: modifier la quantite d'une ligne de commande (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    ligne = get_object_or_404(LigneDeCommande, id=ligne_id)
    data = json.loads(request.body)
    quantite = int(data.get('quantite', 1))

    if quantite < 1:
        return JsonResponse({
            'success': False,
            'message': 'La quantité doit être supérieure à 0.'
        }, status=400)

    ligne.quantite = quantite
    ligne.save()

    return JsonResponse({
        'success': True,
        'message': 'Quantité mise à jour avec succès.',
        'total': float(ligne.commande.montant_total),
    })


@csrf_exempt
def api_supprimer_commandes(request):
    """API: supprimer toutes les commandes (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    try:
        # Supprimer toutes les commandes sans vérifier les factures
        from django.db import connection
        with connection.cursor() as cursor:
            # Supprimer les lignes de commande d'abord
            cursor.execute("DELETE FROM commandes_lignedecommande")
            # Puis supprimer les commandes
            cursor.execute("DELETE FROM commandes_commande")
        
        return JsonResponse({
            'success': True,
            'message': 'Toutes les commandes ont été supprimées avec succès.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erreur lors de la suppression: {str(e)}'
        }, status=500)


@csrf_exempt
def api_liberer_toutes_tables(request):
    """API: libérer toutes les tables manuellement (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    try:
        from core.models import Table
        tables = Table.objects.all()
        tables_liberees = 0
        
        for table in tables:
            if table.statut != 'libre':
                table.statut = 'libre'
                table.nombre_clients = 0
                table.commande_actuelle = None
                table.save()
                tables_liberees += 1
        
        return JsonResponse({
            'success': True,
            'message': f'{tables_liberees} table(s) ont été libérées avec succès.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Erreur lors de la libération: {str(e)}'
        }, status=500)
