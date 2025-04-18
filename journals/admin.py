from django.contrib import admin
from .models import Journal, JournalEntry

@admin.register(Journal)
class JournalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at')
    search_fields = ('title', 'description', 'user__username')
    list_filter = ('created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('title', 'journal', 'created_at', 'mood')
    search_fields = ('title', 'content', 'journal__title', 'mood', 'location')
    list_filter = ('created_at', 'updated_at', 'mood')
    readonly_fields = ('created_at', 'updated_at')
