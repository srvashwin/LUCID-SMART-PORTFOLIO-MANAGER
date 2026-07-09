#!/bin/bash
echo "Starting Finance Tracker..."

# Start backend
echo "Starting backend on http://localhost:8000"
cd "$(dirname "$0")/backend"
python3 -m uvicorn app.main:app --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on http://localhost:5173"
cd "$(dirname "$0")/frontend"
npx vite --host &
FRONTEND_PID=$!

echo ""
echo "==================================="
echo "  Finance Tracker is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo "==================================="
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
