from .schemas import ProductIn
from .models import Product, Category  
from django.http import Http404
from enum import Enum
from loguru import logger 

class ProductStatus(str, Enum):
    AVAILABLE = "Available"
    SOLD = "Sold"
    DELETED = "Deleted"
    PENDING = "Pending"

def create_product_entry(data: ProductIn):
    logger.info(f"Creating product entry with data: {data}")
    try:
        product_data = data.dict()
        product_data["status"] = ProductStatus.AVAILABLE
        product = Product.objects.create(**product_data)
        logger.info(f"Product entry created: {product}")
        return serialize_product(product) 
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise Exception(f"Error creating product: {str(e)}")

def get_filtered_products(
    category=None,
    name=None,
    condition=None,
    location=None,
    min_price=None,
    max_price=None,
    is_wanted=None
    
):
    logger.info(f"Filtering products with: category={category}, name={name}, condition={condition}, location={location}, min_price={min_price}, max_price={max_price}")
    queryset = Product.objects.filter(approve_status="approved", status=ProductStatus.AVAILABLE).order_by('-created_at')  # example order

    if is_wanted is True:
        queryset = Product.objects.filter(
            approve_status="approved", 
            status=ProductStatus.AVAILABLE,
            is_wanted=True
        ).order_by('-created_at')
    elif is_wanted is False:
        queryset = Product.objects.filter(
            approve_status="approved", 
            status=ProductStatus.AVAILABLE,
            is_wanted=False
        ).order_by('-created_at')
    else:
        queryset = Product.objects.filter(
            approve_status="approved", 
            status=ProductStatus.AVAILABLE,
            is_wanted=False
        ).order_by('-created_at')

    
    if category:
        try:
            category_obj = Category.objects.get(category_id=category)
            queryset = queryset.filter(category=category_obj.category_id)
            logger.info(f"Filtered by category: {category_obj}")
        except Category.DoesNotExist:
            logger.warning(f"Category not found: {category}")
            return []
    if name:
        queryset = queryset.filter(name__icontains=name)
        logger.info(f"Filtered by name: {name}")
    if condition:
        queryset = queryset.filter(condition__icontains=condition)
        logger.info(f"Filtered by condition: {condition}")
    if location:
        queryset = queryset.filter(location__icontains=location)
        logger.info(f"Filtered by location: {location}")
    if min_price is not None:
        queryset = queryset.filter(price__gte=min_price)
        logger.info(f"Filtered by min_price: {min_price}")
    if max_price is not None:
        queryset = queryset.filter(price__lte=max_price)
        logger.info(f"Filtered by max_price: {max_price}")

    result = []
    for product in queryset:
        result.append(serialize_product(product))
    return result

def get_product_by_id(product_id):
    logger.info(f"Getting product by id: {product_id}")
    try:
        product = Product.objects.get(product_id=product_id)
        logger.info(f"Product found: {product}")
        return serialize_product(product) 
    except Product.DoesNotExist:
        logger.warning(f"Product with ID {product_id} not found")
        raise Http404(f"Product with ID {product_id} not found")
    except Exception as e:
        logger.error(f"Error retrieving product: {e}")
        raise Exception(f"Error retrieving product: {str(e)}")

def update_product_entry(product_id: int, data: ProductIn):
    logger.info(f"Updating product id={product_id} with data: {data}")
    try:
        product = Product.objects.get(product_id=product_id)
        for attr, value in data.dict().items():
            setattr(product, attr, value)
        product.save()
        logger.info(f"Product updated: {product}")
        return serialize_product(product) 
    except Product.DoesNotExist:
        logger.warning(f"Product with ID {product_id} not found")
        raise Http404(f"Product with ID {product_id} not found")
    except Exception as e:
        logger.error(f"Error updating product: {e}")
        raise Exception(f"Error retrieving product: {str(e)}")


def delete_product_entry(product_id: int):
    try:
        product = Product.objects.get(product_id=product_id)
        product.status = ProductStatus.DELETED
        product.save()
        return {"detail": f"Product with ID {product_id} deleted successfully"}
    except Product.DoesNotExist:
        raise Http404(f"Product with ID {product_id} not found")
    except Exception as e:
        raise Exception(f"Error deleting product: {str(e)}")


def mark_product_as_sold(product_id: int):
    try:
        product = Product.objects.get(product_id=product_id)
        product.status = ProductStatus.SOLD
        product.save()
        return {"detail": f"Product with ID {product_id} marked as sold successfully"}
    except Product.DoesNotExist:
        raise Http404(f"Product with ID {product_id} not found")
    except Exception as e:
        raise Exception(f"Error marking product as sold: {str(e)}")


def mark_product_as_available(product_id: int):
    try:
        product = Product.objects.get(product_id=product_id)
        product.status = ProductStatus.AVAILABLE
        product.save()
        return {"detail": f"Product with ID {product_id} marked as available successfully"}
    except Product.DoesNotExist:
        raise Http404(f"Product with ID {product_id} not found")
    except Exception as e:
        raise Exception(f"Error marking product as available: {str(e)}")
    

def serialize_product(product):
    return {
        "product_id": product.product_id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "condition": product.condition,
        "image_urls": product.image_urls,
        "seller_id": product.seller.user_id,
        "category_id": product.category.category_id if product.category else None,
        "is_wanted": product.is_wanted,
        "location": product.location,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "category_name": product.category.category_name if product.category else "Unknown",
        "rejection_reason": product.rejection_reason,
        "approve_status": product.approve_status,
        "status": product.status
    }

def approve_product_listing(product_id: int):
    logger.info(f"Approving product listing with ID {product_id}.")
    try:
        product = Product.objects.get(product_id=product_id)
        if product.approve_status == "approved":
            logger.warning(f"Product {product_id} is already approved.")
            raise ValueError("Product is already approved.")
        product.approve_status = "approved"
        product.save()
        logger.success(f"Product listing {product_id} approved.")
        return True
    except Product.DoesNotExist:
        logger.warning(f"Product with ID {product_id} not found.")
        raise Http404(f"Product with ID {product_id} not found.")
    except Exception as e:
        logger.error(f"Error approving product {product_id}: {e}")
        raise Exception(f"Error approving product: {str(e)}")

def reject_product_listing(product_id: int, reason: str):
    logger.info(f"Rejecting product listing with ID {product_id}. Reason: {reason}")
    try:
        product = Product.objects.get(product_id=product_id)
        if product.approve_status == "approved":
            logger.warning(f"Product {product_id} is already approved.")
            raise ValueError("Product is already approved.")
        if product.approve_status == "rejected":
            logger.warning(f"Product {product_id} is already rejected.")
            raise ValueError("Product is already rejected.")
        product.approve_status = "rejected"
        product.rejection_reason = reason
        product.save()
        logger.success(f"Product listing {product_id} rejected.")
        return True
    except Product.DoesNotExist:
        logger.warning(f"Product with ID {product_id} not found.")
        raise Http404(f"Product with ID {product_id} not found.")
    except Exception as e:
        logger.error(f"Error rejecting product {product_id}: {e}")
        raise Exception(f"Error rejecting product: {str(e)}")

def get_pending_product_listings():
    """
    Fetch all products with approve_status='pending'.
    """
    logger.info("Fetching all pending product listings.")
    try:
        queryset = Product.objects.filter(approve_status="pending")
        products = [serialize_product(product) for product in queryset]
        logger.success(f"Fetched {len(products)} pending product listings.")
        return products
    except Exception as e:
        logger.error(f"Error fetching pending product listings: {e}")
        raise Exception(f"Error fetching pending product listings: {str(e)}")

def get_user_listings(user_id: int):
    # Fetch all product listings for this user (optionally filter by status)
    logger.info("Fetching all my product listings.")
    try:
        queryset = Product.objects.filter(seller_id=user_id).order_by('-created_at')  # example order
        products = [serialize_product(product) for product in queryset]
        logger.success(f"Fetched {len(products)} my product listings.")
        return products
    except Exception as e:
        logger.error(f"Error fetching my product listings: {e}")
        raise Exception(f"Error fetching my product listings: {str(e)}")
