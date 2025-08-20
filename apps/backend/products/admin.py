from django.contrib import admin
from .models import Product, Category, ProductReport

# Show all fields dynamically for Category
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Category._meta.fields]

# Show all fields dynamically for Product
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Product._meta.fields]
    search_fields = ['product_id', 'name', 'category']
    ordering = ['-created_at']

@admin.register(ProductReport)
class ProductReportAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ProductReport._meta.fields]
