@echo off
echo ========================================================
echo   Iniciando Clasificador de Animales (Teachable Machine)
echo ========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detectado. Levantando servidor local en http://localhost:8000 ...
    echo (Esto asegura que la camara web funcione sin restricciones de seguridad del navegador)
    start "" http://localhost:8000
    python -m http.server 8000
) else (
    echo [INFO] Abriendo index.html directamente en tu navegador predeterminado...
    start "" "index.html"
)
pause
