@echo off
set "GIT_PATH=C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd"
set "PATH=%PATH%;%GIT_PATH%;C:\Program Files\Git\cmd"

echo ==========================================
echo SIFIRDAN KURULUM VE YUKLEME BASLIYOR
echo ==========================================
echo.

echo 1. Eski Git ayarlari temizleniyor...
if exist .git (
    rmdir /s /q .git
)

echo 2. Yeni depo baslatiliyor (Init)...
git init

echo 3. Ayarlar yapiliyor...
git config user.email "faruk@example.com"
git config user.name "Faruk"

echo 4. Dosyalar paketleniyor...
git add .
git commit -m "Sifirdan yukleme - Final"

echo 5. GitHub'a baglaniyor...
git remote add origin https://github.com/FarukBas12/servistakip.git
git branch -M main

echo 6. YUKLENIYOR (Bu adimda giris yapmaniz istenebilir)...
git push -f origin main

echo.
echo ==========================================
echo ISLEM TAMAMLANDI!
echo ==========================================
echo.
pause
