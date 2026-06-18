#!/bin/bash

# AI Supply Chain Control Tower - Setup Script
# This script sets up the entire development environment

echo "🚀 AI Supply Chain Control Tower Setup"
echo "======================================"
echo ""

# Check Python
echo "✓ Checking Python installation..."
python --version || { echo "❌ Python not found. Please install Python 3.8+"; exit 1; }

# Check Node.js
echo "✓ Checking Node.js installation..."
node --version || { echo "❌ Node.js not found. Please install Node.js 14+"; exit 1; }
npm --version

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend || exit
pip install -r requirements.txt
cd ..

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend || exit
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start backend:  cd backend && python app.py"
echo "2. Start frontend: cd frontend && npm start"
echo ""
echo "📊 Dashboard will be available at: http://localhost:3000"
echo ""
