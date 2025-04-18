from django import forms
from .models import Journal, JournalEntry

class JournalForm(forms.ModelForm):
    class Meta:
        model = Journal
        fields = ['title', 'description']

class JournalEntryForm(forms.ModelForm):
    class Meta:
        model = JournalEntry
        fields = ['title', 'content', 'mood', 'location']