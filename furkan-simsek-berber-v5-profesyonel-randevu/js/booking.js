const BOOKING_API_URL="BURAYA_GOOGLE_APPS_SCRIPT_URL";
const bookingForm=document.querySelector("#appointmentForm"),slotBox=document.querySelector("#timeSlots");
const timeHidden=document.querySelector("#selectedTime"),dateInput=document.querySelector("#date"),bookingStatus=document.querySelector("#bookingStatus");

function showStatus(t,ok=false){if(bookingStatus){bookingStatus.textContent=t;bookingStatus.className="booking-status "+(ok?"ok":"error");}}
function localDate(){const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().split("T")[0];}
if(dateInput)dateInput.min=localDate();

async function loadSlots(){
 if(!dateInput||!slotBox||BOOKING_API_URL.startsWith("BURAYA_"))return;
 const date=dateInput.value; if(!date)return;
 slotBox.innerHTML="<span class='slot-loading'>Müsait saatler kontrol ediliyor...</span>"; timeHidden.value="";
 try{
  const r=await fetch(`${BOOKING_API_URL}?action=slots&date=${encodeURIComponent(date)}`),d=await r.json();
  if(!d.ok)throw new Error(d.error);
  slotBox.innerHTML="";
  d.slots.forEach(s=>{
   const b=document.createElement("button");b.type="button";b.className="slot";b.textContent=s.time;b.disabled=!s.available;
   b.title=s.available?"Müsait":"Dolu";
   b.onclick=()=>{document.querySelectorAll(".slot.selected").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");timeHidden.value=s.time;showStatus("");};
   slotBox.appendChild(b);
  });
  if(!d.slots.length)slotBox.innerHTML="<span class='slot-loading'>Bu gün randevu alınamıyor.</span>";
 }catch(e){slotBox.innerHTML="<span class='slot-loading'>Saatler yüklenemedi. WhatsApp'tan ulaşabilirsiniz.</span>";}
}
dateInput?.addEventListener("change",loadSlots);

bookingForm?.addEventListener("submit",async e=>{
 e.preventDefault();
 if(BOOKING_API_URL.startsWith("BURAYA_")){showStatus("Randevu sistemi bağlantısı henüz yapılmadı.");return;}
 if(!timeHidden.value){showStatus("Lütfen uygun bir saat seçin.");return;}
 const f=new FormData(bookingForm),p={action:"book",name:f.get("name"),phone:f.get("phone"),service:f.get("service"),date:f.get("date"),time:timeHidden.value,note:f.get("note")||""};
 const btn=bookingForm.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Randevu oluşturuluyor...";
 try{
  const r=await fetch(BOOKING_API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(p)}),d=await r.json();
  if(!d.ok)throw new Error(d.error||"Randevu oluşturulamadı.");
  showStatus(`Randevunuz alındı. Kod: ${d.id}`,true);bookingForm.reset();timeHidden.value="";slotBox.innerHTML="";
  const msg=`Merhaba Furkan Şimşek Berber, online randevu oluşturdum.%0A%0ARandevu Kodu: ${d.id}%0AAd Soyad: ${p.name}%0ATelefon: ${p.phone}%0AHizmet: ${p.service}%0ATarih: ${p.date}%0ASaat: ${p.time}%0ANot: ${p.note||"Yok"}`;
  window.open(`https://wa.me/905400011966?text=${msg}`,"_blank","noopener");
 }catch(err){showStatus(err.message);}finally{btn.disabled=false;btn.textContent="Randevuyu Oluştur →";}
});
