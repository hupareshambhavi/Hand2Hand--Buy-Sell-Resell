from ninja import Schema
from typing import List, Optional
from products.schemas import ProductOut
from datetime import datetime

class DeliveryAgentOut(Schema):
    agent_id: int
    first_name: str
    last_name: str
    category_ids: list[str]
    email: str
    phone_number: str
    transport_mode: str
    reviews: List[dict]
    deliveries_completed: int
    identity_img_url: Optional[str]
    day_of_week: List[str]
    time_slot: List[List[int]]
    joined_date: str

class DeliveryRequestOut(Schema):
    request_id: int
    agent_id: Optional[int] = None  # Agent ID if assigned
    product: ProductOut = None 
    request_date: str
    seller_id: int
    dropoff_location: str
    pickup_location: str
    status: str
    delivery_fee: Optional[float] = None
    delivery_rating: Optional[int] = None
    delivery_date: Optional[datetime] = None
    buyer_id: int

class DeliveryRequestIn(Schema):
    product_id: int
    dropoff_location: str
    pickup_location: str
    delivery_fee: Optional[float] = None
    delivery_date_time: Optional[datetime] = None
    buyer_id: int
    delivery_notes: Optional[str] = None
    delivery_mode: Optional[str] = "standard"  # Default to "standard" if not provided

class DeliveryAgentSignup(Schema):
    first_name: str
    last_name: str
    email: str
    password: str
    phone_number: str
    transport_mode: str
    category_ids: list[str]
    identity_img_url: Optional[str] = None
    day_of_week: List[str]
    time_slot: List[List[int]]

class DeliveryAgentLogin(Schema):
    email: str
    password: str

class AuthResponse(Schema):
    token: str
    refresh_token: str
    user_id: int
    first_name: str
    last_name: str
    email: str
    approval_status: str
    user_type: str

class RefreshTokenRequest(Schema):
    refresh_token: str

class DeliveryDetailsOut(Schema):
    pickup_location: str
    dropoff_location: str
    delivery_date: Optional[str]  # formatted as "YYYY-MM-DD"
    delivery_time: Optional[str]  # formatted as "HH:MM:SS"

class DeliveryAgentStats(Schema):
    pending_requests: int
    accepted_deliveries: int
    completed_deliveries: int
    total_earnings: float