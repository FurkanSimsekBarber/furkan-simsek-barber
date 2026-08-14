const SHEET_NAME = 'Randevular';
const ADMIN_TOKEN = 'FURKAN1966';

// İşletme ayarları
const OPEN_HOUR = 09;
const CLOSE_HOUR = 20;       // Son başlangıç 19:30 değil, 19:00
const SLOT_MINUTES = 30;
const BREAK_START = '13:00';
const BREAK_END = '14:00';
const SUNDAY_CLOSED = true;

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.clear();
  sh.appendRow(['ID','Oluşturulma','Ad Soyad','Telefon','Hizmet','Tarih','Saat','Not','Durum']);
  sh.setFrozenRows(1);
  sh.getRange('A1:I1').setFontWeight('bold');
  return 'Hazır';
}

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'slots') return json_(getSlots_(e.parameter.date || ''));
  if (action === 'list') return json_(list_(e.parameter.token || '', e.parameter.date || ''));
  return json_({ok:true,message:'Furkan Şimşek Berber randevu servisi aktif.'});
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents || '{}');
    if (b.action === 'book') return json_(book_(b));
    if (b.action === 'status') return json_(status_(b));
    if (b.action === 'cancel') return json_(status_({...b,status:'İptal'}));
    return json_({ok:false,error:'Geçersiz işlem.'});
  } catch(err) {
    return json_({ok:false,error:String(err)});
  }
}

function book_(b) {
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  try {
    if (!b.name || !b.phone || !b.service || !b.date || !b.time)
      return {ok:false,error:'Eksik bilgi.'};
    if (!isValidDate_(b.date) || !isValidSlot_(b.date,b.time))
      return {ok:false,error:'Bu tarih veya saat randevuya uygun değil.'};

    const sh=sheet_(), values=sh.getDataRange().getValues();
    const occupied=values.slice(1).some(r =>
      String(r[5])===String(b.date) && String(r[6])===String(b.time) &&
      String(r[8]||'')!=='İptal'
    );
    if (occupied) return {ok:false,error:'Bu saat az önce doldu. Lütfen başka bir saat seçin.'};

    const id=Utilities.getUuid().slice(0,8).toUpperCase();
    sh.appendRow([id,new Date(),b.name,b.phone,b.service,b.date,b.time,b.note||'','Onay Bekliyor']);
    return {ok:true,id:id,status:'Onay Bekliyor'};
  } finally { lock.releaseLock(); }
}

function getSlots_(date) {
  if (!date) return {ok:false,error:'Tarih gerekli.'};
  const slots=[];
  for(let h=OPEN_HOUR;h<CLOSE_HOUR;h++){
    for(let m=0;m<60;m+=SLOT_MINUTES){
      const t=('0'+h).slice(-2)+':'+('0'+m).slice(-2);
      if(!isValidSlot_(date,t)) continue;
      slots.push(t);
    }
  }
  const sh=sheet_(), values=sh.getDataRange().getValues(), busy={};
  values.slice(1).forEach(r=>{
    if(String(r[5])===String(date) && String(r[8]||'')!=='İptal') busy[String(r[6])]=true;
  });
  return {ok:true,date,slots:slots.map(t=>({time:t,available:!busy[t]}))};
}

function list_(token,date) {
  if(token!==ADMIN_TOKEN) return {ok:false,error:'Yetkisiz.'};
  const values=sheet_().getDataRange().getValues().slice(1);
  const rows=values.filter(r=>!date || String(r[5])===String(date)).map(r=>({
    id:String(r[0]),created:String(r[1]),name:String(r[2]),phone:String(r[3]),
    service:String(r[4]),date:String(r[5]),time:String(r[6]),note:String(r[7]),status:String(r[8])
  }));
  rows.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return {ok:true,rows};
}

function status_(b) {
  if(b.token!==ADMIN_TOKEN) return {ok:false,error:'Yetkisiz.'};
  const sh=sheet_(), values=sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++){
    if(String(values[i][0])===String(b.id)){
      sh.getRange(i+1,9).setValue(b.status);
      return {ok:true};
    }
  }
  return {ok:false,error:'Randevu bulunamadı.'};
}

function isValidDate_(date) {
  const d=new Date(date+'T12:00:00');
  if(isNaN(d.getTime())) return false;
  if(SUNDAY_CLOSED && d.getDay()===0) return false;
  return true;
}

function isValidSlot_(date,t) {
  if(!isValidDate_(date) || !/^\d{2}:\d{2}$/.test(t)) return false;
  const [h,m]=t.split(':').map(Number);
  const minutes=h*60+m;
  if(minutes<OPEN_HOUR*60 || minutes>=CLOSE_HOUR*60) return false;
  const breakS=13*60, breakE=14*60;
  if(minutes>=breakS && minutes<breakE) return false;
  return m%SLOT_MINUTES===0;
}
function sheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName(SHEET_NAME);
  if(!sh){setup();sh=ss.getSheetByName(SHEET_NAME);}
  return sh;
}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
