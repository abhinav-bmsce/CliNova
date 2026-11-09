import os
import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from backend.core.config import settings

PBKDF2_ITERATIONS = 100000

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a cryptographically secure salt."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${dk.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a plain-text password against a stored PBKDF2 hash using constant-time comparison."""
    try:
        parts = stored_hash.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_dk = bytes.fromhex(parts[3])
        actual_dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
        return hmac.compare_digest(actual_dk, expected_dk)
    except Exception:
        return False

def _b64url_encode(data: bytes) -> str:
    """Base64url encode without padding."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64url_decode(data_str: str) -> bytes:
    """Base64url decode with padding restoration."""
    padding = '=' * (-len(data_str) % 4)
    return base64.urlsafe_b64decode(data_str + padding)

def create_access_token(payload: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    """Generate an RFC 7519 compliant JSON Web Token (JWT) with HS256 signature."""
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }

    now = int(time.time())
    if expires_delta_seconds is None:
        expires_delta_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    claims = dict(payload)
    claims["iat"] = now
    claims["exp"] = now + expires_delta_seconds

    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    claims_bytes = json.dumps(claims, separators=(',', ':')).encode('utf-8')

    segments = [
        _b64url_encode(header_bytes),
        _b64url_encode(claims_bytes)
    ]

    signing_input = f"{segments[0]}.{segments[1]}".encode('utf-8')
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()

    segments.append(_b64url_encode(signature))
    return f"{segments[0]}.{segments[1]}.{segments[2]}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """Validate and decode an HS256 signed JWT token."""
    parts = token.strip().split('.')
    if len(parts) != 3:
        raise ValueError("Malformed JWT token")

    header_b64, payload_b64, signature_b64 = parts

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    expected_sig = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        signing_input,
        hashlib.sha256
    ).digest()

    actual_sig = _b64url_decode(signature_b64)
    if not hmac.compare_digest(actual_sig, expected_sig):
        raise ValueError("Invalid JWT signature")

    payload_json = _b64url_decode(payload_b64).decode('utf-8')
    claims = json.loads(payload_json)

    # Validate expiration
    exp = claims.get("exp")
    if exp and int(time.time()) > exp:
        raise ValueError("Token has expired")

    return claims

