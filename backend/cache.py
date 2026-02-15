"""
Simple TTL cache using cachetools.
"""
from cachetools import TTLCache
from config import settings

_cache = TTLCache(maxsize=500, ttl=settings.cache_ttl_seconds)


def get_cached(key: str):
    return _cache.get(key)


def set_cached(key: str, value):
    _cache[key] = value
