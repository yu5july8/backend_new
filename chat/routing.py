from django.urls import path
from chat.consumers import ChatConsumer  # Import your WebSocket consumer

websocket_urlpatterns = [
    path("ws/chatroom/", ChatConsumer.as_asgi()),  # WebSocket URL
]