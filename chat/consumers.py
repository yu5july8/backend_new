import json
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def receive(self, text_data):
        data = json.loads(text_data)
        self.send(text_data=json.dumps({
            "user": data["user"], 
            "message": data["message"], 
            "user_type": data["user_type"]
        }))

    def disconnect(self, close_code):
        print(f"WebSocket disconnected with code: {close_code}")