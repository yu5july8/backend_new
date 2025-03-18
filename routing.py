from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.consumers import ChatConsumer  

application = ProtocolTypeRouter({
    "http": URLRouter([
        # Include Django views here if needed
    ]),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            re_path(r"ws/chatroom/$", ChatConsumer.as_asgi()),
        ])
    ),
})