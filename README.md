# 🛫 FlyWise

**FlyWise** is an AI-powered travel companion that helps you decide whether to **book your flight now or wait**, and recommends the best **hotels** using **Google Gemini AI**.  
It combines flight analytics, price intelligence, and generative AI to make smarter travel decisions.

---

## ✨ Features

- **Book or Wait Decision Engine** – Analyzes flight price trends and volatility.
- **AI Hotel Finder** – Uses Google Gemini to recommend hotels matching your budget and vibe.
- **FastAPI Backend** – Blazing-fast REST API with clean modular routes.
- **CORS Enabled** – Ready for frontend integration or third-party apps.
- **Optional Node Server** – Adds flight route search and Snowflake analytics.

---

## 🧱 Tech Stack

| Layer                 | Technology                                              |
| --------------------- | ------------------------------------------------------- |
| **Backend Framework** | FastAPI                                                 |
| **Language**          | Python 3.9+                                             |
| **AI Model**          | Google Gemini (`gemini-flash-latest`)                   |
| **Env Config**        | python-dotenv                                           |
| **Server**            | Uvicorn                                                 |
| **Optional**          | Node/Express for flight search, Snowflake for analytics |
| **Frontend**          | React + Vite                                            |

---

## ⚙️ Prerequisites

Before you start, make sure you have:

- 🐍 **Python 3.9+**
- 🧰 **pip** (Python package manager)
- 🔑 **Google Gemini API Key**
- 🟢 **Node.js** (if running the Express service)
- 💾 (Optional) **Snowflake credentials** if using analytics

---

## 🔐 Environment Setup

Create a `.env` file in your root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

If you’re enabling Snowflake analytics in the Node service, also add:

```env
SNOWFLAKE_ACCOUNT=...
SNOWFLAKE_USER=...
SNOWFLAKE_PASSWORD=...
SNOWFLAKE_WAREHOUSE=...
SNOWFLAKE_DATABASE=FLYWISE
SNOWFLAKE_SCHEMA=PUBLIC
```

---

## 🚀 Getting the Project Running

Follow these steps to launch **FlyWise** locally.

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ayaannasim9/FlyWise.git
cd FlyWise
```

---

### 2️⃣ Start the FastAPI Backend (Python)

This is the AI backend that communicates with Google Gemini.

```bash
python -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --port 7860
```

- Runs at: **http://localhost:7860**
- Make sure your `.env` file contains a valid `GEMINI_API_KEY`.

---

### 3️⃣ Start the Node/Express Flight Routes Server (Optional)

This handles flight search routes and connects to Snowflake for analytics.

```bash
# from the project root
npm install
node index.js
# or
# npm run dev
```

- Runs at: **http://localhost:3000**
- Requires the Snowflake vars if you’re using analytics logging.

---

### 4️⃣ Start the Frontend (Vite + React)

This is the web interface that communicates with both backends.

```bash
cd frontend
npm install
npm run dev
```

- Runs at: **http://localhost:5173**

Make sure your frontend environment file (`frontend/.env` or `.env.local`) points to the backend servers:

```env
VITE_API_BASE=http://localhost:7860
VITE_ROUTES_BASE=http://localhost:3000
```

---

## ✅ What Should Be Running

| Service              | Port | Description                          |
| -------------------- | ---- | ------------------------------------ |
| **FastAPI Backend**  | 7860 | Handles AI and hotel recommendations |
| **Node/Express API** | 3000 | Handles flight routes + analytics    |
| **Frontend (Vite)**  | 5173 | User interface                       |

Keep them all running in separate terminals for full functionality.

---

## 🧩 Example API Endpoints

- `GET /` → Health check for FastAPI server
- `POST /analyze-flight` → Returns “Book” or “Wait” recommendation
- `POST /recommend-hotel` → Returns AI-curated hotel suggestions
- (Node) `GET /flights` → Flight search API

---

## 🤝 Contributing

Pull requests are welcome!  
If you’d like to add features (like a new AI endpoint or analytics dashboard), please open an issue first to discuss your idea.

---
