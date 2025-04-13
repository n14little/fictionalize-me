from django.contrib import admin
from .models import Feature

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'enabled', 'description', 'updated_at')
    list_filter = ('enabled',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
