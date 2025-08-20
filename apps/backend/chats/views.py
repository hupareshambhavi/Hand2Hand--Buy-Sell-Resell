# chats/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from users.models import UserProfile
from products.models import Product
from .models import ChatMessage
import json
import os
from cryptography.fernet import Fernet

# ---- Encryption helpers (match consumers.py) --------------------------------
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    # If you prefer to hard-fail on missing key, raise here.
    # raise ValueError("FERNET_KEY environment variable not set")
    fernet = None
else:
    fernet = Fernet(FERNET_KEY.encode())

def decrypt_text(token: str) -> str:
    """Decrypt a Fernet token to plain text; return a safe placeholder on failure."""
    if not token:
        return ""
    if fernet is None:
        return "[Decryption Failed]"
    try:
        return fernet.decrypt(token.encode()).decode()
    except Exception:
        return "[Decryption Failed]"

# -----------------------------------------------------------------------------

@require_http_methods(["GET"])
def get_user_chat_rooms(request, user_id):
    """
    Get all chat rooms for a specific user with the latest (decrypted) message
    Room format assumed: product_{product_id}_{smaller_user_id}_{larger_user_id}
    """
    try:
        user = UserProfile.objects.get(user_id=user_id)

        # Find rooms that include this user id based on naming convention
        rooms_as_seller = ChatMessage.objects.filter(
            room_name__contains=f"_{user_id}_"
        ).values('room_name').distinct()

        rooms_as_buyer = ChatMessage.objects.filter(
            room_name__endswith=f"_{user_id}"
        ).values('room_name').distinct()

        # Unique room names
        all_rooms = {r['room_name'] for r in rooms_as_seller} | {r['room_name'] for r in rooms_as_buyer}

        chat_rooms = []

        for room_name in all_rooms:
            latest_message = ChatMessage.objects.filter(
                room_name=room_name
            ).order_by('-timestamp').first()

            if not latest_message:
                continue

            # Parse room name to extract product/user ids
            # product_{product_id}_{smaller_user_id}_{larger_user_id}
            parts = room_name.split('_')
            if len(parts) < 4:
                continue

            try:
                product_id = int(parts[1])
                user1_id = int(parts[2])
                user2_id = int(parts[3])
            except ValueError:
                continue

            # Determine the "other" participant
            other_user_id = user1_id if user2_id == user_id else user2_id
            try:
                other_user = UserProfile.objects.get(user_id=other_user_id)
            except UserProfile.DoesNotExist:
                # If other user not found, still return the room but with placeholders
                other_user = None

            # Get product info
            try:
                product = Product.objects.get(product_id=product_id)
                product_name = product.name
            except Product.DoesNotExist:
                product = None
                product_name = "Product not found"

            # Decrypt the latest message for display
            last_message_plain = decrypt_text(latest_message.message)

            # Count "unread" as messages sent by the other user after the latest message timestamp? (Your original logic)
            # Keeping your count logic intact; adjust if you track read markers separately.
            unread_count = ChatMessage.objects.filter(
                room_name=room_name,
                user=other_user if other_user else None,
                timestamp__gt=latest_message.timestamp
            ).count()

            chat_rooms.append({
                'room_name': room_name,
                'last_message': last_message_plain,                 # decrypted
                'last_message_time': latest_message.timestamp.isoformat(),
                'other_user_email': other_user.email if other_user else 'unknown',
                'other_user_name': (other_user.first_name + ' ' + other_user.last_name) if other_user else 'Unknown',
                'product_name': product_name,
                'product_id': str(product_id),
                'unread_count': unread_count
            })

        # Sort by latest message time desc
        chat_rooms.sort(key=lambda x: x['last_message_time'], reverse=True)

        return JsonResponse(chat_rooms, safe=False)

    except UserProfile.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_chat_messages(request, room_name):
    """
    Get all messages for a specific chat room
    (messages are decrypted before returning)
    """
    try:
        messages = ChatMessage.objects.filter(
            room_name=room_name
        ).order_by('timestamp')

        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg.id,
                'message': decrypt_text(msg.message),              # decrypted
                'translated_message': msg.translated_message,      # (encrypt if you store encrypted)
                'language': msg.language,
                'sender': msg.user.email if msg.user else 'anonymous',
                'timestamp': msg.timestamp.isoformat(),
                'room_name': msg.room_name
            })

        return JsonResponse(message_list, safe=False)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_chat_room(request):
    """
    Create or get existing chat room between two users for a product
    """
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')
        user1_id = data.get('user1_id')  # Usually the buyer
        user2_id = data.get('user2_id')  # Usually the seller

        if not all([product_id, user1_id, user2_id]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        # Ensure users & product exist
        try:
            user1 = UserProfile.objects.get(user_id=user1_id)
            user2 = UserProfile.objects.get(user_id=user2_id)
            product = Product.objects.get(product_id=product_id)
        except (UserProfile.DoesNotExist, Product.DoesNotExist):
            return JsonResponse({'error': 'User or product not found'}, status=404)

        # Consistent room naming
        sorted_user_ids = sorted([user1_id, user2_id])
        room_name = f"product_{product_id}_{sorted_user_ids[0]}_{sorted_user_ids[1]}"

        existing_messages = ChatMessage.objects.filter(room_name=room_name).exists()

        response_data = {
            'room_name': room_name,
            'product_id': product_id,
            'product_name': product.name,
            'user1_email': user1.email,
            'user2_email': user2.email,
            'is_new_room': not existing_messages
        }

        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_user_active_chats_count(request, user_id):
    """
    Get count of active chats for a user (for notification purposes)
    """
    try:
        # Ensure user exists
        UserProfile.objects.get(user_id=user_id)

        rooms_as_participant = ChatMessage.objects.filter(
            Q(room_name__contains=f"_{user_id}_") | Q(room_name__endswith=f"_{user_id}")
        ).values('room_name').distinct().count()

        return JsonResponse({'active_chats_count': rooms_as_participant})

    except UserProfile.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
