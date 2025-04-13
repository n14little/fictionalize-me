from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('signup/', views.signup_view, name='signup'),
    path('signin/', views.signin_view, name='signin'),
    path('waitlist/', views.waitlist_view, name='waitlist'),
    path('logout/', auth_views.LogoutView.as_view(next_page='landing_page'), name='logout'),
]