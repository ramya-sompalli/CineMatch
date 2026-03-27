# 🎬 CineMatch v2 — Movie Recommendation Engine
### With Login System + SQLite Database + Real Movie Poster Images

---

## 🚀 Quick Start

### Option A: Open Directly (Zero Setup — Demo Mode)
```
1. Open frontend/login.html in your browser
2. Click "enter as guest" OR create any account
3. Browse 50 films with real movie posters!
```
Works instantly without any backend. All images load from TMDB CDN.

### Option B: Full Backend (with persistent database)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Then open frontend/login.html
```

---

## 🛠️ Requirements

- **Python 3.9 – 3.13** recommended  
  *(Python 3.14 is not yet supported by numpy/pandas)*
- pip

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Login / Register** | Full auth system — username + password + email |
| 💾 **SQLite Database** | Users, sessions, watchlists, ratings all persist across restarts |
| 🖼️ **Real Movie Posters** | 50 actual TMDB poster images |
| 👤 **User Profiles** | Per-user watchlist, ratings, history |
| 🎨 **Cinema Aesthetic** | Warm amber, film grain, Playfair Display serif |
| 📱 **Responsive** | Works on mobile, tablet, desktop |

---

## 🏗️ Project Structure

```
CineMatch/
├── backend/
│   ├── app.py              # Flask API: auth + movies + recommendations
│   ├── cinematch.db        # SQLite database (auto-created on first run)
│   └── requirements.txt
├── frontend/
│   ├── login.html          # Login / Register page
│   ├── index.html          # Main app (protected)
│   ├── css/style.css       # Full design system
│   └── js/
│       ├── auth.js         # Session management + route guard
│       ├── api.js          # Backend client + embedded demo data
│       ├── ui.js           # Movie cards + modal + posters
│       ├── ai.js           # Claude AI film adviser
│       └── app.js          # Navigation + view controller
└── README.md
```

---

## 💾 Database

The backend uses **SQLite** — no installation needed, it's built into Python.

A file called `cinematch.db` is automatically created in the `backend/` folder on first run.

**Tables:**

| Table | Contents |
|---|---|
| `users` | username, email, hashed password, created_at |
| `sessions` | login tokens (cleared on logout) |
| `watchlist` | per-user saved movie IDs |
| `ratings` | per-user star ratings (1–5) |

To inspect the database:
```bash
# Using sqlite3 CLI (built into most systems)
sqlite3 backend/cinematch.db
.tables
SELECT * FROM users;
.quit
```

---

## 🔐 Authentication Flow

```
login.html → POST /api/auth/login → { token, username }
            → stored in localStorage
            → redirect to index.html

index.html → auth.js checks localStorage
           → if no token → redirect to login.html
           → all API calls send X-Session-Token header
```

### Auth Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account `{username, email, password}` |
| POST | `/api/auth/login` | Sign in `{username, password}` → token |
| POST | `/api/auth/logout` | Invalidate token |
| GET | `/api/auth/me` | Get current user info |

---

## 🖼️ Movie Poster Images

**Demo mode (no backend needed):**
- Poster paths are hardcoded in `js/api.js` → `TMDB_POSTERS`
- Images load directly from `https://image.tmdb.org/t/p/w500/...`
- No API key required

**Backend mode with live posters:**
```bash
# Windows
set TMDB_API_KEY=your_key_here
python app.py

# Mac/Linux
export TMDB_API_KEY=your_key_here
python app.py
```
Get a free key at: https://www.themoviedb.org/settings/api

---

## 🧠 Recommendation Algorithms

- **Content-Based:** TF-IDF on genres, mood, director, cast, era, style, plot → cosine similarity
- **Collaborative:** Films rated ≥ 4 stars are "liked" → similar films scored by weighted similarity
- **Hybrid:** Blends both; falls back to top-rated unseen films for new users
- **Director's Lens:** Shows a director's filmography + other directors with the same style DNA

---

## 🔌 Full API Reference

| Endpoint | Description |
|---|---|
| GET `/api/health` | Server status |
| GET `/api/movies` | List movies (filters: genre, era, mood, sort) |
| GET `/api/movies/:id` | Movie detail + similar films |
| GET `/api/search?q=` | Full-text search |
| GET `/api/recommend/similar/:id` | Content-based recs |
| GET `/api/recommend/mood?mood=` | Mood-based recs |
| GET `/api/recommend/director?director=` | Director Lens |
| GET `/api/recommend/hybrid` | Personalized hybrid (auth required) |
| GET `/api/watchlist` | User's saved films (auth required) |
| POST `/api/watchlist` | Save film |
| DELETE `/api/watchlist` | Remove film |
| POST `/api/rate` | Rate film 1–5 |
| GET `/api/filters` | Available filter options |
| GET `/api/stats` | User stats |
