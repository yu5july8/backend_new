# consumers.py
import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Message

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = "chatroom"  # Shared room for all users
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        data = json.loads(text_data)

        if data.get("event") == "user_joined":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "user_joined",
                    "user": data["user"],
                    "user_type": data["user_type"]
                }
            )
        elif data.get("message"):
            user = data["user"]
            message = data["message"]
            user_type = data["user_type"]

            # Save to DB
            Message.objects.create(user=user, text=message, user_type=user_type)

            # Broadcast
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "user": user,
                    "message": message,
                    "user_type": user_type
                }
            )

    def chat_message(self, event):
        self.send(text_data=json.dumps({
            "user": event["user"],
            "message": event["message"],
            "user_type": event["user_type"]
        }))

    def user_joined(self, event):
        self.send(text_data=json.dumps({
            "event": "user_joined",
            "user": event["user"],
            "user_type": event["user_type"]
        }))
