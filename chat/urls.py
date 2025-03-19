from django.urls import path
from . import views 

urlpatterns = [
    # API Endpoints
    path('register/', register_user),
    path('send/', send_message),
    path('messages/', get_messages),

    # Frontend Pages
    path("admin/", admin.site.urls),
    path("api/chat/", include("chat.urls")),  # API routes
    path("", views.index, name="index"),  # ✅ Index page
    path("login/", views.login_view, name="login"),  # ✅ Login page
    path("chatroom/", views.chatroom, name="chatroom"),  # ✅ Chatroom (Main Monitor)
    path("typing/", views.typing, name="typing"),  # ✅ Typing page
    path("speaking/", views.speaking, name="speaking"),
]