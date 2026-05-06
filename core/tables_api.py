"""
API pour la gestion des tables (RG04 et RG09)
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from .models import Table
from commandes.models import Commande


def api_tables(request):
    """API: liste des tables avec leur statut"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    tables = []
    for table in Table.objects.all().order_by('numero'):
        tables.append({
            'id': table.id,
            'numero': table.numero,
            'capacite': table.capacite,
            'statut': table.statut,
            'statut_display': table.get_statut_display(),
            'nombre_clients': table.nombre_clients,
            'commande_actuelle': {
                'id': table.commande_actuelle.id,
                'nom_clt': table.commande_actuelle.nom_clt,
                'status': table.commande_actuelle.status,
                'montant_total': float(table.commande_actuelle.montant_total),
            } if table.commande_actuelle else None,
        })
    
    return JsonResponse({'tables': tables})


@csrf_exempt
def api_assigner_table(request, table_id):
    """API: assigner une commande à une table (RG04) - POST"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    table = get_object_or_404(Table, id=table_id)
    data = json.loads(request.body)
    commande_id = data.get('commande_id')
    nombre_clients = data.get('nombre_clients', 1)
    
    # Vérifier que la table est disponible
    if not table.est_disponible():
        return JsonResponse({
            'success': False,
            'message': f'La table {table.numero} est déjà occupée ou réservée.'
        })
    
    # Vérifier la capacité (RG05)
    if nombre_clients > table.capacite:
        return JsonResponse({
            'success': False,
            'message': f'La table {table.numero} ne peut accueillir que {table.capacite} personnes maximum (RG05).'
        })
    
    commande = get_object_or_404(Commande, id=commande_id)
    
    # Assigner la commande à la table (RG04: passe automatiquement à Occupée)
    table.nombre_clients = nombre_clients
    table.assigner_commande(commande)
    
    return JsonResponse({
        'success': True,
        'message': f'Table {table.numero} assignée à la commande #{commande.id}.',
        'table': {
            'id': table.id,
            'numero': table.numero,
            'statut': table.statut,
            'statut_display': table.get_statut_display(),
            'nombre_clients': table.nombre_clients,
        }
    })


@csrf_exempt
def api_liberer_table(request, table_id):
    """API: libérer une table (RG09) - POST
    RG09: Une table ne peut être libérée (état "Libre") qu'après la validation du paiement total de la facture
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    table = get_object_or_404(Table, id=table_id)
    
    # Vérifier RG09: La commande doit être payée pour libérer la table
    if table.commande_actuelle and table.commande_actuelle.status != 'payee':
        return JsonResponse({
            'success': False,
            'message': f'RG09: Impossible de libérer la table - la commande #{table.commande_actuelle.id} n\'est pas encore payée (statut: {table.commande_actuelle.get_status_display()}).'
        })
    
    # Libérer la table
    if table.liberer():
        return JsonResponse({
            'success': True,
            'message': f'Table {table.numero} libérée avec succès.',
            'table': {
                'id': table.id,
                'numero': table.numero,
                'statut': table.statut,
                'statut_display': table.get_statut_display(),
            }
        })
    else:
        return JsonResponse({
            'success': False,
            'message': f'Impossible de libérer la table {table.numero}.'
        })


@csrf_exempt
def api_modifier_statut_commande(request, commande_id):
    """API: modifier le statut d'une commande - POST
    Quand une commande passe à 'payee', on peut libérer la table
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    commande = get_object_or_404(Commande, id=commande_id)
    data = json.loads(request.body)
    nouveau_statut = data.get('statut')
    
    if nouveau_statut not in dict(Commande.STATUT_CHOICES):
        return JsonResponse({'success': False, 'message': 'Statut invalide.'})
    
    # Mettre à jour le statut
    ancien_statut = commande.status
    commande.status = nouveau_statut
    commande.save()
    
    # Si la commande devient payée, vérifier si elle a une table assignée
    if nouveau_statut == 'payee' and commande.table:
        # RG09: La table peut maintenant être libérée
        table = commande.table
        return JsonResponse({
            'success': True,
            'message': f"Statut modifié: {commande.get_status_display()}. La table {table.numero} peut maintenant être libérée (RG09).",
            'peut_liberer_table': True,
            'table_id': table.id,
        })
    
    return JsonResponse({
        'success': True,
        'message': f"Statut modifié: {commande.get_status_display()}",
    })


@csrf_exempt
def api_creer_table(request):
    """API: créer une nouvelle table - POST (Admin uniquement)"""
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
            'message': 'Seuls les administrateurs et managers peuvent créer des tables.'
        }, status=403)
    
    data = json.loads(request.body)
    numero = data.get('numero')
    capacite = data.get('capacite', 4)
    
    if not numero:
        return JsonResponse({'success': False, 'message': 'Numéro de table requis.'})
    
    # Vérifier si le numéro existe déjà
    if Table.objects.filter(numero=numero).exists():
        return JsonResponse({'success': False, 'message': f'La table {numero} existe déjà.'})
    
    table = Table.objects.create(numero=numero, capacite=capacite)
    
    return JsonResponse({
        'success': True,
        'message': f'Table {table.numero} créée avec succès.',
        'table': {
            'id': table.id,
            'numero': table.numero,
            'capacite': table.capacite,
            'statut': table.statut,
        }
    })
