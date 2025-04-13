from functools import wraps
from django.http import Http404
from .services import FeatureService

def feature_required(feature_name):
    """
    Decorator to protect views based on feature flags.
    If the feature is disabled, returns a 404.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not FeatureService.is_enabled(feature_name):
                raise Http404("Feature not available")
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator