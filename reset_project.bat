@echo off
echo ===============================================
echo        SIFIRDAN TEMIZ KURULUM BASLATIYOR
echo ===============================================

:: 1. Git Yolunu Ayarla
set "GIT_PATH=C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd"
set "PATH=%PATH%;%GIT_PATH%;C:\Program Files\Git\cmd"

:: 2. Eski Git Gecmisini Sil
echo Temizlik yapiliyor...
if exist .git (
    rmdir /s /q .git
)

:: 3. Yeni Depo Olustur
echo Yeni depo kuruluyor...
git init
git add .
git commit -m "Clean Start: Final v1.0"

:: 4. GitHub Baglantisi
echo GitHub'a baglaniyor...
git remote add origin https://github.com/FarukBas12/servistakip.git
git branch -M main

:: 5. Yukle (Force Push)
echo Buluta yukleniyor (Giris yapmaniz gerekebilir)...
git push -u origin main --force

echo.
echo ===============================================
echo    ISLEM TAMAM! TERTEMIZ BIR SAYFA ACILDI.
echo ===============================================
pause
