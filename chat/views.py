import io
import os
import wave
import json
import subprocess
import tempfile
import traceback
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserSerializer, MessageSerializer
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings  # ✅ Correct import
from .models import User, Message, Conversation
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from vosk import Model, KaldiRecognizer
import wave



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


@csrf_exempt
@api_view(['POST'])
def register_user(request):
    """Register a new user."""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@csrf_exempt
@api_view(['POST'])
def send_message(request):
    """Send a chat message."""
    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@csrf_exempt
@api_view(['GET'])
def get_messages(request):
    """Fetch all chat messages."""
    messages = Message.objects.all().order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

MODEL_PATH = os.path.join("vosk_models", "vosk-model-small-en-us-0.15")
model = Model(MODEL_PATH)

@csrf_exempt
def speech_to_text_vosk(request):
    if request.method == "POST" and request.FILES.get("audio"):
        try:
            audio_file = request.FILES["audio"]

            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_input:
                for chunk in audio_file.chunks():
                    temp_input.write(chunk)
                temp_input_path = temp_input.name

            temp_output_path = temp_input_path.replace(".webm", ".wav")

            subprocess.run([
                "ffmpeg", "-y",
                "-i", temp_input_path,
                "-ar", "16000",
                "-ac", "1",
                "-f", "wav",
                temp_output_path
            ], check=True)

            wf = wave.open(temp_output_path, "rb")
            rec = KaldiRecognizer(model, wf.getframerate())

            result = ""
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    res = json.loads(rec.Result())
                    result += res.get("text", "") + " "

            final_res = json.loads(rec.FinalResult())
            result += final_res.get("text", "")
            wf.close()

            os.remove(temp_input_path)
            os.remove(temp_output_path)

            return JsonResponse({"text": result.strip()})

        except Exception as e:
            print("❌ Vosk Processing Error:", traceback.format_exc())
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "No audio uploaded"}, status=400)


@csrf_exempt
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