from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    user_type = models.CharField(max_length=50, choices=[("hearing", "Hearing"), ("dhh", "DHH")])
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=[("text", "Text"), ("speech", "Speech")])
    timestamp = models.DateTimeField(auto_now_add=True)