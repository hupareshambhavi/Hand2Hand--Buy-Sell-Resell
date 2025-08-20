from django.urls import re_path
from .consumers import ChatConsumer
from channels.routing import ProtocolTypeRouter, URLRouter

# Define websocket URL patterns
websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_name>\w+)/?$", ChatConsumer.as_asgi()),
]

# Application routing configuration
application = ProtocolTypeRouter({
    'websocket': URLRouter(websocket_urlpatterns),
})