"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""
import os
import django
"""
ASGI config for backend project with WebSocket support via Channels.
"""
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()  # <-- Add this line

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from chats.routing import websocket_urlpatterns  # import after setup
from loguru import logger
from users.models import UserProfile
from django.conf import settings
from asgiref.sync import sync_to_async

User = get_user_model()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the token from query parameters
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        logger.info(f"WebSocket connection attempt with token: {token[:20] if token else 'None'}...")

        if token:
            try:
                # Verify the token and get the user
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                logger.info(f"Token decoded successfully. User ID: {user_id}")
                
                # Get the UserProfile asynchronously
                user = await self.get_user_profile(user_id)
                if user:
                    logger.info(f"User authenticated successfully: {user.email}")
                    scope['user'] = user
                else:
                    logger.warning(f"UserProfile not found for ID: {user_id}")
                    scope['user'] = AnonymousUser()
                
            except Exception as e:
                logger.error(f"Token authentication failed: {str(e)}")
                scope['user'] = AnonymousUser()
        else:
            logger.warning("No token provided in WebSocket connection")
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @sync_to_async
    def get_user_profile(self, user_id):
        try:
            return UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return None

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})