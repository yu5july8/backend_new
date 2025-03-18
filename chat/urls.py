from django.urls import path
from .views import register_user, send_message, get_messages, index, login_view, typing ,chatroom

urlpatterns = [
    # API Endpoints
    path('register/', register_user),
    path('send/', send_message),
    path('messages/', get_messages),

    # Frontend Pages
    path('', index, name='index'),  # Homepage
    path('login/', login_view, name='login'),  # Login page
    path('chatroom/', chatroom, name='chatroom'),  # Chatroom page
    path('typing/', typing, name='typing',)
]