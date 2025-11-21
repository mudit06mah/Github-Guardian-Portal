import jwt
import time
import httpx
import os
import logging
from typing import Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class GitHubAppAuth:
    """Handle GitHub App authentication and installation token generation"""
    
    def __init__(self):
        self.app_id = os.getenv("GITHUB_APP_ID")
        raw_key = os.getenv("GITHUB_PRIVATE_KEY", "")
        
        clean_key = raw_key.strip().strip('"').strip("'")
        
        self.private_key = clean_key.replace('\\n', '\n')

        if self.private_key and not self.private_key.endswith('\n'):
            self.private_key += '\n'

        logger.info(f"[v0] App ID present: {bool(self.app_id)}")
        logger.info(f"[v0] Key length: {len(self.private_key)}")
        
        if not self.app_id or not self.private_key:
            logger.error("[v0] GitHub App credentials not configured")
    
    def generate_jwt(self) -> Optional[str]:
        """Generate a JWT for GitHub App authentication"""
        try:
            now = int(time.time())
            payload = {
                "iat": now - 60,  # Issued at time (60 seconds in the past to allow for clock drift)
                "exp": now + (10 * 60),  # Expires in 10 minutes
                "iss": self.app_id
            }
            
            logger.info(f"[v0] App ID present: {bool(self.app_id)}")
            logger.info(f"[v0] Key length: {len(self.private_key)}")
            token = jwt.encode(payload, self.private_key, algorithm="RS256")
            return token
        except Exception as e:
            logger.error(f"[v0] Error generating JWT: {str(e)}")
            return None
    
    async def get_installation_token(self, installation_id: int) -> Optional[dict]:
        """
        Get an installation access token for the GitHub App.
        This token is scoped to the repositories the app has access to.
        """
        try:
            jwt_token = self.generate_jwt()
            if not jwt_token:
                return None
            
            url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
            headers = {
                "Authorization": f"Bearer {jwt_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "GitHub-Guardian"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "token": data.get("token"),
                    "expires_at": data.get("expires_at")
                }
        except Exception as e:
            logger.error(f"[v0] Error getting installation token: {str(e)}")
            return None
    
    async def get_installation_repositories(self, installation_id: int) -> list:
        """Get all repositories accessible to this installation"""
        try:
            token_data = await self.get_installation_token(installation_id)
            if not token_data:
                return []
            
            url = f"https://api.github.com/installation/repositories"
            headers = {
                "Authorization": f"token {token_data['token']}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "GitHub-Guardian"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                return data.get("repositories", [])
        except Exception as e:
            logger.error(f"[v0] Error getting installation repositories: {str(e)}")
            return []
    
    async def refresh_installation_token_if_needed(self, installation_id: int, current_token: str, expires_at: datetime) -> Optional[dict]:
        """Refresh the installation token if it's about to expire (within 1 hour)"""
        try:
            now = datetime.utcnow()
            time_until_expiry = expires_at - now
            
            # Refresh if expiring within 1 hour
            if time_until_expiry < timedelta(hours=1):
                logger.info(f"[v0] Refreshing installation token for installation {installation_id}")
                return await self.get_installation_token(installation_id)
            
            return {"token": current_token, "expires_at": expires_at.isoformat()}
        except Exception as e:
            logger.error(f"[v0] Error refreshing installation token: {str(e)}")
            return None
    
    
