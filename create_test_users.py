#!/usr/bin/env python
"""
Script pour créer des employés de test pour l'application Kool.ma
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'koolma_project.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Manager, Serveur, Cuisinier

def create_test_employees():
    """Créer des employés de test"""
    
    # Supprimer les utilisateurs existants s'ils existent
    test_users = ['manager_test', 'serveur_test', 'cuisinier_test']
    for username in test_users:
        try:
            user = User.objects.get(username=username)
            user.delete()
            print(f"Utilisateur {username} supprimé")
        except User.DoesNotExist:
            pass
    
    # Créer un Manager
    manager_user = User.objects.create_user(
        username='manager_test',
        email='manager@kool.ma',
        password='manager123',
        first_name='Ahmed',
        last_name='Alaoui'
    )
    
    manager = Manager.objects.create(
        user=manager_user,
        nom='Alaoui',
        prenom='Ahmed',
        telephone='+212 6 12 34 56 78',
        email='manager@kool.ma',
        salaire_mensuel=15000.00
    )
    
    print("✅ Manager créé:")
    print(f"   Username: manager_test")
    print(f"   Password: manager123")
    print(f"   Nom: {manager.getNomComplet()}")
    print()
    
    # Créer un Serveur
    serveur_user = User.objects.create_user(
        username='serveur_test',
        email='serveur@kool.ma',
        password='serveur123',
        first_name='Fatima',
        last_name='Benali'
    )
    
    serveur = Serveur.objects.create(
        user=serveur_user,
        nom='Benali',
        prenom='Fatima',
        telephone='+212 6 23 45 67 89',
        email='serveur@kool.ma',
        salaire_mensuel=8000.00
    )
    
    print("✅ Serveur créé:")
    print(f"   Username: serveur_test")
    print(f"   Password: serveur123")
    print(f"   Nom: {serveur.getNomComplet()}")
    print()
    
    # Créer un Cuisinier
    cuisinier_user = User.objects.create_user(
        username='cuisinier_test',
        email='cuisinier@kool.ma',
        password='cuisinier123',
        first_name='Mohammed',
        last_name='Tazi'
    )
    
    cuisinier = Cuisinier.objects.create(
        user=cuisinier_user,
        nom='Tazi',
        prenom='Mohammed',
        telephone='+212 6 34 56 78 90',
        email='cuisinier@kool.ma',
        salaire_mensuel=12000.00,
        status='disponible'
    )
    
    print("✅ Cuisinier créé:")
    print(f"   Username: cuisinier_test")
    print(f"   Password: cuisinier123")
    print(f"   Nom: {cuisinier.getNomComplet()}")
    print()
    
    print("🎉 Tous les employés de test ont été créés avec succès!")
    print("Vous pouvez maintenant vous connecter avec l'un de ces comptes:")
    print()
    print("📋 Récapitulatif des comptes:")
    print("┌─────────────────┬─────────────────┬─────────────────┐")
    print("│ Rôle            │ Username        │ Password        │")
    print("├─────────────────┼─────────────────┼─────────────────┤")
    print("│ Manager         │ manager_test    │ manager123      │")
    print("│ Serveur         │ serveur_test    │ serveur123      │")
    print("│ Cuisinier       │ cuisinier_test  │ cuisinier123    │")
    print("└─────────────────┴─────────────────┴─────────────────┘")
    print()
    print("🌐 Accédez à: http://127.0.0.1:8000/login/")

if __name__ == '__main__':
    create_test_employees() 