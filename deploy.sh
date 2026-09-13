#!/bin/bash

# Muslim Welfare AI System - Easy Deployment Script
# Allows custom port configuration

echo "🚀 Muslim Welfare AI System - Deployment Script"
echo "=============================================="
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Prompt for ports or use defaults
echo "Enter your port configuration (or press Enter for defaults):"
echo ""

read -p "Backend port (default: 8001): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8001}

read -p "Frontend port (default: 3001): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3001}

read -p "Database port (default: 5433): " DB_PORT
DB_PORT=${DB_PORT:-5433}

read -p "Redis port (default: 6380): " REDIS_PORT
REDIS_PORT=${REDIS_PORT:-6380}

# Validate ports are numbers
if ! [[ $BACKEND_PORT =~ ^[0-9]+$ ]] || ! [[ $FRONTEND_PORT =~ ^[0-9]+$ ]]; then
    echo "❌ Ports must be numbers!"
    exit 1
fi

echo ""
echo "📋 Configuration Summary:"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Database: localhost:$DB_PORT"
echo "  Redis:    localhost:$REDIS_PORT"
echo ""

# Create .env.local
cat > .env.local << ENVEOF
# Auto-generated deployment configuration
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
DB_PORT=$DB_PORT
REDIS_PORT=$REDIS_PORT

DATABASE_URL=postgresql://welfare:welfare123@localhost:$DB_PORT/welfare_db
REDIS_URL=redis://localhost:$REDIS_PORT/0
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT

ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:$FRONTEND_PORT
VOICE_ENABLED=true
OFFLINE_ENABLED=true
MULTILINGUAL_SUPPORT=true
ENVEOF

echo "✅ Configuration saved to .env.local"
echo ""

# Check if ports are available
echo "🔍 Checking if ports are available..."
for port in $BACKEND_PORT $FRONTEND_PORT $DB_PORT $REDIS_PORT; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use!"
    fi
done

echo ""
read -p "Start services? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting services..."
    docker-compose up -d

    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 10

    echo ""
    echo "✅ Services started!"
    echo ""
    echo "📍 Access your application:"
    echo "  Frontend (Survey):    http://localhost:$FRONTEND_PORT"
    echo "  API Documentation:    http://localhost:$BACKEND_PORT/docs"
    echo "  API Health Check:     http://localhost:$BACKEND_PORT/health"
    echo "  Database Connection:  psql postgresql://welfare:welfare123@localhost:$DB_PORT/welfare_db"
    echo ""
    echo "📊 View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "  docker-compose down"
else
    echo ""
    echo "To start services later, run:"
    echo "  docker-compose up -d"
fi
