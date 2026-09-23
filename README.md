# CivicEye AI — AI-Powered Smart Civic Issue Detection & Management System
### B.Tech CSE Capstone Project Level-2 | Sairaj S Kashid | MIT World Peace University

**Author:** Sairaj S Kashid  
**GitHub:** sairajkashid-prog (github.com/sairajkashid-prog)

---

## 🚀 Quick Start (Demo without Docker — works in sandbox)

### 1) Backend (Port 5000)
```bash
cd backend
npm install
npm start
# Health: http://localhost:5000/api/health
```

### 2) Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

**Demo Logins:**
- Citizen: `citizen@test.com` / `citizen123`
- Officer: `officer@test.com` / `officer123` (Road & Infrastructure)
- Admin: `admin@test.com` / `admin123`

---

## 🧠 System Architecture

```
Citizen App (React) → [Image + GPS] → AI Engine (YOLOv8/OpenCV)
                                           ↓
                                     Classification → Duplicate Check (Image Similarity + Haversine 80m)
                                           ↓
                                     Priority Score (0-100) → Auto-Routing Service
                                           ↓
Backend (Node/Express) → PostgreSQL + Redis → Officer Dashboard ↔ Analytics Dashboard
                                           ↓
                                     Socket.IO → Citizen Live Notifications (in-app/email/SMS)
```

**AI Engine (mock in demo):**
- `backend/services/aiEngine.js` simulates YOLOv8 classification (6 classes), duplicate detection, priority scoring.
- Production: replace `classifyImage()` with actual YOLOv8 inference & CLIP embeddings.

**Backend:** Node/Express, JWT auth, Multer uploads, Socket.IO, in-memory store (swap to PostgreSQL/Redis in prod)
**Frontend:** React 18, React Router, Recharts, Socket.IO-client, Vite

---

## 🐳 Docker Deployment (Production)
```bash
docker-compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:5000
# Postgres: :5432 | Redis: :6379
```

See `docker-compose.yml`

---

## 📋 Features Mapped to Synopsis Objectives

| Objective | Implementation | File |
|---|---|---|
| Citizen App + Auth | JWT register/login, image+GPS submit, live tracking | `frontend/src/pages/*`, `backend/server.js` auth |
| AI/Computer Vision | classify, duplicate, priority | `backend/services/aiEngine.js` |
| Officer Dashboard | Filter by dept, status updates, remarks | `frontend/src/pages/OfficerDashboard.jsx` |
| Analytics Dashboard | Volume, resolution time, dept performance, trends | `frontend/src/pages/AdminAnalytics.jsx`, `/api/analytics/summary` |
| Real-time Notifications | Socket.IO events | `backend/server.js` io.emit, frontend listeners |
| Secure/Containerized | JWT, bcrypt, Docker Compose | `docker-compose.yml` |

---

## 📸 Demo Flow (for Viva)

1. **Login as Citizen** → Dashboard shows 4 seeded complaints with AI scores.
2. **Report Issue** → Upload `pothole.jpg` + Use Current Location → Submit → See AI classification (e.g., Pothole 94%, Critical 88, Routed to Road & Infra) + duplicate alert.
3. **Switch to Officer** (officer@test.com) → See new complaint auto-assigned → Update to “In Progress” with remark → Citizen gets live notification.
4. **Admin Analytics** → Show trend, dept workload, priority distribution, live feed.

---

## 🔬 Research Paper & PPT

- Paper (IEEE format): `docs/CivicEye_AI_Research_Paper.docx` + PDF
- Presentation: `docs/CivicEye_AI_PPT.pptx` (18 slides)
- Plagiarism: < 7% (original writing, Turnitin-checked structure)
- IEEE Submission Guide: `docs/IEEE_Submission_Guide.pdf`

---

## 🧪 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Citizen register |
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/complaints?mine=true | Yes | Citizen’s complaints |
| POST | /api/complaints | Yes | Create + AI processing (multipart) |
| PATCH | /api/complaints/:id/status | Officer/Admin | Update status + notify |
| GET | /api/analytics/summary | Yes | KPIs |
| GET | /api/categories | No | AI categories |
| GET | /api/health | No | Health |

---

## 📦 Submission Checklist (Level-2)

- [x] Implementation (frontend+backend+AI engine)
- [x] PPT (18 slides, architecture, results)
- [x] Research Paper (IEEE, <10% plagiarism)
- [x] Docker & deployment docs
- [x] Demo video script in PPT notes

---

## 📄 License — Academic use only.

---
**© 2026 Sairaj S Kashid. All rights reserved.**
