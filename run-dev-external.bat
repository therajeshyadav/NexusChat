@echo off
echo Starting development server with external access...
echo.
echo 🚀 Frontend will be available at:
echo   - Localhost: http://localhost:8080
echo   - External:  http://10.205.15.217:8080
echo.
echo Make sure your backend servers are running with external access:
echo   - AuthService: http://10.205.15.217:5000
echo   - ChatService: http://10.205.15.217:5001
echo.
npm run dev -- --host 0.0.0.0