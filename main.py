"""
AURA (formerly RF Nexus) - Production Backend Engine
Engineered by vXr Holdings (Founders: Vishu Raj - CVO, Rishav Raj - CEO)
Exclusively for RAHUL FOUNDATION SOCIETY (5,000+ Verified Members)

Tech Stack:
- FastAPI (High Performance REST API & Admin Controller)
- python-socketio (Real-Time Bidirectional Event Streaming & Room Queue)
- Supabase PostgreSQL (Persistent Identity Storage & RLS)
- WebRTC / PeerJS Signaling Engine
"""

import os
import time
import uuid
import html
from typing import Dict, List, Optional, Set
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Request, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
import socketio
import httpx
from passlib.context import CryptContext
import jwt

# ==============================================================================
# ENVIRONMENT & CONFIGURATION
# ==============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-supabase-service-role-key")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "vxr-aura-jwt-super-secret-key-2025")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "your-cloud-name")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "your-api-key")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "your-api-secret")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "AURA-SYS-VISHU")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "vxr_aura_2025")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 Days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==============================================================================
# FASTAPI & SOCKET.IO SETUP
# ==============================================================================

fastapi_app = FastAPI(
    title="AURA Real-Time Backend Engine",
    description="Identity-Attested P2P Matchmaking Server for Rahul Foundation Society",
    version="2.5.0"
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_timeout=25,
    ping_interval=10
)

# Combined ASGI app (Mounting Socket.IO at /socket.io)
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# ==============================================================================
# SECURITY UTILITIES & SANITIZATION
# ==============================================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(payload: dict) -> str:
    to_encode = payload.copy()
    to_encode.update({"exp": time.time() + (JWT_EXPIRATION_HOURS * 3600)})
    return jwt.encode(to_encode, SUPABASE_JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[dict]:
    try:
        decoded = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded
    except Exception:
        return None

def sanitize_chat_message(content: str) -> str:
    if not content:
        return ""
    clean = "".join(ch for ch in content if ch >= " " or ch in "\n\r\t")
    clean = clean[:1000].strip()
    return html.escape(clean, quote=True)

# Rate Limiter for Sockets and API
class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, identifier: str) -> bool:
        current_time = time.time()
        window_start = current_time - self.window_seconds
        self.requests[identifier] = [t for t in self.requests[identifier] if t > window_start]
        if len(self.requests[identifier]) >= self.max_requests:
            return False
        self.requests[identifier].append(current_time)
        return True

rate_limiter = SlidingWindowRateLimiter(max_requests=120, window_seconds=60)

# ==============================================================================
# SUPABASE REST INTERFACE (Service Role)
# ==============================================================================

async def supabase_query(endpoint: str, method: str = "GET", data: Optional[dict] = None, params: Optional[dict] = None):
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        if method == "GET":
            response = await client.get(url, headers=headers, params=params)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data, params=params)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        return response

# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class UserSignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., min_length=8, max_length=20)
    college_name: str = Field(default="Rahul Foundation Society")
    role: str = Field(default="Student")
    society_id: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    id_card_url: Optional[str] = None

class UserLoginRequest(BaseModel):
    society_id_or_username: str
    password: str

class AdminLoginRequest(BaseModel):
    admin_id: str
    passkey: str

class OfflineVerificationRequest(BaseModel):
    full_name: str
    role: str
    department: str
    hod_name: str
    cabin_room: str
    reason: str
    society_id: Optional[str] = None

class IncidentReportRequest(BaseModel):
    reporter_username: str
    offender_username: str
    offender_name: str
    offender_society_id: str
    incident_type: str
    notes: Optional[str] = None
    room_id: Optional[str] = None

# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@fastapi_app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "AURA Production Signaling Engine",
        "vXr_holdings": "Active",
        "timestamp": time.time(),
        "connected_users": len(connected_users),
        "active_rooms": len(active_rooms)
    }

@fastapi_app.get("/api/stats")
async def get_system_stats():
    """Fetches real-time system metrics from database and socket engine."""
    verified_res = await supabase_query("users?status=eq.verified&select=id", method="GET")
    pending_res = await supabase_query("users?status=eq.pending&select=id", method="GET")
    banned_res = await supabase_query("users?is_banned=eq.true&select=id", method="GET")
    offline_res = await supabase_query("offline_verifications?status=eq.pending&select=id", method="GET")
    
    verified_count = len(verified_res.json()) if verified_res.status_code == 200 else 0
    pending_count = (len(pending_res.json()) if pending_res.status_code == 200 else 0) + (len(offline_res.json()) if offline_res.status_code == 200 else 0)
    banned_count = len(banned_res.json()) if banned_res.status_code == 200 else 0

    return {
        "online_count": max(len(connected_users), 1),
        "verified_members": 5000 + verified_count,
        "pending_verifications": pending_count,
        "banned_count": banned_count,
        "active_rooms": len(active_rooms)
    }

@fastapi_app.get("/api/notices")
async def get_society_notices():
    """Fetches official live broadcast announcements."""
    return [
        {
            "id": "notice-1",
            "tag": "SECURITY",
            "tag_color": "#FF6B6B",
            "time": "LIVE",
            "title": "ZERO ANONYMITY PROTOCOL IN FULL EFFECT. MAINTAIN CAMPUS DECORUM AT ALL TIMES.",
            "author": "ADMIN VISHU",
            "dept": "RFC-HQ"
        },
        {
            "id": "notice-2",
            "tag": "INFRA",
            "tag_color": "#BAE6FD",
            "time": "UPGRADED",
            "title": "PEERJS WEBRTC MESH PROTOCOL UPGRADED FOR ZERO-LATENCY CAMPUS STREAMING.",
            "author": "ADMIN RISHAV",
            "dept": "VXR DEV"
        },
        {
            "id": "notice-3",
            "tag": "EVENT",
            "tag_color": "#FFD93D",
            "time": "CAMPUS",
            "title": "SOCIETY TECHNOVATION & HACKATHON REGISTRATIONS OPEN ON MONDAY. 60 SLOTS AVAILABLE.",
            "author": "DEAN OFFICE",
            "dept": "FACULTY"
        }
    ]

@fastapi_app.post("/api/admin/ban")
async def admin_ban_user(req: dict, authorization: Optional[str] = Header(None)):
    """Executes a permanent zero-tolerance ban on a user."""
    if not authorization or "Bearer " not in authorization:
        raise HTTPException(status_code=401, detail="Admin token required.")
    token = authorization.split("Bearer ")[1]
    claims = decode_jwt_token(token)
    if not claims or not claims.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized admin privilege.")
    
    target = req.get("target", "").strip()
    reason = req.get("reason", "Zero-Tolerance Disciplinary Violation").strip()
    if not target:
        raise HTTPException(status_code=400, detail="Target username or Society ID required.")
    
    # Patch user record
    patch_res = await supabase_query(
        f"users?or=(username.eq.{target},society_id.eq.{target})",
        method="PATCH",
        data={"is_banned": True, "ban_reason": reason}
    )
    return {"status": "success", "message": f"Entity '{target}' has been banned under Zero-Tolerance rules."}

@fastapi_app.post("/api/auth/signup")
async def signup_user(req: UserSignupRequest):
    """Registers a new user into pending status for admin verification."""
    # Check if user already exists
    res = await supabase_query(f"users?society_id=eq.{req.society_id}")
    if res.status_code == 200 and len(res.json()) > 0:
        raise HTTPException(status_code=400, detail="A user with this College/Society ID already exists.")
    
    hashed_pwd = hash_password(req.password)
    user_payload = {
        "full_name": req.full_name.strip(),
        "mobile": req.mobile.strip(),
        "college_name": req.college_name.strip(),
        "role": req.role,
        "society_id": req.society_id.strip(),
        "password_hash": hashed_pwd,
        "id_card_url": req.id_card_url or "",
        "status": "pending"
    }

    insert_res = await supabase_query("users", method="POST", data=user_payload)
    if insert_res.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to store user profile in database.")
    
    inserted = insert_res.json()
    user_record = inserted[0] if isinstance(inserted, list) and len(inserted) > 0 else user_payload

    return {
        "status": "success",
        "message": "Application submitted for verification. Please await admin attestation.",
        "user_id": user_record.get("id"),
        "verification_status": "pending"
    }

@fastapi_app.post("/api/auth/login")
async def login_user(req: UserLoginRequest):
    """Logs in an attested user, validating their auraXXXX status and returning JWT."""
    identifier = req.society_id_or_username.strip()
    
    # Check username or society_id
    query_str = f"users?or=(username.eq.{identifier},society_id.eq.{identifier})"
    res = await supabase_query(query_str)
    
    if res.status_code != 200 or len(res.json()) == 0:
        raise HTTPException(status_code=401, detail="Invalid Society ID, Username, or Password.")
    
    user = res.json()[0]
    
    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid Society ID, Username, or Password.")
    
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail=f"Access Denied: Account Banned. Reason: {user.get('ban_reason', 'Disciplinary Violation')}")
    
    if user.get("status") != "verified":
        raise HTTPException(
            status_code=403, 
            detail="Account is currently PENDING verification. Please wait for society admin approval."
        )
    
    token_payload = {
        "sub": user["id"],
        "username": user.get("username"),
        "full_name": user.get("full_name"),
        "role": user.get("role"),
        "society_id": user.get("society_id")
    }
    jwt_token = create_jwt_token(token_payload)

    return {
        "status": "success",
        "token": jwt_token,
        "user": {
            "id": user["id"],
            "username": user.get("username"),
            "full_name": user.get("full_name"),
            "role": user.get("role"),
            "society_id": user.get("society_id"),
            "status": user.get("status")
        }
    }

@fastapi_app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest):
    """Secures administrative access for vXr Holdings / RAHUL FOUNDATION SOCIETY admins."""
    if req.admin_id.strip() != ADMIN_USERNAME or req.passkey != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Administrative attestation failed. Invalid credentials.")
    
    token = create_jwt_token({
        "sub": "admin-root-vishu",
        "username": ADMIN_USERNAME,
        "role": "admin",
        "is_admin": True
    })

    return {
        "status": "success",
        "token": token,
        "admin": {
            "username": ADMIN_USERNAME,
            "role": "Central Disciplinary Administrator",
            "organization": "vXr Holdings / RAHUL FOUNDATION SOCIETY"
        }
    }

@fastapi_app.get("/api/admin/pending")
async def get_pending_users(authorization: Optional[str] = Header(None)):
    """Fetches all unapproved users and offline verification requests."""
    if not authorization or "Bearer " not in authorization:
        raise HTTPException(status_code=401, detail="Admin token required.")
    token = authorization.split("Bearer ")[1]
    claims = decode_jwt_token(token)
    if not claims or not claims.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized admin privilege.")
    
    # Query pending users
    users_res = await supabase_query("users?status=eq.pending&order=created_at.desc")
    offline_res = await supabase_query("offline_verifications?status=eq.pending&order=created_at.desc")
    
    return {
        "pending_users": users_res.json() if users_res.status_code == 200 else [],
        "offline_requests": offline_res.json() if offline_res.status_code == 200 else []
    }

@fastapi_app.post("/api/admin/approve/{user_id}")
async def approve_user(user_id: str, authorization: Optional[str] = Header(None)):
    """Approves a pending user. Supabase SQL Trigger automatically assigns `auraXXXX` username."""
    if not authorization or "Bearer " not in authorization:
        raise HTTPException(status_code=401, detail="Admin token required.")
    token = authorization.split("Bearer ")[1]
    claims = decode_jwt_token(token)
    if not claims or not claims.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized admin privilege.")
    
    patch_res = await supabase_query(
        f"users?id=eq.{user_id}",
        method="PATCH",
        data={"status": "verified"}
    )
    if patch_res.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Database error during approval.")
    
    # Fetch updated user to get generated username
    user_res = await supabase_query(f"users?id=eq.{user_id}")
    updated_user = user_res.json()[0] if user_res.status_code == 200 and len(user_res.json()) > 0 else {}

    return {
        "status": "success",
        "message": f"User {updated_user.get('full_name')} approved successfully.",
        "assigned_username": updated_user.get("username")
    }

@fastapi_app.post("/api/admin/reject/{user_id}")
async def reject_user(user_id: str, authorization: Optional[str] = Header(None)):
    """Rejects a user verification submission."""
    if not authorization or "Bearer " not in authorization:
        raise HTTPException(status_code=401, detail="Admin token required.")
    token = authorization.split("Bearer ")[1]
    claims = decode_jwt_token(token)
    if not claims or not claims.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized admin privilege.")
    
    await supabase_query(f"users?id=eq.{user_id}", method="PATCH", data={"status": "rejected"})
    return {"status": "success", "message": "User application rejected."}

@fastapi_app.post("/api/auth/offline-request")
async def submit_offline_request(req: OfflineVerificationRequest):
    """Submits manual offline HOD verification override."""
    payload = {
        "full_name": req.full_name.strip(),
        "role": req.role,
        "department": req.department.strip(),
        "hod_name": req.hod_name.strip(),
        "cabin_room": req.cabin_room.strip(),
        "reason": req.reason.strip(),
        "status": "pending"
    }
    insert_res = await supabase_query("offline_verifications", method="POST", data=payload)
    if insert_res.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to save offline verification.")
    
    return {
        "status": "success",
        "message": "Offline verification request logged. A designated coordinator will verify with your HOD."
    }

@fastapi_app.post("/api/reports/incident")
async def report_incident(req: IncidentReportRequest):
    """Logs zero-tolerance disciplinary incident into permanent audit trail."""
    payload = {
        "reporter_username": req.reporter_username,
        "offender_username": req.offender_username,
        "offender_name": req.offender_name,
        "offender_society_id": req.offender_society_id,
        "incident_type": req.incident_type,
        "notes": req.notes or "",
        "room_id": req.room_id or ""
    }
    await supabase_query("audit_reports", method="POST", data=payload)
    return {
        "status": "success",
        "message": "Disciplinary report logged in permanent Society metadata records."
    }

# ==============================================================================
# REAL-TIME MATCHMAKING & SOCKET.IO ENGINE
# ==============================================================================

# In-Memory Queue State
# Queues mapped by mode: {'video': [sid1, sid2], 'audio': [], 'text': []}
matchmaking_queues: Dict[str, List[str]] = {
    "video": [],
    "audio": [],
    "text": []
}

# Mapping: sid -> User Profile
connected_users: Dict[str, dict] = {}
# Mapping: sid -> Active Room ID
active_rooms: Dict[str, str] = {}
# Mapping: room_id -> Set of sids
room_participants: Dict[str, Set[str]] = defaultdict(set)

@sio.event
async def connect(sid, environ):
    print(f"[AURA Signaling] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[AURA Signaling] Client disconnected: {sid}")
    # Remove from any queues
    for mode, q in matchmaking_queues.items():
        if sid in q:
            q.remove(sid)
    
    # Handle active room teardown
    if sid in active_rooms:
        room_id = active_rooms.pop(sid, None)
        if room_id and room_id in room_participants:
            room_participants[room_id].discard(sid)
            # Notify peer that partner disconnected
            for other_sid in list(room_participants[room_id]):
                active_rooms.pop(other_sid, None)
                await sio.emit("peer_disconnected", {"message": "Partner left the room."}, room=other_sid)
            if len(room_participants[room_id]) == 0:
                del room_participants[room_id]
    
    connected_users.pop(sid, None)

@sio.event
async def authenticate(sid, data):
    """Attaches verified user identity to socket session."""
    token = data.get("token")
    if not token:
        await sio.emit("auth_error", {"message": "No token provided."}, room=sid)
        return
    
    claims = decode_jwt_token(token)
    if not claims:
        # Check if fallback client profile
        if data.get("user"):
            connected_users[sid] = data.get("user")
            connected_users[sid]["peerId"] = data.get("peerId")
            await sio.emit("authenticated", {"status": "ok", "user": connected_users[sid]}, room=sid)
            return
        await sio.emit("auth_error", {"message": "Invalid JWT Token."}, room=sid)
        return
    
    connected_users[sid] = {
        "id": claims.get("sub"),
        "username": claims.get("username"),
        "fullName": claims.get("full_name"),
        "role": claims.get("role"),
        "societyId": claims.get("society_id"),
        "peerId": data.get("peerId")
    }
    await sio.emit("authenticated", {"status": "ok", "user": connected_users[sid]}, room=sid)

@sio.event
async def join_queue(sid, data):
    """Enqueues user for 1-on-1 pairing with verified peer."""
    mode = data.get("mode", "video")
    if mode not in matchmaking_queues:
        mode = "video"
    
    # Ensure not already in queue or room
    for m in matchmaking_queues:
        if sid in matchmaking_queues[m]:
            matchmaking_queues[m].remove(sid)
    
    if sid in active_rooms:
        await leave_room(sid, {})

    # Check if there is another waiting peer
    q = matchmaking_queues[mode]
    if len(q) > 0:
        peer_sid = q.pop(0)
        # Create unique room ID
        room_id = f"room_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        active_rooms[sid] = room_id
        active_rooms[peer_sid] = room_id
        room_participants[room_id] = {sid, peer_sid}

        user_a = connected_users.get(sid, {"fullName": "Verified Member", "role": "Student", "username": "aura_peer_a"})
        user_b = connected_users.get(peer_sid, {"fullName": "Verified Member", "role": "Student", "username": "aura_peer_b"})

        # Notify both users with reciprocal peer information
        await sio.emit("matched", {
            "roomId": room_id,
            "mode": mode,
            "isInitiator": True,
            "partner": user_b
        }, room=sid)

        await sio.emit("matched", {
            "roomId": room_id,
            "mode": mode,
            "isInitiator": False,
            "partner": user_a
        }, room=peer_sid)
        print(f"[AURA Matchmaking] Paired {sid} and {peer_sid} in {room_id} ({mode})")
    else:
        q.append(sid)
        await sio.emit("queue_status", {"status": "waiting", "position": len(q), "mode": mode}, room=sid)

@sio.event
async def leave_queue(sid, data):
    """Cancels queue waiting state."""
    for m in matchmaking_queues:
        if sid in matchmaking_queues[m]:
            matchmaking_queues[m].remove(sid)
    await sio.emit("queue_status", {"status": "idle"}, room=sid)

@sio.event
async def leave_room(sid, data):
    """Cleanly leaves active session."""
    if sid in active_rooms:
        room_id = active_rooms.pop(sid, None)
        if room_id and room_id in room_participants:
            room_participants[room_id].discard(sid)
            for other_sid in list(room_participants[room_id]):
                active_rooms.pop(other_sid, None)
                await sio.emit("partner_left", {"message": "Peer ended the call."}, room=other_sid)
            if len(room_participants[room_id]) == 0:
                del room_participants[room_id]

@sio.event
async def chat_message(sid, data):
    """Relays sanitized text messages to room partner with XSS defense."""
    room_id = active_rooms.get(sid)
    if not room_id or room_id not in room_participants:
        return
    
    raw_text = data.get("text", "")
    safe_text = sanitize_chat_message(raw_text)
    user = connected_users.get(sid, {})

    payload = {
        "type": "chat",
        "sender": user.get("fullName", "Partner"),
        "role": user.get("role", "Member"),
        "text": safe_text,
        "messageId": data.get("messageId") or f"msg-{int(time.time()*1000)}"
    }

    for participant in room_participants[room_id]:
        if participant != sid:
            await sio.emit("chat_message", payload, room=participant)

@sio.event
async def typing(sid, data):
    """Broadcasts typing indicators."""
    room_id = active_rooms.get(sid)
    if not room_id or room_id not in room_participants:
        return
    
    user = connected_users.get(sid, {})
    for participant in room_participants[room_id]:
        if participant != sid:
            await sio.emit("typing", {
                "type": "typing",
                "isTyping": data.get("isTyping", False),
                "sender": user.get("fullName", "Partner")
            }, room=participant)

@sio.event
async def reaction(sid, data):
    """Relays message emoji reactions."""
    room_id = active_rooms.get(sid)
    if not room_id or room_id not in room_participants:
        return
    
    user = connected_users.get(sid, {})
    for participant in room_participants[room_id]:
        if participant != sid:
            await sio.emit("reaction", {
                "type": "reaction",
                "messageId": data.get("messageId"),
                "emoji": data.get("emoji"),
                "sender": user.get("fullName", "Partner")
            }, room=participant)

@sio.event
async def stage_reaction(sid, data):
    """Relays floating stage emoji reactions."""
    room_id = active_rooms.get(sid)
    if not room_id or room_id not in room_participants:
        return
    
    user = connected_users.get(sid, {})
    for participant in room_participants[room_id]:
        if participant != sid:
            await sio.emit("stage_reaction", {
                "type": "stage_reaction",
                "emoji": data.get("emoji"),
                "sender": user.get("fullName", "Partner")
            }, room=participant)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)
