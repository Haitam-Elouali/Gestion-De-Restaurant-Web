from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from .models import Manager, Serveur, Cuisinier


class LoginForm(AuthenticationForm):
    """Formulaire de connexion personnalisé"""
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'placeholder': 'Nom d\'utilisateur'
        }),
        label='Nom d\'utilisateur'
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'placeholder': 'Mot de passe'
        }),
        label='Mot de passe'
    )


class ManagerForm(forms.ModelForm):
    """Formulaire pour créer/modifier un Manager"""
    class Meta:
        model = Manager
        fields = ['nom', 'prenom', 'telephone', 'email', 'salaire_mensuel']
        widgets = {
            'nom': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'prenom': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'telephone': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'salaire_mensuel': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
        }


class ServeurForm(forms.ModelForm):
    """Formulaire pour créer/modifier un Serveur"""
    class Meta:
        model = Serveur
        fields = ['nom', 'prenom', 'telephone', 'email', 'salaire_mensuel']
        widgets = {
            'nom': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'prenom': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'telephone': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'salaire_mensuel': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
        }


class CuisinierForm(forms.ModelForm):
    """Formulaire pour créer/modifier un Cuisinier"""
    class Meta:
        model = Cuisinier
        fields = ['nom', 'prenom', 'telephone', 'email', 'salaire_mensuel', 'status']
        widgets = {
            'nom': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'prenom': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'telephone': forms.TextInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'salaire_mensuel': forms.NumberInput(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
            'status': forms.Select(attrs={'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'}),
        }


class UserCreationFormWithProfile(UserCreationForm):
    """Formulaire de création d'utilisateur avec profil employé"""
    nom = forms.CharField(max_length=100, required=True)
    prenom = forms.CharField(max_length=100, required=True)
    telephone = forms.CharField(max_length=20, required=True)
    email = forms.EmailField(required=True)
    salaire_mensuel = forms.DecimalField(max_digits=10, decimal_places=2, required=True)
    type_employe = forms.ChoiceField(
        choices=[
            ('manager', 'Manager'),
            ('serveur', 'Serveur'),
            ('cuisinier', 'Cuisinier'),
        ],
        required=True,
        label="Type d'employé"
    )
    
    class Meta:
        model = User
        fields = ['username', 'password1', 'password2']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gold-500 focus:border-gold-500'
            })
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        
        if commit:
            user.save()
            
            # Créer le profil employé selon le type
            type_employe = self.cleaned_data['type_employe']
            employe_data = {
                'user': user,
                'nom': self.cleaned_data['nom'],
                'prenom': self.cleaned_data['prenom'],
                'telephone': self.cleaned_data['telephone'],
                'email': self.cleaned_data['email'],
                'salaire_mensuel': self.cleaned_data['salaire_mensuel'],
            }
            
            if type_employe == 'manager':
                Manager.objects.create(**employe_data)
            elif type_employe == 'serveur':
                Serveur.objects.create(**employe_data)
            elif type_employe == 'cuisinier':
                Cuisinier.objects.create(**employe_data)
        
        return user 