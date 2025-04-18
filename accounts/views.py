from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.forms import ModelForm
from features.decorators import feature_required
from .models import WaitlistEntry
from django.utils.http import url_has_allowed_host_and_scheme

class WaitlistForm(ModelForm):
    class Meta:
        model = WaitlistEntry
        fields = ['email', 'interest']

def landing_page(request):
    return render(request, 'accounts/landing.html')

@feature_required('enable_signup')
def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Account created successfully!')
            return redirect('journals:journal_list')
    else:
        form = UserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})

@feature_required('enable_signin')
def signin_view(request):
    next_url = request.GET.get('next', None)
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, 'Successfully signed in!')
            
            # Check if there's a next parameter and it's safe
            if next_url and url_has_allowed_host_and_scheme(
                url=next_url,
                allowed_hosts={request.get_host()},
                require_https=request.is_secure()
            ):
                return redirect(next_url)
            return redirect('journals:journal_list')
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/signin.html', {
        'form': form,
        'next': next_url
    })

def waitlist_view(request):
    if request.method == 'POST':
        form = WaitlistForm(request.POST)
        if form.is_valid():
            try:
                form.save()
                messages.success(request, 'Successfully joined the waitlist!')
                return redirect('landing_page')
            except Exception as e:
                messages.error(request, 'This email is already on the waitlist.')
    else:
        form = WaitlistForm()
    return render(request, 'accounts/waitlist.html', {'form': form})

def faq_view(request):
    return render(request, 'accounts/faq.html')
