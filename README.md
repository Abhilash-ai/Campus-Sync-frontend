# CampusSync — One Platform for Campus Intelligence


[![Live Demo](https://img.shields.io/badge/Demo-Live-6366f1?style=for-the-badge&logo=vercel)](https://campussync-ai.vercel.app/)


CampusSync is a production-ready, contactless campus intelligence and attendance analytics system. It integrates high-fidelity face recognition logging, QR identity passport verification, teacher manual overrides, and academic performance correlation dashboards.

---

## 🛠️ Tech Stack & Features

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts (analytics graphs), Lucide Icons.
- **Backend**: Flask (Python 3.10+), PyJWT, CORS.
- **Database**: PyMongo (MongoDB Atlas) with a local JSON file database fallback (`database.json`) if no connection string is present, enabling zero-config sandboxed testing.
- **Computer Vision**: OpenCV, `face_recognition` models with a smart fallback simulation (comparing color histograms and pixel structures) if local native libraries cannot compile.

---

## 📁 Project Folder Structure

```
CampusSync/
├── backend/
│   ├── app.py                  # Flask main application entry point (with database seeder)
│   ├── config.py               # JWT configuration, Mongo URIs, Lateness thresholds
│   ├── database.py             # Dual Database layer (MongoDB Atlas client / Local JSON DB wrapper)
│   ├── requirements.txt        # Python backend packages list
│   ├── utils/
│   │   ├── auth_helper.py      # BCrypt password hashing & JWT generation/decoding
│   │   └── face_helper.py      # OpenCV / face_recognition wrapper & Simulation fallback
│   └── routes/
│       ├── auth.py             # User accounts login, signup, forgot/reset routes
│       ├── student.py          # CRUD directory registry & face capture mapping
│       ├── attendance.py       # Check-in/out processors (Face & QR) & Teacher logs overrides
│       └── analytics.py        # Trends aggregator, Pearson correlation & Risk models
└── frontend/
    ├── index.html              # HTML shell template (responsive viewport, SEO meta tags)
    ├── tailwind.config.js      # CSS configuration setting up our Purple/Indigo design system
    ├── package.json            # React node modules requirements
    └── src/
        ├── main.tsx            # DOM mounting entry point
        ├── App.tsx             # Master router, theme contexts, and protected guard layers
        ├── index.css           # Glassmorphism templates, animations, base styles
        ├── components/
        │   ├── Navbar.tsx      # Dashboard header, theme toggle, and profile badges
        │   └── Sidebar.tsx      # Sidebar links customized dynamically based on user role
        ├── services/
        │   └── api.ts          # REST client wrapper automatically loading session JWTs
        └── views/
            ├── Welcome.tsx     # Landing page with branding and feature cards
            ├── Login.tsx       # Auth form with clickable demo sandbox profile links
            ├── Signup.tsx      # Signup forms with pre-registration checks
            ├── ForgotPassword.tsx # recovery code demo screen
            ├── TeacherDashboard.tsx # Teacher cockpit (student directories, quick actions, forms)
            ├── StudentDashboard.tsx # Student dashboard (days logging, digital passport QR badge)
            ├── CameraAttendance.tsx # AI live capture camera stream
            ├── QRAttendance.tsx     # QR Scan input & sandbox simulator
            └── Reports.tsx          # Recharts lines/bar trends, scatter plot, risk logs
```

---

## 🚀 Step-by-Step Local Setup

### 1. Prerequisites
- Python 3.10 or higher.
- Node.js 18 or higher (with NPM).
- A modern web browser with webcam access.

### 2. Configure Backend Services
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (Optional but Recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install package requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask server:
   ```bash
   python app.py
   ```
   *Note: On startup, the backend automatically seeds the system with 10 mock students and 5 days of historical logs, allowing charts to render immediately. By default, it falls back to creating a local `database.json` inside the `backend/` folder.*

### 3. Configure Frontend Web Console
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local address displayed (usually `http://localhost:5173`).

---

## 🔐 Sandbox Login Shortcuts
For quick evaluation, click the sandbox quick-log buttons at the bottom of the login page:
- **Teacher Account**: `teacher@campussync.edu` / `password123`
- **Student Account**: `student@campussync.edu` / `password123` (Linked to Student ID: `STU1001`)
- **Admin Account**: `admin@campussync.edu` / `password123`

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /signup` — Creates user credentials (hashes passwords using PBKDF2). Matches Student IDs against student records to prevent unauthorized registry.
- `POST /login` — Verifies credentials, generating a JWT token expiring in 7 days.
- `POST /forgot-password` — Sandbox password code recovery tool. Generates code `CS-RESET-9921` for testing.
- `POST /reset-password` — Updates password if the verification code matches.
- `GET /me` — Resolves the current session profile based on JWT headers.

### Student Management (`/api/students`)
- `GET /` — Lists all registered student records. (Teacher/Admin only).
- `GET /<student_id>` — Fetches detailed card profiles, GPA grades, and attendance metrics.
- `POST /` — Inserts a new student record into the directory, setting up default marks.
- `PUT /<student_id>` — Updates details.
- `DELETE /<student_id>` — Removes student profile, their credentials, and all logs.
- `POST /<student_id>/face` — Extracts 128-D embedding from camera snapshot and registers face.

### Attendance Checkpoint (`/api/attendance`)
- `POST /face-checkin` — Decodes base64 webcam jpeg, detects boundaries using Haar Cascade, matches embedding signatures via Euclidean distance, and logs check-in/out duration.
- `POST /qr-checkin` — Marks attendance using QR barcode strings.
- `POST /override` — Allows teachers to manually adjust logs, times, and remarks.
- `GET /logs` — Queries logs filtered by student ID or date.
- `GET /stats` — Computes Present/Absent counts and averages.

### Campus Intelligence (`/api/analytics`)
- `GET /trends` — Gathers last 7 days daily metrics, last 6 months curves, and subject averages.
- `GET /correlation` — Compiles attendance percentage vs GPA metrics for Recharts scatter plots.
- `GET /risk` — Classifies students into risk portfolios (Borderline &lt; 75%, GPA &lt; 2.5, anomalous low-attendance high-performers).
- `GET /insights/<student_id>` — Formulates personalized actionable suggestions (e.g. lectures required to achieve 75%).

---

## 🌐 Production Deployment Instructions

### Deploy Backend (Render / Heroku)
1. Commit your backend files to a GitHub repository.
2. Log in to Render.com and create a new **Web Service**.
3. Link your GitHub repository.
4. Set build configurations:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app` (Make sure to add `gunicorn` to your requirements.txt if deploying).
5. Add Environment Variables:
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/campussync`
   - `JWT_SECRET`: A secure cryptographically random string.
   - `LATE_THRESHOLD`: `09:15`

### Deploy Frontend (Vercel / Netlify)
1. Commit your frontend files to GitHub.
2. Log in to Vercel and click **Add New Project**.
3. Link your GitHub repository.
4. Set build configuration options:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.
6. Set `BASE_URL` inside `frontend/src/services/api.ts` to your active Render web service URL.
