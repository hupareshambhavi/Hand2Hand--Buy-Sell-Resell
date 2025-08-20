from itertools import product
from django.http import Http404
from .models import DeliveryAgent, DeliveryRequest
from ninja.errors import HttpError
from loguru import logger  
from products.database import get_product_by_id
from products.models import Product
from .schemas import DeliveryRequestIn, DeliveryAgentOut, DeliveryAgentSignup, DeliveryAgentLogin, AuthResponse, RefreshTokenRequest
from django.contrib.auth.hashers import make_password, check_password
from datetime import datetime, timedelta
import jwt
from django.conf import settings
from django.db.models import Q

def get_pending_delivery_agent(agent_id: int):
    """
    Fetch a pending delivery agent by ID.
    """
    logger.info(f"Fetching pending delivery agent with ID {agent_id}.")
    try:
        agent = DeliveryAgent.objects.get(agent_id=agent_id, approval_status="pending")
        logger.success(f"Found pending delivery agent with ID {agent_id}.")
        return serialize_delivery_agent(agent)
    except DeliveryAgent.DoesNotExist:
        logger.warning(f"Delivery agent with ID {agent_id} not found or not pending.")
        raise Http404(f"Delivery agent with ID {agent_id} not found or not pending.")
    except Exception as e:
        logger.error(f"Error fetching pending delivery agent {agent_id}: {e}")
        raise Exception(f"Error fetching pending delivery agent: {str(e)}")
    
def get_pending_delivery_agents():
    """
    Fetch all pending delivery agents.
    """
    logger.info("Fetching all pending delivery agents.")
    try:
        agents = [serialize_delivery_agent(agent) for agent in DeliveryAgent.objects.filter(approval_status="pending")]
        logger.success(f"Fetched {len(agents)} pending delivery agents.")
        return agents
    except DeliveryAgent.DoesNotExist:
        logger.warning("No pending delivery agents found.")
        raise Http404("No pending delivery agents found.")
    except Exception as e:
        logger.error(f"Error fetching pending delivery agents: {e}")
        raise Exception(f"Error fetching pending delivery agents: {str(e)}")
    
def approve_agent(agent_id: int):
    """
    Approve a delivery agent by ID.
    """
    logger.info(f"Approving delivery agent with ID {agent_id}.")
    try:
        agent = DeliveryAgent.objects.get(agent_id=agent_id, approval_status="pending")
        agent.approval_status = "approved"
        agent.save()
        logger.success(f"Delivery agent {agent_id} approved.")
        return serialize_delivery_agent(agent)
    except DeliveryAgent.DoesNotExist:
        logger.warning(f"Delivery agent with ID {agent_id} not found or not pending.")
        raise Http404(f"Delivery agent with ID {agent_id} not found or not pending.")
    except Exception as e:
        logger.error(f"Error approving delivery agent {agent_id}: {e}")
        raise Exception(f"Error approving delivery agent: {str(e)}")
    
def reject_agent(agent_id: int):
    """
    Reject a delivery agent by ID.
    """
    logger.info(f"Rejecting delivery agent with ID {agent_id}.")
    try:
        agent = DeliveryAgent.objects.get(agent_id=agent_id)
        if agent.approval_status == "approved":
            logger.warning(f"Delivery agent {agent_id} is already approved.")
            raise HttpError(400, "Delivery agent is already approved.")
        if agent.approval_status == "rejected":
            logger.warning(f"Delivery agent {agent_id} is already rejected.")
            raise HttpError(400, "Delivery agent is already rejected.")
        agent.approval_status = "rejected"
        agent.save()
        logger.success(f"Delivery agent {agent_id} rejected.")
        return serialize_delivery_agent(agent)
    except DeliveryAgent.DoesNotExist:
        logger.warning(f"Delivery agent with ID {agent_id} not found or not pending.")
        raise Http404(f"Delivery agent with ID {agent_id} not found or not pending.")
    except Exception as e:
        logger.error(f"Error rejecting delivery agent {agent_id}: {e}")
        raise Exception(f"Error rejecting delivery agent: {str(e)}")
    

def get_previous_deliveries_for_agent(agent_id: int):
    """
    Fetch previous deliveries for a specific delivery agent.
    """
    logger.info(f"Fetching previous deliveries for agent ID {agent_id}.")
    try:
        deliveries = DeliveryRequest.objects.filter(agent_id=agent_id, status="completed").order_by('-request_date')
        if not deliveries.exists():
            logger.warning(f"No previous deliveries found for agent ID {agent_id}.")
            return []
        logger.success(f"Found {deliveries.count()} previous deliveries for agent ID {agent_id}.")
        return [serialize_delivery_request(delivery) for delivery in deliveries]
    except Exception as e:
        logger.error(f"Error fetching previous deliveries for agent ID {agent_id}: {e}")
        raise Exception(f"Error fetching previous deliveries: {str(e)}")

def get_previous_deliveries_for_user(user_id: int):
    """
    Fetch previous deliveries for a specific user.
    """
    logger.info(f"Fetching previous deliveries for user ID {user_id}.")
    try:
        deliveries = DeliveryRequest.objects.filter(
            buyer_id=user_id,
            status__in=["completed", "pending", "accepted"]
        ).order_by('-request_date')
        if not deliveries.exists():
            logger.warning(f"No previous deliveries found for user ID {user_id}.")
            return []
        logger.success(f"Found {deliveries.count()} previous deliveries for user ID {user_id}.")
        return [serialize_delivery_request(delivery) for delivery in deliveries]
    except Exception as e:
        logger.error(f"Error fetching previous deliveries for user ID {user_id}: {e}")
        raise Exception(f"Error fetching previous deliveries: {str(e)}")


def get_delivery_request_by_id(request_id: int):
    """
    Fetch a delivery request by its ID.
    """
    logger.info(f"Fetching delivery request with ID {request_id}.")
    try:
        request = DeliveryRequest.objects.get(request_id=request_id)
        logger.success(f"Found delivery request with ID {request_id}.")
        return serialize_delivery_request(request)
    except DeliveryRequest.DoesNotExist:
        logger.warning(f"Delivery request with ID {request_id} not found.")
        raise Http404(f"Delivery request with ID {request_id} not found.")
    except Exception as e:
        logger.error(f"Error fetching delivery request {request_id}: {e}")
        raise Exception(f"Error fetching delivery request: {str(e)}")
    
def serialize_delivery_request(request):
    # Get product details using the existing function
    product = None
    if request.product_id:
        try:
            product = get_product_by_id(request.product_id)
        except Exception:
            product = None

    return {
        "request_id": request.request_id,
        "agent_id": request.agent.agent_id if request.agent else None,
        "product_id": request.product_id,
        "product": product, 
        "request_date": request.request_date.isoformat() if request.request_date else None,
        "seller_id": request.seller_id,
        "dropoff_location": request.dropoff_location,
        "pickup_location": request.pickup_location,
        "status": request.status,
        "delivery_fee": str(request.delivery_fee) if request.delivery_fee is not None else None,
        "delivery_rating": request.delivery_rating,
        "delivery_date": request.delivery_date.isoformat() if request.delivery_date else None,
        "buyer_id": request.buyer_id,
        "delivery_mode": request.delivery_mode,
        "delivery_notes": request.delivery_notes,
    }

def serialize_delivery_agent(agent):
    if isinstance(agent.category_ids, str):
        category_ids = [x.strip() for x in agent.category_ids.split(",") if x.strip()]
    else:
        category_ids = [str(x) for x in agent.category_ids] if agent.category_ids else []

    if isinstance(agent.day_of_week, str):
        day_of_week = [agent.day_of_week]
    else:
        day_of_week = [str(x) for x in agent.day_of_week] if agent.day_of_week else []

    if isinstance(agent.time_slot, int):
        time_slot = [[agent.time_slot]]
    elif isinstance(agent.time_slot, str):
        time_slot = [[int(x)] for x in agent.time_slot.split(",") if x.strip()]
    elif isinstance(agent.time_slot, list):
        if all(isinstance(x, int) for x in agent.time_slot):
            time_slot = [[x] for x in agent.time_slot]
        else:
            time_slot = agent.time_slot
    else:
        time_slot = []

    # Convert joined_date to string
    joined_date = (
        agent.joined_date.isoformat()
        if hasattr(agent.joined_date, "isoformat")
        else str(agent.joined_date)
        if agent.joined_date
        else None
    )

    return {
        "agent_id": agent.agent_id,
        "first_name": agent.first_name,
        "last_name": agent.last_name,
        "category_ids": category_ids,
        "email": agent.email,
        "phone_number": agent.phone_number,
        "transport_mode": agent.transport_mode,
        "reviews": agent.reviews,
        "deliveries_completed": agent.deliveries_completed,
        "identity_img_url": agent.identity_img_url,
        "day_of_week": day_of_week,
        "time_slot": time_slot,
        "joined_date": joined_date,
        "user_type": "delivery_agent",
    }

def get_pending_requests_for_agent(agent_id: int):
    """
    Fetch delivery requests that are pending and either unassigned (agent is null)
    or assigned to a non-approved agent.
    """
    logger.info(f"Fetching pending delivery requests for agent ID {agent_id}.")
    try:
        # Ensure requesting agent is approved
        agent = DeliveryAgent.objects.get(agent_id=agent_id, approval_status="approved")

        # Get all pending requests that are either:
        # - Not assigned to any agent (agent is null)
        # - Assigned to agents who are not approved
        requests = DeliveryRequest.objects.filter(
            status="pending"
        ).filter(Q(agent=None) | ~Q(agent__approval_status="approved"))

        return [serialize_delivery_request(req) for req in requests]

    except DeliveryAgent.DoesNotExist:
        raise Http404("Approved delivery agent not found.")


def accept_delivery_request(request_id: int, agent_id: int):
    """
    Assigns the delivery request to an agent and marks it as accepted.
    """
    logger.info(f"Agent {agent_id} accepting delivery request {request_id}.")
    try:
        delivery_request = DeliveryRequest.objects.get(request_id=request_id)
        if delivery_request.status != "pending" or delivery_request.agent_id is not None:
            raise HttpError(400, "Request is already assigned or not pending.")
        agent = DeliveryAgent.objects.get(agent_id=agent_id, approval_status="approved")
        delivery_request.agent = agent
        delivery_request.status = "accepted"
        delivery_request.save()
        logger.success(f"Request {request_id} assigned to agent {agent_id}.")
        return serialize_delivery_request(delivery_request)
    except DeliveryRequest.DoesNotExist:
        raise Http404(f"Delivery request {request_id} not found.")
    except DeliveryAgent.DoesNotExist:
        raise Http404(f"Delivery agent {agent_id} not found.")
    except Exception as e:
        logger.error(f"Error accepting delivery request {request_id}: {e}")
        raise Exception(f"Failed to accept delivery request: {str(e)}")

def get_accepted_requests_for_agent(agent_id: int):
    """
    Fetch delivery requests that were accepted or completed by a specific delivery agent.
    """
    logger.info(f"Fetching accepted or completed deliveries for agent ID {agent_id}.")
    try:
        deliveries = DeliveryRequest.objects.filter(
            agent_id=agent_id,
            status__in=["accepted", "completed"]
        ).order_by('-request_date')
        
        if not deliveries.exists():
            logger.warning(f"No accepted or completed deliveries found for agent ID {agent_id}.")
            return []
        
        logger.success(f"Found {deliveries.count()} accepted or completed deliveries for agent ID {agent_id}.")
        return [serialize_delivery_request(delivery) for delivery in deliveries]
    except Exception as e:
        logger.error(f"Error fetching deliveries for agent ID {agent_id}: {e}")
        raise Exception(f"Error fetching deliveries: {str(e)}")

ALLOWED_STATUSES = {
    "pending",
    "accepted",
    "out_for_delivery",
    "on_the_way",
    "delivered"
}

def update_delivery_status(request_id: int, status: str):
    """
    Updates the delivery status for a given request.
    """
    status = status.replace(" ", "_").lower()

    logger.info(f"Updating delivery status for request {request_id} to {status}.")

    if status not in ALLOWED_STATUSES:
        raise HttpError(400, f"Invalid status. Allowed values: {list(ALLOWED_STATUSES)}")

    if status == "delivered":
        status = "completed"  # ✅ Normalize to internal status

    try:
        request = DeliveryRequest.objects.get(request_id=request_id)
        if request.status == "completed":
            raise HttpError(400, "Delivery already marked as completed.")
        request.status = status
        request.save()
        logger.success(f"Delivery status updated to {status} for request {request_id}.")
        return serialize_delivery_request(request)
    except DeliveryRequest.DoesNotExist:
        raise Http404(f"Request {request_id} not found.")
    except Exception as e:
        logger.error(f"Error updating delivery status: {e}")
        raise Exception(f"Failed to update delivery status: {str(e)}")


def create_delivery_request(delivery_request: DeliveryRequestIn):
    """
    Create a new delivery request.
    """
    logger.info("Creating a new delivery request.")
    product = Product.objects.get(product_id=delivery_request.product_id)
    seller_id = product.seller_id
    try:
        new_request = DeliveryRequest.objects.create(
            product_id=delivery_request.product_id,
            seller_id=seller_id,
            dropoff_location=delivery_request.dropoff_location,
            pickup_location=delivery_request.pickup_location,
            status="pending",
            delivery_fee=delivery_request.delivery_fee,
            delivery_mode=delivery_request.delivery_mode,
            delivery_notes=delivery_request.delivery_notes,
            buyer_id=delivery_request.buyer_id,
            delivery_date=delivery_request.delivery_date_time,
        )
        logger.success(f"Delivery request {new_request.request_id} created successfully.")
        return serialize_delivery_request(new_request)
    except Exception as e:
        logger.error(f"Error creating delivery request: {e}")
        raise Exception(f"Failed to create delivery request: {str(e)}")

def create_delivery_agent(agent_data: DeliveryAgentSignup):
    """
    Create a new delivery agent account with hashed password.
    """
    logger.info("Creating new delivery agent account.")
    try:
        # Check if email already exists
        if DeliveryAgent.objects.filter(email=agent_data.email).exists():
            raise HttpError(400, "Email already registered")

        # Check if phone number already exists
        if DeliveryAgent.objects.filter(phone_number=agent_data.phone_number).exists():
            raise HttpError(400, "Phone number already registered")

        # Hash the password
        hashed_password = make_password(agent_data.password)

        # Create new delivery agent
        new_agent = DeliveryAgent.objects.create(
            first_name=agent_data.first_name,
            last_name=agent_data.last_name,
            email=agent_data.email,
            password=hashed_password,
            phone_number=agent_data.phone_number,
            transport_mode=agent_data.transport_mode,
            category_ids=agent_data.category_ids,
            identity_img_url=agent_data.identity_img_url,
            day_of_week=agent_data.day_of_week,
            time_slot=agent_data.time_slot,
            joined_date=datetime.now().strftime("%Y-%m-%d"),
            approval_status="pending"
        )
        
        logger.success(f"Delivery agent account created successfully with ID {new_agent.agent_id}")
        return serialize_delivery_agent(new_agent)
    except HttpError:
        raise
    except Exception as e:
        logger.error(f"Error creating delivery agent account: {e}")
        raise Exception(f"Failed to create delivery agent account: {str(e)}")

def generate_tokens(agent: DeliveryAgent) -> tuple[str, str]:
    """
    Generate both access and refresh tokens for the agent.
    """
    # Access token expires in 30 minutes
    access_payload = {
        'agent_id': agent.agent_id,
        'email': agent.email,
        'first_name': agent.first_name,
        'last_name': agent.last_name,
        'exp': datetime.utcnow() + timedelta(minutes=30),
        'type': 'access',
        'user_type':'delivery_agent'
    }
    
    # Refresh token expires in 7 days
    refresh_payload = {
        'agent_id': agent.agent_id,
        'email': agent.email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'type': 'refresh'
    }
    
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    
    return access_token, refresh_token

def refresh_access_token(refresh_data: RefreshTokenRequest) -> AuthResponse:
    """
    Generate a new access token using a valid refresh token.
    """
    try:
        # Verify the refresh token
        payload = jwt.decode(refresh_data.refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Check if it's a refresh token
        if payload.get('type') != 'refresh':
            raise HttpError(401, "Invalid token type")
        
        # Get the agent
        agent = DeliveryAgent.objects.get(agent_id=payload['agent_id'])
        
        # Check if agent is approved
        if agent.approval_status != 'approved':
            raise HttpError(403, "Account is not approved")
        
        # Generate new tokens
        access_token, refresh_token = generate_tokens(agent)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            agent_id=agent.agent_id,
            first_name=agent.first_name,
            last_name=agent.last_name,
            email=agent.email,
            approval_status=agent.approval_status,
            user_type="delivery_agent"
        )
        
    except jwt.ExpiredSignatureError:
        raise HttpError(401, "Refresh token has expired")
    except jwt.InvalidTokenError:
        raise HttpError(401, "Invalid refresh token")
    except DeliveryAgent.DoesNotExist:
        raise HttpError(401, "Delivery agent not found")
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HttpError(500, f"Failed to refresh token: {str(e)}")

def login_delivery_agent(login_data: DeliveryAgentLogin) -> AuthResponse:
    """
    Authenticate a delivery agent and return access and refresh tokens.
    """
    logger.info(f"Attempting login for email: {login_data.email}")
    try:
        # Find the agent by email
        agent = DeliveryAgent.objects.get(email=login_data.email)

        # Verify password
        if not check_password(login_data.password, agent.password):
            raise HttpError(401, "Invalid credentials")
        if agent.approval_status != 'approved':
            raise HttpError(401, "Delivery Agent Account is not approved yet. Please wait for approval.")
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(agent)
        
        return AuthResponse(
            token=access_token,
            refresh_token=refresh_token,
            user_id=agent.agent_id,
            first_name=agent.first_name,
            last_name=agent.last_name,
            email=agent.email,
            approval_status=agent.approval_status,
            user_type="delivery_agent"
        )

    except DeliveryAgent.DoesNotExist:
        raise HttpError(401, "Invalid credentials")
    except Exception as e:
        logger.error(f"Login error for email {login_data.email}: {e}")
        raise HttpError(500, f"Login failed: {str(e)}")
    
def serialize_delivery_brief(request):
    return {
        "pickup_location": request.pickup_location,
        "dropoff_location": request.dropoff_location,
        "delivery_date": request.delivery_date.isoformat() if request.delivery_date else None,
        "delivery_time": request.delivery_date.time().isoformat() if request.delivery_date else None,
    }

def get_delivery_brief_by_id(request_id: int):
    """
    Return brief delivery info: pickup, dropoff, date, and time.
    """
    logger.info(f"Fetching delivery brief for request ID {request_id}")
    try:
        request = DeliveryRequest.objects.get(request_id=request_id)
        return serialize_delivery_brief(request)
    except DeliveryRequest.DoesNotExist:
        logger.warning(f"Delivery request {request_id} not found.")
        raise Http404(f"Delivery request {request_id} not found.")
    except Exception as e:
        logger.error(f"Error fetching delivery brief: {e}")
        raise Exception(f"Failed to fetch delivery brief: {str(e)}")

def get_current_status(request_id: int) -> str:
    """
    Returns the current delivery status for a given request ID.
    """
    try:
        request = DeliveryRequest.objects.get(request_id=request_id)
        return request.status
    except DeliveryRequest.DoesNotExist:
        raise Http404(f"Request {request_id} not found.")