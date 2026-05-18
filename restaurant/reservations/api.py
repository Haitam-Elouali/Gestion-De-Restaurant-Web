"""
API pour la gestion des reservations (RG12).
"""
import json

from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from core.api import get_user_role
from .models import Reservation


def _serialize_reservation(reservation):
    return {
        'id': reservation.id,
        'nom_client': reservation.nom_client,
        'email': reservation.email,
        'telephone': reservation.telephone,
        'date': str(reservation.date),
        'heure': str(reservation.heure),
        'nombre_personnes': reservation.nombre_personnes,
        'notes': reservation.notes,
        'statut': reservation.statut,
        'statut_display': reservation.get_statut_display(),
        'table_id': reservation.table_id,
        'table_numero': reservation.table.numero if reservation.table else None,
        'table_capacite': reservation.table.capacite if reservation.table else None,
    }


def api_reservations(request):
    """API: liste des reservations"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    reservations = [
        _serialize_reservation(res)
        for res in Reservation.objects.select_related('table').all().order_by('date', 'heure')
    ]
    return JsonResponse({'reservations': reservations})


@csrf_exempt
def api_creer_reservation(request):
    """API: creer une nouvelle reservation"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if get_user_role(request.user) not in ['admin', 'manager']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent creer des reservations.'
        }, status=403)

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
            table_id=data.get('table_id') or None,
            statut=data.get('statut', 'en_attente'),
        )
        reservation.clean()
        reservation.save()

        return JsonResponse({
            'success': True,
            'message': 'Reservation creee avec succes.',
            'reservation': _serialize_reservation(reservation),
        })
    except ValidationError as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=500)


@csrf_exempt
def api_modifier_reservation(request, reservation_id):
    """API: modifier une reservation"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if get_user_role(request.user) not in ['admin', 'manager']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent modifier des reservations.'
        }, status=403)

    reservation = get_object_or_404(Reservation, id=reservation_id)
    data = json.loads(request.body)

    for field in ['nom_client', 'email', 'telephone', 'date', 'heure', 'nombre_personnes', 'statut', 'notes']:
        if field in data:
            setattr(reservation, field, data[field])
    if 'table_id' in data:
        reservation.table_id = data['table_id'] or None

    try:
        reservation.clean()
        reservation.save()
        return JsonResponse({
            'success': True,
            'message': 'Reservation modifiee avec succes.',
            'reservation': _serialize_reservation(reservation),
        })
    except ValidationError as exc:
        return JsonResponse({'success': False, 'message': str(exc)}, status=400)


@csrf_exempt
def api_supprimer_reservation(request, reservation_id):
    """API: supprimer une reservation"""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if get_user_role(request.user) not in ['admin', 'manager']:
        return JsonResponse({
            'success': False,
            'message': 'Seuls les administrateurs et managers peuvent supprimer des reservations.'
        }, status=403)

    reservation = get_object_or_404(Reservation, id=reservation_id)
    reservation.delete()

    return JsonResponse({
        'success': True,
        'message': 'Reservation supprimee avec succes.',
    })
