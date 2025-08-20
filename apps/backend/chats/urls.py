# chats/urls.py
from django.urls import path
from . import views

# main urls.py
from django.urls import path, include

urlpatterns = [
    # Get all chat rooms for a user
    path('rooms/<int:user_id>/', views.get_user_chat_rooms, name='get_user_chat_rooms'),
    
    # Get messages for a specific room
    path('messages/<str:room_name>/', views.get_chat_messages, name='get_chat_messages'),
    
    # Create or get chat room
    path('room/create/', views.create_chat_room, name='create_chat_room'),
    
    # Get active chats count for notifications
    path('count/<int:user_id>/', views.get_user_active_chats_count, name='get_user_active_chats_count'),

]

