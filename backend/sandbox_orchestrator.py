import subprocess
import json
import os
import sys
from typing import Dict, Any
import logging
import tempfile
import time

logger = logging.getLogger(__name__)

class SandboxOrchestrator:
    """Orchestrates code execution in isolated sandboxes using Docker"""
    
    @staticmethod
    def run_snippet_in_sandbox(snippet: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Execute code snippet safely in a Docker container
        
        Args:
            snippet: Python code to execute
            timeout: Execution timeout in seconds
        
        Returns:
            Dictionary with verdict, log, and execution time
        """
        start_time = time.time()
        
        try:
            # Create temporary file with snippet
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(snippet)
                temp_file = f.name
            
            # Try to run with Docker
            if SandboxOrchestrator._is_docker_available():
                result = SandboxOrchestrator._run_in_docker(temp_file, timeout)
            else:
                # Fallback to subprocess with restrictions
                result = SandboxOrchestrator._run_in_subprocess(temp_file, timeout)
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            result['execution_time_ms'] = execution_time_ms
            
            return result
        
        except Exception as e:
            logger.error(f"Sandbox execution error: {str(e)}")
            return {
                "verdict": "Error",
                "log": f"Execution failed: {str(e)}",
                "execution_time_ms": int((time.time() - start_time) * 1000),
                "error": str(e)
            }
        finally:
            # Cleanup
            try:
                os.unlink(temp_file)
            except:
                pass
    
    @staticmethod
    def _is_docker_available() -> bool:
        """Check if Docker is available"""
        try:
            subprocess.run(['docker', '--version'], capture_output=True, timeout=5)
            return True
        except:
            return False
    
    @staticmethod
    def _run_in_docker(script_path: str, timeout: int) -> Dict[str, Any]:
        """Run script in Docker container"""
        try:
            docker_cmd = [
                'docker', 'run', '--rm',
                '-v', f'{script_path}:/script.py:ro',
                '--network', 'none',
                '--memory', '256m',
                '--cpus', '0.5',
                '--read-only',
                'python:3.11-slim',
                'python', '/script.py'
            ]
            
            result = subprocess.run(
                docker_cmd,
                capture_output=True,
                timeout=timeout,
                text=True
            )
            
            return {
                "verdict": "Safe" if result.returncode == 0 else "Unsafe",
                "log": result.stdout or result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "verdict": "Unsafe",
                "log": f"Execution timeout after {timeout} seconds",
                "return_code": -1
            }
        except Exception as e:
            raise e
    
    @staticmethod
    def _run_in_subprocess(script_path: str, timeout: int) -> Dict[str, Any]:
        """Fallback: run script in subprocess with restrictions"""
        try:
            # Check for dangerous patterns
            with open(script_path, 'r') as f:
                content = f.read()
            
            dangerous_patterns = [
                'os.system', 'subprocess', 'exec', 'eval', 'compile',
                '__import__', 'open', 'requests', 'socket', 'threading'
            ]
            
            for pattern in dangerous_patterns:
                if pattern in content:
                    return {
                        "verdict": "Unsafe",
                        "log": f"Dangerous pattern detected: {pattern}",
                        "return_code": -1
                    }
            
            # Safe execution
            result = subprocess.run(
                [sys.executable, script_path],
                capture_output=True,
                timeout=timeout,
                text=True
            )
            
            return {
                "verdict": "Safe" if result.returncode == 0 else "Unsafe",
                "log": result.stdout or result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "verdict": "Unsafe",
                "log": f"Execution timeout after {timeout} seconds",
                "return_code": -1
            }

def run_snippet_in_sandbox(snippet: str) -> Dict[str, Any]:
    """Wrapper function for backward compatibility"""
    return SandboxOrchestrator.run_snippet_in_sandbox(snippet)
