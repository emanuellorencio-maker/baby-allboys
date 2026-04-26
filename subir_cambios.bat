@echo off
cd /d "C:\Users\emanu\OneDrive\Desktop\fefi-app"

echo ==========================
echo 📂 ARCHIVOS MODIFICADOS
echo ==========================
git status

echo.
set /p confirm=¿Querés subir estos cambios? (s/n): 

if /i not "%confirm%"=="s" (
    echo ❌ Cancelado
    pause
    exit
)

echo.
set /p mensaje=📝 Mensaje del commit: 

if "%mensaje%"=="" (
    set mensaje=update automatico
)

echo.
echo ==========================
echo 💾 HACIENDO BACKUP LOCAL
echo ==========================
set fecha=%date:~6,4%-%date:~3,2%-%date:~0,2%
set hora=%time:~0,2%-%time:~3,2%

mkdir backups 2>nul
git diff > backups\backup_%fecha%_%hora%.txt

echo Backup guardado ✔

echo.
echo ==========================
echo 🚀 SUBIENDO CAMBIOS
echo ==========================

git add .
git commit -m "%mensaje%"
git push

echo.
echo ==========================
echo ✅ TODO LISTO
echo ==========================
pause