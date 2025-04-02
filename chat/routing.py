from django.urls import re_path
from chat.consumers import ChatConsumer  # ✅ Import the consumer correctly
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/chatroom/$", consumers.ChatRoomConsumer.as_asgi()),  # ✅ Ensure correct WebSocket path
]