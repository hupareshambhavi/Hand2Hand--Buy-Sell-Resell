from django.contrib import admin
from .models import Role, Address, UserProfile

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Role._meta.fields]

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Address._meta.fields]

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [field.name for field in UserProfile._meta.fields]
    search_fields = ['first_name', 'last_name', 'email']
    list_filter = ['user_type', 'is_verified', 'joined_date']
    ordering = ['-joined_date']