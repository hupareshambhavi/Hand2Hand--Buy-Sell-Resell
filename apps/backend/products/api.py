from typing import List, Optional
from ninja import Query, Router
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from .models import Category, Product
from .schemas import ProductIn, ProductOut, CategoryOut
from .database import (
    create_product_entry,
    get_filtered_products,
    get_product_by_id,
    update_product_entry,
    delete_product_entry,
    mark_product_as_sold,
    mark_product_as_available,
    serialize_product,
)
from django.http import Http404
from loguru import logger
from typing import List

prodcut_router = Router()

@prodcut_router.get("", response=List[ProductOut], tags=["Products"])
def list_products(
    request,
    category: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None)
):
    logger.info(f"Listing products with filters: category={category}, name={name}, condition={condition}, location={location}, min_price={min_price}, max_price={max_price}")
    try:
        result = get_filtered_products(
            category=category,
            name=name,
            condition=condition,
            location=location,
            min_price=min_price,
            max_price=max_price
        )
        logger.info(f"Found {len(result)} products")
        return result
    except Exception as e:
        logger.error(f"Error listing products: {e}")
        raise HttpError(500, str(e))
    
@prodcut_router.get("/categories", response=List[CategoryOut], tags=["Products"])
def list_categories(request):
    logger.info("Listing all product categories")
    try:
        categories = Category.objects.all()
        return list(categories)
    except Exception as e:
        logger.error(f"Error listing categories: {e}")
        raise HttpError(500, str(e))

# MOVED THIS BEFORE /{id} TO AVOID ROUTE CONFLICT
@prodcut_router.get("/wanted", response=List[ProductOut], tags=["Products"])
def list_wanted_items(
    request,
    search: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    category: Optional[int] = Query(None),
    location: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
):
    logger.info("Listing wanted items")
    try:
        search_term = search or name or q
        
        result = get_filtered_products(
            name=search_term,
            category=category,
            location=location,
            max_price=max_price,
            is_wanted=True
        )
        logger.info(f"Found {len(result)} wanted items")
        return result
    except Exception as e:
        logger.error(f"Error listing wanted items: {e}")
        raise HttpError(500, str(e))

    
@prodcut_router.get("/{id}", response=ProductOut, tags=["Products"])
def product_detail_view(request, id: int):
    logger.info(f"Fetching product detail for id={id}")
    try:
        product = get_product_by_id(id)
        logger.info(f"Product found: {product}")
        return product
    except Http404 as e:
        logger.warning(f"Product not found: {e}")
        raise HttpError(404, str(e))
    except Exception as e:
        logger.error(f"Error fetching product detail: {e}")
        raise HttpError(500, str(e))

@prodcut_router.post("", response=ProductOut, tags=["Products"])
def create_product(request, data: ProductIn):
    logger.info(f"Creating product with data: {data}")
    try:
        product = create_product_entry(data)
        logger.info(f"Product created: {product}")
        return product
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HttpError(500, str(e))

@prodcut_router.put("/{id}", response=ProductOut, tags=["Products"])
def update_product(request, id: int, data: ProductIn):
    logger.info(f"Updating product id={id} with data: {data}")
    try:
        product = get_product_by_id(id) 
        if not product:
            raise Http404(f"Product with ID {id} not found")
        product = update_product_entry(id, data)
        logger.info(f"Product updated: {product}")
        return product
    except Http404 as e:
        logger.warning(f"Product not found for update: {e}")
        raise HttpError(404, str(e))
    except Exception as e:
        logger.error(f"Error updating product: {e}")
        raise HttpError(500, str(e))

@prodcut_router.delete("/{id}", tags=["Products"])
def delete_product(request, id: int):
    logger.info(f"Deleting product id={id}")
    try:
        result = delete_product_entry(id)
        logger.info(f"Product deleted: {result}")
        return result
    except Http404 as e:
        logger.warning(f"Product not found for delete: {e}")
        raise HttpError(404, str(e))
    except Exception as e:
        logger.error(f"Error deleting product: {e}")
        raise HttpError(500, str(e))

@prodcut_router.post("/{id}/mark-sold", tags=["Products"])
def mark_product_sold(request, id: int):
    try:
        result = mark_product_as_sold(id)
        return result
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        raise HttpError(500, str(e))

@prodcut_router.post("/{id}/mark-available", tags=["Products"])
def mark_product_available(request, id: int):
    try:
        result = mark_product_as_available(id)
        return result
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        raise HttpError(500, str(e))
    
@prodcut_router.get("/{product_id}/similar", response=List[ProductOut], tags=["Products"])
def get_similar_products(request, product_id: int):
    logger.info(f"Fetching similar products for product_id={product_id}")
    try:
        original_product = get_object_or_404(Product, pk=product_id)
        
        if not original_product.category:
            return []

        similar_products_queryset = Product.objects.filter(
            category=original_product.category
        ).exclude(
            pk=product_id
        ).order_by('?')[:4]
        serialized_results = [serialize_product(product) for product in similar_products_queryset]

        logger.info(f"Found and serialized {len(serialized_results)} similar products.")
        return serialized_results

    except Product.DoesNotExist:
        logger.warning(f"Product with id={product_id} not found.")
        raise HttpError(404, "Product not found")
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching similar products: {e}")
        raise HttpError(500, "An internal error occurred.")