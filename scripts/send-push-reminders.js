const webpush = require('web-push');

const API_URL = process.env.BOOKING_API_URL;
const PUSH_CRON_SECRET = process.env.PUSH_CRON_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!API_URL || !PUSH_CRON_SECRET || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('Eksik GitHub Actions secret/environment değeri.');
}

webpush.setVapidDetails(
  'mailto:furkansimsek993@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

async function getDuePushes() {
  const url = `${API_URL}?action=duepush&secret=${encodeURIComponent(PUSH_CRON_SECRET)}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`duepush HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'duepush başarısız.');
  return data.items || [];
}

async function markSent(id, kind) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'markPushSent',
      secret: PUSH_CRON_SECRET,
      id,
      kind
    })
  });

  if (!response.ok) throw new Error(`markPushSent HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Bildirim durumu kaydedilemedi.');
}

(async () => {
  const items = await getDuePushes();
  console.log(`Gönderilecek bildirim: ${items.length}`);

  for (const item of items) {
    try {
      const subscription = typeof item.subscription === 'string'
        ? JSON.parse(item.subscription)
        : item.subscription;

      const payload = JSON.stringify({
        title: 'Furkan Şimşek Barber',
        body: item.body,
        tag: `randevu-${item.id}-${item.kind}`,
        url: '/furkan-simsek-barber/randevu/'
      });

      await webpush.sendNotification(subscription, payload, { TTL: 3600 });
      await markSent(item.id, item.kind);
      console.log(`✓ ${item.id} / ${item.kind} gönderildi.`);
    } catch (error) {
      console.error(`✗ ${item.id} / ${item.kind}:`, error.statusCode || '', error.message);
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.error('Abonelik artık geçerli görünmüyor; yeniden bildirim izni alınması gerekir.');
      }
    }
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
