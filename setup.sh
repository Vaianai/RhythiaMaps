#!/bin/bash

# Rhythia Maps Setup Script
# Questo script installa tutte le dipendenze e configura il progetto

set -e

echo "🎵 Rhythia Maps Setup Script"
echo "=============================="
echo ""

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
echo "✓ Node.js $(node -v) installed"

# Check npm
echo -e "${BLUE}Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✓ npm $(npm -v) installed"

# Check PostgreSQL
echo -e "${BLUE}Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed locally (but can be used remotely)"
    echo "   For local development, install PostgreSQL from https://www.postgresql.org/download/"
else
    echo "✓ PostgreSQL installed"
fi

echo ""

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"

echo ""

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Setup backend env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file for backend...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update backend/.env with your values${NC}"
fi

cd ..

echo ""

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Setup frontend env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file for frontend...${NC}"
    cp .env.example .env
fi

cd ..

echo ""

# Database setup instructions
echo -e "${BLUE}Database Setup Instructions:${NC}"
echo "1. Create a PostgreSQL database:"
echo "   createdb rhythia_maps"
echo ""
echo "2. Update DATABASE_URL in backend/.env"
echo ""
echo "3. Run migrations:"
echo "   npm run db:migrate --workspace=backend"
echo ""
echo "4. (Optional) Seed database:"
echo "   npm run db:seed --workspace=backend"

echo ""

# Summary
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update configuration files (.env files)"
echo "2. Setup PostgreSQL database"
echo "3. Run migrations"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "Alternatively:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Happy coding! 🎮"
