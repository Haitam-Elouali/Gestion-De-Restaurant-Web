import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponseNotFound


def react_app(request, path=None):
    """Serve the built React app and its static files from frontend/dist."""
    dist_dir = Path(settings.BASE_DIR) / 'frontend' / 'dist'
    requested_path = (path or '').lstrip('/')

    if requested_path:
        candidate = (dist_dir / requested_path).resolve()
        if candidate.exists() and candidate.is_file() and str(candidate).startswith(str(dist_dir.resolve())):
            content_type, _ = mimetypes.guess_type(str(candidate))
            return FileResponse(open(candidate, 'rb'), content_type=content_type or 'application/octet-stream')

    index_path = dist_dir / 'index.html'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as file_handle:
            return HttpResponse(file_handle.read())

    return HttpResponseNotFound('Application React non buildée. Lancez npm run build dans le dossier frontend.')
