import json
from decimal import Decimal
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from .models import Manager, Serveur, Caissier, Administrateur, Table, Configuration


def get_user_role(user):
    """Helper function pour déterminer le rôle de l'utilisateur"""
    try:
        if Administrateur.objects.filter(user=user).exists():
            return 'admin'
        elif Manager.objects.filter(user=user).exists():
            return 'manager'
        elif Serveur.objects.filter(user=user).exists():
            return 'serveur'
        elif Caissier.objects.filter(user=user).exists():
            return 'caissier'
    except Exception:
        return None

    return None


def _require_admin(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    if get_user_role(request.user) != 'admin':
        return JsonResponse({'success': False, 'message': "Accès refusé. Seul l'administrateur est autorisé."}, status=403)
    return None


def api_auth_status(request):
    """API: statut de l'authentification"""
    user = request.user
    if user.is_authenticated:
        role = get_user_role(user)
        return JsonResponse({
            'authenticated': True,
            'username': user.username,
            'role': role,
            'email': user.email,
        })
    return JsonResponse({'authenticated': False})


@csrf_exempt
def api_login(request):
    """API: connexion (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return JsonResponse({'success': False, 'message': 'Veuillez remplir tous les champs obligatoires.'}, status=400)

    from django.contrib.auth.models import User
    user_obj = User.objects.filter(username=username).first()

    if not user_obj:
        return JsonResponse({'success': False, 'message': "Nom d'utilisateur ou mot de passe incorrect."}, status=401)

    if not user_obj.is_active:
        return JsonResponse({'success': False, 'message': "Ce compte a été désactivé. Veuillez contacter l'administrateur."}, status=403)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        role = get_user_role(user)
        return JsonResponse({
            'success': True,
            'username': user.username,
            'role': role,
            'message': f"Bienvenue {user.username}. Vous êtes connecté en tant que {role}.",
        })
    return JsonResponse({'success': False, 'message': "Nom d'utilisateur ou mot de passe incorrect."}, status=401)


@csrf_exempt
def api_logout(request):
    """API: deconnexion (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    logout(request)
    return JsonResponse({'success': True})


def api_employes(request):
    """API: liste des employes - RG02: Seul admin peut voir/créer/supprimer les managers"""
    denied = _require_admin(request)
    if denied:
        return denied

    managers = []
    for m in Manager.objects.all():
        managers.append({
            'id': m.id,
            'nom': m.nom,
            'prenom': m.prenom,
            'telephone': m.telephone,
            'email': m.email,
            'salaire': float(m.salaire_mensuel),
            'salaire_mensuel': float(m.salaire_mensuel),
            'date_embauche': str(m.date_embauche),
            'type': 'manager',
            'username': m.user.username if m.user else None,
        })

    serveurs = []
    for s in Serveur.objects.all():
        serveurs.append({
            'id': s.id,
            'nom': s.nom,
            'prenom': s.prenom,
            'telephone': s.telephone,
            'email': s.email,
            'salaire': float(s.salaire_mensuel),
            'salaire_mensuel': float(s.salaire_mensuel),
            'date_embauche': str(s.date_embauche),
            'type': 'serveur',
            'username': s.user.username if s.user else None,
        })

    caissiers = []
    for c in Caissier.objects.all():
        caissiers.append({
            'id': c.id,
            'nom': c.nom,
            'prenom': c.prenom,
            'telephone': c.telephone,
            'email': c.email,
            'salaire': float(c.salaire_mensuel),
            'salaire_mensuel': float(c.salaire_mensuel),
            'date_embauche': str(c.date_embauche),
            'type': 'caissier',
            'username': c.user.username if c.user else None,
        })

    admins = []
    for a in Administrateur.objects.all():
        admins.append({
            'id': a.id,
            'nom': a.nom,
            'prenom': a.prenom,
            'telephone': a.telephone,
            'email': a.email,
            'salaire': float(a.salaire_mensuel),
            'salaire_mensuel': float(a.salaire_mensuel),
            'date_embauche': str(a.date_embauche),
            'type': 'admin',
            'username': a.user.username if a.user else None,
        })

    return JsonResponse({
        'managers': managers,
        'serveurs': serveurs,
        'caissiers': caissiers,
        'admins': admins,
        'current_user_role': 'admin',
    })


@csrf_exempt
def api_create_employe(request):
    """API: créer un employé - RG02: Seul admin peut créer des managers"""
    denied = _require_admin(request)
    if denied:
        return denied

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}

    employe_type = data.get('type')
    allowed_types = {'manager', 'serveur', 'caissier', 'admin'}
    if employe_type not in allowed_types:
        return JsonResponse({'success': False, 'message': "Type d'employé inconnu."}, status=400)

    required_fields = ['nom', 'prenom', 'email', 'telephone', 'username', 'password']
    if any(not (data.get(field) or '').strip() for field in required_fields):
        return JsonResponse({'success': False, 'message': 'Veuillez remplir tous les champs obligatoires.'}, status=400)

    try:
        from django.contrib.auth.models import User
        username = (data.get('username') or '').strip()
        email = (data.get('email') or '').strip()

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'success': False, 'message': "Format d'email invalide."}, status=400)

        # Vérifier si le username existe déjà
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': "Ce nom d'utilisateur est déjà utilisé. Veuillez en choisir un autre."
            }, status=400)

        # Vérifier si l'email existe déjà
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': "Cette adresse email est déjà utilisée."
            }, status=400)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=data.get('password'),
                email=email,
            )

            common_kwargs = {
                'user': user,
                'nom': (data.get('nom') or '').strip(),
                'prenom': (data.get('prenom') or '').strip(),
                'telephone': (data.get('telephone') or '').strip(),
                'email': email,
                'salaire_mensuel': data.get('salaire_mensuel', 0) or 0,
            }

            if employe_type == 'manager':
                Manager.objects.create(**common_kwargs)
            elif employe_type == 'serveur':
                Serveur.objects.create(**common_kwargs)
            elif employe_type == 'caissier':
                Caissier.objects.create(**common_kwargs)
            elif employe_type == 'admin':
                Administrateur.objects.create(**common_kwargs)

        return JsonResponse({'success': True, 'message': 'Compte créé avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_delete_employe(request, employe_id):
    """API: supprimer un employé - RG02: Seul admin peut supprimer des managers"""
    denied = _require_admin(request)
    if denied:
        return denied

    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
    except Exception:
        data = {}
    employe_type = data.get('type')

    try:
        from django.contrib.auth.models import User

        if employe_type not in {'manager', 'serveur', 'caissier', 'admin'}:
            return JsonResponse({'success': False, 'message': "Type d'employé inconnu."}, status=400)

        if employe_type == 'manager':
            employe = Manager.objects.filter(id=employe_id).select_related('user').first()
        elif employe_type == 'serveur':
            employe = Serveur.objects.filter(id=employe_id).select_related('user').first()
        elif employe_type == 'caissier':
            employe = Caissier.objects.filter(id=employe_id).select_related('user').first()
        else:
            employe = Administrateur.objects.filter(id=employe_id).select_related('user').first()

        if not employe:
            return JsonResponse({'success': False, 'message': f"Aucun {employe_type} trouvé avec l'ID {employe_id}."}, status=404)

        if employe.user_id == request.user.id:
            return JsonResponse({'success': False, 'message': 'Impossible de supprimer votre propre compte.'}, status=400)

        with transaction.atomic():
            user = employe.user
            employe.delete()
            if user:
                user.delete()

        return JsonResponse({'success': True, 'message': 'Compte supprimé avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_diagnostic_employes(request):
    """API: diagnostic des employés et utilisateurs (POST) - pour débogage"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        from django.contrib.auth.models import User
        from django.db import connection

        # Récupérer tous les utilisateurs Django
        users = []
        for user in User.objects.all():
            users.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_active': user.is_active,
                'date_joined': str(user.date_joined)
            })

        # Récupérer tous les profils d'employés
        managers = []
        for m in Manager.objects.all():
            managers.append({
                'id': m.id,
                'nom': m.nom,
                'prenom': m.prenom,
                'user_id': m.user_id,
                'user_username': m.user.username if m.user else None
            })

        serveurs = []
        for s in Serveur.objects.all():
            serveurs.append({
                'id': s.id,
                'nom': s.nom,
                'prenom': s.prenom,
                'user_id': s.user_id,
                'user_username': s.user.username if s.user else None
            })

        caissiers = []
        for c in Caissier.objects.all():
            caissiers.append({
                'id': c.id,
                'nom': c.nom,
                'prenom': c.prenom,
                'user_id': c.user_id,
                'user_username': c.user.username if c.user else None
            })

        admins = []
        for a in Administrateur.objects.all():
            admins.append({
                'id': a.id,
                'nom': a.nom,
                'prenom': a.prenom,
                'user_id': a.user_id,
                'user_username': a.user.username if a.user else None
            })

        return JsonResponse({
            'users': users,
            'managers': managers,
            'serveurs': serveurs,
            'caissiers': caissiers,
            'admins': admins,
            'total_users': len(users),
            'total_employes': len(managers) + len(serveurs) + len(caissiers) + len(admins)
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_creer_caissier_defaut(request):
    """API: créer le caissier par défaut (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        from django.contrib.auth.models import User

        # Vérifier si le caissier par défaut existe déjà
        if User.objects.filter(username='caissier').exists():
            return JsonResponse({
                'success': False,
                'message': 'Le caissier par défaut existe déjà.'
            })

        # Créer l'utilisateur Django
        user = User.objects.create_user(
            username='caissier',
            password='caissier123',
            email='caissier@koolma.ma'
        )

        # Créer le profil caissier
        caissier = Caissier.objects.create(
            user=user,
            nom='Caissier',
            prenom='Défaut',
            telephone='0000000000',
            email='caissier@koolma.ma',
            salaire_mensuel=3000
        )

        return JsonResponse({
            'success': True,
            'message': 'Caissier par défaut créé avec succès.',
            'username': 'caissier',
            'password': 'caissier123'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_nettoyer_utilisateurs_orphelins(request):
    """API: nettoyer les utilisateurs orphelins (POST)"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_role = get_user_role(request.user)
    if user_role != 'admin':
        return JsonResponse({'success': False, 'message': 'Seul l\'administrateur peut nettoyer les utilisateurs orphelins.'}, status=403)

    try:
        from django.contrib.auth.models import User
        from django.db import connection

        # Récupérer tous les user_id des profils employés
        user_ids_with_profiles = set()
        for m in Manager.objects.all():
            user_ids_with_profiles.add(m.user_id)
        for s in Serveur.objects.all():
            user_ids_with_profiles.add(s.user_id)
        for c in Caissier.objects.all():
            user_ids_with_profiles.add(c.user_id)
        for a in Administrateur.objects.all():
            user_ids_with_profiles.add(a.user_id)

        # Trouver les utilisateurs orphelins
        orphan_users = User.objects.filter(~Q(id__in=user_ids_with_profiles))

        # Supprimer les utilisateurs orphelins
        deleted_count = 0
        for user in orphan_users:
            user.delete()
            deleted_count += 1

        return JsonResponse({
            'success': True,
            'message': f'{deleted_count} utilisateur(s) orphelin(s) supprimé(s) avec succès.',
            'deleted_count': deleted_count
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


# API Tables CRUD
def api_tables(request):
    """API: liste des tables"""
    denied = _require_admin(request)
    if denied:
        return denied

    tables = []
    for t in Table.objects.all():
        tables.append({
            'id': t.id,
            'numero': t.numero,
            'emplacement': t.emplacement,
            'capacite': t.capacite,
            'statut': t.statut,
            'nombre_clients': t.nombre_clients,
            'commande_actuelle_id': t.commande_actuelle.id if t.commande_actuelle else None,
        })

    return JsonResponse({'tables': tables})


@csrf_exempt
def api_create_table(request):
    """API: créer une table - Seul admin peut créer des tables"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_role = get_user_role(request.user)
    if user_role != 'admin':
        return JsonResponse({'success': False, 'message': 'Seul l\'administrateur peut créer des tables.'}, status=403)

    try:
        data = json.loads(request.body)
        table = Table.objects.create(
            numero=data.get('numero'),
            emplacement=data.get('emplacement', '') or '',
            capacite=data.get('capacite', 4),
            statut='libre',
            nombre_clients=0
        )
        return JsonResponse({'success': True, 'message': 'Table créée avec succès.', 'table_id': table.id})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_update_table(request, table_id):
    """API: modifier une table - Seul admin peut modifier des tables"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_role = get_user_role(request.user)
    if user_role != 'admin':
        return JsonResponse({'success': False, 'message': 'Seul l\'administrateur peut modifier des tables.'}, status=403)

    try:
        data = json.loads(request.body)
        table = Table.objects.get(id=table_id)

        if 'numero' in data:
            table.numero = data['numero']
        if 'emplacement' in data:
            table.emplacement = data['emplacement'] or ''
        if 'capacite' in data:
            table.capacite = data['capacite']

        table.save()
        return JsonResponse({'success': True, 'message': 'Table modifiée avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_delete_table(request, table_id):
    """API: supprimer une table - Seul admin peut supprimer des tables"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_role = get_user_role(request.user)
    if user_role != 'admin':
        return JsonResponse({'success': False, 'message': 'Seul l\'administrateur peut supprimer des tables.'}, status=403)

    try:
        table = Table.objects.get(id=table_id)
        table.delete()
        return JsonResponse({'success': True, 'message': 'Table supprimée avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_update_employe(request, employe_id):
    """API: modifier un employé"""
    denied = _require_admin(request)
    if denied:
        return denied

    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}

    employe_type = data.get('type') or data.get('role')
    desired_type = data.get('new_type') or data.get('role') or data.get('type')

    try:
        from django.contrib.auth.models import User

        if employe_type not in {'manager', 'serveur', 'caissier', 'admin'}:
            return JsonResponse({'success': False, 'message': "Type d'employé inconnu."}, status=400)
        if desired_type not in {'manager', 'serveur', 'caissier', 'admin'}:
            return JsonResponse({'success': False, 'message': "Type d'employé inconnu."}, status=400)

        required_fields = ['nom', 'prenom', 'email', 'telephone']
        if any(not (data.get(field) or '').strip() for field in required_fields):
            return JsonResponse({'success': False, 'message': 'Veuillez remplir tous les champs obligatoires.'}, status=400)

        new_email = (data.get('email') or '').strip()
        try:
            validate_email(new_email)
        except ValidationError:
            return JsonResponse({'success': False, 'message': "Format d'email invalide."}, status=400)

        if employe_type == 'manager':
            employe = Manager.objects.filter(id=employe_id).select_related('user').first()
        elif employe_type == 'serveur':
            employe = Serveur.objects.filter(id=employe_id).select_related('user').first()
        elif employe_type == 'caissier':
            employe = Caissier.objects.filter(id=employe_id).select_related('user').first()
        else:
            employe = Administrateur.objects.filter(id=employe_id).select_related('user').first()

        if not employe:
            return JsonResponse({'success': False, 'message': 'Compte introuvable.'}, status=404)

        new_username = data.get('username')
        if new_username is not None:
            new_username = new_username.strip()
            if not new_username:
                return JsonResponse({'success': False, 'message': 'Veuillez remplir tous les champs obligatoires.'}, status=400)

        with transaction.atomic():
            user = employe.user

            if new_username and new_username != user.username:
                if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                    return JsonResponse({'success': False, 'message': "Nom d'utilisateur déjà utilisé par un autre compte."}, status=400)
                user.username = new_username

            if new_email != (user.email or ''):
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                    return JsonResponse({'success': False, 'message': "Adresse email déjà utilisée par un autre compte."}, status=400)
                user.email = new_email

            common_updates = {
                'nom': (data.get('nom') or '').strip(),
                'prenom': (data.get('prenom') or '').strip(),
                'telephone': (data.get('telephone') or '').strip(),
                'email': new_email,
                'salaire_mensuel': data.get('salaire_mensuel', employe.salaire_mensuel),
            }

            if desired_type != employe_type:
                if desired_type == 'manager':
                    new_profile = Manager.objects.create(user=user, **common_updates)
                elif desired_type == 'serveur':
                    new_profile = Serveur.objects.create(user=user, **common_updates)
                elif desired_type == 'caissier':
                    new_profile = Caissier.objects.create(user=user, **common_updates)
                else:
                    new_profile = Administrateur.objects.create(user=user, **common_updates)
                employe.delete()
                employe = new_profile
            else:
                for key, value in common_updates.items():
                    setattr(employe, key, value)
                employe.save()

            user.save()

        return JsonResponse({'success': True, 'message': 'Compte mis à jour avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


def api_configuration_public(request):
    """API publique : informations du restaurant (sans données sensibles, pas d'auth requise)"""
    config = Configuration.objects.first()
    if not config:
        return JsonResponse({'success': True, 'restaurant_nom': 'KOOL.MA',
            'restaurant_adresse': '', 'restaurant_telephone': '',
            'restaurant_email': '', 'restaurant_horaires': ''})
    return JsonResponse({
        'success': True,
        'restaurant_nom': config.restaurant_nom,
        'restaurant_adresse': config.restaurant_adresse,
        'restaurant_telephone': config.restaurant_telephone,
        'restaurant_email': config.restaurant_email,
        'restaurant_horaires': config.restaurant_horaires,
    })


@csrf_exempt
def api_caisse_mouvement(request):
    """API UC4.5 : modifier l'état de la caisse (accessible aux caissiers, managers, admins)"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)

    role = get_user_role(request.user)
    if role not in ['caissier', 'manager', 'admin']:
        return JsonResponse({'success': False, 'message': 'Accès refusé.'}, status=403)

    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}

    type_mouvement = data.get('type_mouvement', 'ouverture')
    montant_raw = data.get('montant', '0')

    try:
        montant = Decimal(str(montant_raw))
        if montant < 0:
            raise ValueError
    except Exception:
        return JsonResponse({'success': False, 'message': 'Montant invalide.'}, status=400)

    config = Configuration.objects.first()
    if not config:
        config = Configuration.objects.create(caisse_modes_paiement=['cash', 'carte', 'cheque'])

    # Pour l'ouverture, mettre à jour les fonds de départ
    if type_mouvement == 'ouverture':
        config.caisse_fonds_depart = montant
        config.save()

    labels = {
        'ouverture': 'Ouverture de caisse',
        'entree': 'Entrée de fonds',
        'sortie': 'Sortie de fonds',
        'fermeture': 'Fermeture de caisse',
    }
    return JsonResponse({
        'success': True,
        'message': f"Mouvement enregistré : {labels.get(type_mouvement, type_mouvement)} — {montant} XOF",
    })


def api_configuration(request):
    denied = _require_admin(request)
    if denied:
        return denied

    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    config = Configuration.objects.first()
    if not config:
        config = Configuration.objects.create(caisse_modes_paiement=['cash', 'carte', 'cheque'])

    return JsonResponse({
        'success': True,
        'configuration': {
            'id': config.id,
            'restaurant_nom': config.restaurant_nom,
            'restaurant_adresse': config.restaurant_adresse,
            'restaurant_telephone': config.restaurant_telephone,
            'restaurant_email': config.restaurant_email,
            'restaurant_horaires': config.restaurant_horaires,
            'caisse_fonds_depart': str(config.caisse_fonds_depart),
            'caisse_modes_paiement': config.caisse_modes_paiement,
        }
    })


@csrf_exempt
def api_update_configuration(request):
    denied = _require_admin(request)
    if denied:
        return denied

    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}

    config = Configuration.objects.first()
    if not config:
        config = Configuration.objects.create(caisse_modes_paiement=['cash', 'carte', 'cheque'])

    restaurant_email = (data.get('restaurant_email') or '').strip()
    if restaurant_email:
        try:
            validate_email(restaurant_email)
        except ValidationError:
            return JsonResponse({'success': False, 'message': "Format d'email invalide."}, status=400)

    fonds_depart_raw = data.get('caisse_fonds_depart', str(config.caisse_fonds_depart))
    try:
        fonds_depart = Decimal(str(fonds_depart_raw))
    except Exception:
        return JsonResponse({'success': False, 'message': 'Paramètres invalides. Veuillez vérifier les champs.'}, status=400)
    if fonds_depart < 0:
        return JsonResponse({'success': False, 'message': 'Paramètres invalides. Veuillez vérifier les champs.'}, status=400)

    modes = data.get('caisse_modes_paiement', config.caisse_modes_paiement)
    if modes is None:
        modes = []
    if not isinstance(modes, list) or not all(isinstance(item, str) for item in modes):
        return JsonResponse({'success': False, 'message': 'Paramètres invalides. Veuillez vérifier les champs.'}, status=400)

    config.restaurant_nom = (data.get('restaurant_nom') or '').strip() or config.restaurant_nom
    config.restaurant_adresse = (data.get('restaurant_adresse') or '').strip()
    config.restaurant_telephone = (data.get('restaurant_telephone') or '').strip()
    config.restaurant_email = restaurant_email
    config.restaurant_horaires = (data.get('restaurant_horaires') or '').strip()
    config.caisse_fonds_depart = fonds_depart
    config.caisse_modes_paiement = modes
    config.save()

    return JsonResponse({'success': True, 'message': 'Configuration mise à jour avec succès.'})
