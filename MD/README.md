# ⚡ ApiPilot — Postman-like API Testing Tool

A full-stack API testing tool built with **React** (frontend) + **Node.js/Express** (backend proxy).

---

## 📁 Project Structure

```
apipilot/
├── backend/
│   ├── server.js            ← Express proxy server
│   ├── auth-middleware.js   ← JWT & API key middleware
│   ├── token-auth.js        ← Login & token refresh
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── ApiTester.js
│   │   ├── LoginComponent.js
│   │   ├── ProtectedApp.js
│   │   └── auth-service.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### Option 1 — Local Dev (recommended)

```bash
# 1. Install all dependencies
npm run setup

# 2. Copy env file and fill in secrets
cp .env.example .env

# 3. Start both servers
npm start
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:5000

### Option 2 — Docker

```bash
cp .env.example .env
docker-compose up --build
```

- App available at: http://localhost:80

---

## ✅ Features

| Feature | Status |
|---|---|
| GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS | ✅ |
| Query params editor (appended to URL) | ✅ |
| Request headers editor | ✅ |
| Body: JSON / raw / form-data | ✅ |
| Auth: Bearer / Basic / API Key | ✅ |
| Response: status, time, size, headers | ✅ |
| JSON syntax highlighting | ✅ |
| Copy response body | ✅ |
| Request history | ✅ |
| JSON body validation | ✅ |
| 30s request timeout | ✅ |
| JWT login & token refresh | ✅ |
| CORS bypass via proxy | ✅ |

---

## 🔐 Default Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |
| User  | user     | user123  |

Override via environment variables: `ADMIN_USER`, `ADMIN_PASS`, `APP_USER`, `APP_PASS`

---

## 🧪 Test APIs

| URL | Method |
|---|---|
| `https://jsonplaceholder.typicode.com/posts` | GET |
| `https://jsonplaceholder.typicode.com/posts` | POST |
| `https://httpbin.org/get` | GET |
| `https://httpbin.org/post` | POST |
| `https://api.github.com/users/octocat` | GET |
