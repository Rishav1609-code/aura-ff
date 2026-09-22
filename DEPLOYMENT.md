# AURA — Production Deployment & Technical Manual
**Architected by vXr Holdings**  
*Founders: Vishu Raj (Chief Visionary Officer), Rishav Raj (Chief Executive Officer)*  
*Engineered Exclusively for RAHUL FOUNDATION SOCIETY (5,000+ Verified Members)*

---

## 1. PROJECT OVERVIEW & MISSION

**AURA** (formerly RF Nexus) is a next-generation, identity-attested peer-to-peer communication and social networking platform built to eliminate campus anonymity, toxicity, and disconnected silos across the 5,000+ students, faculty, and administrative staff of **RAHUL FOUNDATION SOCIETY**.

### Core Mission & Guiding Principles
- **Upgrading the College Mindset**: Cultivating a culture of radical friendliness, interdisciplinary collaboration, and peer mentorship across engineering, medical, computer applications, and management faculties.
- **Zero-Anonymity Protocol**: Unlike anonymous chat applications, every participant on AURA is legally and administratively verified through their official college credentials, institutional ID cards, or departmental HOD endorsements.
- **Mutual Accountability**: Active video and voice calls display verified names, roles, departmental affiliations, and official sequential Society IDs (`aura0001`, `aura0002`), ensuring zero-tolerance enforcement for disciplinary guidelines.
- **Zero-Cost Sovereign Infrastructure**: Designed to run indefinitely with zero monthly operational infrastructure costs through an optimized combination of serverless hosting, PostgreSQL row-level security, client-side WebRTC mesh networking, and free-tier cloud architectures.

---

## 2. TECH STACK & ZERO-COST INFRASTRUCTURE

| Layer | Technology | Service Provider | Monthly Cost | Scaling Capacity |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI** | HTML5, Tailwind CSS, Vanilla JS, Lenis Scroll | **Vercel** (Hobby) | **$0.00** | Unlimited static bandwidth & CDN edge delivery |
| **Backend Signaling** | Python 3, FastAPI, `python-socketio`, Uvicorn | **Render.com** (Free Web Service) | **$0.00** | 750 free monthly compute hours, automatic SSL |
| **Database & Auth** | PostgreSQL 15, Custom Triggers, Row-Level Security | **Supabase** (Free Tier) | **$0.00** | 500MB database, 50,000 monthly active users |
| **ID Storage** | Cloudinary Encrypted Image Storage | **Cloudinary** (Free Tier) | **$0.00** | 25GB managed storage & 25,000 monthly transformations |
| **Media Streaming** | PeerJS WebRTC P2P Mesh Network | **PeerJS Cloud / Free STUN** | **$0.00** | 0 server media bandwidth (direct browser-to-browser) |

---

## 3. CORE FEATURES & UI/UX ARCHITECTURE

### 🎨 Neo-Brutalist Design System
- **Hard Contrast Geometry**: Clean, high-impact visuals characterized by heavy 4px solid borders (`border-4 border-black`), sharp unrounded corners, and pure offset box shadows (`shadow-[6px_6px_0px_0px_#000]`).
- **Typographic Hierarchy**: Distinctive typography featuring **Space Grotesk** (900 Black & 700 Bold) for impactful display headers paired with clean, accessible sans-serif body copy.
- **Tactile Click Physics**: Real mechanical feedback with translated active button states (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).
- **High-Contrast Palette**: Vibrant accents featuring Vivid Yellow (`#FFE600`), Electric Cyan (`#00F0FF`), Hot Red (`#FF0055`), Neon Green (`#39FF14`), Muted Violet (`#C4B5FD`), and Warm Cream (`#FFFDF5`).

### 🚀 Lenis Smooth Scroll Engine
- High-performance inertial scrolling on the public landing page and manifesto sections using `@studio-freight/lenis`.
- Complete nested container isolation using `data-lenis-prevent` on internal scrollable feeds (chat logs, noticeboard broadcasts, and moderation modals).

### ⌨️ Tactile Mechanical UI & Keystroke Audio Engine
- **Web Audio API Synthesizer**: Custom real-time synthesis reproducing realistic mechanical typewriter key clicks with pitch variance on alphanumeric keys, a low thud for `Space`, and an affirmative return chime for `Enter`.
- **Audio Controls**: Toggleable via the dedicated System Settings modal with persistent `localStorage` preference retention.
- **Bouncy Pop-In Animations**: Springy CSS entry transitions (`chatMsgPopIn`) with cubic-bezier curves for newly arrived messages.
- **Elastic Reaction Badges**: Tactile pulse and bounce animations on message reaction counters whenever peers react with emoji tokens.

### 🛡️ Strict Verification Pipeline
1. **Dual-Mode Authentication Card**:
   - **GET VERIFIED**: Registration for new students and staff with institutional ID card image capture (drag-and-drop or file selector) and department selection.
   - **ENTER AURA**: Instant sign-in for attested users via Society ID (`RFC-XXXX`) or assigned AURA handle (`auraXXXX`).
2. **"NO ID CARD? GET APPROVED" Manual Override**:
   - Direct emergency bypass modal for new students or misplaced IDs, capturing Head of Department (HOD) details, cabin location, and verification reasoning.
3. **"VERIFICATION IN PROGRESS" Blocking Modal**:
   - Restricts unapproved users until reviewed and signed off by the central administration.
4. **Automated `auraXXXX` Generation**:
   - A Supabase PostgreSQL sequence and trigger automatically assigns the next sequential username (e.g., `aura0001`, `aura0002`, `aura0003`) the exact second an administrator approves the profile.

### 🏛️ Main User Dashboard & Society Noticeboard
- **Attested User Header**: Displays verified name, role badge, golden `auraXXXX` sequence tag, zero-anonymity protocol status, real-time verified online counter, and sign-out control.
- **Chunky Header Settings Button**: Neo-Brutalist square gear icon button (`bg-[#C4B5FD]`, `border-4 border-black`, hard shadow) positioned directly in the authenticated dashboard header.
- **Society Noticeboard**: Real-time broadcasts, exam advisories, workshop announcements, and emergency notices issued directly by campus administration.
- **Matchmaking Matrix**: Instant selection between 1-on-1 HD Video, Voice-Only, and Fast Text protocols.

### ⚡ Admin Command Center (AURA-SYS)
- **Hidden Access Protocol**: Triggered via `Ctrl + Shift + A` (or triple-clicking the AURA brand badge) and protected by `AURA-SYS-[NAME]` credentials.
- **Queue Management**: Immediate visual review of uploaded student ID cards, department credentials, and offline verification submissions.
- **One-Click Attestation**: Approves or rejects applications with instant real-time synchronization.
- **Incident Audit Trail**: Permanent logging of disciplinary infractions, harassment reports, and session metadata.

---

## 4. STEP-BY-STEP ZERO-COST DEPLOYMENT GUIDE

### Step 1: Supabase Database Setup
1. Sign in to [Supabase](https://supabase.com) and click **New Project**.
2. Name the project `aura-production`, set a secure database password, and select your nearest geographic region (e.g., `South Asia (Mumbai) - ap-south-1`).
3. In the left navigation menu, open the **SQL Editor**.
4. Create a new query, paste the complete contents of `supabase_schema.sql`, and click **Run**.
5. Verify in the **Table Editor** that the following tables and views are active:
   - `users` (with Row Level Security enabled)
   - `offline_verifications`
   - `audit_reports`
   - `aura_username_seq` (Sequence starting at 1)
6. Go to **Project Settings** > **API** and copy:
   - **Project URL** (`https://[project-ref].supabase.co`)
   - **anon / public key** (`eyJhb...`)
   - **service_role secret** (`eyJhb...` — *Keep confidential! Used exclusively on the Render backend*)

---

### Step 2: Cloudinary Encrypted Storage Setup
1. Create a free account at [Cloudinary](https://cloudinary.com).
2. From the **Dashboard**, note:
   - **Cloud Name** (e.g., `aura-rfc`)
   - **API Key** (e.g., `781234567891234`)
   - **API Secret** (e.g., `abC_Def123GHIjkl`)
3. Go to **Settings** > **Upload** > **Upload Presets** and click **Add Upload Preset**:
   - **Preset Name**: `aura_id_cards`
   - **Signing Mode**: `Unsigned` (allows direct secure client-side uploads)
   - **Folder**: `aura_society_ids`
4. Click **Save**.

---

### Step 3: Deploy FastAPI + Socket.IO Backend to Render.com
1. Push this project repository to **GitHub** or **GitLab**.
2. Log in to [Render.com](https://render.com) and select **New +** > **Web Service**.
3. Connect your repository and configure the deployment parameters:
   - **Name**: `aura-backend-api`
   - **Region**: `Singapore` (or region closest to your campus)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
   - **Instance Type**: `Free`
4. Expand the **Environment Variables** section and add all required keys (see Section 5).
5. Click **Create Web Service**.
6. Wait 2–3 minutes for the build to complete. Note your backend URL:  
   `https://aura-backend-api.onrender.com`

---

### Step 4: Deploy Unified Frontend to Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
2. Select your repository.
3. In the project settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (or directory containing `index.html`)
   - **Build Command**: Leave empty (static single-page application)
   - **Output Directory**: `./`
4. In `index.html`, verify that the backend signaling endpoint points to your live Render instance:
   ```javascript
   const AURA_BACKEND_URL = (window.AURA_CONFIG && window.AURA_CONFIG.BACKEND_URL) 
     || localStorage.getItem('aura_backend_url') 
     || 'https://aura-backend-api.onrender.com';
   ```
5. Click **Deploy**.
6. Your application will be live globally on a custom URL (e.g., `https://aura-society.vercel.app`).

---

## 5. ENVIRONMENT VARIABLES CHECKLIST

Create a `.env` file for local development and enter these exact variables into your **Render.com Web Service Settings**:

```env
# ==============================================================================
# AURA PRODUCTION ENVIRONMENT VARIABLES (Render.com + Local Backend)
# ==============================================================================

# SUPABASE POSTGRESQL & AUTH
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=vxr_aura_super_secret_jwt_signing_key_2025_prod

# CLOUDINARY ENCRYPTED ASSET STORAGE
CLOUDINARY_CLOUD_NAME=aura-rfc-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# CENTRAL ADMIN ATTESTATION CREDENTIALS
ADMIN_USERNAME=AURA-SYS-VISHU
ADMIN_SECRET_KEY=vxr_aura_2025

# NETWORKING & SECURITY
ALLOWED_ORIGINS=*
PORT=10000
```

---

## 6. PRODUCTION VERIFICATION & TEST RUNBOOK

Execute this quick 4-step checklist to confirm full operational readiness:

1. **User Registration & Proof of Storage**:
   - Navigate to the live Vercel URL.
   - Click **GET VERIFIED**, fill in student information, attach a sample ID image, and submit.
   - Confirm that the "VERIFICATION IN PROGRESS" blocking modal appears.
2. **Administrative Approval & Trigger Execution**:
   - Open the admin login modal using `Ctrl + Shift + A` (or triple-clicking the AURA header logo).
   - Sign in with `AURA-SYS-VISHU` and passkey `vxr_aura_2025`.
   - Click **APPROVE** on the pending applicant.
   - Confirm that the database trigger assigns `aura0001` (or the next sequence integer) and stamps the approval timestamp.
3. **Attested Login & Dashboard Verification**:
   - Log in with the registered credentials.
   - Verify the golden `aura0001` badge, the chunky header Settings button (`⚙️`), and the live member ticker.
4. **P2P Audio/Video & Keystroke Audio Test**:
   - Open two browser windows (or separate devices).
   - Enter matchmaking queue on both and confirm instant WebRTC media streaming, mechanical typing sounds, and message reaction badges.

---

*© 2025–2026 vXr Holdings. Built with pride for Rahul Foundation Society.*
