from ninja import Router 
from ninja.errors import HttpError 
from typing import Union
from .schemas import UserSignupIn, UserLoginIn, UserOut, FavouritesOut, FavouritesIn, UserIn, AddressOut, TokenRefreshIn, TwoFASetupOut, TwoFAVerifyIn, TwoFAStatusOut, TwoFARequiredOut
from .database import create_user_entry, validate_user_login, add_product_to_favourites, get_user_favourites, remove_product_from_favourites
from django.http import Http404 , JsonResponse
from loguru import logger
from .models import UserProfile, Address
from delivery_agent.database import get_previous_deliveries_for_user, get_delivery_request_by_id
from delivery_agent.schemas import DeliveryRequestOut
from products.schemas import ProductOut
from products.database import get_user_listings
from .schemas import UserIn, UserOut, AddressIn  # import AddressIn/Out
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken # type: ignore
from rest_framework_simplejwt.exceptions import TokenError # type: ignore
import pyotp
from django.conf import settings

user_router = Router()

@user_router.post("/signup", response={201: UserOut, 400: str}, tags=["Authentication"])
def user_signup(request, data: UserSignupIn):
    try:
        if data.password != data.confirm_password:
            raise HttpError(400, "Passwords do not match")
        user = create_user_entry(data)
        
        # Generate both access and refresh tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Create AddressOut object from user's address
        address_out = None
        if user.address:
            address_out = AddressOut(
                street=user.address.street,
                city=user.address.city,
                state=user.address.state,
                postal_code=user.address.postal_code
            )
            
        return 201, UserOut(
            user_id=user.user_id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            user_type=user.user_type,
            badge=user.badge,
            sell_count=user.sell_count,
            buy_count=user.buy_count,
            joined_date=user.joined_date,
            profile_pic_url=user.profile_pic_url,
            role_name=user.role.role_name if user.role else None,
            address=address_out,
            token=access_token,
            refresh_token=refresh_token
        )
    except Exception as e:
        raise HttpError(400, str(e))

@user_router.post("/login", response={200: UserOut, 400: str, 404: str}, tags=["Authentication"])
def user_login(request, data: UserLoginIn):
    try:
        user = validate_user_login(data)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Create AddressOut object from user's address
        address_out = None
        if user.address:
            address_out = AddressOut(
                street=user.address.street,
                city=user.address.city,
                state=user.address.state,
                postal_code=user.address.postal_code
            )
            
        return 200, UserOut(
            user_id=user.user_id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            user_type=user.user_type,
            badge=user.badge,
            sell_count=user.sell_count,
            buy_count=user.buy_count,
            joined_date=user.joined_date,
            profile_pic_url=user.profile_pic_url,
            role_name=user.role.role_name if user.role else None,
            address=address_out,
            token=access_token,
            refresh_token=refresh_token,
            twofa_required=user.totp_secret is not None  #This is to check if 2FA is enabled by the user or not
        )
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        raise HttpError(400, str(e))

@user_router.post("/token/refresh", response={200: dict, 400: str}, tags=["Authentication"])
def refresh_token(request, data: TokenRefreshIn):
    try:
        refresh = RefreshToken(data.refresh_token)
        access_token = str(refresh.access_token)
        new_refresh_token = str(refresh)
        
        return 200, {
            "access_token": access_token,
            "refresh_token": new_refresh_token
        }
    except TokenError as e:
        raise HttpError(400, "Invalid or expired refresh token")
    except Exception as e:
        raise HttpError(400, str(e))

@user_router.post("/favourites", tags=["User"])
def add_favourite(request, data: FavouritesIn):
    try:
        logger.info(f"Adding product {data.product_id} to favourites for user {data.user_id}")
        user = add_product_to_favourites(data.user_id, data.product_id)
        return JsonResponse({"message": "Product added to favourites successfully"}, status=201)
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        raise HttpError(400, str(e))
    
@user_router.get("/favourites/{user_id}", response=FavouritesOut, tags=["User"])
def get_favourites(request, user_id: int):
    try:
        return get_user_favourites(user_id)
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        raise HttpError(400, str(e))
    
@user_router.delete("/favourites/{user_id}/{product_id}", response={204: None, 404: str}, tags=["User"])
def remove_favourite(request, user_id: int, product_id: str):
    try:
        logger.info(f"Removing product {product_id} from favourites for user {user_id}")
        user = remove_product_from_favourites(user_id, product_id)
        return JsonResponse({"message": "Product removed from favourites successfully"}, status=200)
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        raise HttpError(400, str(e))
    
@user_router.get("/{user_id}", response=list[DeliveryRequestOut], tags=["User"])
def get_users_previous_deliveries(request, user_id: int):
    """
    API endpoint to fetch user details by user ID.
    """
    try:
        user = UserProfile.objects.get(user_id=user_id)
        return get_previous_deliveries_for_user(user_id)
    except UserProfile.DoesNotExist:
        raise HttpError(404, f"User with ID {user_id} not found.")
    except Exception as e:
        logger.error(f"Error fetching user details for ID {user_id}: {e}")
        raise HttpError(500, f"An error occurred while fetching user details: {str(e)}")


@user_router.get("/orders/{request_id}", response=DeliveryRequestOut, tags=["User"])
def get_order_details(request, request_id: int):
    """
    API endpoint to fetch order details for a specific user.
    """
    try:
        deliveries = get_delivery_request_by_id(request_id)
        if not deliveries:
            raise HttpError(404, f"No deliveries found for request ID {request_id}.")
        return deliveries
    except Exception as e:
        logger.error(f"Error fetching order details for request ID {request_id}: {e}")
        raise HttpError(500, f"An error occurred while fetching order details: {str(e)}")

@user_router.get("/my-listings/{user_id}", response=list[ProductOut], tags=["User-Listings"])
def my_listings(request, user_id: int):
    try:
        listings = get_user_listings(user_id)
        logger.info(f"Fetched {len(listings)} listings for user_id={user_id}")
        return list(listings)
    except Exception as e:
        logger.error(f"Error fetching listings for user_id={user_id}: {e}")
        raise HttpError(500, "Failed to fetch listings: {str(e)}")
    
@user_router.put("/edit/{user_id}", response={200: UserOut, 404: str}, tags=["User"])
def edit_user_profile(request, user_id: int, data: UserIn):
    try:
        user = UserProfile.objects.get(user_id=user_id)

        # Update fields…
        if data.address:
            addr_data = data.address.dict(exclude_unset=True)
            if user.address:
                for k, v in addr_data.items():
                    setattr(user.address, k, v)
                user.address.save()
            else:
                user.address = Address.objects.create(**addr_data)

        for field, value in data.dict(exclude_unset=True, exclude={"address"}).items():
            setattr(user, field, value)
        user.save()

        # Build nested address dict
        address_obj = None
        if user.address:
            address_obj = AddressIn(
                street=user.address.street,
                city=user.address.city,
                state=user.address.state,
                postal_code=user.address.postal_code
            )

        return 200, UserOut(
            user_id=user.user_id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            user_type=user.user_type,
            badge=user.badge,
            sell_count=user.sell_count,
            buy_count=user.buy_count,
            joined_date=user.joined_date,
            profile_pic_url=user.profile_pic_url,
            role_name=user.role.role_name if user.role else None,
            address=address_obj,           # ← now an object
            token=None
        )

    except UserProfile.DoesNotExist:
        raise HttpError(404, f"User with ID {user_id} not found")
    except Exception as e:
        raise HttpError(400, str(e))

@user_router.get("/edit/{user_id}", response={200: UserOut, 404: str}, tags=["User"])
def get_user_profile(request, user_id: int):
    try:
        user = UserProfile.objects.get(user_id=user_id)

        address_obj = None
        if user.address:
            address_obj = AddressIn(
                street=user.address.street,
                city=user.address.city,
                state=user.address.state,
                postal_code=user.address.postal_code
            )

        return 200, UserOut(
            user_id=user.user_id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            user_type=user.user_type,
            badge=user.badge,
            sell_count=user.sell_count,
            buy_count=user.buy_count,
            joined_date=user.joined_date,
            profile_pic_url=user.profile_pic_url,
            role_name=user.role.role_name if user.role else None,
            address=address_obj,
            token=None,
            twofa_required=user.totp_secret is not None
        )
    except UserProfile.DoesNotExist:
        raise HttpError(404, f"User with ID {user_id} not found")

@user_router.post("/2fa/setup", response={200: TwoFASetupOut, 404: str, 400: str}, tags=["2FA"])
def setup_2fa(request, user_id: int):
    try:
        user = UserProfile.objects.get(user_id=user_id)
        if user.totp_secret:
            raise HttpError(400, "2FA already enabled for this user.")
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.save()
        issuer = getattr(settings, 'PROJECT_NAME', 'Hand2Hand')
        provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)
        return 200, TwoFASetupOut(provisioning_uri=provisioning_uri)
    except UserProfile.DoesNotExist:
        raise HttpError(404, "User not found.")
    except Exception as e:
        raise HttpError(400, str(e))

@user_router.post("/2fa/verify", response={200: UserOut, 400: str, 404: str}, tags=["2FA"])
def verify_2fa(request, data: TwoFAVerifyIn):
    try:
        user = UserProfile.objects.get(user_id=data.user_id)
        if not user.totp_secret:
            raise HttpError(400, "2FA not enabled for this user.")
        totp = pyotp.TOTP(user.totp_secret)
        if totp.verify(data.code):
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            address_out = None
            if user.address:
                address_out = AddressOut(
                    street=user.address.street,
                    city=user.address.city,
                    state=user.address.state,
                    postal_code=user.address.postal_code
                )
            return 200, UserOut(
                user_id=user.user_id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                user_type=user.user_type,
                badge=user.badge,
                sell_count=user.sell_count,
                buy_count=user.buy_count,
                joined_date=user.joined_date,
                profile_pic_url=user.profile_pic_url,
                role_name=user.role.role_name if user.role else None,
                address=address_out,
                token=access_token,
                refresh_token=refresh_token,
                twofa_required=False  # 2FA is now complete
            )
        else:
            raise HttpError(400, "Invalid 2FA code.")
    except UserProfile.DoesNotExist:
        raise HttpError(404, "User not found.")
    except Exception as e:
        raise HttpError(400, str(e))