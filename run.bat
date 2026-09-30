@echo off
title ShopVista - E-Commerce Business Analysis Platform
echo =====================================================================
echo           ShopVista - E-Commerce Business Analysis Platform
echo =====================================================================
echo.

echo [1/3] Checking and installing Python dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies might have failed. Continuing...
)

echo.
echo [2/3] Verifying and Seeding MySQL Database (ecommerce_analytics)...
python database/seed_data.py
if %errorlevel% neq 0 (
    echo [WARNING] MySQL database seed failed or already populated. Using live DB or cache.
)

echo.
echo [3/3] Starting ShopVista Analytics Server on http://localhost:5000...
echo Open your browser at: http://localhost:5000
echo Press CTRL+C to stop the server anytime.
echo.
python app.py
pause
