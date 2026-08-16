document.addEventListener("DOMContentLoaded",()=>{
  /* MOBILE / DESKTOP MENU */
  const menuBtn=document.querySelector(".menu-btn");
  const nav=document.querySelector(".nav");
  if(menuBtn&&nav){
    menuBtn.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();
      nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded",nav.classList.contains("open")?"true":"false");
    });
    nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
    document.addEventListener("click",e=>{
      if(window.innerWidth<=850&&!nav.contains(e.target)&&!menuBtn.contains(e.target)) nav.classList.remove("open");
    });
  }

  /* INTERNAL APPOINTMENT NAVIGATION */
  document.querySelectorAll('a[href*="furkansimsekbarber.randevunet.com"]').forEach(link=>{
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.href="randevu.html";
  });

  /* LIGHTBOX */
  const lightbox=document.querySelector(".lightbox");
  const lightImg=lightbox?.querySelector("img");
  document.querySelectorAll(".gallery-item").forEach(item=>item.addEventListener("click",()=>{
    if(!lightbox||!lightImg)return;
    lightImg.src=item.dataset.src||item.querySelector("img")?.src||"";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
  }));
  const closeLightbox=()=>{if(lightbox){lightbox.classList.remove("open");lightbox.setAttribute("aria-hidden","true")}};
  document.querySelector(".lightbox .close")?.addEventListener("click",closeLightbox);
  lightbox?.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLightbox()});

  /* APPOINTMENT FORM */
  const appointmentForm=document.querySelector("#appointmentForm");
  const dateInput=document.querySelector("#date");
  if(dateInput){
    const d=new Date();
    dateInput.min=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().split("T")[0];
  }
  appointmentForm?.addEventListener("submit",e=>{
    e.preventDefault();
    const data=new FormData(appointmentForm);
    const name=data.get("name")||"",phone=data.get("phone")||"",service=data.get("service")||"",date=data.get("date")||"",time=data.get("time")||"",note=data.get("note")||"Yok";
    const formattedDate=date?new Date(date+"T12:00:00").toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"}):"";
    const message=`Merhaba Furkan Şimşek Berber, online randevu talebinde bulunuyorum.%0A%0AAd Soyad: ${encodeURIComponent(name)}%0ATelefon: ${encodeURIComponent(phone)}%0AHizmet: ${encodeURIComponent(service)}%0ATarih: ${encodeURIComponent(formattedDate)}%0ASaat: ${encodeURIComponent(time)}%0ANot: ${encodeURIComponent(note)}`;
    window.open(`https://wa.me/905400011966?text=${message}`,"_blank","noopener");
  });

  /* PREMIUM CURSOR */
  const cursor=document.querySelector(".custom-cursor"),dot=document.querySelector(".custom-cursor-dot");
  if(cursor&&dot&&window.matchMedia("(pointer:fine)").matches){
    let mx=0,my=0,cx=0,cy=0;
    document.addEventListener("mousemove",e=>{mx=e.clientX;my=e.clientY;dot.style.left=`${mx}px`;dot.style.top=`${my}px`});
    const animate=()=>{cx+=(mx-cx)*.15;cy+=(my-cy)*.15;cursor.style.left=`${cx}px`;cursor.style.top=`${cy}px`;requestAnimationFrame(animate)};animate();
    document.querySelectorAll("a,button,input,select,textarea").forEach(el=>{el.addEventListener("mouseenter",()=>document.body.classList.add("cursor-hover"));el.addEventListener("mouseleave",()=>document.body.classList.remove("cursor-hover"))});
  }

  /* SCROLL REVEAL */
  const elements=document.querySelectorAll(".price-card,.gallery-item,.split-image,.split-copy,.about > div,.contact-grid > div,.reviews-card,.map-wrap");
  elements.forEach((el,i)=>{el.setAttribute("data-reveal","");el.style.transitionDelay=`${Math.min(i*70,350)}ms`});
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("revealed");observer.unobserve(entry.target)}}),{threshold:.12});
    elements.forEach(el=>observer.observe(el));
  }

  /* MOBILE BOTTOM NAV */
  const mobileNav=document.querySelector(".mobile-bottom-nav");
  if(mobileNav){
    const links=mobileNav.querySelectorAll("a[href^='#']");
    const sections=["anasayfa","hizmetler","galeri","hakkimizda","iletisim"].map(id=>document.getElementById(id)).filter(Boolean);
    const updateActive=()=>{
      const pos=window.scrollY+window.innerHeight*.35;let current="anasayfa";
      sections.forEach(s=>{if(pos>=s.offsetTop)current=s.id});
      if(current==="galeri"||current==="hakkimizda")current="hizmetler";
      links.forEach(l=>l.classList.toggle("active",l.getAttribute("href")===`#${current}`));
    };
    let last=window.scrollY,ticking=false;
    const onScroll=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const y=window.scrollY;if(y>last&&y>120){mobileNav.classList.add("mobile-nav-compact");mobileNav.classList.remove("mobile-nav-visible")}else{mobileNav.classList.remove("mobile-nav-compact");mobileNav.classList.add("mobile-nav-visible")}last=y;updateActive();ticking=false})};
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",updateActive);
    updateActive();
  }
});
