# 🎬 CineMatch

> A cinematic movie recommendation engine with real posters, smart algorithms, and a full authentication system.

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-built--in-lightgrey?style=flat-square&logo=sqlite)
![TMDB](https://img.shields.io/badge/Posters-TMDB-01b4e4?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Features

- 🔐 **Full auth system** — register, login, logout with session tokens
- 💾 **SQLite database** — users, watchlists, and ratings persist across restarts
- 🖼️ **Real movie posters** — 50 films with images loaded from the TMDB CDN
- 🧠 **Smart recommendations** — content-based, collaborative, hybrid, and mood-based
- 🎬 **Director's Lens** — explore a director's filmography and discover stylistically similar directors
- 📱 **Responsive design** — works on mobile, tablet, and desktop
- 🎨 **Cinema aesthetic** — warm amber tones, film grain texture, Playfair Display serif

---

## 🚀 Quick Start

### Option A — Zero Setup (Demo Mode)

No backend required. Everything runs from the browser.

Open `frontend/login.html` directly in your browser. Click **Enter as Guest** or create an account. All 50 films with real posters load instantly from the TMDB CDN.

---

### Option B — Full Backend (Persistent Database)
```bash
cd backend
pip install -r requirements.txt

# Optional: add your TMDB API key for live poster fetching
export TMDB_API_KEY=your_key_here   # Mac/Linux
set TMDB_API_KEY=your_key_here      # Windows

python app.py
# Then open frontend/login.html in your browser
```

Get a free TMDB API key at: https://www.themoviedb.org/settings/api

---

## 🏗️ Project Structure
```
CineMatch/
├── backend/
│   ├── app.py              # Flask API — auth, movies, recommendations
│   ├── cinematch.db        # SQLite database (auto-created on first run)
│   └── requirements.txt
├── frontend/
│   ├── login.html          # Login / Register page
│   ├── index.html          # Main app (auth-protected)
│   ├── css/style.css       # Full design system
│   └── js/
│       ├── auth.js         # Session management + route guard
│       ├── api.js          # Backend client + embedded demo data
│       ├── ui.js           # Movie cards, modals, posters
│       ├── ai.js           # Claude AI film adviser
│       └── app.js          # Navigation + view controller
└── README.md
```

---

## 🧠 Recommendation Algorithms

| Algorithm | How It Works |
|---|---|
| **Content-Based** | TF-IDF on genres, mood, director, cast, era, style, plot → cosine similarity |
| **Collaborative** | Films rated ≥ 4 stars → similar films scored by weighted similarity |
| **Hybrid** | Blends both; falls back to top-rated unseen films for new users |
| **Mood-Based** | Filters and ranks by emotional tone (Thrilling, Heartwarming, Mind-bending…) |
| **Director's Lens** | Full filmography + directors sharing the same style DNA |

---

## 💾 Database Schema

SQLite — no installation needed, built into Python. `cinematch.db` is auto-created in `backend/` on first run.

| Table | Contents |
|---|---|
| `users` | username, email, password_hash, created_at |
| `sessions` | login tokens (cleared on logout) |
| `watchlist` | per-user saved movie IDs |
| `ratings` | per-user star ratings (1–5) |
```bash
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
           → no token → redirect to login.html
           → all API calls send X-Session-Token header
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account `{ username, email, password }` |
| POST | `/api/auth/login` | Sign in → returns token |
| POST | `/api/auth/logout` | Invalidate session token |
| GET | `/api/auth/me` | Current user info *(auth required)* |

### Movies
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status |
| GET | `/api/movies` | List movies (filters: genre, era, mood, sort) |
| GET | `/api/movies/:id` | Movie detail + similar films |
| GET | `/api/search?q=` | Full-text search |
| GET | `/api/filters` | Available filter options |
| GET | `/api/stats` | User stats |

### Recommendations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recommend/similar/:id` | Content-based recs |
| GET | `/api/recommend/mood?mood=` | Mood-based recs |
| GET | `/api/recommend/director?director=` | Director Lens |
| GET | `/api/recommend/hybrid` | Personalized hybrid *(auth required)* |

### User
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/watchlist` | Get saved films *(auth required)* |
| POST | `/api/watchlist` | Save a film `{ movie_id }` |
| DELETE | `/api/watchlist` | Remove a film `{ movie_id }` |
| POST | `/api/rate` | Rate a film `{ movie_id, rating }` (1–5) |

---

## 🛠️ Requirements

- Python **3.9 – 3.13** *(3.14 not yet supported by numpy/pandas)*
- pip
```
flask==3.0.0
flask-cors==4.0.0
pandas>=2.2.0
numpy>=2.0.0
scikit-learn>=1.4.0
requests==2.31.0
```

---

## 📄 License

[MIT](LICENSE)

---

<p align="center">Built with 🎞️ and Python</p>
