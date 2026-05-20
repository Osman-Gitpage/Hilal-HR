@echo off

cd /d C:\Users\PC\muhasebe

REM npm run dev'i yeni bir pencerede başlat
start "Muhasebe Dev" cmd /k npm run dev

REM serverın ayağa kalkması için biraz bekle
timeout /t 5 /nobreak > nul

REM Google Chrome'da linkleri aç
start chrome http://localhost:3000/

exit
