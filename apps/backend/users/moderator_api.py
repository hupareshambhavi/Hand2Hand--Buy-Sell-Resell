from ninja import Router
from ninja.errors import HttpError, Http404
from .schemas import ModeratorIn, UserOut, UserIn
from .schemas import RejectReasonIn
from products.database import approve_product_listing, reject_product_listing, get_pending_product_listings
from delivery_agent.database import get_pending_delivery_agent, get_pending_delivery_agents, approve_agent, reject_agent
from delivery_agent.models import DeliveryAgent
from delivery_agent.schemas import DeliveryAgentOut
from products.schemas import ProductOut
from products.models import Product, ProductReport
from users.models import UserProfile
from loguru import logger
from .database import get_moderator_by_id, update_moderator

moderator_router = Router()


@moderator_router.get("/pending-listings", response=list[ProductOut], tags=["Moderator-Listings"])
def pending_listings(request):
    """
    List all pending product listings.
    """
    logger.info("Fetching all pending product listings.")
    try:
        pending_products = get_pending_product_listings()
        logger.success(f"Fetched {len(pending_products)} pending product listings.")
        return list(pending_products)
    except Exception as e:
        logger.error(f"Error fetching pending listings: {e}")
        raise HttpError(500, f"An error occurred while fetching pending listings: {str(e)}")


@moderator_router.post("/approve-listings/{product_id}", tags=["Moderator-Listings"])
def approve_listing(request, product_id: int):
    """
    Approve a product listing by its ID.
    """
    logger.info(f"Approving product listing with ID {product_id}.")
    try:
        approve_product_listing(product_id)
        logger.success(f"Product listing {product_id} approved.")
        return {"message": "Product listing approved successfully."}
    except Exception as e:
        logger.error(f"Error approving product {product_id}: {e}")
        if hasattr(e, "status_code") and e.status_code == 404:
            raise HttpError(404, str(e))
        raise HttpError(500, f"An error occurred while approving the product: {str(e)}")

@moderator_router.post("/reject-listings/{product_id}", tags=["Moderator-Listings"])
def reject_listing(request, product_id: int, data: RejectReasonIn):
    """
    Reject a product listing by its ID.
    """
    logger.info(f"Rejecting product listing with ID {product_id}. Reason: {data.reason}")
    try:
        reject_product_listing(product_id, data.reason)
        logger.success(f"Product listing {product_id} rejected.")
        return {"message": "Product listing rejected successfully."}
    except Exception as e:
        logger.error(f"Error rejecting product {product_id}: {e}")
        if hasattr(e, "status_code") and e.status_code == 404:
            raise HttpError(404, str(e))
        raise HttpError(500, f"An error occurred while rejecting the product: {str(e)}")
    

@moderator_router.get("/pending-agents", response=list[DeliveryAgentOut] ,tags=["Moderator-Agents"])
def pending_agents_list(request):
    """
    List all pending delivery agents.
    """
    logger.info("Fetching all pending delivery agents.")
    try:
        agents = get_pending_delivery_agents()
        logger.success(f"Fetched {len(agents)} pending delivery agents.")
        return agents
    except Exception as e:
        logger.error(f"Error fetching pending delivery agents: {e}")
        raise HttpError(500, f"An error occurred while fetching pending delivery agents: {str(e)}")

@moderator_router.get("/pending-agents/{agent_id}", tags=["Moderator-Agents"], response=DeliveryAgentOut)
def get_pending_agent(request, agent_id: int):
    """
    Fetch pending delivery agent by ID.
    """
    logger.info(f"Fetching pending delivery agent with ID {agent_id}.")
    try:
        agent = get_pending_delivery_agent(agent_id)
        logger.success(f"Fetched delivery agent {agent_id}.")
        return agent
    except Exception as e:
        logger.error(f"Error fetching delivery agent {agent_id}: {e}")
        if hasattr(e, "status_code") and e.status_code == 404:
            raise HttpError(404, str(e))
        raise HttpError(500, f"An error occurred while fetching the delivery agent: {str(e)}")
    
@moderator_router.post("/approve-agents/{agent_id}", tags=["Moderator-Agents"])
def approve_agent_api(request, agent_id: int):
    """
    Approve a delivery agent by ID.
    """
    logger.info(f"Approving delivery agent with ID {agent_id}.")
    try:
        approve_agent(agent_id)
        logger.success(f"Delivery agent {agent_id} approved.")
        return {"message": "Delivery agent approved successfully."}
    except DeliveryAgent.DoesNotExist:
        logger.warning(f"Delivery agent with ID {agent_id} not found.")
        raise HttpError(404, f"Delivery agent with ID {agent_id} not found.")
    except Exception as e:
        logger.error(f"Error approving delivery agent {agent_id}: {e}")
        raise HttpError(500, f"An error occurred while approving the delivery agent: {str(e)}")

@moderator_router.post("/reject-agents/{agent_id}", tags=["Moderator-Agents"])
def reject_agent_api(request, agent_id: int):
    """
    Reject a delivery agent by ID.
    """
    logger.info(f"Rejecting delivery agent with ID {agent_id}.")
    try:
        reject_agent(agent_id) 
        logger.success(f"Delivery agent {agent_id} rejected.")
        return {"message": "Delivery agent rejected successfully."}
    except DeliveryAgent.DoesNotExist:
        logger.warning(f"Delivery agent with ID {agent_id} not found.")
        raise HttpError(404, f"Delivery agent with ID {agent_id} not found.")
    except Exception as e:
        logger.error(f"Error rejecting delivery agent {agent_id}: {e}")
        raise HttpError(500, f"An error occurred while rejecting the delivery agent: {str(e)}")


@moderator_router.get("/stats", tags=["Moderator-Stats"])
def get_moderator_stats(request):
    """
    Get dashboard statistics for moderator home page.
    """
    logger.info("Fetching moderator dashboard statistics.")
    try:
        # total number of usrts
        total_users = UserProfile.objects.count()
        
        # total no of products
        total_listings = Product.objects.count()
        
        # show how many lists are pending
        pending_listings = Product.objects.filter(approve_status="pending").count()
        
        # get how many reports need review
        active_reports = ProductReport.objects.filter(status="pending").count()
        
        # get how many agents need review
        pending_agents = DeliveryAgent.objects.filter(approval_status="pending").count()
        
        stats = {
            "total_users": total_users,
            "total_listings": total_listings,
            "pending_listings": pending_listings,
            "active_reports": active_reports,
            "pending_agents": pending_agents
        }
        
        logger.success(f"Fetched moderator stats: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching moderator stats: {e}")
        raise HttpError(500, f"An error occurred while fetching stats: {str(e)}")
    

@moderator_router.get("/{id}", response=UserOut, tags=["Moderators"])
def get_moderator_details(request, id: int):
    """
    Get moderator details by ID.
    """
    moderator = get_moderator_by_id(id)
    if not moderator:
        raise HttpError(404, "Moderator not found")
    return moderator

@moderator_router.put("/{id}", response=UserOut, tags=["Moderators"])
def update_moderator_details(request, id: int, data: UserIn):
    try:
        moderator = update_moderator(id, **(data.dict(exclude_unset=True)))
        if not moderator:
            raise HttpError(404, "Moderator not found")
        return moderator
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        logger.error(f"Error updating moderator: {e}")
        raise HttpError(500, str(e))