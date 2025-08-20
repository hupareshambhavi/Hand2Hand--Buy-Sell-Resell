from django.db import models

# Create your models here.

class DeliveryAgent(models.Model):
    agent_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    category_ids = models.JSONField(default=list)  
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # For storing hashed password
    phone_number = models.CharField(max_length=15, unique=True)
    transport_mode = models.CharField(max_length=50)  
    phone_number = models.CharField(max_length=15, unique=True)
    reviews = models.JSONField(default=list)  
    deliveries_completed = models.IntegerField(default=0)
    identity_img_url = models.URLField(null=True, blank=True)
    day_of_week = models.JSONField(default=list)  # Store array of strings as JSON
    time_slot = models.JSONField(default=list)    # Store array of arrays as JSON
    joined_date = models.DateField()
    approval_status = models.CharField(max_length=20, default="pending")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.transport_mode})"
    
    class Meta:
        db_table = "delivery_agents"
        verbose_name = "Delivery Agent"
        verbose_name_plural = "Delivery Agents"
    
class DeliveryRequest(models.Model):
    
    request_id = models.AutoField(primary_key=True)
    agent = models.ForeignKey(DeliveryAgent, on_delete=models.CASCADE, null=True, blank=True)
    product_id = models.IntegerField(unique=True)
    request_date = models.DateTimeField(auto_now_add=True)
    seller_id = models.IntegerField()
    buyer_id = models.IntegerField()
    delivery_date = models.DateTimeField(null=True, blank=True)
    dropoff_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default="pending")  # pending, accepted, rejected, completed
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_rating = models.IntegerField(null=True, blank=True) 
    delivery_mode = models.CharField(max_length=50, default="standard")  # e.g., "standard", "express"
    delivery_notes = models.TextField(null=True, blank=True)  # Additional notes for the delivery
    
    def __str__(self):
        return f"Request {self.request_id} for Product {self.product_id} by Agent {self.agent.first_name} {self.agent.last_name}"
    
    class Meta:
        db_table = "delivery_requests"
        verbose_name = "Delivery Request"
        verbose_name_plural = "Delivery Requests"
        ordering = ['-request_date']