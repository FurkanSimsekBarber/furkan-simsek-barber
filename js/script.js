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
/* =====================================================
   PREMIUM CURSOR
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const cursor = document.querySelector(".custom-cursor");
    const dot = document.querySelector(".custom-cursor-dot");

    if (cursor && dot && window.matchMedia("(pointer:fine)").matches) {

        let mouseX = 0;
        let mouseY = 0;

        let cursorX = 0;
        let cursorY = 0;

        document.addEventListener("mousemove", (e) => {

            mouseX = e.clientX;
            mouseY = e.clientY;

            dot.style.left = `${mouseX}px`;
            dot.style.top = `${mouseY}px`;

        });

        function animateCursor() {

            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;

            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;

            requestAnimationFrame(animateCursor);

        }

        animateCursor();


        document
            .querySelectorAll("a, button, input, select, textarea")
            .forEach((element) => {

                element.addEventListener("mouseenter", () => {
                    document.body.classList.add("cursor-hover");
                });

                element.addEventListener("mouseleave", () => {
                    document.body.classList.remove("cursor-hover");
                });

            });

    }


    /* =================================================
       SCROLL REVEAL
       ================================================= */

    const elements = document.querySelectorAll(
        ".price-card, .gallery-item, .split-image, .split-copy, .about > div, .contact-grid > div, .reviews-card, .map-wrap"
    );

    elements.forEach((element, index) => {

        element.setAttribute("data-reveal", "");

        element.style.transitionDelay =
            `${Math.min(index * 70, 350)}ms`;

    });


    const observer = new IntersectionObserver(

        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("revealed");

                    observer.unobserve(entry.target);

                }

            });

        },

        {
            threshold: 0.12
        }

    );


    elements.forEach((element) => {

        observer.observe(element);

    });

});
/* =====================================================
   MOBİL ALT MENÜ — AKTİF BÖLÜM
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const mobileLinks =
        document.querySelectorAll(".mobile-bottom-nav a");

    const sections = [
        document.querySelector("#anasayfa"),
        document.querySelector("#hizmetler"),
        document.querySelector("#iletisim")
    ].filter(Boolean);


    function updateMobileMenu() {

        const scrollPosition =
            window.scrollY + window.innerHeight * 0.35;

        let currentSection = "anasayfa";

        sections.forEach(section => {

            if (scrollPosition >= section.offsetTop) {
                currentSection = section.id;
            }

        });


        mobileLinks.forEach(link => {

            link.classList.remove("active");

            const href = link.getAttribute("href");

            if (href === `#${currentSection}`) {
                link.classList.add("active");
            }

        });

    }


    window.addEventListener(
        "scroll",
        updateMobileMenu,
        { passive: true }
    );

    updateMobileMenu();

});
