# 🚀 Guida Deployment Rhythia Maps

Questa guida spiega come deployare Rhythia Maps in produzione.

## Architettura Consigliata

```
                    ┌─────────────────┐
                    │   Tuo Dominio   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                │
              ┌─────▼────┐      ┌────▼──────┐
              │  Vercel  │      │  Railway  │
              │ (Frontend)      │ (Backend) │
              └──────────┘      └────┬──────┘
                                     │
                            ┌────────▼────────┐
                            │ PostgreSQL DB  │
                            │ (Railway/Neon) │
                            └─────────────────┘
```

## Passo 1: Setup Repository

### GitHub
```bash
# Se non hai già repository
git init
git remote add origin https://github.com/tuousername/rhythia-maps.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Passo 2: Preparare Variabili d'Ambiente

### Backend Variables (Railway)
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# JWT
JWT_SECRET="generate-secure-random-string"
JWT_REFRESH_SECRET="generate-another-secure-random-string"
JWT_EXPIRATION="24h"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="production"
API_URL="https://api.tuodominio.com"
FRONTEND_URL="https://tuodominio.com"

# AWS S3 (o Cloudflare R2)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="rhythia-maps-prod"
AWS_S3_ENDPOINT="optional-if-using-r2"

# File Upload
MAX_FILE_SIZE=52428800
ALLOWED_EXTENSIONS="sspm"

# CORS
CORS_ORIGIN="https://tuodominio.com"

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Variables (Vercel)
```env
VITE_API_URL="https://api.tuodominio.com"
```

## Passo 3: Setup Database (Railway)

1. Vai su https://railway.app
2. Crea nuovo account / login
3. Crea nuovo progetto
4. Aggiungi PostgreSQL plugin
5. Copia connection string `DATABASE_URL`
6. Aggiorna nel backend .env

## Passo 4: Setup S3 Storage

### AWS S3
```bash
# 1. Crea bucket S3
# 2. Configura bucket policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rhythia-maps-prod/*"
    }
  ]
}

# 3. Abilita CORS:
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://tuodominio.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Cloudflare R2 (alternativa, zero egress cost)
```bash
# 1. Vai su Cloudflare Dashboard
# 2. Crea R2 bucket
# 3. Genera API token
# 4. Usa come AWS_S3_ENDPOINT
```

## Passo 5: Deploy Backend (Railway)

### Opzione A: Deploy Diretto

```bash
# 1. Installa Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link progetto
railway link

# 4. Deploy
railway up
```

### Opzione B: GitHub Integration

1. Connetti Railway con GitHub
2. Seleziona repository
3. Configura build settings:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Build Command**: `npm run build && npm run db:migrate`

### Dopo il Deploy
```bash
# Seed database (una volta)
railway run npm run db:seed

# Verificare API
curl https://api.tuodominio.com/health
```

## Passo 6: Deploy Frontend (Vercel)

### Opzione A: Vercel CLI

```bash
# 1. Installa Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --scope your-scope
```

### Opzione B: Git Integration

1. Vai a https://vercel.com
2. Importa repository GitHub
3. Configura build:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output**: `dist`
4. Aggiungi env variables
5. Deploy

## Passo 7: Configurare Domini

### DNS Setup (CloudFlare)

```
Frontend:
  CNAME rhythia.tuodominio.com -> cname.vercel-dns.com

Backend:
  CNAME api.tuodominio.com -> railway.app (o render.onrender.com)
```

### HTTPS Certificates

- Vercel: Automatico
- Railway: Automatico con Railway Domains

## Passo 8: Ottimizzazioni Produzione

### Backend
```bash
# 1. Disabilita TypeScript watch
NODE_ENV=production npm start

# 2. Abilita compression
npm install compression

# 3. Monitora con logging
npm install winston pino

# 4. Setup health checks
curl -H "Upgrade-Insecure-Requests: 1" https://api.tuodominio.com/health
```

### Frontend
```bash
# 1. Build ottimizzato
npm run build

# 2. Verifica bundle size
npm install -g @vite/inspect

# 3. Monitoring con Sentry
npm install @sentry/react
```

## Passo 9: Setup Monitoraggio

### Error Tracking
```bash
# Backend - Sentry
npm install @sentry/node @sentry/tracing

# Frontend - Sentry
npm install @sentry/react @sentry/tracing
```

### Logging
```bash
# Backend - Winston
npm install winston

# Monitor con Railway dashboard
# Railway > Logs tab
```

## Passo 10: Backup e Sicurezza

### Database Backup
```bash
# Railway auto-backups ogni 24h
# Configura in Railway dashboard

# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### SSL/TLS
```bash
# Automatico su tutti i provider
# Verifica:
curl -I https://api.tuodominio.com
# Dovrebbe mostrare certificate valido
```

### Rate Limiting (in produzione)
```bash
# Abilita nel backend
RATE_LIMIT_WINDOW=15    # 15 minuti
RATE_LIMIT_MAX_REQUESTS=100  # max richieste
```

## Passo 11: Testing Pre-Production

```bash
# Test API endpoints
curl https://api.tuodominio.com/maps
curl -X POST https://api.tuodominio.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Test frontend
# Apri https://tuodominio.com
# Verifica login, upload, ricerca funzionano

# Monitora logs
railway logs -f
```

## Troubleshooting Deploy

### Backend non parte
```bash
# Controlla logs
railway logs --service backend

# Verifica variabili d'ambiente
railway variables

# Test database locally
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend errore 404 dopo build
```bash
# Verifica output folder in vercel.json
# Dovrebbe essere 'frontend/dist'

# Controlla Routes in Vercel dashboard
# Aggiungi: { "src": "/(.*)", "dest": "/index.html" }
```

### S3 upload fails
```bash
# Testa credentials
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \
  aws s3 ls s3://rhythia-maps-prod

# Verifica bucket CORS
aws s3api get-bucket-cors --bucket rhythia-maps-prod
```

### CORS errors
```bash
# Backend
# Verifica CORS_ORIGIN nel .env
# Dovrebbe essere: https://tuodominio.com (senza trailing slash)

# S3
# Verifica bucket CORS policy
# AllowedOrigins deve includere https://tuodominio.com
```

## Monitoraggio Post-Deploy

### Dashboard
- **Railway**: https://railway.app/dashboard
- **Vercel**: https://vercel.com/dashboard
- **AWS S3**: https://s3.console.aws.amazon.com

### Checking Health
```bash
# API health
curl https://api.tuodominio.com/health

# Database stats
psql $DATABASE_URL -c "SELECT COUNT(*) FROM maps;"

# Storage usage
aws s3 ls s3://rhythia-maps-prod --recursive --summarize
```

## Scaling Futura

Quando crescerai, considera:

1. **CDN per immagini**: CloudFlare, Akamai
2. **Redis caching**: Railway Redis plugin
3. **Database read replicas**: Per query pesanti
4. **Serverless functions**: Per tasks background
5. **Load balancing**: Multiple backend instances
6. **Containerization**: Docker/Kubernetes

## Cost Estimation (Monthly)

| Service | Free Tier | Pricing |
|---------|-----------|---------|
| Vercel | 100 GB bandwidth | $5-50 |
| Railway | $5 credit | $7-20/month per service |
| PostgreSQL (Neon) | Free tier | $0-30 |
| AWS S3 | 1GB storage free | $0.023/GB |
| **Total (minimal)** | - | **$10-50/month** |

## Checklist Deploy

- [ ] Repository su GitHub
- [ ] Database setup su Railway/Neon
- [ ] S3 bucket creato
- [ ] Variabili d'ambiente configurate
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Domini DNS configurati
- [ ] SSL/TLS certificates validati
- [ ] Health check passato
- [ ] Test end-to-end completato
- [ ] Backup database configurato
- [ ] Monitoring/logging setup
- [ ] Documentazione aggiornata

---

**Per supporto**: Consulta la documentazione ufficiale di Vercel, Railway, AWS S3
