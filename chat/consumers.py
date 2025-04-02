# consumers.py
import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Message, Conversation

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.send(text_data=json.dumps({
            "event": "connection_established",
            "message": "You are connected"
        }))

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        data = json.loads(text_data)
        user = data.get("user")
        message = data.get("message")
        user_type = data.get("user_type")

        # Save to DB
        Conversation.objects.create(username=user, message=message, user_type=user_type)

        # Broadcast message
        self.send(text_data=json.dumps({
            "user": user,
            "message": message,
            "user_type": user_type
        }))
        self.channel_layer.group_send(
            "chatroom",
            {
                "type": "chat_message",
                "user": user,
                "message": message,
                "user_type": user_type
            }
        )

    def user_joined(self, event):
        self.send(text_data=json.dumps({
            "event": "user_joined",
            "user": event["user"],
            "user_type": event["user_type"]
        }))

    

    

    def chat_message(self, event):
        self.send(text_data=json.dumps(event))