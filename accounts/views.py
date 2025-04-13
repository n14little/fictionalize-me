from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import WaitlistEntry

def landing_page(request):
    return render(request, 'accounts/landing.html')

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
        email = request.POST.get('email')
        interest = request.POST.get('interest')
        try:
            WaitlistEntry.objects.create(email=email, interest=interest)
            messages.success(request, 'Successfully joined the waitlist!')
            return redirect('landing_page')
        except Exception as e:
            messages.error(request, 'This email is already on the waitlist.')
    return render(request, 'accounts/waitlist.html')
