const menuBtn=document.querySelector(".menu-btn"),nav=document.querySelector(".nav");menuBtn?.addEventListener("click",()=>nav.classList.toggle("open"));document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));const lightbox=document.querySelector(".lightbox"),lightImg=lightbox?.querySelector("img");document.querySelectorAll(".gallery-item").forEach(item=>item.addEventListener("click",()=>{lightImg.src=item.dataset.src;lightbox.classList.add("open");lightbox.setAttribute("aria-hidden","false")}));document.querySelector(".close")?.addEventListener("click",()=>{lightbox.classList.remove("open");lightbox.setAttribute("aria-hidden","true")});lightbox?.addEventListener("click",e=>{if(e.target===lightbox){lightbox.classList.remove("open");lightbox.setAttribute("aria-hidden","true")}});document.addEventListener("keydown",e=>{if(e.key==="Escape")lightbox?.classList.remove("open")});
const appointmentForm=document.querySelector("#appointmentForm");
const dateInput=document.querySelector("#date");
if(dateInput){
  const today=new Date();
  const localToday=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().split("T")[0];
  dateInput.min=localToday;
}
appointmentForm?.addEventListener("submit",e=>{
  e.preventDefault();
  const data=new FormData(appointmentForm);
  const name=data.get("name"), phone=data.get("phone"), service=data.get("service");
  const date=data.get("date"), time=data.get("time"), note=data.get("note")||"Yok";
  const formattedDate=date ? new Date(date+"T12:00:00").toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"}) : "";
  const message=`Merhaba Furkan Şimşek Berber, online randevu talebinde bulunuyorum.%0A%0AAd Soyad: ${name}%0ATelefon: ${phone}%0AHizmet: ${service}%0ATarih: ${formattedDate}%0ASaat: ${time}%0ANot: ${note}`;
  window.open(`https://wa.me/905400011966?text=${message}`,"_blank","noopener");
});
