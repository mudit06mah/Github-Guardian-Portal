import re
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class WorkflowScanner:
    """Scans GitHub workflow files for security issues"""
    
    # Define security patterns
    SECURITY_PATTERNS = {
        "unpinned_action": {
            "pattern": r"uses:\s*[\w-]+/[\w-]+@(?!sha256:)",
            "severity": "High",
            "description": "Action is not pinned to a specific commit SHA"
        },
        "curl_bash": {
            "pattern": r"curl\s+.*\|\s*bash",
            "severity": "High",
            "description": "Direct execution of curl output via bash is unsafe"
        },
        "hardcoded_secrets": {
            "pattern": r"(?:password|secret|token|api[_-]?key)\s*[:=]\s*['\"][\w\-./]{8,}['\"]",
            "severity": "High",
            "description": "Potential hardcoded secrets detected"
        },
        "no_checkout_ref": {
            "pattern": r"uses:\s*actions/checkout@(?!sha256:)",
            "severity": "Medium",
            "description": "Checkout action should be pinned to specific commit"
        },
        "external_script": {
            "pattern": r"run:\s*.*(?:wget|curl)\s+.*\|\s*(?:sh|bash|python)",
            "severity": "Medium",
            "description": "Downloading and executing external scripts is risky"
        },
        "shell_injection": {
            "pattern": r"\$\{\s*[A-Z_]+\s*\}",
            "severity": "Medium",
            "description": "Environment variable expansion in unsafe context"
        }
    }
    
    @classmethod
    def scan_workflow(cls, workflow_content: str, workflow_path: str) -> List[Dict[str, Any]]:
        """Scan workflow content for security issues"""
        findings = []
        
        if not workflow_content:
            return findings
        
        for pattern_name, pattern_info in cls.SECURITY_PATTERNS.items():
            matches = re.finditer(pattern_info["pattern"], workflow_content, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                line_number = workflow_content[:match.start()].count('\n') + 1
                findings.append({
                    "type": pattern_name,
                    "severity": pattern_info["severity"],
                    "description": pattern_info["description"],
                    "line": line_number,
                    "matched_text": match.group(0)[:100],
                    "workflow_path": workflow_path
                })
        
        return findings
    
    @classmethod
    def get_finding_details(cls, finding_type: str) -> str:
        """Get detailed explanation for a finding"""
        descriptions = {
            "unpinned_action": "Actions should be pinned to a specific commit SHA (e.g., @a1b2c3d4) to prevent version drift and ensure reproducibility.",
            "curl_bash": "Piping curl output directly to bash can execute arbitrary code. Consider downloading to a file first, verifying contents, then executing.",
            "hardcoded_secrets": "Never hardcode secrets in workflow files. Use GitHub Secrets instead and reference them with ${{ secrets.SECRET_NAME }}.",
            "no_checkout_ref": "Always pin the checkout action to a specific commit to ensure consistent behavior.",
            "external_script": "Downloading and executing scripts from the internet is risky. Review the script content before execution.",
            "shell_injection": "Environment variables used in commands can be exploited. Escape special characters and validate input."
        }
        return descriptions.get(finding_type, "Unknown security finding")
