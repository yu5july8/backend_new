from django.urls import path, include
from django.contrib import admin
from .views import register_user, send_message, get_messages, speech_to_text_vosk
from .views import save_message
from . import views

urlpatterns = [
    # ✅ API Endpoints
    path("api/chat/register/", register_user),
    path("api/chat/send/", send_message),
    path("api/chat/messages/", get_messages),
    path("speech_to_text/", speech_to_text_vosk, name="speech_to_text_vosk"),

    # ✅ Frontend Pages
    path("admin/", admin.site.urls),
    path("", views.index, name="index"),  # ✅ Index page
    path("login/", views.login_view, name="login"),  # ✅ Login page
    path("chatroom/", views.chatroom, name="chatroom"),  # ✅ Chatroom (Main Monitor)
    path("typing/", views.typing, name="typing"),  # ✅ Typing page
    path("speaking/", views.speaking, name="speaking"),  # ✅ Speaking page
    path("messages/", get_messages, name="get_messages"),  # ✅ Ensure API route exists
    path("send/", send_message, name="send_message"),
    path("save/", save_message),
    path("exit/", views.exit_page, name="exit"),
]