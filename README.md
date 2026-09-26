# AURA // RAHUL FOUNDATION SOCIETY

A highly secure, neo-brutalist peer-to-peer web communication platform.

## Architecture

This project is divided into two distinct parts:
1. **Frontend**: A React + Vite application featuring a high-contrast Neo-Brutalist UI and WebRTC peer-to-peer logic.
2. **Backend**: A Node.js + Express backend utilizing Socket.io for matchmaking and signaling, backed by MongoDB.

---

## 🚀 Getting Started

To run this project locally, you will need to open **two terminal windows**: one for the backend, and one for the frontend.

### Prerequisites
- [Node.js](https://nodejs.org/en/) installed on your system.
- A running MongoDB instance (either local or MongoDB Atlas).
- A Google OAuth Client ID (for Google Authentication).

### 1. Setup the Backend
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend/` directory and add the following keys:
```env
PORT=10000
MONGODB_URL=mongodb://localhost:27017
DB_NAME=aura
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_JWT_SECRET=vxr-aura-jwt-super-secret-key-2025
ADMIN_USERNAME=AURA-SYS-VISHU
ADMIN_SECRET_KEY=vxr_aura_2025
ALLOWED_ORIGINS=*
```

**Start the Backend Server:**
```bash
npm run dev
```
*(The backend should start and listen on port 10000).*

### 2. Setup the Frontend
Open a new terminal window and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

**Environment Variables:**
Create a `.env` file in the `frontend/` directory and add the following keys:
```env
VITE_BACKEND_URL=http://localhost:10000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Start the Frontend Server:**
```bash
npm run dev
```
*(The frontend will start, typically on `http://localhost:5173`).*

---

## ⚙️ Features
- **Zero-Anonymity Protocol:** All members are authenticated via Google OAuth.
- **Neo-Brutalist Dashboard:** Unique high-contrast interface.
- **Real-Time Matchmaking:** Peer-to-peer Video, Voice, and Text modes.
- **Administrator Portal:** Secure management of users and platform analytics.
