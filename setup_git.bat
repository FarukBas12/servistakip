@echo off
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd;C:\Program Files\Git\cmd
echo Git Ayarlari Yapiliyor...
echo.
set /p "email=GitHub E-posta Adresinizi Girin: "
set /p "name=Adiniz Soyadiniz (GitHub Kullanici Adi): "

git config --global user.email "%email%"
git config --global user.name "%name%"
git init
git add .
git commit -m "Ilk yukleme"

echo.
echo Harika! Git ayarlari yapildi ve kodlar paketlendi.
echo Simdi GitHub'a yuklemeye hazir.
pause
