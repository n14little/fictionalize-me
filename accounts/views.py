from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.forms import ModelForm
from features.decorators import feature_required
from .models import WaitlistEntry

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
            return redirect('landing_page')
    else:
        form = UserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})

@feature_required('enable_signin')
def signin_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, 'Successfully signed in!')
            return redirect('landing_page')
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/signin.html', {'form': form})

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
