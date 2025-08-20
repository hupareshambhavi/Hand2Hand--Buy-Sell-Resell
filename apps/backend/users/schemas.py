from ninja import Schema # type: ignore
from typing import List, Optional
from datetime import date
from products.schemas import ProductOut  # Assuming Products schema is defined in products.schemas
class AddressIn(Schema):
    street: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    postal_code: str

class UserSignupIn(Schema):
    first_name: str
    last_name: str
    email: str
    user_type: str
    password: str
    confirm_password: str
    badge: Optional[str] = ""
    sell_count: Optional[int] = 0
    buy_count: Optional[int] = 0
    joined_date: date
    profile_pic_url: Optional[str] = ""
    address: AddressIn
    role_id: int

class UserLoginIn(Schema):
    email: str
    password: str

# Reuse AddressIn for output
AddressOut = AddressIn

class UserOut(Schema):
    user_id:        int
    first_name:     str
    last_name:      str
    email:          str
    user_type:      str
    badge:          Optional[str]
    sell_count:     int
    buy_count:      int
    joined_date:    date
    profile_pic_url: Optional[str]
    role_name:      Optional[str]
    address:        Optional[AddressOut]   # ← now an object
    token:          Optional[str] = None
    refresh_token:  Optional[str] = None
    twofa_required: Optional[bool] = False  #Checks if 2FA is enabled for the user

class UserIn(Schema):
    first_name: str = None
    last_name: str = None
    email: str = None
    badge: Optional[str] = None
    sell_count: Optional[int] = None
    buy_count: Optional[int] = None
    profile_pic_url: Optional[str] = None
    address: Optional[AddressIn] = None

class FavouritesOut(Schema):
    user_id: int
    products: Optional[List[ProductOut]]

class FavouritesIn(Schema):
    user_id: int
    product_id: str

class RejectReasonIn(Schema):
    reason: str


class ModeratorIn(Schema):
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    email: Optional[str] = ""
    password: Optional[str] = None

class ModeratorOut(Schema):
    moderator_id: int
    first_name: str
    last_name: str
    email: str

class TokenRefreshIn(Schema):
    refresh_token: str

class TwoFASetupOut(Schema):
    provisioning_uri: str

class TwoFAVerifyIn(Schema):
    user_id: int
    code: str

class TwoFAStatusOut(Schema):
    enabled: bool

class TwoFARequiredOut(Schema):
    user_id: int
    twofa_required: bool