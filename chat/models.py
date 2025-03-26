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

class Conversation(models.Model):
    username = models.CharField(max_length=100)
    message = models.TextField()
    user_type = models.CharField(max_length=20, choices=[
        ('hearing-user', 'Hearing User'),
        ('dhh-user', 'DHH User')
    ])
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} - {self.username}: {self.message}"