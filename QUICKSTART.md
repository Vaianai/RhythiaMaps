# 🎵 Rhythia Maps - Quick Start Guide

Benvenuto! Questo progetto è **completamente pronto per la produzione**. Segui questa breve guida per iniziare.

## ⚡ 30 Secondi di Setup

### Windows
```bash
setup.bat
```

### macOS/Linux
```bash
chmod +x setup.sh
./setup.sh
```

Questo installerà tutte le dipendenze e creerà i file `.env`.

---

## 📋 Passo-Passo

### 1️⃣ Prerequisiti
- ✅ Node.js 18+ ([Download](https://nodejs.org))
- ✅ PostgreSQL 14+ ([Download](https://www.postgresql.org/download))
- ✅ Git

### 2️⃣ Configura Database Locale

```bash
# Crea database
createdb rhythia_maps

# Oppure via PostgreSQL client
psql -U postgres
CREATE DATABASE rhythia_maps;
\q
```

### 3️⃣ Configura Variabili d'Ambiente

**Backend - `backend/.env`**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rhythia_maps"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
# AWS S3 (lascia vuoto per development)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
```

**Frontend - `frontend/.env`**
```env
VITE_API_URL=http://localhost:3000
```

### 4️⃣ Installa e Avvia

```bash
# Dall'root della cartella

# Install dipendenze
npm install

# Setup database
npm run db:migrate --workspace=backend

# (Opzionale) Aggiungi dati di test
npm run db:seed --workspace=backend

# Avvia entrambi (backend + frontend)
npm run dev
```

Apri browser a: **http://localhost:5173**

---

## 🎮 Primo Test

### 1. Registrati
- Click "Sign Up"
- Credenziali test: 
  - Username: `testuser`
  - Email: `test@example.com`
  - Password: `testpass123`

### 2. Upload una mappa
- Click "Upload"
- Carica uno screenshot .sspm (per test, puoi creare un file dummy)
- Compila i dettagli

### 3. Esplora
- Torna a "Browse"
- Vedi la griglia di mappe
- Click su una per vedere i dettagli
- Scarica e vota

---

## 📂 Struttura Cartelle

```
rhythia-maps/
├── backend/                 # API REST Express + TypeScript
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # API routes
│   │   └── utils/           # Helpers
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # DB migrations
│   └── package.json
│
├── frontend/                # React 18 + TypeScript
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # State (Zustand)
│   │   ├── services/        # API client
│   │   └── styles/          # CSS
│   └── package.json
│
├── README.md                # Complete documentation
├── DEPLOYMENT.md            # Production guide
└── PROGRESS.md              # Project status
```

---

## 🛠️ Comandi Utili

```bash
# Development
npm run dev                              # Start both

# Backend only
cd backend && npm run dev                # Start backend

# Frontend only
cd frontend && npm run dev               # Start frontend

# Database
npm run db:migrate --workspace=backend   # Run migrations
npm run db:seed --workspace=backend      # Seed data
npm run db:studio --workspace=backend    # Prisma Studio UI

# Build
npm run build                            # Build both
npm run build --workspace=backend        # Build backend only
npm run build --workspace=frontend       # Build frontend only

# Linting
npm run lint                             # Lint all
cd backend && npm run lint               # Lint backend
cd frontend && npm run lint              # Lint frontend
```

---

## 🔧 Troubleshooting

### ❌ "Cannot find module '@prisma/client'"
```bash
npm install --workspace=backend
npm run db:generate --workspace=backend
```

### ❌ Database connection error
```bash
# Verifica PostgreSQL è running
psql -U postgres -c "SELECT 1"

# Controlla DATABASE_URL
echo $DATABASE_URL
```

### ❌ Port already in use
```bash
# Backend (port 3000)
PORT=3001 npm run dev --workspace=backend

# Frontend (port 5173)
# Vite automaticamente usa port diverso se occupato
```

### ❌ CORS error
- Controlla `CORS_ORIGIN` in backend `.env`
- Dovrebbe corrispondere a frontend URL
- Esempio: `http://localhost:5173`

---

## 📊 API Health Check

```bash
# Verifica che backend è running
curl http://localhost:3000/health

# Dovrebbe rispondere con:
# {"status":"ok"}
```

---

## 🚀 Pronto per Produzione?

Consulta **[DEPLOYMENT.md](./DEPLOYMENT.md)** per:
- Deploy su Vercel (frontend)
- Deploy su Railway (backend)
- Setup database remoto
- Configurazione S3/R2
- Custom domain setup
- Monitoring e logging

---

## 📚 Documentazione Completa

- **[README.md](./README.md)** - Features, stack, schema database
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[PROGRESS.md](./PROGRESS.md)** - Project status e checklist

---

## 💡 Prossimi Passi Suggeriti

1. ✅ Testa localmente
2. ✅ Personalizza branding/theme
3. ✅ Implementa feature aggiuntive
4. ⬜ Deploy su staging
5. ⬜ Test end-to-end
6. ⬜ Deploy produzione

---

## 🆘 Aiuto

Se incontri problemi:

1. Controlla che tutte le dipendenze sono installate
2. Verifica variabili d'ambiente (`.env`)
3. Guarda i logs del terminal
4. Consulta documentazione official dei package

---

## ✨ Caratteristiche Implementate

- ✅ Backend REST API completa
- ✅ Frontend React responsive
- ✅ Autenticazione JWT
- ✅ Upload file con validazione
- ✅ Ricerca full-text
- ✅ Sorting multi-criterio
- ✅ Sistema rating
- ✅ Tracking download
- ✅ UI moderna dark theme
- ✅ Database schema ottimizzato
- ✅ Production-ready & scalable

---

**Happy coding! 🎮🎵**

Per domande, consulta la documentazione completa nei file `.md` della root.
