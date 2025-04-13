from django.core.cache import cache
from .models import Feature

class FeatureService:
    CACHE_KEY_PREFIX = 'feature_flag_'
    CACHE_TIMEOUT = 300  # 5 minutes

    @classmethod
    def is_enabled(cls, feature_name: str) -> bool:
        """Check if a feature is enabled."""
        cache_key = f"{cls.CACHE_KEY_PREFIX}{feature_name}"
        
        # Try to get from cache first
        cached_value = cache.get(cache_key)
        if cached_value is not None:
            return cached_value

        # If not in cache, get from database
        try:
            feature = Feature.objects.get(name=feature_name)
            enabled = feature.enabled
        except Feature.DoesNotExist:
            # Default to False if feature doesn't exist
            enabled = False

        # Cache the result
        cache.set(cache_key, enabled, cls.CACHE_TIMEOUT)
        return enabled

    @classmethod
    def get_all_features(cls) -> dict:
        """Get all features and their states."""
        return {
            feature.name: feature.enabled
            for feature in Feature.objects.all()
        }

    @classmethod
    def invalidate_cache(cls, feature_name: str) -> None:
        """Clear the cache for a specific feature."""
        cache_key = f"{cls.CACHE_KEY_PREFIX}{feature_name}"
        cache.delete(cache_key)