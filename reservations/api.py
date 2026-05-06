"""
API pour la gestion des réservations (RG12)
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Reservation


def api_reservations(request):
    """API: liste des réservations"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    reservations = []
    for res in Reservation.objects.all().order_by('date', 'heure'):
        reservations.append({
            'id': res.id,
            'nom_client': res.nom_client,
            'email': res.email,
            'telephone': res.telephone,
            'date': str(res.date),
            'heure': str(res.heure),
            'nombre_personnes': res.nombre_personnes,
            'notes': res.notes,
            'statut': res.statut,
            'statut_display': res.get_statut_display(),
        })
    
    return JsonResponse({'reservations': reservations})


@csrf_exempt
def api_creer_reservation(request):
    """API: créer une nouvelle réservation (RG12: date passée interdite)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    # Les réservations peuvent être créées par des visiteurs non connectés (public)
    data = json.loads(request.body)
    
    try:
        reservation = Reservation(
            nom_client=data.get('nom_client'),
            email=data.get('email'),
            telephone=data.get('telephone'),
            date=data.get('date'),
            heure=data.get('heure'),
            nombre_personnes=data.get('nombre_personnes', 2),
            notes=data.get('notes', ''),
        )
        
        # RG12: Validation de la date
        reservation.clean()
        reservation.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Réservation créée avec succès.',
            'reservation': {
                'id': reservation.id,
                'nom_client': reservation.nom_client,
                'date': str(reservation.date),
                'heure': str(reservation.heure),
            }
        })
    except ValidationError as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=500)


@csrf_exempt
def api_modifier_reservation(request, reservation_id):
    """API: modifier une réservation (date passée toujours interdite)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    reservation = get_object_or_404(Reservation, id=reservation_id)
    data = json.loads(request.body)
    
    # Mise à jour des champs
    if 'nom_client' in data:
        reservation.nom_client = data['nom_client']
    if 'email' in data:
        reservation.email = data['email']
    if 'telephone' in data:
        reservation.telephone = data['telephone']
    if 'date' in data:
        reservation.date = data['date']
    if 'heure' in data:
        reservation.heure = data['heure']
    if 'nombre_personnes' in data:
        reservation.nombre_personnes = data['nombre_personnes']
    if 'statut' in data:
        reservation.statut = data['statut']
    if 'notes' in data:
        reservation.notes = data['notes']
    
    try:
        # RG12: Validation de la date
        reservation.clean()
        reservation.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Réservation modifiée avec succès.',
        })
    except ValidationError as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
        }, status=400)


@csrf_exempt
def api_supprimer_reservation(request, reservation_id):
    """API: supprimer une réservation"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    reservation = get_object_or_404(Reservation, id=reservation_id)
    reservation.delete()
    
    return JsonResponse({
        'success': True,
        'message': 'Réservation supprimée avec succès.',
    })
