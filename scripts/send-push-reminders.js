const webpush = require('web-push');
const crypto = require('crypto');

const API_URL = process.env.BOOKING_API_URL;
const PUSH_CRON_SECRET = process.env.PUSH_CRON_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const TEST_PUSH = String(process.env.TEST_PUSH || 'false').toLowerCase() === 'true';
const TEST_BOOKING_ID = process.env.TEST_BOOKING_ID || '';

if (!API_URL || !PUSH_CRON_SECRET || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('Eksik GitHub Actions secret/environment değeri.');
}

function b64urlToBuffer(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4), 'base64');
}

function validateVapidPair() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(b64urlToBuffer(VAPID_PRIVATE_KEY));
  const derivedPublic = ecdh.getPublicKey(null, 'uncompressed').toString('base64url');
  if (derivedPublic !== VAPID_PUBLIC_KEY) {
    throw new Error('VAPID_PUBLIC_KEY ile VAPID_PRIVATE_KEY aynı anahtar çiftine ait değil. GitHub Secrets değerlerini kontrol edin.');
  }
}

validateVapidPair();

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
  return Array.isArray(data.items) ? data.items : [];
}

async function getTestPush() {
  if (!TEST_BOOKING_ID) throw new Error('TEST_BOOKING_ID tanımlı değil.');
  const url = `${API_URL}?action=testpush&secret=${encodeURIComponent(PUSH_CRON_SECRET)}&id=${encodeURIComponent(TEST_BOOKING_ID)}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`testpush HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'testpush başarısız.');
  return data.item ? [data.item] : [];
}

async function markPushSent(item) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'markPushSent',
      secret: PUSH_CRON_SECRET,
      id: item.id,
      kind: item.kind
    }),
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`markPushSent HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || 'Bildirim gönderildi işareti kaydedilemedi.');
}

(async () => {
  const items = TEST_PUSH ? await getTestPush() : await getDuePushes();
  console.log(`Gönderilecek bildirim: ${items.length}`);

  for (const item of items) {
    try {
      const subscription = typeof item.subscription === 'string'
        ? JSON.parse(item.subscription)
        : item.subscription;

      const payload = JSON.stringify({
        title: 'Furkan Şimşek Barber',
        body: TEST_PUSH
          ? 'TEST BİLDİRİMİ — Web Push sistemi başarıyla çalışıyor.'
          : item.body,
        tag: `randevu-${item.id}-${item.kind || 'test'}`,
        url: '/furkan-simsek-barber/randevu/'
      });

      await webpush.sendNotification(subscription, payload, { TTL: 3600 });

      if (!TEST_PUSH) {
        await markPushSent(item);
      }

      console.log(`✓ ${item.id} / ${TEST_PUSH ? 'test' : item.kind} gönderildi.`);
    } catch (error) {
      console.error(`✗ ${item.id} / ${TEST_PUSH ? 'test' : (item.kind || '')}:`, error.statusCode || '', error.message);
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
