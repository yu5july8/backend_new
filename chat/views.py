from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User, Message
from .serializers import UserSerializer, MessageSerializer
from django.shortcuts import render
import openai
import os
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings  # ✅ Correct import

# Configure OpenAI API
openai.api_key = settings.OPENAI_API_KEY



# template loading 
def index(request):
    return render(request, "chat/index.html")  # Loads index.html from templates

def login_view(request):
    return render(request, "chat/login.html")  # Loads login.html

def chatroom(request):
    return render(request, "chat/chatroom.html")  # Loads chatroom.html

def typing(request):
    return render(request, "chat/typing.html") #loads typing.html

def speaking(request):
    return render(request, "chat/speaking.html")

def exit(request):
    return render(request, "chat/exit.html")

def loading(request):
    return render(request, "chat/loading.html")



@api_view(['POST'])
def register_user(request):
    """Register a new user."""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def send_message(request):
    """Send a chat message."""
    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_messages(request):
    """Fetch all chat messages."""
    messages = Message.objects.all().order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def speech_to_text(request):
    """Converts an uploaded audio file into text using OpenAI Whisper API."""
    
    if 'audio' not in request.FILES:
        return JsonResponse({"error": "No audio file uploaded"}, status=400)

    audio_file = request.FILES['audio']
    
    # Save file temporarily
    file_path = default_storage.save(f"uploads/{audio_file.name}", ContentFile(audio_file.read()))

    try:
        # OpenAI Whisper API Call
        with open(default_storage.path(file_path), "rb") as audio:
            response = openai.Audio.transcribe("whisper-1", audio)

        # Clean up: Delete the temp file
        default_storage.delete(file_path)

        return JsonResponse({"text": response.get("text", "")})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def save_message(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("user")
        message = data.get("message")
        user_type = data.get("user_type")

        if username and message and user_type:
            Conversation.objects.create(
                username=username,
                message=message,
                user_type=user_type
            )
            return JsonResponse({"status": "success"})
        return JsonResponse({"status": "failed", "error": "Missing fields"}, status=400)