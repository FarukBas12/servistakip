@echo off
echo ServisTakip Uygulamasi Baslatiliyor...

echo Backend (Sunucu) Aciliyor...
start "ServisTakip Backend" cmd /k "cd server && npm run dev"

echo Frontend (Arayuz) Aciliyor...
start "ServisTakip Client" cmd /k "cd client && npm run dev"

echo Islem Tamam! Pencereleri kapatmayin.
exit
