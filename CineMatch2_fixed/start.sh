#!/bin/bash
echo "🎬 CineMatch v2 — Starting..."
cd backend
pip3 install -r requirements.txt -q
echo "🚀 Backend → http://localhost:5000"
python3 app.py &
sleep 2
echo "✅ Open frontend/login.html in your browser"
# Try to open browser
if command -v open &>/dev/null; then open ../frontend/login.html
elif command -v xdg-open &>/dev/null; then xdg-open ../frontend/login.html; fi
wait
