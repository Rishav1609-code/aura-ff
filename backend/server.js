require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

// ==============================================================================
// ENVIRONMENT & CONFIGURATION
// ==============================================================================
const PORT = process.env.PORT || 10000;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "aura";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "your-google-client-id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret";
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || "vxr-aura-jwt-super-secret-key-2025";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "AURA-SYS-VISHU";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "vxr_aura_2025";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",");
const JWT_EXPIRATION_HOURS = 24 * 7; // 7 Days

// ==============================================================================
// EXPRESS & MONGODB SETUP
// ==============================================================================
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage');

let db;
MongoClient.connect(MONGODB_URL)
  .then(client => {
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  })
  .catch(err => console.error("MongoDB connection error:", err));

// ==============================================================================
// SECURITY UTILITIES
// ==============================================================================
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const createJwtToken = (payload) => {
  return jwt.sign(payload, SUPABASE_JWT_SECRET, { expiresIn: `${JWT_EXPIRATION_HOURS}h` });
};

const decodeJwtToken = (token) => {
  try {
    return jwt.verify(token, SUPABASE_JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const sanitizeChatMessage = (content) => {
  if (!content) return "";
  const clean = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
  return clean.substring(0, 1000).trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const checkRejectedStatus = (user) => {
  if (user.status === "rejected") {
    const err = new Error("ACCOUNT_REJECTED");
    err.status = 403;
    throw err;
  }
  if (user.is_banned) {
    const err = new Error("ACCOUNT_BANNED");
    err.status = 403;
    throw err;
  }
};

const fixId = (doc) => {
  if (doc && doc._id) {
    doc.id = doc._id.toString();
    delete doc._id;
  }
  return doc;
};

// ==============================================================================
// REST API ENDPOINTS
// ==============================================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'online' });
});

app.get('/api/stats', async (req, res) => {
  if (!db) return res.status(503).json({ error: "DB not connected" });
  const verified_count = await db.collection('users').countDocuments({ status: "verified" });
  const pending_count = await db.collection('users').countDocuments({ status: "pending" });
  const banned_count = await db.collection('users').countDocuments({ is_banned: true });
  
  res.json({
    online_count: Math.max(Object.keys(connected_users).length, 1),
    verified_members: 5000 + verified_count,
    pending_verifications: pending_count,
    banned_count: banned_count,
    active_rooms: Object.keys(active_rooms).length
  });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ detail: "Invalid input." });
    }
    
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: "User with this email already exists." });
    }
    
    const password_hash = await hashPassword(password);
    const userPayload = {
      email,
      password_hash,
      status: "incomplete",
      created_at: Date.now() / 1000,
      username: `aura_${crypto.randomBytes(3).toString('hex')}`,
      role: "Student"
    };
    
    const result = await db.collection('users').insertOne(userPayload);
    const user_id = result.insertedId.toString();
    const token = createJwtToken({ sub: user_id, email, status: "incomplete" });
    
    res.json({ status: "success", token, user: { id: user_id, email, status: "incomplete" } });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });
    
    if (!user || !(await verifyPassword(password, user.password_hash || ""))) {
      return res.status(401).json({ detail: "Invalid email or password." });
    }
    
    checkRejectedStatus(user);
    
    const user_id = user._id.toString();
    const token = createJwtToken({ sub: user_id, email: user.email, status: user.status });
    
    res.json({
      status: "success",
      token,
      user: {
        id: user_id, email: user.email, status: user.status,
        full_name: user.full_name, username: user.username
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ detail: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await googleClient.getToken(code);
    
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const full_name = payload.name;
    const picture = payload.picture;
    
    let user = await db.collection('users').findOne({ email });
    if (!user) {
      user = {
        email,
        full_name,
        picture,
        status: "incomplete",
        created_at: Date.now() / 1000,
        username: `aura_${crypto.randomBytes(3).toString('hex')}`,
        role: "Student",
        auth_provider: "google"
      };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
    }
    
    checkRejectedStatus(user);
    const user_id = user._id.toString();
    const token = createJwtToken({ sub: user_id, email: user.email, status: user.status });
    
    res.json({
      status: "success", token,
      user: { id: user_id, email: user.email, status: user.status, full_name: user.full_name }
    });
  } catch (err) {
    console.error("GOOGLE TOKEN ERROR:", err);
    res.status(err.status || 401).json({ detail: err.message || "Invalid Google token" });
  }
});

app.post('/api/auth/github', async (req, res) => {
  try {
    const { code } = req.body;
    const email = `github_${code}@mock.com`;
    
    let user = await db.collection('users').findOne({ email });
    if (!user) {
      user = {
        email,
        status: "incomplete",
        created_at: Date.now() / 1000,
        username: `aura_${crypto.randomBytes(3).toString('hex')}`,
        role: "Student",
        auth_provider: "github"
      };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
    }
    
    checkRejectedStatus(user);
    const user_id = user._id.toString();
    const token = createJwtToken({ sub: user_id, email: user.email, status: user.status });
    
    res.json({
      status: "success", token,
      user: { id: user_id, email: user.email, status: user.status, full_name: user.full_name }
    });
  } catch (err) {
    res.status(err.status || 500).json({ detail: err.message });
  }
});

app.post('/api/auth/onboarding', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ detail: "Token required." });
    }
    const token = authHeader.split(" ")[1];
    const claims = decodeJwtToken(token);
    if (!claims) return res.status(401).json({ detail: "Invalid token." });
    
    const user_id = new ObjectId(claims.sub);
    const user = await db.collection('users').findOne({ _id: user_id });
    if (!user) return res.status(404).json({ detail: "User not found." });
    
    const { full_name, mobile, id_card_url } = req.body;
    const society_id = `RFC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    
    await db.collection('users').updateOne(
      { _id: user_id },
      { $set: { full_name, mobile, id_card_url: id_card_url || "", society_id, status: "pending" } }
    );
    
    const updatedUser = await db.collection('users').findOne({ _id: user_id });
    const newToken = createJwtToken({ sub: user_id.toString(), email: updatedUser.email, status: "pending" });
    
    res.json({
      status: "success",
      token: newToken,
      user: { id: user_id.toString(), email: updatedUser.email, status: "pending", full_name }
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ detail: "Token required." });
    }
    const token = authHeader.split(" ")[1];
    const claims = decodeJwtToken(token);
    if (!claims) return res.status(401).json({ detail: "Invalid token." });
    
    const user_id = new ObjectId(claims.sub);
    const user = await db.collection('users').findOne({ _id: user_id });
    if (!user) return res.status(404).json({ detail: "User not found." });
    
    const newToken = createJwtToken({ sub: user._id.toString(), email: user.email, status: user.status });
    
    res.json({
      status: "success",
      token: newToken,
      user: { 
        id: user._id.toString(), email: user.email, status: user.status, 
        full_name: user.full_name, username: user.username, role: user.role, society_id: user.society_id
      }
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { admin_id, passkey } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "AURA-SYS-VISHU";
  const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "vxr12345";
  
  if (admin_id.trim() !== ADMIN_USERNAME || passkey !== ADMIN_SECRET_KEY) {
    return res.status(401).json({ detail: "Invalid credentials." });
  }
  const token = createJwtToken({ sub: "admin", is_admin: true });
  res.json({ status: "success", token });
});

app.post('/api/admin/auth/google', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    
    // Admins are defined either by a hardcoded fallback or if their DB profile has role: ADMIN
    let isAdmin = false;
    if (email === "arnounity1208@gmail.com") {
      isAdmin = true;
    } else {
      const user = await db.collection('users').findOne({ email });
      if (user && (user.role === "ADMIN" || user.role === "Admin")) {
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      return res.status(401).json({ detail: "Unauthorized: Insufficient root privileges." });
    }
    
    const token = createJwtToken({ sub: "admin", is_admin: true, email });
    res.json({ status: "success", token });
  } catch (err) {
    console.error("ADMIN GOOGLE AUTH ERROR:", err);
    res.status(401).json({ detail: "Invalid Google token or authorization failed." });
  }
});

app.get('/api/admin/pending', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : "";
  const claims = decodeJwtToken(token);
  if (!claims || !claims.is_admin) return res.status(403).json({ detail: "Forbidden" });
  
  const users = await db.collection('users').find({ status: "pending" }).limit(100).toArray();
  res.json({ pending_users: users.map(fixId) });
});

app.post('/api/admin/approve/:user_id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : "";
  const claims = decodeJwtToken(token);
  if (!claims || !claims.is_admin) return res.status(403).json({ detail: "Forbidden" });
  
  await db.collection('users').updateOne(
    { _id: new ObjectId(req.params.user_id) },
    { $set: { status: "verified" } }
  );
  res.json({ status: "success" });
});

app.get('/api/admin/users', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : "";
  const claims = decodeJwtToken(token);
  if (!claims || !claims.is_admin) return res.status(403).json({ detail: "Forbidden" });
  
  const users = await db.collection('users').find({}).limit(100).toArray();
  res.json({ users: users.map(fixId) });
});

app.post('/api/admin/reject/:user_id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : "";
  const claims = decodeJwtToken(token);
  if (!claims || !claims.is_admin) return res.status(403).json({ detail: "Forbidden" });
  
  await db.collection('users').updateOne(
    { _id: new ObjectId(req.params.user_id) },
    { $set: { status: "rejected", is_banned: true, ban_reason: "Verification Rejected" } }
  );
  res.json({ status: "success" });
});

// ==============================================================================
// REAL-TIME MATCHMAKING & SOCKET.IO ENGINE
// ==============================================================================
const matchmaking_queues = { video: [], audio: [], text: [] };
const connected_users = {}; // sid -> User Profile
const active_rooms = {}; // sid -> room_id
const room_participants = {}; // room_id -> Set of sids

io.on('connection', (socket) => {
  console.log(`[AURA Signaling] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[AURA Signaling] Client disconnected: ${socket.id}`);
    
    for (const mode in matchmaking_queues) {
      matchmaking_queues[mode] = matchmaking_queues[mode].filter(id => id !== socket.id);
    }
    
    if (active_rooms[socket.id]) {
      const room_id = active_rooms[socket.id];
      delete active_rooms[socket.id];
      if (room_participants[room_id]) {
        room_participants[room_id].delete(socket.id);
        for (const other_sid of room_participants[room_id]) {
          delete active_rooms[other_sid];
          io.to(other_sid).emit("peer_disconnected", { message: "Partner left the room." });
        }
        if (room_participants[room_id].size === 0) {
          delete room_participants[room_id];
        }
      }
    }
    delete connected_users[socket.id];
    const uniqueUsers = new Set(Object.values(connected_users).map(u => u.id || u.username));
    io.emit('online_count', uniqueUsers.size);
  });
  
  socket.on('authenticate', async (data) => {
    const token = data.token;
    if (!token) return socket.emit("auth_error", { message: "No token provided." });
    
    const claims = decodeJwtToken(token);
    if (!claims) {
      if (data.user) {
        connected_users[socket.id] = data.user;
        connected_users[socket.id].peerId = data.peerId;
        const uniqueUsers = new Set(Object.values(connected_users).map(u => u.id || u.username));
        io.emit('online_count', uniqueUsers.size);
        return socket.emit("authenticated", { status: "ok", user: connected_users[socket.id] });
      }
      return socket.emit("auth_error", { message: "Invalid JWT Token." });
    }
    
    const user_id = claims.sub;
    if (user_id && user_id !== "admin") {
      if (!db) return socket.emit("auth_error", { message: "Database not ready." });
      try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(user_id) });
        if (user && (user.status === "rejected" || user.is_banned)) {
          return socket.emit("auth_rejected", { message: "Account has been rejected." });
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    connected_users[socket.id] = {
      id: claims.sub,
      username: claims.username,
      fullName: claims.full_name,
      role: claims.role,
      societyId: claims.society_id,
      peerId: data.peerId
    };
    socket.emit("authenticated", { status: "ok", user: connected_users[socket.id] });
    const uniqueUsers = new Set(Object.values(connected_users).map(u => u.id || u.username));
    io.emit('online_count', uniqueUsers.size);
  });
  
  socket.on('join_queue', (data) => {
    const mode = data.mode || "video";
    
    for (const m in matchmaking_queues) {
      matchmaking_queues[m] = matchmaking_queues[m].filter(id => id !== socket.id);
    }
    
    if (active_rooms[socket.id]) {
      // Leave room cleanly first
      const room_id = active_rooms[socket.id];
      delete active_rooms[socket.id];
      if (room_participants[room_id]) {
        room_participants[room_id].delete(socket.id);
        for (const other_sid of room_participants[room_id]) {
          delete active_rooms[other_sid];
          io.to(other_sid).emit("partner_left", { message: "Peer ended the call." });
        }
        if (room_participants[room_id].size === 0) {
          delete room_participants[room_id];
        }
      }
    }
    
    if (!matchmaking_queues[mode]) matchmaking_queues[mode] = [];
    const q = matchmaking_queues[mode];
    
    if (q.length > 0) {
      const peer_sid = q.shift();
      const room_id = `room_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      active_rooms[socket.id] = room_id;
      active_rooms[peer_sid] = room_id;
      room_participants[room_id] = new Set([socket.id, peer_sid]);
      
      const user_a = connected_users[socket.id] || { fullName: "Verified Member", role: "Student", username: "aura_peer_a" };
      const user_b = connected_users[peer_sid] || { fullName: "Verified Member", role: "Student", username: "aura_peer_b" };
      
      socket.emit("matched", { roomId: room_id, mode, isInitiator: true, partner: user_b });
      io.to(peer_sid).emit("matched", { roomId: room_id, mode, isInitiator: false, partner: user_a });
      console.log(`[AURA Matchmaking] Paired ${socket.id} and ${peer_sid} in ${room_id} (${mode})`);
    } else {
      q.push(socket.id);
      socket.emit("queue_status", { status: "waiting", position: q.length, mode });
    }
  });
  
  socket.on('leave_queue', () => {
    for (const m in matchmaking_queues) {
      matchmaking_queues[m] = matchmaking_queues[m].filter(id => id !== socket.id);
    }
    socket.emit("queue_status", { status: "idle" });
  });
  
  socket.on('leave_room', () => {
    if (active_rooms[socket.id]) {
      const room_id = active_rooms[socket.id];
      delete active_rooms[socket.id];
      if (room_participants[room_id]) {
        room_participants[room_id].delete(socket.id);
        for (const other_sid of room_participants[room_id]) {
          delete active_rooms[other_sid];
          io.to(other_sid).emit("partner_left", { message: "Peer ended the call." });
        }
        if (room_participants[room_id].size === 0) {
          delete room_participants[room_id];
        }
      }
    }
  });
  
  socket.on('chat_message', (data) => {
    const room_id = active_rooms[socket.id];
    if (!room_id || !room_participants[room_id]) return;
    
    const safe_text = sanitizeChatMessage(data.text || "");
    const user = connected_users[socket.id] || {};
    const payload = {
      type: "chat",
      sender: user.fullName || "Partner",
      role: user.role || "Member",
      text: safe_text,
      messageId: data.messageId || `msg-${Date.now()}`
    };
    
    for (const participant of room_participants[room_id]) {
      if (participant !== socket.id) {
        io.to(participant).emit("chat_message", payload);
      }
    }
  });
  
  socket.on('typing', (data) => {
    const room_id = active_rooms[socket.id];
    if (!room_id || !room_participants[room_id]) return;
    const user = connected_users[socket.id] || {};
    for (const participant of room_participants[room_id]) {
      if (participant !== socket.id) {
        io.to(participant).emit("typing", {
          type: "typing", isTyping: data.isTyping || false, sender: user.fullName || "Partner"
        });
      }
    }
  });
  
  socket.on('reaction', (data) => {
    const room_id = active_rooms[socket.id];
    if (!room_id || !room_participants[room_id]) return;
    const user = connected_users[socket.id] || {};
    for (const participant of room_participants[room_id]) {
      if (participant !== socket.id) {
        io.to(participant).emit("reaction", {
          type: "reaction", messageId: data.messageId, emoji: data.emoji, sender: user.fullName || "Partner"
        });
      }
    }
  });
  
  socket.on('stage_reaction', (data) => {
    const room_id = active_rooms[socket.id];
    if (!room_id || !room_participants[room_id]) return;
    const user = connected_users[socket.id] || {};
    for (const participant of room_participants[room_id]) {
      if (participant !== socket.id) {
        io.to(participant).emit("stage_reaction", {
          type: "stage_reaction", emoji: data.emoji, sender: user.fullName || "Partner"
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`AURA Node.js Backend Engine running on port ${PORT}`);
});
