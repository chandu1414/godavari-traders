@echo off
title GODAVARI TRADERS - Digital Billing & Shop Management System
echo ===================================================
echo     GODAVARI TRADERS - Digital POS Billing System
echo ===================================================
echo.
echo Starting application backend and frontend...
echo Access URL: http://localhost:5000
echo Default Login: admin / Godavari@2026
echo.
cd /d "%~dp0backend"
python app.py
pause
