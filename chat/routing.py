from django.urls import path, re_path
from chat.consumers import ChatConsumer  # Import your WebSocket consumer

websocket_urlpatterns = [
    path("ws/chatroom/", ChatConsumer.as_asgi()),  # WebSocket URL
]

websocket_urlpatterns = [
    re_path(r"ws/chatroom/$", ChatConsumer.as_asgi()),
]