from django.db import models

class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.category_name
    class Meta:
        db_table = "categories"  

class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.FloatField()
    condition = models.CharField(max_length=50)
    image_urls = models.JSONField(default=list)  # For string array
    seller = models.ForeignKey('users.UserProfile', on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=50)
    is_wanted = models.BooleanField(default=False)
    location = models.CharField(max_length=255, null=True, blank=True)
    approve_status = models.CharField(default="pending", max_length=20)  # pending, approved, rejected
    rejection_reason = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return self.name
    class Meta:
        db_table = "products"  

# models.py
class ProductReport(models.Model):
    report_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reports")
    reported_by = models.ForeignKey('users.UserProfile', on_delete=models.CASCADE)
    reason = models.TextField(null=True, blank=True)  # make it nullable temporarily
    status = models.CharField(
        max_length=20,
        choices=[("pending", "Review Pending"), ("deleted", "Deleted"), ("kept", "Kept")],
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_reports"

