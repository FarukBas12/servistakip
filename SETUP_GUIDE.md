# Proje Kurulum Rehberi

Projemize devam etmek için aşağıdaki servislerden bazı bilgilere ihtiyacımız var. Lütfen bu adımları takip ederek gerekli bilgileri toplayın.

## 1. Veritabanı (PostgreSQL)
Verilerimizi (kullanıcılar, görevler, vb.) saklamak için bir PostgreSQL veritabanına ihtiyacımız var. İki seçeneğiniz var:

### Seçenek A: Bulut Veritabanı (Önerilen - En Kolay)
Ücretsiz ve kurulum gerektirmez.
1. [Neon.tech](https://neon.tech/) adresine gidin ve üye olun (Sign Up).
2. Yeni bir proje oluşturun.
3. Size verilen **Connection String**'i kopyalayın.
   - Şuna benzer: `postgres://kullanici:sifre@ep-xyz.aws.neon.tech/neondb?sslmode=require`

### Seçenek B: Yerel Kurulum (Localhost)
Bilgisayarınıza kurmak isterseniz.
1. [PostgreSQL İndir](https://www.postgresql.org/download/windows/) adresinden indirip kurun.
2. Kurulum sırasında belirlediğiniz şifreyi not edin.
3. pgAdmin açıp bir veritabanı (örn: `fieldservice`) oluşturun.
4. Bağlantı adresiniz şöyle olacak: `postgres://postgres:SIFRENIZ@localhost:5432/fieldservice`

---

## 2. Google Maps API
Harita özellikleri için Google Cloud Console'dan API Anahtarı almalısınız.
*(Bunu şimdilik atlayabiliriz, ama harita çalışmayacaktır)*

1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin.
2. Yeni bir proje oluşturun.
3. Şu API'leri etkinleştirin:
   - **Maps JavaScript API**
   - **Geocoding API**
4. "Credentials" kısmından bir **API Key** oluşturun.

---

## 3. Fotoğraf Depolama
Fotoğrafları nerede saklayalım?

- **Yerel (Local)**: Bilgisayarınızdaki bir klasöre kaydedilir. (Geliştirme için en kolayı).
- **Bulut (S3/Supabase)**: İnternete yüklenir. (Canlı ortam için gerekli).
*Şimdilik "Yerel" ile başlayabiliriz.*

---

## Ne Yapmalısınız?
Lütfen bana **Veritabanı Bağlantı Adresini (Connection String)** gönderin.
Örnek: `postgres://...`
