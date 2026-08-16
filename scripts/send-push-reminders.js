const webpush = require('web-push');

const API_URL = process.env.BOOKING_API_URL;
const PUSH_CRON_SECRET = process.env.PUSH_CRON_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const TEST_PUSH = true;
const TEST_BOOKING_ID = process.env.TEST_BOOKING_ID || '';

if (!API_URL || !PUSH_CRON_SECRET || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('Eksik GitHub Actions secret/environment değeri.');
}

webpush.setVapidDetails(
  'mailto:furkansimsek993@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

async function getTestPush() {
  if (!TEST_BOOKING_ID) throw new Error('TEST_BOOKING_ID tanımlı değil.');
  const url = `${API_URL}?action=testpush&secret=${encodeURIComponent(PUSH_CRON_SECRET)}&id=${encodeURIComponent(TEST_BOOKING_ID)}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`testpush HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'testpush başarısız.');
  return [data.item];
}

(async () => {
  const items = await getTestPush();
  console.log(`Gönderilecek bildirim: ${items.length}`);

  for (const item of items) {
    try {
      const subscription = typeof item.subscription === 'string'
        ? JSON.parse(item.subscription)
        : item.subscription;

      const payload = JSON.stringify({
        title: 'Furkan Şimşek Barber',
        body: 'TEST BİLDİRİMİ — Web Push sistemi başarıyla çalışıyor.',
        tag: `randevu-${item.id}-test`,
        url: '/'
      });

      await webpush.sendNotification(subscription, payload, { TTL: 3600 });
      console.log(`✓ ${item.id} / test gönderildi.`);
    } catch (error) {
      console.error(`✗ ${item.id} / test:`, error.statusCode || '', error.message);
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.error('Push aboneliği artık geçerli değil; tarayıcıdan yeniden bildirim izni verilmesi gerekir.');
      }
      process.exitCode = 1;
    }
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
