from django.contrib import admin
from .models import User, Product, Request, Order, OrderItem

admin.site.register(User)
admin.site.register(Product)
admin.site.register(Request)
admin.site.register(Order)
admin.site.register(OrderItem)
