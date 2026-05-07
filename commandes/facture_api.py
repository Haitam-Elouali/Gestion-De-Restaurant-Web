"""
API pour la gestion des factures et paiements (RG08)
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Commande
from .models_facture import Facture, LigneFacture


def api_factures(request):
    """API: liste des factures"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin, manager ou caissier
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    elif hasattr(request.user, 'caissier_profile'):
        user_role = 'caissier'
    
    if user_role not in ['admin', 'manager', 'caissier']:
        return JsonResponse({
            'success': False,
            'message': 'Accès non autorisé.'
        }, status=403)
    
    factures = []
    for facture in Facture.objects.select_related('commande', 'caissier').order_by('-date_facture'):
        lignes = []
        for ligne in facture.lignes.all():
            lignes.append({
                'id': ligne.id,
                'nom_plat': ligne.nom_plat,
                'quantite': ligne.quantite,
                'prix_unitaire': float(ligne.prix_unitaire),
                'montant_ht': float(ligne.montant_ht),
                'montant_tva': float(ligne.montant_tva),
                'montant_total': float(ligne.montant_total),
            })
        
        factures.append({
            'id': facture.id,
            'numero_facture': facture.numero_facture,
            'commande_id': facture.commande.id,
            'date_facture': facture.date_facture.isoformat(),
            'date_paiement': facture.date_paiement.isoformat() if facture.date_paiement else None,
            'montant_total': float(facture.montant_total),
            'montant_ht': float(facture.montant_ht),
            'montant_tva': float(facture.montant_tva),
            'mode_paiement': facture.mode_paiement,
            'mode_paiement_display': facture.mode_paiement_display,
            'reference_paiement': facture.reference_paiement,
            'statut': facture.statut,
            'statut_display': facture.get_statut_display(),
            'caissier': facture.caissier.username if facture.caissier else None,
            'notes': facture.notes,
            'lignes': lignes,
        })
    
    return JsonResponse({'factures': factures})


@csrf_exempt
def api_creer_facture(request, commande_id):
    """API: créer une facture pour une commande (POST) - RG08: mode paiement requis"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin, manager ou caissier
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    elif hasattr(request.user, 'caissier_profile'):
        user_role = 'caissier'
    
    if user_role not in ['admin', 'manager', 'caissier']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls admin, manager et caissier peuvent créer des factures.'
        }, status=403)
    
    commande = get_object_or_404(Commande, id=commande_id)
    data = json.loads(request.body)
    mode_paiement = data.get('mode_paiement')
    
    # RG08: Le mode de paiement est obligatoire
    if not mode_paiement:
        return JsonResponse({
            'success': False,
            'message': 'RG08: Le mode de paiement est obligatoire.',
        }, status=400)
    
    try:
        # Générer un numéro de facture unique
        from django.utils import timezone
        numero_facture = f"F{timezone.now().strftime('%Y%m%d')}{Facture.objects.count() + 1:04d}"
        
        facture = Facture.objects.create(
            commande=commande,
            numero_facture=numero_facture,
            montant_total=commande.montant_total,
            mode_paiement=mode_paiement,
            reference_paiement=data.get('reference_paiement', ''),
            caissier=request.user,
            notes=data.get('notes', ''),
        )
        
        # Créer les lignes de facture à partir des lignes de commande
        for ligne_cmd in commande.lignes.all():
            LigneFacture.objects.create(
                facture=facture,
                nom_plat=ligne_cmd.plat.nom,
                quantite=ligne_cmd.quantite,
                prix_unitaire=ligne_cmd.prix_unitaire,
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Facture créée avec succès.',
            'facture_id': facture.id,
            'numero_facture': facture.numero_facture,
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
def api_valider_paiement(request, facture_id):
    """API: valider le paiement d'une facture (POST) - RG08"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin, manager ou caissier
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    elif hasattr(request.user, 'caissier_profile'):
        user_role = 'caissier'
    
    if user_role not in ['admin', 'manager', 'caissier']:
        return JsonResponse({
            'success': False,
            'message': 'Accès non autorisé.'
        }, status=403)
    
    facture = get_object_or_404(Facture, id=facture_id)
    data = json.loads(request.body)
    
    try:
        # Marquer la facture comme payée
        facture.statut = 'payee'
        facture.date_paiement = timezone.now()
        facture.reference_paiement = data.get('reference_paiement', facture.reference_paiement)
        facture.save()
        
        # Marquer la commande associée comme payée
        commande = facture.commande
        commande.status = 'payee'
        commande.save()
        
        return JsonResponse({
            'success': True,
            'message': f'RG08: Paiement validé pour la facture {facture.numero_facture} ({facture.mode_paiement_display}).',
            'date_paiement': facture.date_paiement.isoformat(),
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


@csrf_exempt
def api_annuler_facture(request, facture_id):
    """API: annuler une facture (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin, manager ou caissier
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    elif hasattr(request.user, 'caissier_profile'):
        user_role = 'caissier'
    
    if user_role not in ['admin', 'manager', 'caissier']:
        return JsonResponse({
            'success': False,
            'message': 'Accès non autorisé.'
        }, status=403)
    
    facture = get_object_or_404(Facture, id=facture_id)
    
    try:
        facture.statut = 'annulee'
        facture.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Facture {facture.numero_facture} annulée.',
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def api_imprimer_facture(request, facture_id):
    """API: générer le contenu HTML pour impression d'une facture"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    # Vérifier si l'utilisateur est admin, manager ou caissier
    user_role = None
    if hasattr(request.user, 'admin_profile'):
        user_role = 'admin'
    elif hasattr(request.user, 'manager_profile'):
        user_role = 'manager'
    elif hasattr(request.user, 'caissier_profile'):
        user_role = 'caissier'
    
    if user_role not in ['admin', 'manager', 'caissier']:
        return JsonResponse({
            'success': False,
            'message': 'Accès non autorisé.'
        }, status=403)
    
    facture = get_object_or_404(Facture, id=facture_id)
    
    # Générer le HTML pour l'impression
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Facture {facture.numero_facture}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .info {{ margin-bottom: 20px; }}
            .table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
            .table th, .table td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            .table th {{ background-color: #f2f2f2; }}
            .total {{ font-weight: bold; font-size: 18px; }}
            .footer {{ margin-top: 30px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>FACTURE</h1>
            <h2>Restaurant Kool.ma</h2>
            <p>Numéro: {facture.numero_facture}</p>
            <p>Date: {facture.date_facture.strftime('%d/%m/%Y')}</p>
            {f'<p>Date paiement: {facture.date_paiement.strftime("%d/%m/%Y")}</p>' if facture.date_paiement else '<p>Non payée</p>'}
        </div>
        
        <div class="info">
            <p><strong>Client:</strong> {facture.commande.nom_clt}</p>
            <p><strong>Caissier:</strong> {facture.caissier.username if facture.caissier else 'N/A'}</p>
            <p><strong>Mode paiement:</strong> {facture.mode_paiement_display}</p>
            {f'<p><strong>Référence:</strong> {facture.reference_paiement}</p>' if facture.reference_paiement else ''}
        </div>
        
        <table class="table">
            <tr>
                <th>Plat</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Montant HT</th>
                <th>TVA (20%)</th>
                <th>Total TTC</th>
            </tr>
    """
    
    for ligne in facture.lignes.all():
        html_content += f"""
            <tr>
                <td>{ligne.nom_plat}</td>
                <td>{ligne.quantite}</td>
                <td>{ligne.prix_unitaire} DH</td>
                <td>{ligne.montant_ht} DH</td>
                <td>{ligne.montant_tva} DH</td>
                <td>{ligne.montant_total} DH</td>
            </tr>
        """
    
    html_content += f"""
            <tr class="total">
                <td colspan="3"></td>
                <td>Total HT:</td>
                <td>{facture.montant_ht} DH</td>
                <td>{facture.montant_tva} DH</td>
                <td>{facture.montant_total} DH</td>
            </tr>
        </table>
        
        <div class="footer">
            <p><strong>Total à payer: {facture.montant_total} DH</strong></p>
            <p>Merci de votre visite!</p>
        </div>
    </body>
    </html>
    """
    
    return JsonResponse({
        'success': True,
        'html_content': html_content,
        'facture': {
            'id': facture.id,
            'numero_facture': facture.numero_facture,
            'montant_total': float(facture.montant_total),
        }
    })
