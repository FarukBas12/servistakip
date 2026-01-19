@echo off
echo GitHub'a Zorla Gonderme Basliyor...
echo.
echo Lutfen asagidaki adimlari takip edin:
echo 1. Eger 'Sign in with browser' penceresi acilirsa giris yapin.
echo 2. Eger kullanici adi sorarsa girin.
echo 3. Sifre yerine 'Personal Access Token' gerekebilir (ama once normal sifreyi deneyin).
echo.

set PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Users\%USERNAME%\AppData\Local\Programs\Git\cmd;C:\Program Files (x86)\Git\cmd

git remote remove origin
git remote add origin https://github.com/FarukBas12/servistakip.git
git branch -M main
git push -u origin main

echo.
echo ISLEM SONUCU YUKARIDA YAZIYOR.
echo Eger 'Everything up-to-date' yaziyorsa basarili demektir.
echo Eger kirmizi hata varsa lutfen bana soyleyin.
pause
