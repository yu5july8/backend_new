from django.urls import re_path
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/chatroom/$", ChatConsumer.as_asgi()),
]