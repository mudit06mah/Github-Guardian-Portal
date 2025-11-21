import httpx
import os
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class GitHubService:
    """
    GitHub API service that works with GitHub App installation tokens.
    No longer uses Personal Access Tokens (PATs) for security and scalability.
    """
    
    def __init__(self, token: str, is_app_token: bool = True):
        self.token = token
        self.is_app_token = is_app_token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Guardian"
        }
    
    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """Fetch repository details from GitHub"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/repos/{owner}/{repo}"
                response = await client.get(url, headers=self.headers, timeout=10.0)
                
                if response.status_code == 404:
                    logger.warning(f"[v0] Repository {owner}/{repo} not found or not accessible")
                    return None
                
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"[v0] HTTP error fetching repository {owner}/{repo}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"[v0] Error fetching repository {owner}/{repo}: {str(e)}")
            return None
    
    async def get_workflows(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Fetch GitHub Actions workflows"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/actions/workflows"
                response = await client.get(url, headers=self.headers, timeout=10.0)
                
                if response.status_code == 404:
                    logger.warning(f"[v0] Workflows not found for {owner}/{repo}")
                    return []
                
                response.raise_for_status()
                workflows = response.json().get("workflows", [])
                logger.info(f"[v0] Found {len(workflows)} workflows for {owner}/{repo}")
                return workflows
        except Exception as e:
            logger.error(f"[v0] Error fetching workflows for {owner}/{repo}: {str(e)}")
            return []
    
    async def get_workflow_file(self, owner: str, repo: str, workflow_path: str, ref: str = None) -> Optional[str]:
        """Fetch workflow YAML file content"""
        try:
            async with httpx.AsyncClient() as client:
                # Use the content API which supports ?ref=...
                url = f"{self.base_url}/repos/{owner}/{repo}/contents/{workflow_path}"
                params = {}
                if ref:
                    params["ref"] = ref
                
                response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
                
                if response.status_code == 404:
                    logger.warning(f"[v0] Workflow file {workflow_path} not found at ref {ref}")
                    return None
                
                response.raise_for_status()
                import base64
                content = response.json().get("content", "")
                decoded_content = base64.b64decode(content).decode("utf-8")
                return decoded_content
        except Exception as e:
            logger.error(f"[v0] Error fetching workflow file {workflow_path}: {str(e)}")
            return None
    
    async def get_pull_requests(self, owner: str, repo: str, state: str = "open") -> List[Dict[str, Any]]:
        """Fetch pull requests"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
                response = await client.get(url, headers=self.headers, params={"state": state}, timeout=10.0)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"[v0] Error fetching pull requests for {owner}/{repo}: {str(e)}")
            return []
    
    async def create_issue(self, owner: str, repo: str, title: str, body: str) -> Optional[Dict[str, Any]]:
        """Create a GitHub issue"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/issues"
                data = {"title": title, "body": body}
                response = await client.post(url, headers=self.headers, json=data, timeout=10.0)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"[v0] Error creating issue in {owner}/{repo}: {str(e)}")
            return None
    
    async def create_check_run(self, owner: str, repo: str, head_sha: str, name: str, 
                               status: str = "completed", conclusion: str = "success", 
                               output: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Create a check run for a commit (GitHub App only)"""
        if not self.is_app_token:
            logger.warning("[v0] Check runs require GitHub App installation token")
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/check-runs"
                data = {
                    "name": name,
                    "head_sha": head_sha,
                    "status": status,
                    "conclusion": conclusion
                }
                
                if output:
                    data["output"] = output
                
                response = await client.post(url, headers=self.headers, json=data, timeout=10.0)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"[v0] Error creating check run: {str(e)}")
            return None
