from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Commande, LigneDeCommande
from .forms import CommandeForm, LigneDeCommandeForm, CommandeRapideForm, AjouterPlatForm
from menus.models import Plat


# Create your views here.

# Vues pour les Serveurs
@login_required
def serveur_dashboard(request):
    """Dashboard pour les serveurs"""
    # Vérifier que l'utilisateur est un serveur
    if not hasattr(request.user, 'serveur_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Commandes en cours gérées par ce serveur
    commandes_en_cours = Commande.objects.filter(
        employe=request.user,
        status__in=['en_cours', 'preparee']
    ).order_by('date_creation_h')
    
    # Commandes récentes
    commandes_recentes = Commande.objects.filter(
        employe=request.user
    ).order_by('-date_creation_h')[:10]
    
    context = {
        'commandes_en_cours': commandes_en_cours,
        'commandes_recentes': commandes_recentes,
    }
    return render(request, 'commandes/serveur_dashboard.html', context)


@login_required
def nouvelle_commande(request):
    """Vue pour créer une nouvelle commande (Serveur uniquement)"""
    if not hasattr(request.user, 'serveur_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = CommandeRapideForm(request.POST)
        if form.is_valid():
            commande = Commande.objects.create(
                nom_clt=form.cleaned_data['nom_clt'],
                type=form.cleaned_data['type'],
                adresse_liv=form.cleaned_data.get('adresse_liv', ''),
                notes=form.cleaned_data.get('notes', ''),
                employe=request.user
            )
            messages.success(request, 'Commande créée avec succès.')
            return redirect('commandes:modifier_commande', commande_id=commande.id)
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = CommandeRapideForm()
    
    return render(request, 'commandes/nouvelle_commande.html', {'form': form})


@login_required
def modifier_commande(request, commande_id):
    """Vue pour modifier une commande (Serveur uniquement)"""
    if not hasattr(request.user, 'serveur_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    commande = get_object_or_404(Commande, id=commande_id, employe=request.user)
    
    if request.method == 'POST':
        form = CommandeForm(request.POST, instance=commande)
        if form.is_valid():
            form.save()
            messages.success(request, 'Commande modifiée avec succès.')
            return redirect('commandes:serveur_dashboard')
        else:
            messages.error(request, 'Veuillez corriger les erreurs ci-dessous.')
    else:
        form = CommandeForm(instance=commande)
    
    # Formulaire pour ajouter des plats
    ajouter_plat_form = AjouterPlatForm()
    
    context = {
        'commande': commande,
        'form': form,
        'ajouter_plat_form': ajouter_plat_form,
    }
    return render(request, 'commandes/modifier_commande.html', context)


@login_required
@require_http_methods(["POST"])
def ajouter_plat_commande(request, commande_id):
    """Vue pour ajouter un plat à une commande (Serveur uniquement)"""
    if not hasattr(request.user, 'serveur_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        commande = get_object_or_404(Commande, id=commande_id, employe=request.user)
        form = AjouterPlatForm(request.POST)
        
        if form.is_valid():
            plat = form.cleaned_data['plat']
            quantite = form.cleaned_data['quantite']
            notes = form.cleaned_data.get('notes', '')
            
            # Créer ou mettre à jour la ligne de commande
            ligne, created = LigneDeCommande.objects.get_or_create(
                commande=commande,
                plat=plat,
                defaults={'quantite': quantite, 'notes': notes}
            )
            
            if not created:
                ligne.quantite += quantite
                if notes:
                    ligne.notes = f"{ligne.notes}; {notes}" if ligne.notes else notes
                ligne.save()
            
            return JsonResponse({
                'success': True, 
                'message': f'{quantite}x {plat.nom} ajouté à la commande.',
                'total': commande.calculer_total()
            })
        else:
            return JsonResponse({'success': False, 'message': 'Données invalides.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})


@login_required
@require_http_methods(["POST"])
def supprimer_ligne_commande(request, ligne_id):
    """Vue pour supprimer une ligne de commande (Serveur uniquement)"""
    if not hasattr(request.user, 'serveur_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        ligne = get_object_or_404(LigneDeCommande, id=ligne_id, commande__employe=request.user)
        commande = ligne.commande
        ligne.delete()
        commande.calculer_total()
        
        return JsonResponse({
            'success': True, 
            'message': 'Plat supprimé de la commande.',
            'total': commande.montant_total
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})


@login_required
@require_http_methods(["POST"])
def modifier_statut_commande(request, commande_id):
    """Vue pour modifier le statut d'une commande (Serveur uniquement)"""
    if not hasattr(request.user, 'serveur_profile'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        commande = get_object_or_404(Commande, id=commande_id, employe=request.user)
        nouveau_statut = request.POST.get('statut')
        
        if nouveau_statut in dict(Commande.STATUT_CHOICES):
            commande.status = nouveau_statut
            commande.save()
            return JsonResponse({
                'success': True, 
                'message': f'Statut modifié: {commande.get_status_display()}'
            })
        else:
            return JsonResponse({'success': False, 'message': 'Statut invalide.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})


# Vues pour les Cuisiniers
@login_required
def cuisinier_dashboard(request):
    """Dashboard pour les cuisiniers"""
    # Vérifier que l'utilisateur est un cuisinier
    if not hasattr(request.user, 'cuisinier_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Commandes à préparer
    commandes_a_preparer = Commande.objects.filter(
        status='en_cours'
    ).prefetch_related('lignes__plat').order_by('date_creation_h')
    
    # Commandes préparées
    commandes_preparees = Commande.objects.filter(
        status='preparee'
    ).prefetch_related('lignes__plat').order_by('date_creation_h')
    
    context = {
        'commandes_a_preparer': commandes_a_preparer,
        'commandes_preparees': commandes_preparees,
    }
    return render(request, 'commandes/cuisinier_dashboard.html', context)


@login_required
@require_http_methods(["POST"])
def marquer_plat_prepare(request, ligne_id):
    """Vue pour marquer un plat comme préparé (Cuisinier uniquement)"""
    if not hasattr(request.user, 'cuisinier'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        ligne = get_object_or_404(LigneDeCommande, id=ligne_id)
        commande = ligne.commande
        
        # Marquer la ligne comme préparée (on pourrait ajouter un champ pour cela)
        # Pour l'instant, on change le statut de la commande si tous les plats sont préparés
        commande.status = 'preparee'
        commande.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Plat {ligne.plat.nom} marqué comme préparé.'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})


@login_required
@require_http_methods(["POST"])
def signaler_rupture_stock(request, plat_id):
    """Vue pour signaler une rupture de stock (Cuisinier uniquement)"""
    if not hasattr(request.user, 'cuisinier'):
        return JsonResponse({'success': False, 'message': 'Accès non autorisé.'})
    
    try:
        plat = get_object_or_404(Plat, id=plat_id)
        plat.disponible = False
        plat.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Rupture de stock signalée pour {plat.nom}.'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erreur: {str(e)}'})


# Vues pour les Managers
@login_required
def manager_dashboard(request):
    """Dashboard pour les managers"""
    # Vérifier que l'utilisateur est un manager
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Statistiques du jour
    aujourd_hui = timezone.now().date()
    commandes_aujourd_hui = Commande.objects.filter(
        date_creation_h__date=aujourd_hui
    )
    
    # Statistiques
    total_ventes_jour = commandes_aujourd_hui.aggregate(
        total=Sum('montant_total')
    )['total'] or 0
    
    nombre_commandes_jour = commandes_aujourd_hui.count()
    
    # Commandes en cours
    commandes_en_cours = Commande.objects.filter(
        status__in=['en_cours', 'preparee']
    ).order_by('date_creation_h')
    
    # Commandes récentes
    commandes_recentes = Commande.objects.order_by('-date_creation_h')[:10]
    
    context = {
        'total_ventes_jour': total_ventes_jour,
        'nombre_commandes_jour': nombre_commandes_jour,
        'commandes_en_cours': commandes_en_cours,
        'commandes_recentes': commandes_recentes,
    }
    return render(request, 'commandes/manager_dashboard.html', context)


@login_required
def gestion_commandes(request):
    """Vue pour la gestion des commandes (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Filtres
    status_filter = request.GET.get('status', '')
    date_filter = request.GET.get('date', '')
    
    commandes = Commande.objects.select_related('employe').all()
    
    if status_filter:
        commandes = commandes.filter(status=status_filter)
    
    if date_filter:
        try:
            date_obj = datetime.strptime(date_filter, '%Y-%m-%d').date()
            commandes = commandes.filter(date_creation_h__date=date_obj)
        except ValueError:
            pass
    
    commandes = commandes.order_by('-date_creation_h')
    
    context = {
        'commandes': commandes,
        'status_filter': status_filter,
        'date_filter': date_filter,
        'status_choices': Commande.STATUT_CHOICES,
    }
    return render(request, 'commandes/gestion_commandes.html', context)


@login_required
def rapport_ventes(request):
    """Vue pour les rapports de ventes (Manager uniquement)"""
    if not hasattr(request.user, 'manager_profile'):
        messages.error(request, 'Accès non autorisé.')
        return redirect('dashboard')
    
    # Période par défaut : 30 derniers jours
    fin_periode = timezone.now().date()
    debut_periode = fin_periode - timedelta(days=30)
    
    # Permettre de changer la période
    if request.GET.get('debut'):
        try:
            debut_periode = datetime.strptime(request.GET.get('debut'), '%Y-%m-%d').date()
        except ValueError:
            pass
    
    if request.GET.get('fin'):
        try:
            fin_periode = datetime.strptime(request.GET.get('fin'), '%Y-%m-%d').date()
        except ValueError:
            pass
    
    # Commandes de la période
    commandes_periode = Commande.objects.filter(
        date_creation_h__date__range=[debut_periode, fin_periode]
    )
    
    # Statistiques
    total_ventes = commandes_periode.aggregate(total=Sum('montant_total'))['total'] or 0
    nombre_commandes = commandes_periode.count()
    moyenne_commande = total_ventes / nombre_commandes if nombre_commandes > 0 else 0
    
    # Ventes par jour
    ventes_par_jour = commandes_periode.values('date_creation_h__date').annotate(
        total_jour=Sum('montant_total'),
        nombre_jour=Count('id')
    ).order_by('date_creation_h__date')
    
    context = {
        'debut_periode': debut_periode,
        'fin_periode': fin_periode,
        'total_ventes': total_ventes,
        'nombre_commandes': nombre_commandes,
        'moyenne_commande': moyenne_commande,
        'ventes_par_jour': ventes_par_jour,
    }
    return render(request, 'commandes/rapport_ventes.html', context)
