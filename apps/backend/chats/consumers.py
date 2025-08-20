import os
import json
import deepl
import traceback
from loguru import logger
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async
from users.models import UserProfile
from chats.models import ChatMessage
import datetime
from cryptography.fernet import Fernet

FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    raise ValueError("FERNET_KEY environment variable not set")

fernet = Fernet(FERNET_KEY.encode())

logger.add("logs/chat_consumer.log", rotation="500 MB", level="INFO")

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        self.user = self.scope["user"]

        logger.info(f"New connection attempt - Room: {self.room_name}, User: {self.user}")
        if isinstance(self.user, AnonymousUser):
            logger.warning("User is anonymous in WebSocket connection")
        else:
            logger.info(f"User authenticated: {self.user.email}")
        
        try:
            api_key = os.getenv("DEEPL_API_KEY")
            if not api_key:
                raise ValueError("DEEPL_API_KEY environment variable not set")
            self.translator = deepl.Translator(api_key)
        except Exception as e:
            self.translator = None
            logger.error(f"DeepL translator initialization failed: {e}. Translation will be disabled.")
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        messages = await self.get_past_messages(self.room_name)
        logger.info(f"Retrieved {len(messages)} past messages for room {self.room_name}")
        
        for msg in messages:
            message_data = await self.get_message_data(msg)
            await self.send(text_data=json.dumps(message_data))

    async def disconnect(self, close_code):
        logger.info(f"Disconnected from room {self.room_name} with code {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        logger.debug(f"Received message of type: {msg_type}")
        
        if msg_type == "chat":
            await self.handle_chat_message(data)
        elif msg_type == "translate":
            await self.handle_translation_request(data)

    async def handle_chat_message(self, data):
        message = data.get("message", "")
        user_email = self.user.email if not isinstance(self.user, AnonymousUser) else "anonymous"
        
        logger.info(f"Processing chat message from {user_email} in room {self.room_name}")
        
        await self.save_message(self.room_name, self.user, message, None, None)
        
        message_data = {
            "type": "chat_message",
            "message": message,
            "original": message,
            "language": None,
            "sender": user_email,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                **message_data
            }
        )
        logger.debug(f"Message broadcasted to room {self.room_name}")

    async def handle_translation_request(self, data):
        original = data.get("message", "")
        logger.info("Translation request received")

        try:
            detection_result = self.translator.translate_text(original, target_lang="EN-US")
            source_lang = detection_result.detected_source_lang.upper()

            if source_lang.startswith("EN"):
                target_lang = "DE"
            elif source_lang == "DE":
                target_lang = "EN-US"
            else:
                target_lang = "EN-US"

            logger.info(f"Detected language: {source_lang}, translating to: {target_lang}")
            result = self.translator.translate_text(original, target_lang=target_lang)
            translated = result.text
            logger.info(f"Translation successful: {original} -> {translated}")

        except Exception as e:
            translated = "[Translation Failed]"
            source_lang = "unknown"
            target_lang = "unknown"
            logger.error(f"Translation failed: {str(e)}")
            traceback.print_exc()

        await self.send(text_data=json.dumps({
            "type": "translation_result",
            "message": translated,
            "original": original,
            "language": source_lang,
            "target": target_lang,
            "sender": self.user.email if not isinstance(self.user, AnonymousUser) else "anonymous",
        }))

    async def chat_message(self, event):
        message_data = {k: v for k, v in event.items() if k != 'type'}
        await self.send(text_data=json.dumps(message_data))
        logger.debug("Chat message sent to client")

    @sync_to_async
    def get_message_data(self, msg):
        try:
            decrypted_message = fernet.decrypt(msg.message.encode()).decode()
            user_email = msg.user.email if msg.user else "anonymous"
            return {
                "message": decrypted_message,
                "translated": msg.translated_message,
                "language": msg.language,
                "sender": user_email,
                "timestamp": msg.timestamp.isoformat(),
            }
        except Exception as e:
            logger.error(f"Error decrypting message: {str(e)}")
            return {
                "message": "[Decryption Failed]",
                "translated": msg.translated_message,
                "language": msg.language,
                "sender": "unknown",
                "timestamp": msg.timestamp.isoformat(),
            }

    @sync_to_async
    def save_message(self, room_name, user, original, translated, language):
        user_obj = None
        if not isinstance(user, AnonymousUser):
            user_obj = user

        try:
            encrypted_message = fernet.encrypt(original.encode()).decode()
            ChatMessage.objects.create(
                room_name=room_name,
                user=user_obj,
                message=encrypted_message,
                translated_message=translated,
                language=language
            )
            logger.debug(f"Encrypted message saved for room {room_name}")
        except Exception as e:
            logger.error(f"Failed to save message: {str(e)}")

    @sync_to_async
    def get_past_messages(self, room_name):
        try:
            messages = list(ChatMessage.objects.filter(room_name=room_name).order_by("-timestamp")[:20][::-1])
            logger.debug(f"Retrieved {len(messages)} messages for room {room_name}")
            return messages
        except Exception as e:
            logger.error(f"Error retrieving past messages: {str(e)}")
            return []
