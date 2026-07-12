# personal_1

A full-stack e-commerce app: React + Vite frontend, Node.js + Express backend, MongoDB.

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |

---

## Running with Docker Compose (recommended)

Starts all three services (frontend, backend, MongoDB) in one command. MongoDB is only reachable within the internal Docker network.

**Prerequisites:** Docker and Docker Compose installed.

```bash
docker compose up --build
```

To stop and remove containers:

```bash
docker compose down
```

To also remove the persisted MongoDB volume:

```bash
docker compose down -v
```

---

## Running without Docker

> **Caveat:** You must have a MongoDB instance already running locally or on a cloud provider (e.g. MongoDB Atlas). Run each service in a separate terminal.

**Prerequisites:** Node.js 20+ installed.

### Terminal 1 — Backend

#### 1. Install dependencies

```bash
cd backend
npm install
```

#### 2. Configure environment variables

Create `backend/.env`:

```env
PORT=3000
DB_CONNECTIONSTRING=mongodb://localhost:27017/personal_1
```

For a cloud instance:

```env
DB_CONNECTIONSTRING=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

#### 3. Start

```bash
# development (auto-restarts on file changes)
npm run dev

# or production
node index.js
```

### Terminal 2 — Frontend

#### 1. Install dependencies

```bash
cd frontend
npm install
```

#### 2. Start the dev server

```bash
npm run dev
```

The frontend dev server proxies API calls to `http://localhost:3000` by default (`VITE_API_BASE_URL` defaults to that value). No extra config needed when the backend is running locally.

To point at a different backend:

```bash
VITE_API_BASE_URL=http://other-host:3000 npm run dev
```
