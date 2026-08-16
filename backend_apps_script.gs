const SHEET_NAME = 'Randevular';
const ADMIN_TOKEN = 'FURKAN1966';

// İşletme ayarları
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
  return 'Hazır';
}

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
  if (action === 'slots') return json_(getSlots_(e.parameter.date || ''));
  if (action === 'list') return json_(list_(e.parameter.token || '', e.parameter.date || ''));
  return json_({ok:true,message:'Furkan Şimşek Berber randevu servisi aktif.'});
}

function doPost(e) {
  try {
    const b = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (b.action === 'book') return json_(book_(b));
    if (b.action === 'status') return json_(status_(b));
    if (b.action === 'cancel') return json_(status_({...b,status:'İptal'}));
    return json_({ok:false,error:'Geçersiz işlem.'});
  } catch(err) {
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

    // Kritik kontrol sunucuda ve kilit altında yapılır. Böylece aynı anda
    // iki kişi aynı saati seçse bile yalnızca bir randevu kaydedilir.
    if (occupied) {
      return {ok:false,error:'Bu saat dolu. Lütfen müsait başka bir saat seçin.'};
    }

    const id = Utilities.getUuid().slice(0,8).toUpperCase();
    sh.appendRow([
      id,
      new Date(),
      String(b.name).trim(),
      String(b.phone).trim(),
      String(b.service).trim(),
      date,
      time,
      String(b.note || '').trim(),
      'Onay Bekliyor'
    ]);

    SpreadsheetApp.flush();
    return {ok:true,id:id,status:'Onay Bekliyor'};
  } finally {
    lock.releaseLock();
  }
}

function getSlots_(date) {
  date = normalizeDate_(date);
  if (!date) return {ok:false,error:'Tarih gerekli.'};

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
    .map(r => ({
      id:String(r[0]),
      created:String(r[1]),
      name:String(r[2]),
      phone:String(r[3]),
      service:String(r[4]),
      date:normalizeDate_(r[5]),
      time:normalizeTime_(r[6]),
      note:String(r[7]),
      status:String(r[8] || 'Onay Bekliyor')
    }));

  rows.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return {ok:true,rows:rows};
}

function status_(b) {
  if (b.token !== ADMIN_TOKEN) return {ok:false,error:'Yetkisiz.'};

  const requestedStatus = String(b.status || '').trim();
  const allowed = ['Onay Bekliyor','Onaylandı','İptal'];
  if (allowed.indexOf(requestedStatus) === -1)
    return {ok:false,error:'Geçersiz durum.'};

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheet_();
    const values = sh.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) !== String(b.id)) continue;

      const targetDate = normalizeDate_(values[i][5]);
      const targetTime = normalizeTime_(values[i][6]);
      const currentStatus = String(values[i][8] || '').trim();

      // Bir randevuyu onaylarken aynı gün/saatte başka aktif kayıt varsa
      // ikinci randevunun onaylanmasına izin verme.
      if (requestedStatus === 'Onaylandı') {
        const conflict = values.slice(1).some((r, idx) => {
          const actualRow = idx + 1;
          if (actualRow === i) return false;
          return normalizeDate_(r[5]) === targetDate &&
            normalizeTime_(r[6]) === targetTime &&
            String(r[8] || '').trim().toLowerCase() !== 'iptal';
        });

        if (conflict) {
          return {ok:false,error:'Bu saat başka bir aktif randevu tarafından kullanılıyor. Önce diğer randevuyu iptal edin.'};
        }
      }

      sh.getRange(i + 1, 9).setValue(requestedStatus);
      SpreadsheetApp.flush();
      return {ok:true,previousStatus:currentStatus,status:requestedStatus};
    }

    return {ok:false,error:'Randevu bulunamadı.'};
  } finally {
    lock.releaseLock();
  }
}

function isValidDate_(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date+'T12:00:00');
  if (isNaN(d.getTime())) return false;
  if (SUNDAY_CLOSED && d.getDay() === 0) return false;
  return true;
}

function isValidSlot_(date,t) {
  if (!isValidDate_(date) || !/^\d{2}:\d{2}$/.test(t)) return false;
  const parts = t.split(':').map(Number);
  const h = parts[0], m = parts[1];
  const minutes = h*60+m;
  if (minutes < OPEN_HOUR*60 || minutes >= CLOSE_HOUR*60) return false;
  const breakS = 13*60, breakE = 14*60;
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
