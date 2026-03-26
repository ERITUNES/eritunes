# 🎓 EduCore SMS — School Management System

A full-stack, role-based School Management System built with **Node.js/Express**, **MongoDB**, and a polished vanilla JS frontend.

---

## 📁 Folder Structure

```
sms/
├── backend/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── seed.js        # Admin + subjects seeder
│   ├── middleware/
│   │   └── auth.js        # JWT + role-based auth middleware
│   ├── models/
│   │   ├── School.js
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Subject.js
│   │   └── Mark.js
│   ├── routes/
│   │   ├── auth.js        # Login, register, user CRUD
│   │   ├── schools.js     # School CRUD
│   │   ├── students.js    # Student CRUD
│   │   ├── marks.js       # Marks upload + analytics
│   │   └── subjects.js    # Subject listing
│   ├── .env               # Environment variables
│   ├── package.json
│   └── server.js          # Express app entry point
│
└── frontend/
    ├── css/
    │   └── main.css       # Full design system
    ├── js/
    │   ├── api.js         # HTTP client wrapper
    │   ├── auth.js        # Login/logout/session
    │   ├── device.js      # Device detection
    │   ├── ui.js          # Toast, modal, helpers
    │   ├── app.js         # Router & initialization
    │   └── pages/
    │       ├── dashboard.js
    │       ├── schools.js
    │       ├── users.js
    │       ├── students.js
    │       ├── marks.js
    │       └── results.js
    └── index.html         # SPA shell
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or MongoDB Atlas)

### 1. Install Dependencies
```bash
cd sms/backend
npm install
```

### 2. Configure Environment
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management_system
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```
> For MongoDB Atlas: `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sms`

### 3. Seed the Database
```bash
cd sms/backend
npm run seed
```
This creates:
- Admin account: `admin@sms.com` / `admin123`
- All 4 primary + 17 secondary subjects

### 4. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Open in Browser
```
http://localhost:5000
```

---

## 👤 Roles & Access

| Role    | Access |
|---------|--------|
| **ADMIN** | Full control — create schools, users, view everything |
| **DOS**   | Secondary school — students, marks, results |
| **H.M**   | Primary school — students, marks, results |
| **TEACHER** | Upload marks for assigned subjects only |

---

## 🏫 School Type Logic

| Type | Subjects |
|------|----------|
| **PRIMARY** | SST, Science, English, Mathematics (4 subjects) |
| **SECONDARY** | 17 CBC subjects (Mathematics, English, Biology, Chemistry, Physics, History, Geography, CRE, IRE, Computer, Agriculture, Business, Fine Art, Music, Literature, French, German) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| GET  | `/api/auth/me` | All |
| POST | `/api/auth/register` | Admin |
| GET  | `/api/auth/users` | Admin |
| DELETE | `/api/auth/users/:id` | Admin |

### Schools
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | `/api/schools` | All |
| POST | `/api/schools` | Admin |
| PUT  | `/api/schools/:id` | Admin |
| DELETE | `/api/schools/:id` | Admin |

### Students
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | `/api/students` | All |
| POST | `/api/students` | Admin/DOS/HM |
| DELETE | `/api/students/:id` | Admin/DOS/HM |

### Marks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | `/api/marks` | All (filtered by role) |
| POST | `/api/marks` | Teacher/DOS/HM/Admin |
| DELETE | `/api/marks/:id` | Admin/DOS/HM |
| GET  | `/api/marks/analytics` | All |
| GET  | `/api/marks/student/:id` | All |

---

## 🎨 Design Features

- **Dark academic theme** — Navy + Gold + Emerald
- **Fraunces** (serif display) + **DM Sans** (body)
- Animated stat cards, grade bar charts
- Responsive: Mobile sidebar collapses, grids reflow
- Device detection badge (📱/📟/💻)
- Toast notifications (no alerts!)
- Modal dialogs for all forms
- PDF export for results
- Grade badges (A=Emerald, B=Blue, C=Gold, D=Orange, E=Rose)

---

## 🔐 Security Notes

- Passwords hashed with **bcryptjs** (10 salt rounds)
- **JWT** tokens with 7-day expiry
- Role-based middleware on every protected route
- Teachers can only upload marks for assigned subjects
- DOS/HM can only access their own school data

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla HTML/CSS/JS (SPA) |
| Fonts | Google Fonts (Fraunces, DM Sans) |
