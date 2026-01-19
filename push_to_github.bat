@echo off
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd;C:\Program Files\Git\cmd
echo GitHub'a Baglaniyor...
echo.

git remote remove origin
git remote add origin https://github.com/FarukBas12/servistakip.git
git branch -M main
git push -u origin main

echo.
echo Islem Bitti!
pause
