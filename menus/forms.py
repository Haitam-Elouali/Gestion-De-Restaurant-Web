from django import forms
from .models import Categorie, Plat, Promotion


class CategorieForm(forms.ModelForm):
    """Formulaire pour créer/modifier une catégorie"""
    class Meta:
        model = Categorie
        fields = ['nom', 'description']
        widgets = {
            'nom': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'placeholder': 'Nom de la catégorie'
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 3,
                'placeholder': 'Description de la catégorie'
            }),
        }


class PlatForm(forms.ModelForm):
    """Formulaire pour créer/modifier un plat"""
    class Meta:
        model = Plat
        fields = ['nom', 'description', 'prix', 'disponible', 'image', 'categorie']
        widgets = {
            'nom': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'placeholder': 'Nom du plat'
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 3,
                'placeholder': 'Description du plat'
            }),
            'prix': forms.NumberInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'step': '0.01',
                'min': '0.01',
                'placeholder': 'Prix en DH'
            }),
            'disponible': forms.CheckboxInput(attrs={
                'class': 'w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500'
            }),
            'image': forms.FileInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
            }),
            'categorie': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
            }),
        }


class PromotionForm(forms.ModelForm):
    """Formulaire pour créer/modifier une promotion"""
    class Meta:
        model = Promotion
        fields = ['nom', 'description', 'reduction_pourcentage', 'date_debut', 'date_fin', 'active', 'plats']
        widgets = {
            'nom': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'placeholder': 'Nom de la promotion'
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'rows': 3,
                'placeholder': 'Description de la promotion'
            }),
            'reduction_pourcentage': forms.NumberInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'step': '0.01',
                'min': '0.01',
                'max': '100',
                'placeholder': 'Pourcentage de réduction'
            }),
            'date_debut': forms.DateInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'type': 'date'
            }),
            'date_fin': forms.DateInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500',
                'type': 'date'
            }),
            'active': forms.CheckboxInput(attrs={
                'class': 'w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500'
            }),
            'plats': forms.SelectMultiple(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500'
            }),
        }
    
    def clean(self):
        """Validation personnalisée pour les dates"""
        cleaned_data = super().clean()
        date_debut = cleaned_data.get('date_debut')
        date_fin = cleaned_data.get('date_fin')
        
        if date_debut and date_fin and date_debut > date_fin:
            raise forms.ValidationError("La date de début ne peut pas être postérieure à la date de fin.")
        
        return cleaned_data 