from django.urls import path
from . import views

app_name = 'journals'

urlpatterns = [
    path('', views.JournalListView.as_view(), name='journal_list'),
    path('create/', views.JournalCreateView.as_view(), name='journal_create'),
    path('<uuid:pk>/', views.JournalDetailView.as_view(), name='journal_detail'),
    path('<uuid:pk>/edit/', views.JournalUpdateView.as_view(), name='journal_edit'),
    path('<uuid:journal_pk>/entries/create/', views.JournalEntryCreateView.as_view(), name='entry_create'),
    path('<uuid:journal_pk>/entries/<uuid:pk>/edit/', views.JournalEntryUpdateView.as_view(), name='entry_edit'),
]