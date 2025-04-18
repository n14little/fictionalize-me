from django import forms
from .models import Journal, JournalEntry

class JournalForm(forms.ModelForm):
    class Meta:
        model = Journal
        fields = ['title', 'description', 'public']
        widgets = {
            'public': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        }

class JournalEntryForm(forms.ModelForm):
    class Meta:
        model = JournalEntry
        fields = ['title', 'content', 'mood', 'location']