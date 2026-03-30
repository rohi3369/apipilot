@echo off
echo 🚀 Starting ApiPilot Application...

REM Stop any existing containers
echo 📦 Stopping existing containers...
docker-compose down

REM Clean up any hanging containers
echo 🧹 Cleaning up...
docker system prune -f

REM Build and start the application
echo 🔨 Building and starting containers...
docker-compose up --build

echo ✅ Application should be available at:
echo    Frontend: http://localhost:80
echo    Backend:  http://localhost:5000
echo    Health:   http://localhost:5000/health
echo.
echo 🔐 Login credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo 📝 To check logs:
echo    docker-compose logs backend
echo    docker-compose logs frontend
pause
