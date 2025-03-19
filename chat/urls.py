from django.urls import path, include
from django.contrib import admin
from .views import register_user, send_message, get_messages, speech_to_text
from . import views

urlpatterns = [
    # ✅ API Endpoints
    path("api/chat/register/", register_user),
    path("api/chat/send/", send_message),
    path("api/chat/messages/", get_messages),
    path("api/chat/speech_to_text/", speech_to_text),  # ✅ Added Speech-to-Text Endpoint

    # ✅ Frontend Pages
    path("admin/", admin.site.urls),
    path("", views.index, name="index"),  # ✅ Index page
    path("login/", views.login_view, name="login"),  # ✅ Login page
    path("chatroom/", views.chatroom, name="chatroom"),  # ✅ Chatroom (Main Monitor)
    path("typing/", views.typing, name="typing"),  # ✅ Typing page
    path("speaking/", views.speaking, name="speaking"),  # ✅ Speaking page
]