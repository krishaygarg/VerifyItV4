# VerifyIt! Replicated & Live Multiplayer

A premium, real-time multiplayer civics, voting rights, and news literacy trivia game replicated from the original VerifyIt! layout. The application features a solo gameplay loop, a live multiplayer lobby with a dedicated host dashboard, real-time player controller inputs, and dual-database support using SQLite.

## 🚀 Key Features

* **Real-time Live Multiplayer (Kahoot-style flow):**
  * **Lobby:** Real-time player registration using a unique 4-digit PIN.
  * **Host Dashboard:** Controls game start, showing live answers distribution, points, and score leaderboards after each round.
  * **Player Controllers:** Responsive Web controller views with quick-feedback buttons (A, B, C, D) and immediate points calculation based on answer speed.
* **Single Player Mode:** Shuffled trivia rounds from selected tracks with instant explanations.
* **Dual Database Toggle:**
  * **Original Database (`verifyit.db`):** Sourced from the original 1,700+ question base.
  * **AI Modern Database (`verifyit_ai.db`):** AI-curated, highly polished modern trivia questions (e.g. AI robocalls, Section 230 algorithms, deepfakes, lateral reading) with clean HTML structures.
* **Auto-Healing Parser:** Automatically detects and repairs flipped columns or missing description tags in older database records (redirecting titles to questions and content to explanations).
* **Source Reference Tooltips:** Parses inline references like `[1]` or `[2]` dynamically and displays the backing source citation on hover using CSS tooltips.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Vanilla CSS (Glassmorphism & premium blue tokens), Lucide React.
* **Backend:** Node.js (Express), Socket.io (WebSocket room state management), native `node:sqlite` connection.

---

## 💻 Local Setup

### 1. Prerequisites
Ensure you have **Node.js (v22+)** installed (required for the built-in experimental SQLite driver).

### 2. Installation
Install dependencies in both directories:

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install --legacy-peer-deps
```

### 3. Running Locally
Start the backend and frontend dev servers:

```bash
# In the backend directory
npm run start

# In the frontend directory
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment

### 1. Backend (Node.js + WebSockets + SQLite)
Deploy to a persistent server host like **Render** or **Railway**:
* **Root Directory:** `backend`
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* *Make sure both `verifyit.db` and `verifyit_ai.db` database files are committed to your repository.*

### 2. Frontend (Vite Static Build)
Deploy to **Cloudflare Pages**:
* Add a `.env.production` file in your `frontend` directory:
  ```env
  VITE_BACKEND_URL=https://your-backend-service-url.onrender.com
  ```
* Run local build and deploy using Wrangler CLI:
  ```bash
  cd frontend
  npm run build
  npx wrangler pages deploy dist
  ```
