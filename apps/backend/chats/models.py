from django.db import models
from users.models import UserProfile

class ChatMessage(models.Model):
    room_name = models.CharField(max_length=255)
    user = models.ForeignKey(UserProfile, null=True, blank=True, on_delete=models.SET_NULL)
    message = models.TextField()
    translated_message = models.TextField(null=True, blank=True)
    language = models.CharField(max_length=10, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        ordering = ["timestamp"]
