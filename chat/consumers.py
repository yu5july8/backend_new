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

def receive(self, text_data):
    try:
        data = json.loads(text_data)
        user = data.get("user", "Anonymous")
        message = data.get("message", "")
        user_type = data.get("user_type", "unknown")

        # Only broadcast if message exists
        if message:
            self.send(text_data=json.dumps({
                "user": user,
                "message": message,
                "user_type": user_type
            }))
        else:
            print("Received message without content, skipping broadcast.")
    except Exception as e:
        print("Error in WebSocket message:", e)