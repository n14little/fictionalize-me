from rest_framework import serializers
from .models import Journal, JournalEntry

class JournalEntrySerializer(serializers.ModelSerializer):
    journal_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = JournalEntry
        fields = ['id', 'journal_id', 'title', 'content', 'mood', 'location', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class JournalSerializer(serializers.ModelSerializer):
    entries_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Journal
        fields = ['id', 'title', 'description', 'slug', 'created_at', 'updated_at', 'entries_count']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'entries_count']

    def get_entries_count(self, obj):
        return obj.entries.count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)