import json
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        print("🔌 WebSocket connected.")

    def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data.get("event") == "user_joined":
                print(f"📲 User joined: {data['user']} ({data['user_type']})")
                self.send(text_data=json.dumps({
                    "event": "user_joined",
                    "user": data["user"],
                    "user_type": data["user_type"]
                }))

            elif "message" in data:
                # Normal chat message
                self.send(text_data=json.dumps({
                    "user": data["user"],
                    "message": data["message"],
                    "user_type": data["user_type"]
                }))
            else:
                print("⚠️ Unrecognized WebSocket message:", data)

        except Exception as e:
            print("❌ WebSocket receive error:", e)

    def disconnect(self, close_code):
        print("🔌 WebSocket disconnected.")