from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
import requests
import json

User = get_user_model()

class ClerkJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
        except IndexError:
            raise AuthenticationFailed('Invalid token header')

        try:
            # For development - decode without verification
            # This allows us to test with Clerk tokens
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            # Extract user info from the decoded token
            user_id = decoded.get('sub')  # Clerk user ID
            email = decoded.get('email', '')
            first_name = decoded.get('first_name', '')
            last_name = decoded.get('last_name', '')
            
            if not user_id:
                raise AuthenticationFailed('User ID not found in token')

            # Get or create user based on Clerk user ID
            user, created = User.objects.get_or_create(
                clerk_id=user_id,
                defaults={
                    'email': email or f'user_{user_id[:8]}@temp.com',
                    'username': f'user_{user_id[:8]}',
                    'first_name': first_name or '',
                    'last_name': last_name or '',
                }
            )
            
            # Update user info if it changed
            if not created:
                if email and user.email != email:
                    user.email = email
                if first_name and user.first_name != first_name:
                    user.first_name = first_name
                if last_name and user.last_name != last_name:
                    user.last_name = last_name
                user.save()
            
            return (user, None)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication error: {str(e)}')