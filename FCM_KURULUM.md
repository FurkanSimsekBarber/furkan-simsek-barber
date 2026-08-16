# FCM Bildirim Kurulumu

Kod tarafı hazırdır. Bildirimlerin gerçekten gönderilebilmesi için yalnızca Google Apps Script'e Firebase servis hesabı bilgileri eklenmelidir.

## 1. Firebase servis hesabı

Firebase Console → Project settings → Service accounts bölümünden bir servis hesabı oluşturun ve JSON private key indirin.

JSON içindeki şu iki alan kullanılacak:

- `client_email`
- `private_key`

## 2. Apps Script Script Properties

Google Apps Script projesinde:

**Proje Ayarları → Komut dosyası özellikleri → Komut dosyası özellikleri ekle**

şu iki özelliği ekleyin:

### FCM_CLIENT_EMAIL

Firebase servis hesabındaki `client_email` değeri.

### FCM_PRIVATE_KEY

Firebase servis hesabındaki `private_key` değeri.

Private key'i GitHub'a veya frontend JavaScript dosyalarına koymayın.

## 3. Bildirim akışı

- Müşteri randevu oluşturur.
- Müşterinin FCM tokenı randevu ID'siyle `FCM_Tokens` sayfasına kaydedilir.
- İşletme Android uygulamasındaki admin FCM tokenı `Tip=admin` olarak kaydedilir.
- Yeni randevu geldiğinde tüm admin cihazlarına **Yeni Randevu** bildirimi gönderilir.
- Yönetici randevuyu **Onaylandı** yaptığında ilgili müşteriye **Randevunuz Onaylandı** bildirimi gönderilir.
- Yönetici randevuyu **İptal** yaptığında ilgili müşteriye **Randevunuz Reddedildi** bildirimi gönderilir.
- Geçersiz/eski FCM tokenları otomatik olarak token tablosundan temizlenir.

## 4. Önemli

`backend_apps_script.gs` dosyasını Apps Script projesine kopyaladıktan sonra yeni sürüm olarak dağıtın ve web uygulamasının erişimini mevcut şekilde koruyun.

Firebase servis hesabı bilgileri yalnızca Apps Script Script Properties içinde tutulmalıdır.
