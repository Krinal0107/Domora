# Domora — Complete Setup Guide

Next-generation real estate platform for Surat, Gujarat.
Built with Next.js 14, Express, MongoDB, Solana (Anchor), and OpenAI.

---

## Table of Contents

1. [What Was Built](#1-what-was-built)
2. [Project Structure](#2-project-structure)
3. [All Dummy / Placeholder Values — What to Replace](#3-all-dummy--placeholder-values--what-to-replace)
4. [Prerequisites — Install These First](#4-prerequisites--install-these-first)
5. [Service Accounts — Get Your Keys](#5-service-accounts--get-your-keys)
6. [Backend Setup](#6-backend-setup)
7. [Frontend Setup](#7-frontend-setup)
8. [Solana Smart Contract Setup](#8-solana-smart-contract-setup)
9. [Run Everything Locally](#9-run-everything-locally)
10. [Docker (All-in-one)](#10-docker-all-in-one)
11. [Production Deployment](#11-production-deployment)
12. [Environment Variables — Full Reference](#12-environment-variables--full-reference)
13. [API Reference](#13-api-reference)
14. [Solana Program Instructions](#14-solana-program-instructions)
15. [What Works Without Keys](#15-what-works-without-keys)
16. [Common Errors & Fixes](#16-common-errors--fixes)

---

## 1. What Was Built

| Layer | What it does |
|---|---|
| **Frontend** | Next.js 14 App — home, property listings, detail pages, reels feed, investment dashboard, chat, dashboard, admin panel |
| **Backend** | Express REST API — auth, properties, leads, chat, negotiations, visits, KYC, AI, admin |
| **Database** | MongoDB — 8 models with indexes |
| **Blockchain** | Solana Anchor program — property registry, escrow, dual-signature agreements |
| **AI** | OpenAI GPT-4o-mini — chatbot, recommendations, ROI predictions |
| **Auth** | JWT + Google OAuth + Phantom wallet login |
| **Storage** | AWS S3 — property images, KYC documents, reel videos |
| **Realtime** | Socket.io — live chat, notifications |

---

## 2. Project Structure

```
surat-realestate/
│
├── frontend/                        ← Next.js 14 (TypeScript)
│   ├── app/
│   │   ├── page.tsx                 ← Home page
│   │   ├── layout.tsx               ← Root layout + providers
│   │   ├── globals.css              ← Tailwind base styles
│   │   ├── login/page.tsx           ← Login page
│   │   ├── register/page.tsx        ← Register page
│   │   ├── auth/callback/page.tsx   ← Google OAuth callback handler
│   │   ├── properties/
│   │   │   ├── page.tsx             ← Listing grid + map + filters
│   │   │   └── [id]/page.tsx        ← Property detail page
│   │   ├── reels/page.tsx           ← Vertical scroll reel feed
│   │   ├── investment/page.tsx      ← ROI calculator + area insights
│   │   ├── chat/page.tsx            ← Real-time chat interface
│   │   └── dashboard/
│   │       ├── page.tsx             ← Owner/broker dashboard
│   │       ├── list-property/       ← Multi-step property listing form
│   │       └── admin/page.tsx       ← Admin panel (verify, KYC, users)
│   ├── components/
│   │   ├── Navbar.tsx               ← Responsive nav + theme toggle
│   │   ├── PropertyCard.tsx         ← Card with save, badge, price
│   │   ├── PropertyFilters.tsx      ← Sidebar filter panel
│   │   ├── PropertyMap.tsx          ← Leaflet map with markers
│   │   ├── AIChat.tsx               ← Floating AI chatbot
│   │   ├── AreaInsights.tsx         ← 19-area Surat intelligence cards
│   │   ├── LeadForm.tsx             ← Contact owner modal
│   │   ├── ScheduleVisit.tsx        ← Book a site visit modal
│   │   ├── NegotiationModal.tsx     ← Make offer / counter offer
│   │   ├── InvestmentCalculator.tsx ← ROI + rental yield widget
│   │   ├── WalletProvider.tsx       ← Phantom wallet context
│   │   └── ui/                      ← ShadCN-style button, input
│   ├── lib/
│   │   ├── api.ts                   ← Axios client (auto-attaches JWT)
│   │   ├── utils.ts                 ← formatPrice, formatDate, cn()
│   │   └── constants.ts             ← Area insights data (client copy)
│   ├── store/authStore.ts           ← Zustand auth state (persisted)
│   ├── hooks/useSocket.ts           ← Socket.io singleton hook
│   ├── types/index.ts               ← Re-exports from shared/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.local.example           ← COPY THIS to .env.local
│
├── backend/                         ← Express + MongoDB API
│   ├── server.js                    ← Entry point, Socket.io init
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection
│   │   └── passport.js              ← JWT + Google OAuth strategies
│   ├── models/
│   │   ├── User.js                  ← Role, KYC status, wallet, alerts
│   │   ├── Property.js              ← Full listing model + 2dsphere index
│   │   ├── Lead.js                  ← Buyer enquiries
│   │   ├── Message.js               ← Chat messages + conversations
│   │   ├── Negotiation.js           ← Offer → counter → accept flow
│   │   ├── Visit.js                 ← Scheduled site visits
│   │   ├── KYC.js                   ← Document uploads + status
│   │   └── Notification.js          ← In-app notifications
│   ├── routes/
│   │   ├── auth.js                  ← register, login, Google, wallet
│   │   ├── property.js              ← CRUD + image/video upload
│   │   ├── user.js                  ← Profile, save, alerts, wallet link
│   │   ├── leads.js                 ← Submit + manage leads
│   │   ├── chat.js                  ← Conversations + messages
│   │   ├── negotiation.js           ← Offer lifecycle
│   │   ├── visit.js                 ← Schedule + status update
│   │   ├── kyc.js                   ← Upload + admin review
│   │   ├── ai.js                    ← Chatbot, recommend, ROI, area
│   │   └── admin.js                 ← Stats, verify listings, manage users
│   ├── middleware/
│   │   ├── auth.js                  ← JWT protect + optionalAuth
│   │   ├── roleCheck.js             ← authorize('admin','broker',...)
│   │   ├── rateLimit.js             ← General, auth, AI rate limits
│   │   ├── upload.js                ← Multer + S3 upload helpers
│   │   └── validate.js              ← express-validator error handler
│   ├── services/
│   │   └── fraudDetection.js        ← Price-anomaly + language scoring
│   ├── socket/
│   │   └── chatHandler.js           ← Socket.io events (join, message, typing)
│   ├── utils/
│   │   └── areaData.js              ← All 19 Surat area insights (server copy)
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example                 ← COPY THIS to .env
│
├── solana/                          ← Anchor smart contract
│   ├── Anchor.toml                  ← Network + program ID config
│   ├── Cargo.toml                   ← Workspace definition
│   ├── programs/real_estate/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs               ← Full Rust smart contract
│   ├── tests/
│   │   └── real_estate.ts           ← 7 end-to-end tests
│   └── app/
│       ├── deploy.ts                ← Deployment helper script
│       └── package.json
│
├── shared/                          ← TypeScript types used by both
│   ├── types/index.ts               ← All interfaces & enums
│   └── utils/
│       ├── constants.ts             ← Area data + amenities list
│       └── formatters.ts            ← formatPrice, formatDate, ROI calc
│
├── docker-compose.yml               ← Runs mongo + backend + frontend
└── README.md                        ← This file
```

---

## 3. All Dummy / Placeholder Values — What to Replace

> **Read this section carefully before running the project.**
> Every `XXXX`, `your_`, and `dummy` value listed below must be replaced with a real value.

### 3.1 Solana Program ID — MOST IMPORTANT

The placeholder `SuRtEsTaTePRoGrAmIdXXXXXXXXXXXXXXXXXXXXXXXX` appears in **4 files**.
After you run `anchor deploy`, you get a real 44-character base58 program ID.
Replace the placeholder in all 4 places:

| File | Line | What to replace |
|---|---|---|
| `solana/programs/real_estate/src/lib.rs` | 3 | `declare_id!("SuRtEsTaTePRoGrAmId...")` |
| `solana/Anchor.toml` | 6 | `real_estate = "SuRtEsTaTePRoGrAmId..."` |
| `shared/utils/constants.ts` | last line | `export const PROGRAM_ID = 'SuRtEsTaTePRoGrAmId...'` |
| `backend/.env` (after copy) | bottom | `SOLANA_PROGRAM_ID=SuRtEsTaTePRoGrAmId...` |
| `frontend/.env.local` (after copy) | last line | `NEXT_PUBLIC_PROGRAM_ID=SuRtEsTaTePRoGrAmId...` |

**How to get the real ID:**
```bash
cd solana
anchor build
anchor deploy --provider.cluster devnet
# Output will say: Program Id: <YOUR_REAL_ID_HERE>
```

---

### 3.2 Backend `.env` — All Placeholders

Copy first:
```bash
cd backend
cp .env.example .env
```

Then open `backend/.env` and replace each value:

| Variable | Placeholder | Replace with | Where to get it |
|---|---|---|---|
| `MONGODB_URI` | `mongodb+srv://username:password@cluster...` | Your Atlas connection string | See §5.1 |
| `JWT_SECRET` | `your_super_secret_jwt_key_here_min_32_chars` | Any random 32+ char string | Run: `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | `your_google_client_id` | Your OAuth client ID | See §5.2 |
| `GOOGLE_CLIENT_SECRET` | `your_google_client_secret` | Your OAuth client secret | See §5.2 |
| `OPENAI_API_KEY` | `sk-your-openai-api-key` | Your real OpenAI key | See §5.3 |
| `AWS_ACCESS_KEY_ID` | `your_aws_access_key` | Your IAM access key | See §5.4 |
| `AWS_SECRET_ACCESS_KEY` | `your_aws_secret_key` | Your IAM secret | See §5.4 |
| `AWS_BUCKET_NAME` | `surat-realestate-uploads` | Your S3 bucket name | See §5.4 |
| `EMAIL_USER` | `your@gmail.com` | Your Gmail address | See §5.5 |
| `EMAIL_PASS` | `your_app_password` | Gmail App Password | See §5.5 |
| `SOLANA_PROGRAM_ID` | `SuRtEsTaTePRoGrAmId...` | Real program ID after deploy | See §3.1 |

---

### 3.3 Frontend `.env.local` — All Placeholders

Copy first:
```bash
cd frontend
cp .env.local.example .env.local
```

Then open `frontend/.env.local` and replace:

| Variable | Placeholder | Replace with |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Keep for local dev. For prod: your Railway/Render URL |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:5000` | Keep for local dev. For prod: your backend URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | `your_google_maps_key` | See §5.6 (optional — only for enhanced map) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | Keep as `devnet` for testing |
| `NEXT_PUBLIC_PROGRAM_ID` | `SuRtEsTaTePRoGrAmId...` | Real program ID after deploy |

---

## 4. Prerequisites — Install These First

### Node.js (required for frontend + backend)
```bash
# Check if installed
node --version   # need v20+

# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

### MongoDB (required — choose one option)

**Option A: Local MongoDB**
```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community@7.0
brew services start mongodb-community@7.0
# Connection string: mongodb://localhost:27017/surat-realestate
```

**Option B: MongoDB Atlas (cloud — recommended for production)**
See §5.1 below.

### Rust + Solana + Anchor (required for smart contract only)
```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 3. Install Anchor via avm
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# 4. Verify
solana --version    # solana-cli 1.18.x
anchor --version    # anchor-cli 0.29.x
```

### Git
```bash
git --version  # should already be installed
```

---

## 5. Service Accounts — Get Your Keys

### 5.1 MongoDB Atlas (Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account → Create a free M0 cluster
3. Under **Security → Database Access**: Add a user with password
4. Under **Security → Network Access**: Add `0.0.0.0/0` (allow all IPs for dev)
5. Click **Connect → Connect your application**
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abc12.mongodb.net/surat-realestate?retryWrites=true&w=majority
   ```
7. Replace `myuser` and `mypassword` with your actual credentials
8. Paste into `backend/.env` as `MONGODB_URI`

---

### 5.2 Google OAuth (for "Sign in with Google")

> Skip this if you don't need Google login. Email/password login still works.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → name it "SuratEstate"
3. Go to **APIs & Services → OAuth consent screen**
   - User type: External
   - App name: SuratEstate
   - Add your email
   - Save
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
   - For production: also add `https://your-backend.railway.app/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**
6. Paste into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-yourSecret
   ```

---

### 5.3 OpenAI API Key (for AI features)

> Without this: AI chatbot, recommendations, and ROI AI insights won't work. Everything else works fine.

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Log in
3. Go to **API Keys → Create new secret key**
4. Copy the key (starts with `sk-...`) — you only see it once
5. Paste into `backend/.env`:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
   ```
6. Add billing: go to **Billing → Add payment method** (GPT-4o-mini is very cheap — ~$0.15/million tokens)

---

### 5.4 AWS S3 (for file/image uploads)

> Without this: property image upload, KYC document upload, and reel video upload won't work.

1. Go to [aws.amazon.com](https://aws.amazon.com) → Create account
2. Go to **S3 → Create bucket**
   - Bucket name: `surat-realestate-uploads` (or any name)
   - Region: `ap-south-1` (Mumbai — closest to Surat)
   - Uncheck "Block all public access"
   - Save
3. Go to **IAM → Users → Create user** → name it `surat-realestate-app`
   - Attach policy: `AmazonS3FullAccess`
   - Create user → **Security credentials → Create access key**
   - Copy **Access Key ID** and **Secret Access Key**
4. Paste into `backend/.env`:
   ```
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_REGION=ap-south-1
   AWS_BUCKET_NAME=surat-realestate-uploads
   ```
5. Add a bucket policy to allow public read (for viewing images):
   - Go to your bucket → **Permissions → Bucket Policy** → paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicRead",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::surat-realestate-uploads/*"
     }]
   }
   ```

---

### 5.5 Gmail App Password (for email notifications)

> Without this: email notifications won't send. Nothing breaks — it just silently skips.

1. Go to your Google account → **Security**
2. Enable **2-Step Verification** (required)
3. Go to **App passwords** → Select app: Mail → Select device: Other → name it "SuratEstate"
4. Copy the 16-char password (no spaces)
5. Paste into `backend/.env`:
   ```
   EMAIL_USER=yourname@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop   ← remove spaces → abcdefghijklmnop
   ```

---

### 5.6 Google Maps API Key (optional — enhances map markers)

> Without this: OpenStreetMap (Leaflet) is used for free with no key needed. Google Maps is optional.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Maps JavaScript API**
3. Create an API key under **Credentials**
4. Paste into `frontend/.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

### 5.7 Phantom Wallet (for Solana features)

> Only needed by end users in their browser. No backend key needed.

1. Install [Phantom wallet extension](https://phantom.app) in Chrome/Brave
2. Create a wallet → switch to **Devnet** network:
   - Click Settings → Developer Settings → Change Network → Devnet
3. Get devnet SOL from [faucet.solana.com](https://faucet.solana.com)

---

## 6. Backend Setup

```bash
# Step 1: Go to backend folder
cd surat-realestate/backend

# Step 2: Copy env file
cp .env.example .env

# Step 3: Open .env and fill in your values (see §3.2 and §5)
# At minimum fill: MONGODB_URI and JWT_SECRET
# Others are optional for basic testing (see §15)

# Step 4: Generate a secure JWT_SECRET if you don't have one
openssl rand -hex 32
# Copy the output and paste as JWT_SECRET in .env

# Step 5: Install dependencies
npm install

# Step 6: Start development server
npm run dev
# Server starts at http://localhost:5000
# You should see: "MongoDB connected: cluster0.xxx.mongodb.net"
# You should see: "Server running on port 5000 in development mode"
```

**Verify backend is working:**
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 7. Frontend Setup

```bash
# Step 1: Go to frontend folder
cd surat-realestate/frontend

# Step 2: Copy env file
cp .env.local.example .env.local

# Step 3: Open .env.local — for local dev, the defaults are fine
# Only change if you renamed backend port or need production URLs

# Step 4: Install dependencies
npm install

# Step 5: Start development server
npm run dev
# Frontend starts at http://localhost:3000
```

**Open in browser:** [http://localhost:3000](http://localhost:3000)

---

## 8. Solana Smart Contract Setup

> You need both the backend AND frontend running before this matters.
> The app works without Solana — blockchain features just won't be active.

### Step 1: Create a Solana wallet for deployment
```bash
# Generate a new keypair (saved at ~/.config/solana/id.json)
solana-keygen new --outfile ~/.config/solana/id.json

# Set network to devnet
solana config set --url devnet

# Check your wallet address
solana address

# Get free devnet SOL
solana airdrop 2
# If faucet fails, use: https://faucet.solana.com
```

### Step 2: Build the program
```bash
cd surat-realestate/solana
anchor build
# This compiles the Rust code
# Output: target/deploy/real_estate.so
```

### Step 3: Get your program ID
```bash
# The keypair for your program is at:
solana address -k target/deploy/real_estate-keypair.json
# This is YOUR real program ID — copy it
```

### Step 4: Replace the placeholder program ID
Replace `SuRtEsTaTePRoGrAmIdXXXXXXXXXXXXXXXXXXXXXXXX` with your real ID in:

```bash
# File 1: Rust contract
# solana/programs/real_estate/src/lib.rs  line 3
declare_id!("YOUR_REAL_PROGRAM_ID_HERE");

# File 2: Anchor config
# solana/Anchor.toml  line 6
real_estate = "YOUR_REAL_PROGRAM_ID_HERE"

# File 3: Shared constants
# shared/utils/constants.ts  last line
export const PROGRAM_ID = 'YOUR_REAL_PROGRAM_ID_HERE';

# File 4: Backend env
# backend/.env
SOLANA_PROGRAM_ID=YOUR_REAL_PROGRAM_ID_HERE

# File 5: Frontend env
# frontend/.env.local
NEXT_PUBLIC_PROGRAM_ID=YOUR_REAL_PROGRAM_ID_HERE
```

### Step 5: Build again after updating the ID
```bash
anchor build
```

### Step 6: Deploy to devnet
```bash
anchor deploy --provider.cluster devnet
# Output: Program Id: YOUR_REAL_PROGRAM_ID_HERE
# Signature: <transaction_signature>
```

### Step 7: Run tests
```bash
anchor test --provider.cluster devnet
# All 7 tests should pass:
# ✓ Registers a property on-chain
# ✓ Verifies a property
# ✓ Updates property price
# ✓ Creates an escrow for property purchase
# ✓ Releases escrow to seller
# ✓ Creates a sale agreement
# ✓ Both parties sign the agreement
# ✓ Completes the agreement
# ✓ Deactivates the property after sale
```

---

## 9. Run Everything Locally

### Terminal 1 — Backend
```bash
cd surat-realestate/backend
npm run dev
# ✓ Running at http://localhost:5000
```

### Terminal 2 — Frontend
```bash
cd surat-realestate/frontend
npm run dev
# ✓ Running at http://localhost:3000
```

### Access the App
| URL | What you see |
|---|---|
| http://localhost:3000 | Home page |
| http://localhost:3000/properties | Property listings |
| http://localhost:3000/reels | Vertical reel feed |
| http://localhost:3000/investment | ROI dashboard |
| http://localhost:3000/register | Create account |
| http://localhost:3000/login | Sign in |
| http://localhost:3000/dashboard | Owner/broker dashboard (login required) |
| http://localhost:3000/dashboard/admin | Admin panel (admin role required) |
| http://localhost:3000/chat | Chat (login required) |
| http://localhost:5000/api/health | Backend health check |

### Create an Admin User
After registering normally, update the user role in MongoDB:
```bash
# Using MongoDB Compass or Atlas UI:
# Collection: users
# Find your user by email
# Update: { role: "admin" }

# Or using mongosh:
mongosh "your_connection_string"
use surat-realestate
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 10. Docker (All-in-one)

Runs MongoDB + backend + frontend together.

```bash
cd surat-realestate

# Step 1: Create a .env file in the root with these values:
cat > .env << 'EOF'
JWT_SECRET=replace_with_openssl_rand_hex_32_output
OPENAI_API_KEY=sk-your-openai-key
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF

# Step 2: Start all services
docker-compose up -d

# Step 3: View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Step 4: Stop
docker-compose down

# Stop and remove all data
docker-compose down -v
```

**Note:** The Docker setup uses a local MongoDB container.
For production, replace the MongoDB service with your Atlas URI in `docker-compose.yml`.

---

## 11. Production Deployment

### Frontend → Vercel (free tier available)

```bash
cd surat-realestate/frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Project Settings → Environment Variables
# Add all variables from .env.local (use production values)
```

Production env vars to set in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=your_real_program_id
```

---

### Backend → Railway (free $5 credit)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Connect your GitHub repo → select the repo
3. Set **Root Directory** to `backend`
4. Add all environment variables from `backend/.env` in Railway dashboard
5. Railway auto-detects Node.js and runs `npm start`
6. Copy the Railway URL (e.g. `https://surat-realestate-backend.railway.app`)
7. Update `FRONTEND_URL` in Railway env vars to your Vercel URL
8. Update `NEXT_PUBLIC_API_URL` in Vercel to `https://your-railway-url/api`

**Also update Google OAuth redirect URI:**
- Go back to Google Console → Credentials
- Add: `https://your-railway-url/api/auth/google/callback`

---

### Backend → Render (alternative, free tier)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect GitHub → select repo → set **Root Directory** to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all env vars from `backend/.env`

---

### MongoDB → Atlas (production)

Already covered in §5.1. For production:
- Use M10+ cluster (paid) for better performance
- Enable IP allowlist (add only your backend's IP)
- Enable backup

---

## 12. Environment Variables — Full Reference

### `backend/.env` (complete)

```bash
# ── Server ──────────────────────────────────────────
PORT=5000
# Port the Express server listens on. Railway/Render auto-set this.

NODE_ENV=development
# "development" or "production". Affects error verbosity and logging.

# ── Database ────────────────────────────────────────
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/surat-realestate
# Full MongoDB connection string.
# Local: mongodb://localhost:27017/surat-realestate
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# ── Authentication ───────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
# Secret key for signing JWTs. Use: openssl rand -hex 32
# Must be at least 32 characters. Never commit this.

JWT_EXPIRE=7d
# How long JWT tokens last. Format: 7d, 24h, 60m, etc.

# ── Google OAuth ─────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
# From Google Cloud Console → Credentials → OAuth 2.0 Client IDs

GOOGLE_CLIENT_SECRET=your_google_client_secret
# From same page as above

GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
# Must match exactly what you put in Google Console.
# For production: https://your-backend-url/api/auth/google/callback

# ── OpenAI ───────────────────────────────────────────
OPENAI_API_KEY=sk-your-openai-api-key
# From platform.openai.com → API Keys
# Used for: AI chatbot, property recommendations, ROI AI insights

# ── AWS S3 ───────────────────────────────────────────
AWS_ACCESS_KEY_ID=your_aws_access_key
# From AWS IAM → Users → your user → Security credentials

AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# Generated alongside the access key. Only shown once.

AWS_REGION=ap-south-1
# S3 bucket region. ap-south-1 = Mumbai (closest to Surat)

AWS_BUCKET_NAME=surat-realestate-uploads
# Your S3 bucket name. Must match what you created.

# ── Frontend URL ─────────────────────────────────────
FRONTEND_URL=http://localhost:3000
# Used for CORS and OAuth redirects.
# For production: https://your-app.vercel.app

# ── Email ────────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
# Your Gmail address

EMAIL_PASS=your_app_password
# Gmail App Password (NOT your Gmail password).
# Generate at: Google Account → Security → App Passwords

# ── Solana ───────────────────────────────────────────
SOLANA_NETWORK=devnet
# "devnet" for testing, "mainnet-beta" for production

SOLANA_PROGRAM_ID=SuRtEsTaTePRoGrAmIdXXXXXXXXXXXXXXXXXXXXXXXX
# Replace after running: anchor deploy --provider.cluster devnet
```

---

### `frontend/.env.local` (complete)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Backend API base URL.
# For production: https://your-backend.railway.app/api

NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
# Backend Socket.io URL (without /api).
# For production: https://your-backend.railway.app

NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
# Optional. Only needed if replacing Leaflet map with Google Maps.
# Leave blank to use free OpenStreetMap (Leaflet) — works out of the box.

NEXT_PUBLIC_SOLANA_NETWORK=devnet
# "devnet" for testing. Change to "mainnet-beta" only after full audit.

NEXT_PUBLIC_PROGRAM_ID=SuRtEsTaTePRoGrAmIdXXXXXXXXXXXXXXXXXXXXXXXX
# Replace with your real Solana program ID after anchor deploy.
```

---

## 13. API Reference

All routes are prefixed with `/api`.

### Auth
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | No | `name, email, password, role?` | Register new user |
| POST | `/auth/login` | No | `email, password` | Login, returns JWT |
| GET | `/auth/google` | No | — | Redirect to Google OAuth |
| GET | `/auth/google/callback` | No | — | Google OAuth callback |
| POST | `/auth/wallet-login` | No | `walletAddress, name?` | Login with Phantom wallet |
| GET | `/auth/me` | JWT | — | Get current user |
| POST | `/auth/logout` | JWT | — | Logout |

### Properties
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/properties` | Optional | List with filters. Query: `listingType, type, area, minPrice, maxPrice, bedrooms, isVerified, sortBy, page, limit, search` |
| GET | `/properties/featured` | No | Featured properties (homepage) |
| GET | `/properties/area-insights` | No | All 19 Surat area data |
| GET | `/properties/my-listings` | JWT | Current user's listings |
| GET | `/properties/reels` | No | Reel feed (paginated) |
| GET | `/properties/:id` | Optional | Single property detail |
| POST | `/properties` | JWT | Create new listing |
| PUT | `/properties/:id` | JWT | Update listing (owner only) |
| DELETE | `/properties/:id` | JWT | Delete listing (owner/admin) |
| POST | `/properties/:id/images` | JWT | Upload images (multipart) |
| POST | `/properties/:id/video` | JWT | Upload reel video (multipart) |

### AI
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/ai/chat` | Optional | `message, history[]` | AI chatbot response + matching properties |
| POST | `/ai/recommend` | Optional | `budget{min,max}, type, area[], bedrooms[], purpose` | AI property recommendations |
| POST | `/ai/roi-predict` | No | `area, type, purchasePrice, holdingYears` | ROI + rental yield + AI insight |
| GET | `/ai/area-analysis/:area` | No | — | Area stats + recent sales |

### Leads
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/leads` | Optional | `propertyId, name, email, phone, message?` | Submit enquiry |
| GET | `/leads/my-leads` | JWT | — | Seller's incoming leads |
| PUT | `/leads/:id/status` | JWT | `status, notes?, followUpDate?` | Update lead status |

### Chat
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/chat/conversations` | JWT | List all conversations |
| POST | `/chat/conversations` | JWT | Create/find conversation |
| GET | `/chat/conversations/:id/messages` | JWT | Get messages (paginated) |
| POST | `/chat/conversations/:id/messages` | JWT | Send message |

### Negotiations
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/negotiations` | JWT | `propertyId, offerAmount, message?` | Make offer |
| GET | `/negotiations/my` | JWT | — | All negotiations (buyer + seller) |
| GET | `/negotiations/:id` | JWT | — | Single negotiation detail |
| POST | `/negotiations/:id/respond` | JWT | `action, counterAmount?, message?` | Accept/reject/counter |

### Visits
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/visits` | JWT | `propertyId, scheduledAt, notes?` | Schedule visit |
| GET | `/visits/my` | JWT | — | User's visits (visitor + owner) |
| PUT | `/visits/:id/status` | JWT | `status, feedback?, rating?, newDateTime?` | Update visit status |

### KYC
| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/kyc` | JWT | `document (file), docType, propertyId?` | Upload document |
| GET | `/kyc/my` | JWT | — | User's documents |
| GET | `/kyc/pending` | Admin | — | All pending documents |
| PUT | `/kyc/:id/review` | Admin | `status, rejectionReason?` | Approve/reject document |

### Admin
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Platform overview stats |
| GET | `/admin/properties/pending` | Admin | Unverified listings |
| PUT | `/admin/properties/:id/verify` | Admin | Approve/reject listing |
| PUT | `/admin/properties/:id/feature` | Admin | Feature a listing |
| GET | `/admin/users` | Admin | List users with filters |
| PUT | `/admin/users/:id/role` | Admin | Change user role |

### Socket.io Events
| Event (emit) | Payload | Description |
|---|---|---|
| `join_conversation` | `conversationId` | Join a chat room |
| `leave_conversation` | `conversationId` | Leave a chat room |
| `typing` | `{conversationId, isTyping}` | Typing indicator |
| `send_message` | `{conversationId, content}` | Send a message |

| Event (listen) | Payload | Description |
|---|---|---|
| `receive_message` | message object | New message received |
| `user_typing` | `{userId, isTyping}` | Other user is typing |
| `notification` | `{type, ...data}` | Lead/offer/KYC notification |
| `negotiation_update` | `{id, status, action}` | Offer response |

---

## 14. Solana Program Instructions

All on-chain instructions in `solana/programs/real_estate/src/lib.rs`:

| Instruction | Accounts | Arguments | What it does |
|---|---|---|---|
| `register_property` | owner (signer), property_record (PDA), system_program | property_id, document_hash, price_lamports, metadata_uri | Creates on-chain property record with document hash |
| `verify_property` | verifier (signer), property_record | document_hash | Marks property as verified if hash matches |
| `update_property_price` | owner (signer), property_record | new_price_lamports | Updates listing price |
| `deactivate_property` | owner (signer), property_record | — | Marks property as sold/inactive |
| `create_escrow` | buyer (signer, pays), seller, escrow (PDA), system_program | property_id, amount_lamports, agreement_hash | Locks buyer funds in escrow PDA |
| `release_escrow` | buyer (signer), escrow, seller | — | Releases funds to seller (buyer confirms deal) |
| `refund_escrow` | seller (signer), escrow, buyer | — | Returns funds to buyer (seller cancels) |
| `create_agreement` | buyer (signer), seller, agreement (PDA), system_program | property_id, agreement_hash, agreement_type, amount_lamports | Creates sale/rent agreement |
| `sign_agreement_buyer` | signer (buyer), agreement | — | Buyer signs agreement |
| `sign_agreement_seller` | signer (seller), agreement | — | Seller signs. Both signed → state = Active |
| `complete_agreement` | authority (signer), agreement | — | Marks agreement complete |

**PDAs (Program Derived Addresses):**
```
property_record PDA = ["property", owner_pubkey, property_id]
escrow PDA          = ["escrow", buyer_pubkey, property_id]
agreement PDA       = ["agreement", buyer_pubkey, seller_pubkey, property_id]
```

---

## 15. What Works Without Keys

You can run the app with just `MONGODB_URI` and `JWT_SECRET` filled in.
Everything else is optional for testing:

| Feature | Required Key | Works without? |
|---|---|---|
| User registration/login | JWT_SECRET | ✅ Yes (required) |
| Property listings (browse) | — | ✅ Yes |
| Property map (Leaflet) | — | ✅ Yes (uses OpenStreetMap) |
| Dashboard, leads, visits | MONGODB_URI + JWT | ✅ Yes |
| Real-time chat | — | ✅ Yes (Socket.io runs in-process) |
| Smart negotiations | — | ✅ Yes |
| AI chatbot | OPENAI_API_KEY | ❌ No — returns 500 error |
| AI recommendations | OPENAI_API_KEY | ❌ No |
| AI ROI prediction | OPENAI_API_KEY | Partial — numbers work, AI insight fails |
| Image/video upload | AWS S3 keys | ❌ No — upload fails |
| KYC document upload | AWS S3 keys | ❌ No |
| Google login | GOOGLE_CLIENT_ID/SECRET | ❌ No |
| Email notifications | EMAIL_USER/PASS | ❌ No (silently skipped) |
| Blockchain verification | Solana deployed | ❌ No (blockchain tab inactive) |
| Phantom wallet login | Phantom extension | ❌ No |

---

## 16. Common Errors & Fixes

### `MongoServerError: bad auth` or `Authentication failed`
- Wrong username/password in `MONGODB_URI`
- Check Atlas Database Access → user credentials
- Ensure `?authSource=admin` if using Docker local Mongo

### `JsonWebTokenError: invalid signature`
- `JWT_SECRET` in `.env` changed after users were created
- All existing tokens are now invalid — users must log in again

### `Error: Cannot find module 'openai'`
```bash
cd backend && npm install
```

### `CORS error` in browser
- `FRONTEND_URL` in `backend/.env` must exactly match where frontend runs
- e.g. if frontend is at `http://localhost:3000`, set `FRONTEND_URL=http://localhost:3000`
- No trailing slash

### `Anchor build failed: proc-macro`
```bash
rustup update
cargo clean
anchor build
```

### `Error: Account does not exist` (Solana tests)
- You haven't airdropped devnet SOL
```bash
solana airdrop 2
solana balance
```

### `rate limit exceeded` (AI endpoints)
- Too many requests. Default: 20 AI calls/minute
- Change in `backend/middleware/rateLimit.js` → `aiLimiter` → `max: 20`

### `Image not loading` in production
- S3 bucket doesn't have public read policy
- Add the bucket policy from §5.4
- Images served via `https://bucket.s3.region.amazonaws.com/key`

### Phantom wallet not connecting
- Must be on **Devnet** in Phantom settings
- Phantom extension must be installed in browser
- Check browser console for wallet adapter errors

### `Port 5000 already in use`
```bash
lsof -ti :5000 | xargs kill -9
```

### `Port 3000 already in use`
```bash
lsof -ti :3000 | xargs kill -9
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│           WHAT YOU NEED TO REPLACE           │
├──────────────────────────────────────────────┤
│ REQUIRED (app won't start without these):    │
│  backend/.env → MONGODB_URI                  │
│  backend/.env → JWT_SECRET                   │
│                                              │
│ FOR AI FEATURES:                             │
│  backend/.env → OPENAI_API_KEY               │
│                                              │
│ FOR FILE UPLOADS:                            │
│  backend/.env → AWS_ACCESS_KEY_ID            │
│  backend/.env → AWS_SECRET_ACCESS_KEY        │
│  backend/.env → AWS_BUCKET_NAME              │
│                                              │
│ FOR GOOGLE LOGIN:                            │
│  backend/.env → GOOGLE_CLIENT_ID             │
│  backend/.env → GOOGLE_CLIENT_SECRET         │
│                                              │
│ FOR SOLANA (after anchor deploy):            │
│  solana/programs/real_estate/src/lib.rs L3   │
│  solana/Anchor.toml L6                       │
│  shared/utils/constants.ts last line         │
│  backend/.env → SOLANA_PROGRAM_ID            │
│  frontend/.env.local → NEXT_PUBLIC_PROGRAM_ID│
│                                              │
│ FOR PRODUCTION:                              │
│  frontend/.env.local → NEXT_PUBLIC_API_URL   │
│  frontend/.env.local → NEXT_PUBLIC_SOCKET_URL│
│  backend/.env → FRONTEND_URL                 │
│  backend/.env → GOOGLE_CALLBACK_URL          │
└──────────────────────────────────────────────┘
```

---

MIT License — Built for Surat, Gujarat, India 🇮🇳
