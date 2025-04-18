from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from django.urls import reverse_lazy, reverse
from django.db.models import Q
from django.http import Http404

from .models import Journal, JournalEntry
from .forms import JournalForm, JournalEntryForm

@method_decorator(login_required, name='dispatch')
class JournalListView(ListView):
    model = Journal
    template_name = 'journals/journal_list.html'
    context_object_name = 'journals'

    def get_queryset(self):
        return Journal.objects.filter(user=self.request.user)

class JournalDetailView(DetailView):
    model = Journal
    template_name = 'journals/journal_detail.html'
    context_object_name = 'journal'

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
        if obj.public or (self.request.user.is_authenticated and obj.user == self.request.user):
            return obj
        raise Http404("Journal not found")
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['entries'] = self.object.entries.all().order_by('-created_at')
        return context

@method_decorator(login_required, name='dispatch')
class JournalCreateView(CreateView):
    model = Journal
    form_class = JournalForm
    template_name = 'journals/journal_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Create New Journal'
        return context

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('journals:journal_detail', kwargs={'pk': self.object.pk})

@method_decorator(login_required, name='dispatch')
class JournalUpdateView(UpdateView):
    model = Journal
    form_class = JournalForm
    template_name = 'journals/journal_form.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Edit Journal'
        return context

    def get_queryset(self):
        return Journal.objects.filter(user=self.request.user)

    def get_success_url(self):
        return reverse('journals:journal_detail', kwargs={'pk': self.object.pk})

@method_decorator(login_required, name='dispatch')
class JournalEntryCreateView(CreateView):
    model = JournalEntry
    form_class = JournalEntryForm
    template_name = 'journals/entry_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Create New Entry'
        context['journal'] = get_object_or_404(Journal, pk=self.kwargs['journal_pk'], user=self.request.user)
        return context

    def form_valid(self, form):
        journal = get_object_or_404(Journal, pk=self.kwargs['journal_pk'], user=self.request.user)
        form.instance.journal = journal
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('journals:journal_detail', kwargs={'pk': self.kwargs['journal_pk']})

@method_decorator(login_required, name='dispatch')
class JournalEntryUpdateView(UpdateView):
    model = JournalEntry
    form_class = JournalEntryForm
    template_name = 'journals/entry_form.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_title'] = 'Edit Entry'
        context['journal'] = self.object.journal
        return context

    def get_queryset(self):
        return JournalEntry.objects.filter(journal__user=self.request.user)

    def get_success_url(self):
        return reverse('journals:journal_detail', kwargs={'pk': self.object.journal.pk})
