from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings


def _key_func(request):
    settings = get_settings()
    if settings.REDIS_URL:
        try:
            from slowapi.middleware import SlowAPIMiddleware  # noqa: F401
        except Exception:
            pass
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:40]
    return get_remote_address(request)


limiter = Limiter(key_func=_key_func, default_limits=["200/minute"])
