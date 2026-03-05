# Rhythia Maps - Platform di Condivisione Mappe

Piattaforma web moderna per la condivisione e il download di mappe di gioco in formato .sspm. Ispirata al layout di [Rhythia Maps](https://www.rhythia.com/maps).

## 🌟 Caratteristiche

- **Autenticazione JWT** - Sistema di autenticazione sicuro con access e refresh token
- **Upload Mappe** - Carica file .sspm con validazione e parsing automatico
- **Ricerca e Sorting** - Ricerca full-text PostgreSQL, sorting per data/download/rating
- **Sistema di Rating** - Gli utenti possono valutare le mappe
- **Download Tracking** - Traccia il numero di download per ogni mappa
- **Storage Cloud** - Integrazione con S3/R2/Supabase per file storage
- **UI Responsiva** - Design moderno dark con componenti riutilizzabili
- **Performance** - Lazy loading, pagination server-side, caching
- **Production-Ready** - Secure, scalable, tested

## 🏗️ Stack Tecnologico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **File Upload**: Multer
- **Storage**: AWS S3 / Cloudflare R2
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Installazione Locale

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- npm o yarn
- AWS S3 / Cloudflare R2 account (optional per development)

### Clone del Repository
```bash
git clone https://github.com/tuousername/rhythia-maps.git
cd rhythia-maps
```

### Setup Backend

```bash
cd backend

# Installa dipendenze
npm install

# Copia file di configurazione
cp .env.example .env

# Configura il file .env con i tuoi valori
nano .env

# Esegui migrazioni database
npm run db:migrate

# (Opzionale) Seed del database con dati di esempio
npm run db:seed

# Avvia il server di development
npm run dev
```

**Variabili d'ambiente backend (.env)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rhythia_maps"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="rhythia-maps"

MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS="sspm"
```

### Setup Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Copia file di configurazione
cp .env.example .env

# Configura il file .env
nano .env

# Avvia dev server
npm run dev
```

**Variabili d'ambiente frontend (.env)**
```env
VITE_API_URL=http://localhost:3000
```

## 📚 API Endpoints

### Autenticazione
- `POST /auth/register` - Registrazione nuovo utente
- `POST /auth/login` - Login utente
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Profilo utente (richiede auth)

### Mappe
- `GET /maps` - Elenco mappe con sorting/ricerca
- `GET /maps/:id` - Dettagli mappa specifica
- `GET /maps/popular` - Mappe più scaricate
- `GET /maps/recent` - Mappe recenti
- `POST /maps` - Upload nuova mappa (richiede auth)
- `DELETE /maps/:id` - Elimina mappa (richiede auth + owner)

### Download & Rating
- `POST /maps/:id/download` - Registra download
- `GET /user/downloads` - Mappe scaricate dall'utente (richiede auth)
- `POST /maps/:id/ratings` - Crea rating (richiede auth)
- `PUT /maps/:id/ratings` - Aggiorna rating (richiede auth)
- `DELETE /maps/:id/ratings` - Elimina rating (richiede auth)
- `GET /maps/:id/ratings` - Elenco rating mappa
- `GET /maps/:id/my-rating` - Rating attuale dell'utente (richiede auth)

## 🗄️ Schema Database

### Users
```sql
- id: Int (PK)
- username: String (unique)
- email: String (unique)
- passwordHash: String
- role: Enum (USER, ADMIN)
- createdAt: DateTime
```

### Maps
```sql
- id: Int (PK)
- title, artist, mapper: String
- difficulty, bpm: Float
- duration, noteCount: Int
- fileUrl, coverUrl: String (S3 URLs)
- description: String
- downloadCount, weeklyDownloadCount: Int
- ratingAvg, ratingCount: Int
- createdAt, updatedAt: DateTime
- uploaderId: Int (FK)
```

### Downloads
```sql
- id: Int (PK)
- mapId: Int (FK)
- userId: Int (FK, nullable)
- createdAt: DateTime
```

### Ratings
```sql
- id: Int (PK)
- mapId, userId: Int (FK)
- rating: Int (1-5)
- comment: String (optional)
- createdAt, updatedAt: DateTime
- Constraint: (mapId, userId) unique
```

## 🚀 Deployment

### Opzione 1: Vercel + Railway

#### Frontend - Deploy su Vercel
```bash
cd frontend

# Login a Vercel
vercel login

# Deploy
vercel
```

#### Backend - Deploy su Railway
```bash
cd backend

# Login a Railway
railway login

# Link al progetto
railway link

# Deploy
railway up
```

### Opzione 2: Render + Railway

#### Backend su Render
1. Push il codice su GitHub
2. Vai su [render.com](https://render.com)
3. Crea nuovo Web Service
4. Connetti il repository GitHub
5. Seleziona `backend` come root directory
6. Configura variabili d'ambiente
7. Deploy

#### Database su Railway
1. Crea nuovo PostgreSQL database
2. Copia connection string
3. Usa come `DATABASE_URL` nel backend

### Configurazione DNS

Per il tuo dominio, configura:
```
Frontend: CNAME -> vercel.app (o render)
Backend: CNAME -> railway.app (o render)
```

## 🔒 Sicurezza in Produzione

- [ ] Abilitare HTTPS (certificato SSL/TLS)
- [ ] Configurare CORS per il tuo dominio
- [ ] Abilitare rate limiting
- [ ] Usare variabili d'ambiente per secrets
- [ ] Abilitare 2FA su conti provider (AWS, GitHub, etc.)
- [ ] Configurare backup database automatici
- [ ] Abilitare monitoring e logging
- [ ] Eseguire security audit regolari
- [ ] Update dipendenze periodicamente

## 📊 Performance Tips

### Frontend
- Lazy load immagini con `loading="lazy"`
- Paginate i risultati (non caricare tutto insieme)
- Cache API responses
- Compression gzip automatica da Vite

### Backend
- Indici su: `downloadCount`, `weeklyDownloadCount`, `createdAt`, `ratingAvg`
- Connection pooling PostgreSQL
- Redis per caching (opzionale)
- CDN per immagini S3
- Compression middleware

## 🐛 Troubleshooting

### Database connection error
```bash
# Verifica che PostgreSQL è running
psql -U postgres

# Controlla connection string
echo $DATABASE_URL
```

### S3 upload fails
- Verifica AWS credentials
- Controlla bucket permissions
- Verifica CORS bucket policy

### Frontend can't connect to backend
- Verifica CORS_ORIGIN nel backend .env
- Controlla proxy in vite.config.ts
- Verifica API_URL nel frontend .env

## 📝 File Structure

```
rhythia-maps/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth, validation
│   │   ├── utils/              # Helpers, validators
│   │   └── index.ts            # App entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # DB migrations
│   │   └── seed.ts             # Seed script
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── context/            # State management
│   │   ├── services/           # API client
│   │   ├── styles/             # Global CSS
│   │   └── App.tsx             # Root component
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── package.json                # Monorepo root
└── README.md
```

## 🤝 Contribuire

1. Fork il repository
2. Crea un feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📄 Licenza

Questo progetto è licenziato sotto MIT License - vedi il file [LICENSE](LICENSE) per dettagli.

## 👨‍💻 Autore

Sviluppato come piattaforma production-ready per la comunità di rhythm game.

## 🎮 Future Features

- [ ] Sistema di commenti su mappe
- [ ] Sistema follow tra utenti
- [ ] Leaderboard mapper per difficoltà
- [ ] API pubblica per integrazioni
- [ ] Sistema notifiche in tempo reale
- [ ] Editor mappa online
- [ ] Preview player mini
- [ ] Collaborazione multipla mapper
- [ ] Sistema tag gerarchico
- [ ] Analytics per mapper

---

**Made with ❤️ for the Rhythm Game Community**
