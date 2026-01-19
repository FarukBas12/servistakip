@echo off
echo GitHub Guncelleniyor...
set PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd;C:\Program Files\Git\cmd

git add .
git commit -m "Update API logic for cloud"
git push -u origin main
echo.
echo Kodlar guncellendi! Simdi Render'a gecebiliriz.
pause
