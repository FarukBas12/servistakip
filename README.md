# ServisTakip App

Modern bir Saha Servis Yönetim Uygulaması (Field Service Management).

## 🚀 Özellikler

*   **Yönetici Paneli**: Görev atama, takip etme, harita görünümü, personel yönetimi ve raporlama.
*   **Teknisyen Arayüzü**: Mobil uyumlu görev listesi, iş başlatma/bitirme, fotoğraf ve GPS konumu ile iş tamamlama.
*   **İş Havuzu**: Atanmamış işlerin yönetimi, düzenlenmesi ve silinmesi.
*   **Harita**: Tüm işlerin Google Haritalar üzerinde pinlerle gösterimi.
*   **Raporlar**: İş durumu dağılımı ve günlük iş yükü grafikleri.

## 🛠️ Kurulum ve Çalıştırma

Bu proje iki ana parçadan oluşur: `server` (Backend) ve `client` (Frontend). İkisinin de ayrı terminallerde çalışması gerekir.

### 1. Backend'i (Sunucu) Başlatma
Veritabanı bağlantısı ve API servisleri için gereklidir.

```bash
cd server
npm run dev
```
*Not: Eğer "scripts disabled" hatası alırsanız `node index.js` komutunu kullanın.*
*Sunucu şu adreste çalışır: http://localhost:5000*

### 2. Frontend'i (Uygulama) Başlatma
Arayüzü görmek için gereklidir.

```bash
cd client
npm run dev
```
*Uygulama şu adreste açılır: http://localhost:5173* (veya size verilen Network IP adresi).

## 🔐 Giriş Bilgileri

*   **Admin**: `admin` / `password`
*   **Teknisyen**: `tech1` / `password`

## 📂 Proje Yapısı

*   `/server`: Node.js, Express, PostgreSQL veritabanı kodları.
*   `/client`: React, Vite, Recharts, Leaflet arayüz kodları.

## 📝 Notlar
*   Tasarım: Gri tonlarında Glassmorphism teması.
*   Logolar: `client/public/logo.png` dosyasından değiştirilebilir.
