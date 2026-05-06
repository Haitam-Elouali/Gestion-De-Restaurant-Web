from django.http import HttpResponse
from django.conf import settings
from pathlib import Path


def react_app(request, path=None):
    """Vue pour servir l'application React buildée"""
    index_path = Path(settings.BASE_DIR) / 'frontend' / 'dist' / 'index.html'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    return HttpResponse('Application React non buildée. Lancez npm run build dans le dossier frontend.')
