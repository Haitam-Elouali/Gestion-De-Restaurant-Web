import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Manager, Serveur, Caissier, Administrateur, Table


def get_user_role(user):
    """Helper function pour déterminer le rôle de l'utilisateur"""
    try:
        from .models import Manager, Serveur, Caissier, Administrateur
        
        # Vérifier directement avec les modèles (plus fiable)
        if Administrateur.objects.filter(user=user).exists():
            return 'admin'
        elif Manager.objects.filter(user=user).exists():
            return 'manager'
        elif Serveur.objects.filter(user=user).exists():
            return 'serveur'
        elif Caissier.objects.filter(user=user).exists():
            return 'caissier'
            
    except Exception as e:
        print(f"Erreur dans get_user_role: {e}")
    
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

    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        role = get_user_role(user)
        return JsonResponse({
            'success': True,
            'username': user.username,
            'role': role,
        })
    return JsonResponse({'success': False, 'message': 'Nom d\'utilisateur ou mot de passe incorrect.'})


@csrf_exempt
def api_logout(request):
    """API: deconnexion (POST)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    logout(request)
    return JsonResponse({'success': True})


def api_employes(request):
    """API: liste des employes - RG02: Seul admin peut voir/créer/supprimer les managers"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    user_role = get_user_role(request.user)
    
    # RG02: Seul l'administrateur peut créer ou supprimer des comptes "Manager"
    # Donc seul l'admin voit les managers dans la liste
    managers = []
    if user_role == 'admin':
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
        })
    
    admins = []
    if user_role == 'admin':
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
            })

    return JsonResponse({
        'managers': managers,
        'serveurs': serveurs,
        'caissiers': caissiers,
        'admins': admins,
        'current_user_role': user_role,
    })


@csrf_exempt
def api_create_employe(request):
    """API: créer un employé - RG02: Seul admin peut créer des managers"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    user_role = get_user_role(request.user)
    data = json.loads(request.body)
    employe_type = data.get('type')
    
    # RG02: Vérification des permissions
    if employe_type == 'manager' and user_role != 'admin':
        return JsonResponse({
            'success': False, 
            'message': 'Seul l\'administrateur peut créer des comptes Manager (RG02).'
        }, status=403)
    
    # Seul l'admin peut créer des admins
    if employe_type == 'admin' and user_role != 'admin':
        return JsonResponse({
            'success': False,
            'message': 'Seul l\'administrateur peut créer des comptes Administrateur.'
        }, status=403)
    
    try:
        from django.contrib.auth.models import User
        username = data.get('username')
        email = data.get('email')
        
        # Vérifier si le username existe déjà
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': f'Le nom d\'utilisateur "{username}" est déjà utilisé.'
            }, status=400)
        
        # Vérifier si l'email existe déjà
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': f'L\'email "{email}" est déjà utilisé.'
            }, status=400)
        
        # Créer l'utilisateur Django
        user = User.objects.create_user(
            username=username,
            password=data.get('password'),
            email=email
        )
        
        # Créer le profil employé selon le type
        if employe_type == 'manager':
            Manager.objects.create(
                user=user,
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                telephone=data.get('telephone'),
                email=data.get('email'),
                salaire_mensuel=data.get('salaire_mensuel', 0)
            )
        elif employe_type == 'serveur':
            Serveur.objects.create(
                user=user,
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                telephone=data.get('telephone'),
                email=data.get('email'),
                salaire_mensuel=data.get('salaire_mensuel', 0)
            )
        elif employe_type == 'caissier':
            Caissier.objects.create(
                user=user,
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                telephone=data.get('telephone'),
                email=data.get('email'),
                salaire_mensuel=data.get('salaire_mensuel', 0)
            )
        elif employe_type == 'admin':
            Administrateur.objects.create(
                user=user,
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                telephone=data.get('telephone'),
                email=data.get('email'),
                salaire_mensuel=data.get('salaire_mensuel', 0)
            )
        
        return JsonResponse({'success': True, 'message': f'{employe_type} créé avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@csrf_exempt
def api_delete_employe(request, employe_id):
    """API: supprimer un employé - RG02: Seul admin peut supprimer des managers"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    user_role = get_user_role(request.user)
    data = json.loads(request.body) if request.body else {}
    employe_type = data.get('type')
    
    # RG02: Seul l'administrateur peut supprimer des comptes Manager
    if employe_type == 'manager' and user_role != 'admin':
        return JsonResponse({
            'success': False,
            'message': 'Seul l\'administrateur peut supprimer des comptes Manager (RG02).'
        }, status=403)
    
    try:
        from django.contrib.auth.models import User
        from django.db import connection
        
        # Trouver et supprimer l'employé avec gestion d'erreur spécifique
        employe = None
        user_id = None
        try:
            if employe_type == 'manager':
                employe = Manager.objects.get(id=employe_id)
                user_id = employe.user_id
            elif employe_type == 'serveur':
                employe = Serveur.objects.get(id=employe_id)
                user_id = employe.user_id
            elif employe_type == 'caissier':
                employe = Caissier.objects.get(id=employe_id)
                user_id = employe.user_id
            elif employe_type == 'admin':
                employe = Administrateur.objects.get(id=employe_id)
                user_id = employe.user_id
            else:
                return JsonResponse({'success': False, 'message': 'Type d\'employé inconnu.'})
        except Manager.DoesNotExist:
            return JsonResponse({'success': False, 'message': f'Aucun manager trouvé avec l\'ID {employe_id}.'})
        except Serveur.DoesNotExist:
            return JsonResponse({'success': False, 'message': f'Aucun serveur trouvé avec l\'ID {employe_id}.'})
        except Caissier.DoesNotExist:
            return JsonResponse({'success': False, 'message': f'Aucun caissier trouvé avec l\'ID {employe_id}.'})
        except Administrateur.DoesNotExist:
            return JsonResponse({'success': False, 'message': f'Aucun administrateur trouvé avec l\'ID {employe_id}.'})
        
        # Supprimer l'employé d'abord
        employe.delete()
        
        # Puis supprimer l'utilisateur avec SQL direct pour éviter les dépendances
        if user_id:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM auth_user WHERE id = %s", [user_id])
        
        return JsonResponse({'success': True, 'message': 'Employé supprimé avec succès.'})
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
        orphan_users = User.objects.filter(~models.Q(id__in=user_ids_with_profiles))
        
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
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    tables = []
    for t in Table.objects.all():
        tables.append({
            'id': t.id,
            'numero': t.numero,
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
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentification requise.'}, status=401)
    
    if request.method != 'PUT':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    user_role = get_user_role(request.user)
    data = json.loads(request.body)
    employe_type = data.get('type')
    
    try:
        from django.contrib.auth.models import User
        
        # Trouver l'employé
        if employe_type == 'manager':
            employe = Manager.objects.get(id=employe_id)
        elif employe_type == 'serveur':
            employe = Serveur.objects.get(id=employe_id)
        elif employe_type == 'caissier':
            employe = Caissier.objects.get(id=employe_id)
        elif employe_type == 'admin':
            employe = Administrateur.objects.get(id=employe_id)
        else:
            return JsonResponse({'success': False, 'message': 'Type d\'employé inconnu.'})
        
        # Mettre à jour les champs
        if 'nom' in data:
            employe.nom = data['nom']
        if 'prenom' in data:
            employe.prenom = data['prenom']
        if 'telephone' in data:
            employe.telephone = data['telephone']
        if 'email' in data:
            employe.email = data['email']
            employe.user.email = data['email']
        if 'salaire_mensuel' in data:
            employe.salaire_mensuel = data['salaire_mensuel']
        
        employe.save()
        employe.user.save()
        
        return JsonResponse({'success': True, 'message': 'Employé modifié avec succès.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})
