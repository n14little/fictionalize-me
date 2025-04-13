from django.db import models

class WaitlistEntry(models.Model):
    email = models.EmailField(unique=True)
    interest = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
