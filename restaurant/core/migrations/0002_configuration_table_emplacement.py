import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='table',
            name='emplacement',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Emplacement'),
        ),
        migrations.CreateModel(
            name='Configuration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('restaurant_nom', models.CharField(default='KOOL.MA', max_length=150, verbose_name='Nom du restaurant')),
                ('restaurant_adresse', models.TextField(blank=True, default='', verbose_name='Adresse')),
                ('restaurant_telephone', models.CharField(blank=True, default='', max_length=30, verbose_name='Téléphone')),
                ('restaurant_email', models.EmailField(blank=True, default='', max_length=254, verbose_name='Email')),
                ('restaurant_horaires', models.TextField(blank=True, default='', verbose_name="Horaires d'ouverture")),
                ('caisse_fonds_depart', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0.00'))], verbose_name='Fonds de départ')),
                ('caisse_modes_paiement', models.JSONField(default=list, verbose_name='Modes de paiement acceptés')),
                ('date_creation', models.DateTimeField(auto_now_add=True, verbose_name='Date de création')),
                ('date_modification', models.DateTimeField(auto_now=True, verbose_name='Date de modification')),
            ],
            options={
                'verbose_name': 'Configuration',
                'verbose_name_plural': 'Configuration',
            },
        ),
    ]

