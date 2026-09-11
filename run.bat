@echo off
cd /d "%~dp0"
echo.
echo ==========================================
echo       DAILY ROUTINE LOG - STARTING
echo ==========================================
echo.
if not exist venv\Scripts\python.exe (
    echo Creating virtual environment...
    py -m venv venv
)
echo Installing required packages...
venv\Scripts\python.exe -m pip install -r requirements.txt
echo.
echo Starting the app...
echo Open http://127.0.0.1:5000 in Chrome
echo Keep this window open while using the app.
echo.
venv\Scripts\python.exe app.py
pause
