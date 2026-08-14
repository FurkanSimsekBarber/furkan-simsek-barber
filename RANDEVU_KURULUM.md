# Furkan Şimşek Berber — V5 Profesyonel Randevu Sistemi

## Eklenenler
- Gerçek zamanlı dolu/müsait saat kontrolü
- 09:00–20:00 çalışma aralığı
- 13:00–14:00 öğle molası
- Pazar kapalı
- 30 dakikalık randevu slotları
- Aynı saatin iki kişi tarafından alınmasını önleyen sunucu kilidi
- Google Sheets kayıt sistemi
- "Onay Bekliyor / Onaylandı / İptal" durumları
- `admin.html` ile günlük randevu yönetim ekranı
- Randevu sonrası WhatsApp'a hazır mesaj
- Mobil uyumlu yönetim ekranı

## Kurulum
1. Google Sheet oluştur.
2. Uzantılar > Apps Script.
3. `backend_apps_script.gs` kodunu yapıştır.
4. `ADMIN_TOKEN` değerini güçlü, gizli bir şifreyle değiştir.
5. `setup` fonksiyonunu bir kez çalıştır.
6. Dağıt > Yeni dağıtım > Web uygulaması.
7. "Ben" olarak çalıştır; erişimi "Herkes" yap.
8. `/exec` adresini kopyala.
9. `js/booking.js` içindeki `BOOKING_API_URL` değerine yapıştır.
10. `admin.html` içindeki `API` değerine aynı adresi yapıştır.
11. Siteyi yayınla.

## Yönetim
Site klasöründeki `admin.html` adresini aç. Apps Script'teki `ADMIN_TOKEN` ile giriş yap.
Buradan seçilen güne ait randevuları görüp "Onaylandı" veya "İptal" durumuna çevirebilirsin.

## İşletme saatleri
Backend:
- Pazartesi–Cumartesi: 09:00–20:00
- Öğle molası: 13:00–14:00
- Pazar: kapalı
- Randevu aralığı: 30 dakika

Bunları `backend_apps_script.gs` içindeki ayarlardan değiştirebilirsin.

## Güvenlik notu
Admin token'ı siteye sabit yazmak yerine Apps Script üzerinde gizli tutmak en güvenlisidir. Bu sürümde token admin sayfasına kullanıcı tarafından girilir; tarayıcıda localStorage'da saklanır. Çok daha yüksek güvenlik için Google hesabı ile yönetici doğrulaması ayrıca kurulabilir.
