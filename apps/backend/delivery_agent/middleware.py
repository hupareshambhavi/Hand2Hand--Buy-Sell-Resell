from django.http import JsonResponse
from ninja.errors import HttpError
from loguru import logger
from functools import lru_cache
import jwt
import time
from django.conf import settings
from .models import DeliveryAgent
from typing import Callable
from django.http import HttpRequest, HttpResponse
from django.middleware.csrf import get_token, CsrfViewMiddleware
from django.utils.deprecation import MiddlewareMixin
# from functools import lru_cache

class DeliveryAgentAuthMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response
        # List of paths that don't require CSRF token (GET requests are exempt by default)
        self.csrf_exempt_paths = [
            '/api/delivery-agent/signup',
            '/api/delivery-agent/login',
            '/api/delivery-agent/csrf-token'
        ]
        # HTTP methods that don't require authentication
        self.public_methods = ['OPTIONS']

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Check if the request is for delivery agent API
        if not request.path.startswith('/api/delivery-agent'):
            return self.get_response(request)

        # Allow access to public methods (like OPTIONS for CORS)
        if request.method in self.public_methods:
            return self.get_response(request)

        # Allow access to public paths
        if request.path in self.csrf_exempt_paths:
            return self.get_response(request)

        # CSRF validation for non-GET requests (except exempt paths and OPTIONS)
        # GET requests are typically exempt from CSRF protection as they should be safe operations
        if request.method not in ['GET', 'OPTIONS'] and request.path not in self.csrf_exempt_paths:
            csrf_token = request.headers.get('X-CSRFToken') or request.POST.get('csrfmiddlewaretoken')
            if not csrf_token:
                return JsonResponse(
                    {'error': 'CSRF token missing'}, 
                    status=403
                )
            
            # Validate CSRF token using Django's built-in validation
            csrf_middleware = CsrfViewMiddleware(self.get_response)
            try:
                csrf_middleware.process_request(request)
                csrf_middleware.process_view(request, None, (), {})
            except Exception as e:
                return JsonResponse(
                    {'error': 'CSRF token validation failed'}, 
                    status=403
                )

        # Get the authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse(
                {'error': 'Authentication required'}, 
                status=401
            )

        try:
            # Extract and verify the token
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            # Proactive token expiry check
            if payload.get('exp') and payload['exp'] - time.time() < 300:  # 5 minutes
                logger.warning(f"Token for agent {payload['agent_id']} expires soon")
            
            # Get the agent from database (with caching)
            agent = self.get_agent_by_id(payload['agent_id'])
            
            # Check if agent is approved
            if agent.approval_status != 'approved':
                return JsonResponse(
                    {'error': 'Account is not approved'}, 
                    status=403
                )
            
            # Add agent to request for use in views
            request.delivery_agent = agent
            
            return self.get_response(request)

        except jwt.ExpiredSignatureError:
            return JsonResponse(
                {'error': 'Token has expired'}, 
                status=401
            )
        except jwt.InvalidTokenError:
            return JsonResponse(
                {'error': 'Invalid token'}, 
                status=401
            )
        except DeliveryAgent.DoesNotExist:
            return JsonResponse(
                {'error': 'Delivery agent not found'}, 
                status=401
            )
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return JsonResponse(
                {'error': 'Authentication failed'}, 
                status=500
            )

    # @lru_cache(maxsize=10)
    def get_agent_by_id(self, agent_id):
        """Cache frequently accessed delivery agents"""
        return DeliveryAgent.objects.get(agent_id=agent_id)