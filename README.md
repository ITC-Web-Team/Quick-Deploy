
# QuickDeploy

**QuickDeploy** is a full-stack deployment platform designed to simplify the process of hosting static websites. It enables users to upload HTML, CSS, and JavaScript files and instantly publish them at unique URLs.

The platform is built with scalability, security, and developer experience in mind, making it suitable for internal tools, academic deployments, and lightweight hosting solutions.

* Instant deployment of static websites
* Automatic URL generation per deployment
* File validation and secure upload handling
* Site management (list, delete, download)
* View tracking and metadata storage
* RESTful API for integration and automation
* Containerized deployment using Docker

### Use Cases

* Internal tooling for rapid prototyping
* Student or academic project hosting
* Lightweight static hosting platform
* Demo environments for frontend applications

---

## Architecture

QuickDeploy follows a modular, service-oriented architecture:

```
[ Client (Browser) ]
          │
          ▼
[ Frontend (React + Vite) ]
          │
          ▼
[ Backend API (Node.js + Express) ]
          │
          ▼
[ File System Storage ]
```

### Components

#### Frontend

* Built with React and Vite
* Provides UI for file upload and site management
* Communicates with backend via REST APIs

#### Backend

* Node.js with Express
* Handles file uploads using Multer
* Performs validation and site provisioning
* Serves deployed sites and static assets

#### Storage Layer

* Local file system-based storage
* Each deployment stored in an isolated directory
* Metadata maintained via JSON files

#### Deployment Layer

* Dockerized services for consistent environments
* Nginx used for serving frontend in production

### Request Flow

1. User uploads files via frontend
2. Backend validates and processes files
3. Files are stored and indexed
4. Site becomes accessible via unique URL
5. Static content is served directly by backend

---

## Local Setup

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn
* Docker (optional, for containerized setup)

---

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start at:

```
http://localhost:3000
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be available at:

```
http://localhost:5173
```

---

### Environment Configuration

#### Backend (`.env`)

```
PORT=3000
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
SITES_DIR=./sites
MAX_FILE_SIZE=5242880
```

#### Frontend (`.env`)

```
VITE_API_URL=http://localhost:3000/api
```

---

### Docker Setup (Optional)

#### Backend

```bash
cd backend
docker build -t quickdeploy-backend .
docker run -p 3000:3000 quickdeploy-backend
```

#### Frontend

```bash
cd frontend
docker build -t quickdeploy-frontend .
docker run -p 80:80 quickdeploy-frontend
```

---

### Verification

To verify the system is running:

```
GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "OK"
}
```

---

If you want, I can next upgrade this into a **FAANG-level README** (badges, diagrams, system design visuals, API tables, and deployment guide).
