# 🎵 ERITUNES — Full Deployment Guide

**Admin:** `Ericfx` / `5qejifyd`

---

## 📁 Project Structure

```
eritunes/
├── vercel.json              ← Routing config
├── package.json             ← Dependencies
├── public/
│   └── index.html           ← Complete frontend (Sonic Tunes design)
└── api/
    ├── _db.js               ← MongoDB connection (shared)
    ├── _mid.js              ← JWT auth middleware
    ├── auth/
    │   ├── login.js         ← POST /api/auth/login
    │   ├── signup.js        ← POST /api/auth/signup
    │   └── me.js            ← GET  /api/auth/me
    ├── users/
    │   ├── index.js         ← GET  /api/users
    │   └── [u].js           ← GET/PATCH/DELETE/POST /api/users/:username
    ├── songs/
    │   ├── index.js         ← GET/POST /api/songs
    │   ├── charts.js        ← GET /api/songs/charts
    │   └── [id].js          ← GET/DELETE/POST /api/songs/:id
    ├── messages/
    │   ├── index.js         ← GET /api/messages
    │   └── [u].js           ← GET/POST/DELETE /api/messages/:username
    ├── invites/
    │   ├── index.js         ← GET/POST /api/invites
    │   └── [code].js        ← PATCH/DELETE /api/invites/:code
    └── reports/
        ├── index.js         ← GET/POST /api/reports
        └── [id].js          ← PATCH/DELETE /api/reports/:id
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1 — MongoDB Atlas (free database)

1. Go to **https://mongodb.com/atlas** → Sign Up Free
2. Click **"Build a Database"** → choose **M0 Free**
3. Pick any region → click **Create**
4. Set a **username** and **password** (save these!)
5. Under network access → click **"Add IP Address"** → choose **"Allow access from anywhere"** → Add `0.0.0.0/0`
6. Click **"Connect"** → **"Drivers"** → copy the connection string

Your connection string looks like:
```
mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/
```

Add `eritunes` at the end:
```
mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/eritunes
```

---

### STEP 2 — GitHub

1. Go to **https://github.com** → New repository → name it `eritunes`
2. Extract the zip file
3. Upload ALL files keeping the exact folder structure
4. Click **Commit changes**

---

### STEP 3 — Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New Project"** → import your `eritunes` repo
3. Under **"Environment Variables"** add these TWO:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/eritunes` |
| `JWT_SECRET` | `eritunes_secret_2024` (any random text) |

4. Click **Deploy** ✅

---

### STEP 4 — First Login

Go to your live URL and log in:
- **Username:** `Ericfx`
- **Password:** `5qejifyd`

The admin account is auto-created the first time anyone visits.

---

## 🎯 How It Works

The app is a **hybrid**:
- All UI/design runs from `public/index.html` (Sonic Tunes design)
- On login/signup it talks to the real backend API
- Songs, users, invites, reports are stored in **MongoDB**
- The API bridge in the HTML syncs data between localStorage and MongoDB

## 🌐 API Endpoints Summary

```
POST  /api/auth/login
POST  /api/auth/signup
GET   /api/auth/me

GET   /api/users                 list all users
GET   /api/users/:u              get one user
PATCH /api/users/:u              edit profile
POST  /api/users/:u?action=follow|approve|reject|approve-artist|bluetick|verify
DELETE /api/users/:u

GET   /api/songs                 list songs
POST  /api/songs                 upload (admin)
GET   /api/songs/charts          top 20
GET   /api/songs/:id
POST  /api/songs/:id?action=stream|like|comment
DELETE /api/songs/:id

GET   /api/messages              my conversations
GET   /api/messages/:u           thread
POST  /api/messages/:u           send message

GET   /api/invites               list codes (admin)
POST  /api/invites               generate codes (admin)
PATCH /api/invites/:code?action=deactivate|reactivate
DELETE /api/invites/:code

GET   /api/reports               list (admin)
POST  /api/reports               submit report
DELETE /api/reports/:id
```
