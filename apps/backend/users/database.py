from .models import UserProfile, Address, Role, UserFavourites
from .schemas import UserSignupIn, UserLoginIn, FavouritesOut,  UserOut
from products.database import serialize_product 
from django.http import Http404 # type: ignore
from django.contrib.auth.hashers import make_password, check_password # type: ignore
from loguru import logger
from django.db import IntegrityError
from typing import Optional
from products.models import Product

def create_user_entry(data: UserSignupIn):
    try:
        signup_data = data.dict()
        address_data = signup_data.pop("address")
        role_id = signup_data.pop("role_id")
        password = signup_data.pop("password")
        signup_data.pop("confirm_password")  # Clean up

        # Create Address
        address = Address.objects.create(**address_data)

        # Fetch Role
        role = Role.objects.get(role_id=role_id)

        # Create UserProfile with hashed password
        user = UserProfile.objects.create(
            address=address,
            role=role,
            password=make_password(password),
            **signup_data
        )
        return user
    except Exception as e:
        raise Exception(f"Error creating user: {str(e)}")

def validate_user_login(data: UserLoginIn):
    try:
        email = data.email
        password = data.password
        user = UserProfile.objects.get(email=email)

        if not check_password(password, user.password):
            raise Http404("Invalid password")

        return user
    except UserProfile.DoesNotExist:
        raise Http404(f"User with email {email} not found")
    except Exception as e:
        raise Exception(f"Login error: {str(e)}")
    

def add_product_to_favourites(user_id: int, product_id: str):
    try:
        # Check if user exists
        try:
            user = UserProfile.objects.get(user_id=user_id)
            product = Product.objects.get(product_id=product_id)  # Assuming Product model exists
        except UserProfile.DoesNotExist:
            logger.error(f"User with id={user_id} does not exist.")
            raise Exception("User does not exist.")
        except Product.DoesNotExist:    
            logger.error(f"Product with id={product_id} does not exist.")
            raise Exception("Product does not exist.")

        try:
            userFavourites = UserFavourites.objects.get(user=user)
            if product_id in userFavourites.product_ids:
                logger.warning(f"Product_id={product_id} already in favourites for user_id={user_id}")
                raise Exception("Product already in favourites")

            logger.info(f"Adding product_id={product_id} to favourites for user_id={user_id}")
            userFavourites.product_ids.append(product_id)
            userFavourites.save()
            return userFavourites
        except UserFavourites.DoesNotExist:
            logger.info(f"Creating new favourites entry for user_id={user_id}")
            userFavourites = UserFavourites.objects.create(user=user, product_ids=[product_id])
            return userFavourites

    except IntegrityError as e:
        logger.error(f"Database integrity error: {str(e)}")
        raise Exception("Database integrity error. Please check user and product IDs.")
    except Exception as e:
        logger.error(f"Error adding product to favourites: {str(e)}")
        raise Exception(f"Error adding product to favourites: {str(e)}")

def get_user_favourites(user_id: int):
    try:
        favouritesOut = FavouritesOut(user_id=user_id, products=[])
        userFavourites = UserFavourites.objects.get(user_id=user_id)
        for product_id in userFavourites.product_ids:
            try:
                favouritesOut.products.append(serialize_product(Product.objects.get(product_id=product_id)))
            except Product.DoesNotExist:
                logger.warning(f"Product with id={product_id} does not exist in favourites for user_id={user_id}")
                continue
        return favouritesOut
    except UserFavourites.DoesNotExist:
        return FavouritesOut(user_id=user_id, products=[])
    except UserProfile.DoesNotExist:
        raise Http404(f"User with ID {user_id} not found")
    except Exception as e:
        raise Exception(f"Error fetching user favourites: {str(e)}")

def remove_product_from_favourites(user_id: int, product_id: str):
    try:
        userFavourites = UserFavourites.objects.get(user_id=user_id)
        if product_id not in userFavourites.product_ids:
            raise Exception("Product not found in favourites")

        userFavourites.product_ids.remove(product_id)
        userFavourites.save()
        return userFavourites
    except UserFavourites.DoesNotExist:
        raise Http404(f"User with ID {user_id} not found")
    except Exception as e:
        raise Exception(f"Error removing product from favourites: {str(e)}")
    

def get_moderator_by_id(moderator_id: int):
    try:
        moderator = UserProfile.objects.filter(user_id=moderator_id, role_id=2).first()
        if not moderator:
            raise UserProfile.DoesNotExist(f"Moderator with ID {moderator_id} does not exist.")
        return 200, serialize_moderator(moderator)
    except UserProfile.DoesNotExist:
        return None
    

def update_moderator(moderator_id, **kwargs):
    try:
        logger.info(f"Updating moderator with ID {moderator_id} with data: {kwargs}")
        moderator = UserProfile.objects.get(user_id=moderator_id)

        address_data = kwargs.pop("address", None)

        for key, value in kwargs.items():
            if hasattr(moderator, key) and value not in [None, ""]:
                setattr(moderator, key, value)

        if address_data:
            if moderator.address:
                
                for key, value in address_data.items():
                    if hasattr(moderator.address, key) and value not in [None, ""]:
                        setattr(moderator.address, key, value)
                moderator.address.save()
            else:
                from .models import Address
                new_address = Address.objects.create(**address_data)
                moderator.address = new_address

        moderator.save()
        return 200, serialize_moderator(moderator)

    except UserProfile.DoesNotExist:
        return None
    except IntegrityError as e:
        raise IntegrityError("Email already exists for another moderator.")


def serialize_moderator(moderator):
    return {
        "user_id": moderator.user_id,
        "first_name": moderator.first_name,
        "last_name": moderator.last_name,
        "email": moderator.email,
        "user_type": moderator.user_type,
        "badge": moderator.badge,
        "sell_count": moderator.sell_count,
        "buy_count": moderator.buy_count,
        "joined_date": moderator.joined_date,
        "profile_pic_url": moderator.profile_pic_url,
        "role_name": moderator.role.role_name if moderator.role else None,
        "address": moderator.address if moderator.address else None,
        "token": None,
    }