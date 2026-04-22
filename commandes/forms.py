from django import forms
from .models import Commande, LigneDeCommande
from menus.models import Plat


class CommandeForm(forms.ModelForm):
    """Formulaire pour créer/modifier une commande"""
    class Meta:
        model = Commande
        fields = ['type', 'nom_clt', 'adresse_liv', 'status', 'notes']
        widgets = {
            'type': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
            }),
            'nom_clt': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'placeholder': 'Nom du client'
            }),
            'adresse_liv': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 3,
                'placeholder': 'Adresse de livraison (si applicable)'
            }),
            'status': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 3,
                'placeholder': 'Notes spéciales'
            }),
        }


class LigneDeCommandeForm(forms.ModelForm):
    """Formulaire pour créer/modifier une ligne de commande"""
    class Meta:
        model = LigneDeCommande
        fields = ['plat', 'quantite', 'notes']
        widgets = {
            'plat': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
            }),
            'quantite': forms.NumberInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'min': '1',
                'value': '1'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 2,
                'placeholder': 'Notes spéciales pour ce plat'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrer seulement les plats disponibles
        self.fields['plat'].queryset = Plat.objects.filter(disponible=True)


class CommandeRapideForm(forms.Form):
    """Formulaire pour créer une commande rapide"""
    nom_clt = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'placeholder': 'Nom du client'
        }),
        label='Nom du client'
    )
    type = forms.ChoiceField(
        choices=Commande.TYPE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
        }),
        label='Type de commande'
    )
    adresse_liv = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'rows': 2,
            'placeholder': 'Adresse de livraison (si livraison)'
        }),
        label='Adresse de livraison'
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'rows': 2,
            'placeholder': 'Notes spéciales'
        }),
        label='Notes'
    )


class AjouterPlatForm(forms.Form):
    """Formulaire pour ajouter un plat à une commande existante"""
    plat = forms.ModelChoiceField(
        queryset=Plat.objects.filter(disponible=True),
        widget=forms.Select(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
        }),
        label='Plat'
    )
    quantite = forms.IntegerField(
        min_value=1,
        initial=1,
        widget=forms.NumberInput(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'min': '1'
        }),
        label='Quantité'
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
            'rows': 2,
            'placeholder': 'Notes spéciales pour ce plat'
        }),
        label='Notes'
    ) 