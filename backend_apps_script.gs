const SHEET_NAME = 'Randevular';
const TOKEN_SHEET_NAME = 'FCM_Tokens';
const ADMIN_TOKEN = 'FURKAN1966';

// Firebase Cloud Messaging ayarları.
// Hassas bilgiler GitHub'a yazılmaz; Apps Script > Proje Ayarları > Komut Dosyası Özellikleri'ne eklenir:
// FCM_CLIENT_EMAIL
// FCM_PRIVATE_KEY
const FIREBASE_PROJECT_ID = 'furkansimsekbarber';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const FCM_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;
const SLOT_MINUTES = 30;
const BREAK_START = '13:00';
const BREAK_END = '14:00';
const SUNDAY_CLOSED = true;

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Oluşturulma','Ad Soyad','Telefon','Hizmet','Tarih','Saat','Not','Durum']);
  } else if (sh.getRange(1, 1).getValue() !== 'ID') {
    sh.insertRowBefore(1);
    sh.getRange(1, 1, 1, 9).setValues([['ID','Oluşturulma','Ad Soyad','Telefon','Hizmet','Tarih','Saat','Not','Durum']]);
  }

  sh.setFrozenRows(1);
  sh.getRange('A1:I1').setFontWeight('bold');
  setupTokenSheet_();
  return 'Hazır';
}

function setupTokenSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TOKEN_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(TOKEN_SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow(['Token','Tip','Randevu ID','Tarih']);
    sh.setFrozenRows(1);
    sh.getRange('A1:D1').setFontWeight('bold');
  }
  return sh;
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();

    if (action === 'slots') return json_(getSlots_(e.parameter.date || ''));
    if (action === 'list') return json_(list_(e.parameter.token || '', e.parameter.date || ''));
    if (action === 'all') return json_(listAll_(e.parameter.token || ''));
    if (action === 'booking') return json_(getBooking_(e.parameter.id || '', e.parameter.phone || ''));
    if (action === 'status') return json_(customerStatus_(e.parameter.id || '', e.parameter.phone || ''));

    return json_({ok:true,message:'Furkan Şimşek Barber randevu servisi aktif.'});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}

function doPost(e) {
  try {
    const b = JSON.parse((e.postData && e.postData.contents) || '{}');

    if (b.action === 'save_fcm_token') {
      return json_(saveFcmToken_(b.token || '', b.type || 'admin', b.bookingId || ''));
    }

    // Müşteri web bildirim aboneliği için eski push formatını da kabul et.
    // Yeni sistem FCM token kullanır.
    if (b.action === 'subscribe') {
      return json_(saveFcmToken_(b.fcmToken || '', 'customer', b.bookingId || ''));
    }

    if (b.action === 'book') return json_(book_(b));
    if (b.action === 'status') return json_(status_(b));
    if (b.action === 'cancel') return json_(status_({...b,status:'İptal'}));
    if (b.action === 'check') return json_(customerStatus_(b.id || '', b.phone || ''));

    return json_({ok:false,error:'Geçersiz işlem.'});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}

function book_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const date = normalizeDate_(b.date);
    const time = normalizeTime_(b.time);

    if (!b.name || !b.phone || !b.service || !date || !time)
      return {ok:false,error:'Eksik bilgi.'};

    if (!isValidDate_(date) || !isValidSlot_(date,time))
      return {ok:false,error:'Bu tarih veya saat randevuya uygun değil.'};

    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    const occupied = values.slice(1).some(r =>
      normalizeDate_(r[5]) === date &&
      normalizeTime_(r[6]) === time &&
      String(r[8] || '').trim().toLowerCase() !== 'iptal'
    );

    if (occupied)
      return {ok:false,error:'Bu saat dolu. Lütfen müsait başka bir saat seçin.'};

    const id = Utilities.getUuid().slice(0,8).toUpperCase();
    const name = String(b.name).trim();
    const phone = String(b.phone).trim();
    const service = String(b.service).trim();

    sh.appendRow([
      id,
      new Date(),
      name,
      phone,
      service,
      date,
      time,
      String(b.note || '').trim(),
      'Onay Bekliyor'
    ]);

    SpreadsheetApp.flush();

    // Yönetici telefonuna yeni randevu bildirimi.
    notifyAdmins_({
      title: 'Yeni Randevu 📅',
      body: name + ' — ' + date + ' ' + time,
      data: {type:'new_booking',bookingId:id,url:'https://furkansimsekbarber.github.io/furkan-simsek-barber/admin.html'}
    });

    return {
      ok:true,
      id:id,
      status:'Onay Bekliyor',
      date:date,
      time:time,
      name:name,
      service:service
    };
  } finally {
    lock.releaseLock();
  }
}

function getSlots_(date) {
  date = normalizeDate_(date);
  if (!date) return {ok:false,error:'Tarih gerekli.'};
  if (!isValidDate_(date)) return {ok:false,error:'Bu tarih randevuya uygun değil.'};

  const slots = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const t = ('0'+h).slice(-2)+':'+('0'+m).slice(-2);
      if (isValidSlot_(date,t)) slots.push(t);
    }
  }

  const values = sheet_().getDataRange().getValues();
  const busy = {};
  values.slice(1).forEach(r => {
    const rowDate = normalizeDate_(r[5]);
    const rowTime = normalizeTime_(r[6]);
    const status = String(r[8] || '').trim().toLowerCase();
    if (rowDate === date && rowTime && status !== 'iptal') busy[rowTime] = true;
  });

  return {
    ok:true,
    date:date,
    slots:slots.map(t => ({time:t,available:!busy[t]}))
  };
}

function list_(token,date) {
  if (token !== ADMIN_TOKEN) return {ok:false,error:'Yetkisiz.'};
  date = normalizeDate_(date);

  const values = sheet_().getDataRange().getValues().slice(1);
  const rows = values
    .filter(r => !date || normalizeDate_(r[5]) === date)
    .map(r => bookingObject_(r));

  rows.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return {ok:true,date:date,count:rows.length,rows:rows};
}

function listAll_(token) {
  if (token !== ADMIN_TOKEN) return {ok:false,error:'Yetkisiz.'};
  const rows = sheet_().getDataRange().getValues().slice(1).map(r => bookingObject_(r));
  rows.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return {ok:true,count:rows.length,rows:rows};
}

function getBooking_(id, phone) {
  if (!id) return {ok:false,error:'Randevu kodu gerekli.'};

  const values = sheet_().getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    const row = values[i];
    if (String(row[0]).trim().toUpperCase() !== String(id).trim().toUpperCase()) continue;

    if (phone && normalizePhone_(row[3]) !== normalizePhone_(phone))
      return {ok:false,error:'Randevu bulunamadı.'};

    return {ok:true,booking:bookingObject_(row)};
  }

  return {ok:false,error:'Randevu bulunamadı.'};
}

function customerStatus_(id, phone) {
  const result = getBooking_(id, phone);
  if (!result.ok) return result;
  return {
    ok:true,
    id:result.booking.id,
    status:result.booking.status,
    date:result.booking.date,
    time:result.booking.time,
    service:result.booking.service
  };
}

function status_(b) {
  if (String(b.token || '').trim() !== ADMIN_TOKEN)
    return {ok:false,error:'Yetkisiz.'};

  const allowed = ['Onay Bekliyor','Onaylandı','İptal'];
  const newStatus = String(b.status || '').trim();
  if (allowed.indexOf(newStatus) === -1) return {ok:false,error:'Geçersiz durum.'};

  const id = String(b.id || '').trim().toUpperCase();
  if (!id) return {ok:false,error:'Randevu ID bulunamadı.'};

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sh = sheet_();
    const values = sh.getDataRange().getValues();

    for (let i=1;i<values.length;i++) {
      const rowId = String(values[i][0] || '').trim().toUpperCase();
      if (rowId !== id) continue;

      const currentStatus = String(values[i][8] || '').trim();
      const date = normalizeDate_(values[i][5]);
      const time = normalizeTime_(values[i][6]);

      if (newStatus === 'Onaylandı') {
        for (let j=1;j<values.length;j++) {
          if (j === i) continue;
          const otherStatus = String(values[j][8] || '').trim().toLowerCase();
          if (
            normalizeDate_(values[j][5]) === date &&
            normalizeTime_(values[j][6]) === time &&
            otherStatus !== 'iptal'
          ) {
            return {ok:false,error:'Bu saat başka bir aktif randevu tarafından kullanılıyor.'};
          }
        }
      }

      sh.getRange(i+1,9).setValue(newStatus);
      SpreadsheetApp.flush();

      const booking = {
        id:String(values[i][0]),
        name:String(values[i][2]),
        phone:String(values[i][3]),
        service:String(values[i][4]),
        date:date,
        time:time
      };

      // Sadece gerçek durum değişikliğinde müşteri bildirimi gönder.
      if (currentStatus !== newStatus && (newStatus === 'Onaylandı' || newStatus === 'İptal')) {
        notifyCustomer_(booking,newStatus);
      }

      return {
        ok:true,
        id:booking.id,
        previousStatus:currentStatus,
        status:newStatus,
        date:date,
        time:time,
        name:booking.name,
        phone:booking.phone,
        service:booking.service
      };
    }

    return {ok:false,error:'Randevu bulunamadı. ID: '+id};
  } finally {
    lock.releaseLock();
  }
}

function bookingObject_(row) {
  return {
    id:String(row[0]),
    created:String(row[1]),
    name:String(row[2]),
    phone:String(row[3]),
    service:String(row[4]),
    date:normalizeDate_(row[5]),
    time:normalizeTime_(row[6]),
    note:String(row[7] || ''),
    status:String(row[8] || 'Onay Bekliyor')
  };
}

// ============================================================
// FCM TOKEN KAYDET
// ============================================================

function saveFcmToken_(token, type, bookingId) {
  token = String(token || '').trim();
  type = String(type || 'admin').trim().toLowerCase();
  bookingId = String(bookingId || '').trim().toUpperCase();

  if (!token) return {ok:false,error:'FCM token gerekli.'};
  if (type !== 'admin' && type !== 'customer') type = 'customer';

  const sh = setupTokenSheet_();
  const values = sh.getDataRange().getValues();
  let found = false;

  for (let i=1;i<values.length;i++) {
    if (String(values[i][0] || '').trim() === token) {
      sh.getRange(i+1,2,1,3).setValues([[type,bookingId,new Date()]]);
      found = true;
      break;
    }
  }

  if (!found) sh.appendRow([token,type,bookingId,new Date()]);
  SpreadsheetApp.flush();

  return {ok:true,message:'FCM token kaydedildi.',type:type,bookingId:bookingId};
}

function notifyAdmins_(payload) {
  const tokens = getTokens_('admin');
  sendFcmToTokens_(tokens,payload);
}

function notifyCustomer_(booking,status) {
  const tokens = getCustomerTokens_(booking.id);
  if (!tokens.length) return;

  const approved = status === 'Onaylandı';
  sendFcmToTokens_(tokens,{
    title:approved ? 'Randevunuz Onaylandı ✓' : 'Randevunuz Reddedildi ✕',
    body:approved
      ? booking.date+' '+booking.time+' tarihli randevunuz onaylandı.'
      : booking.date+' '+booking.time+' tarihli randevunuz reddedildi/iptal edildi.',
    data:{
      type:'booking_status',
      bookingId:booking.id,
      status:status,
      url:'https://furkansimsekbarber.github.io/furkan-simsek-barber/randevu/'
    }
  });
}

function getTokens_(type) {
  const sh = setupTokenSheet_();
  const values = sh.getDataRange().getValues();
  return values.slice(1)
    .filter(r => String(r[1] || '').trim().toLowerCase() === type)
    .map(r => String(r[0] || '').trim())
    .filter(Boolean);
}

function getCustomerTokens_(bookingId) {
  const wanted = String(bookingId || '').trim().toUpperCase();
  if (!wanted) return [];

  const sh = setupTokenSheet_();
  const values = sh.getDataRange().getValues();
  return values.slice(1)
    .filter(r =>
      String(r[1] || '').trim().toLowerCase() === 'customer' &&
      String(r[2] || '').trim().toUpperCase() === wanted
    )
    .map(r => String(r[0] || '').trim())
    .filter(Boolean);
}

// ============================================================
// FIREBASE HTTP v1
// ============================================================

function sendFcmToTokens_(tokens,payload) {
  if (!tokens || !tokens.length) return {ok:true,sent:0};

  try {
    const accessToken = getFcmAccessToken_();
    const url = 'https://fcm.googleapis.com/v1/projects/'+FIREBASE_PROJECT_ID+'/messages:send';
    let sent = 0;

    tokens.forEach(function(token) {
      try {
        const body = {
          message: {
            token: token,
            notification: {
              title: String(payload.title || 'Furkan Şimşek Barber'),
              body: String(payload.body || 'Yeni bir bildiriminiz var.')
            },
            data: stringifyData_(payload.data || {})
          }
        };

        const response = UrlFetchApp.fetch(url,{
          method:'post',
          contentType:'application/json',
          headers:{Authorization:'Bearer '+accessToken},
          payload:JSON.stringify(body),
          muteHttpExceptions:true
        });

        const code = response.getResponseCode();
        if (code >= 200 && code < 300) sent++;
        else {
          const text = response.getContentText();
          // Geçersiz tokenları temizle; diğer hataları logla.
          if (text.indexOf('UNREGISTERED') !== -1 || text.indexOf('INVALID_ARGUMENT') !== -1) {
            removeFcmToken_(token);
          }
          console.warn('FCM gönderim hatası: '+code+' '+text);
        }
      } catch (err) {
        console.warn('FCM token gönderim hatası: '+err);
      }
    });

    return {ok:true,sent:sent};
  } catch (err) {
    // Bildirim servisi kurulmamış olsa bile randevu işlemini bozma.
    console.warn('FCM servis hatası: '+err);
    return {ok:false,error:String(err)};
  }
}

function stringifyData_(obj) {
  const out = {};
  Object.keys(obj || {}).forEach(function(k) {
    out[String(k)] = String(obj[k] == null ? '' : obj[k]);
  });
  return out;
}

function removeFcmToken_(token) {
  const sh = setupTokenSheet_();
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++) {
    if (String(values[i][0] || '').trim() === String(token).trim()) {
      sh.deleteRow(i+1);
      return;
    }
  }
}

function getFcmAccessToken_() {
  const props = PropertiesService.getScriptProperties();
  const clientEmail = props.getProperty('FCM_CLIENT_EMAIL');
  let privateKey = props.getProperty('FCM_PRIVATE_KEY');

  if (!clientEmail || !privateKey) {
    throw new Error('FCM_CLIENT_EMAIL ve FCM_PRIVATE_KEY Script Properties içine eklenmeli.');
  }

  privateKey = privateKey.replace(/\\n/g,'\n');

  const now = Math.floor(Date.now()/1000);
  const header = base64Url_(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claim = base64Url_(JSON.stringify({
    iss:clientEmail,
    scope:FCM_SCOPE,
    aud:FCM_TOKEN_URL,
    iat:now,
    exp:now+3600
  }));

  const unsigned = header+'.'+claim;
  const signature = Utilities.computeRsaSha256Signature(unsigned,privateKey);
  const assertion = unsigned+'.'+base64UrlBytes_(signature);

  const response = UrlFetchApp.fetch(FCM_TOKEN_URL,{
    method:'post',
    contentType:'application/x-www-form-urlencoded',
    payload:{
      grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:assertion
    },
    muteHttpExceptions:true
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Google OAuth token alınamadı: '+response.getContentText());
  }

  const data = JSON.parse(response.getContentText());
  if (!data.access_token) throw new Error('FCM access token alınamadı.');
  return data.access_token;
}

function base64Url_(text) {
  return base64UrlBytes_(Utilities.newBlob(text).getBytes());
}

function base64UrlBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,'');
}

function isValidDate_(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date+'T12:00:00');
  if (isNaN(d.getTime())) return false;
  if (SUNDAY_CLOSED && d.getDay() === 0) return false;
  return true;
}

function isValidSlot_(date,time) {
  if (!isValidDate_(date) || !/^\d{2}:\d{2}$/.test(time)) return false;
  const parts = time.split(':').map(Number);
  const h = parts[0], m = parts[1];
  const minutes = h*60+m;
  if (minutes < OPEN_HOUR*60 || minutes >= CLOSE_HOUR*60) return false;

  const breakS = Number(BREAK_START.split(':')[0])*60 + Number(BREAK_START.split(':')[1]);
  const breakE = Number(BREAK_END.split(':')[0])*60 + Number(BREAK_END.split(':')[1]);
  if (minutes >= breakS && minutes < breakE) return false;

  return m % SLOT_MINUTES === 0;
}

function normalizeDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (m) return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
  return '';
}

function normalizeTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  const s = String(value || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return ('0'+m[1]).slice(-2)+':'+m[2];
}

function normalizePhone_(value) {
  return String(value || '').replace(/\D/g,'').replace(/^0/,'');
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    setup();
    sh = ss.getSheetByName(SHEET_NAME);
  }
  return sh;
}

function json_(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
