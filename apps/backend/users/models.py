from django.db import models # type: ignore

class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=100)

    def __str__(self):
        return self.role_name

    class Meta:
        db_table = "roles"

class Address(models.Model):
    address_id = models.AutoField(primary_key=True)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.street}, {self.city}"

    class Meta:
        db_table = "addresses"

class UserProfile(models.Model):
    user_id = models.AutoField(primary_key=True)
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default='temp1234')  # ✅ Added password field
    user_type = models.CharField(max_length=50)
    is_verified = models.BooleanField(default=False)
    badge = models.CharField(max_length=100, blank=True)
    sell_count = models.IntegerField(default=0)
    buy_count = models.IntegerField(default=0)
    joined_date = models.DateField()
    profile_pic_url = models.URLField(blank=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='users')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, related_name='users')
    totp_secret = models.CharField(max_length=32, blank=True, null=True)  #Setting up TOTP for 2FA

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        db_table = "users"

class UserFavourites(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='favourites')
    product_ids = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Favourites of {self.user.first_name} {self.user.last_name} - {len(self.product_ids)} products favourited"

    class Meta:
        db_table = "user_favourites"


class Moderator(models.Model):
    moderator_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    def __str__(self):
        return f"Moderator: {self.first_name} {self.last_name}"

    class Meta:
        db_table = "moderators"