from django.urls import re_path
from chat.consumers import ChatConsumer  # ✅ Import the consumer correctly

websocket_urlpatterns = [
    re_path(r"ws/chatroom/$", ChatConsumer.as_asgi()),  # ✅ Ensure correct WebSocket path
]