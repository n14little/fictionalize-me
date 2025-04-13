from .services import FeatureService

def feature_flags(request):
    """Make all feature flags available in templates."""
    return {
        'features': FeatureService.get_all_features()
    }