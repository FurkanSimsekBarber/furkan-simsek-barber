document.addEventListener("DOMContentLoaded", () => {

    const radio = document.querySelector(".barber-radio");

    const toggle = document.querySelector("#radioToggle");
    const close = document.querySelector("#radioClose");

    const playButton = document.querySelector("#radioPlay");
    const muteButton = document.querySelector("#radioMute");
    const volume = document.querySelector("#radioVolume");
    const audio = document.querySelector("#barberRadioAudio");
    const status = document.querySelector("#radioStatus");

    /* WhatsApp butonunun üstünde kalması için radyo konumu */
    function positionRadio() {
        if (!radio) return;

        const isMobile = window.innerWidth <= 600;
        const adHeight = isMobile ? 44 : 52;
        const whatsappSize = isMobile ? 48 : 56;
        const gap = isMobile ? 14 : 16;

        radio.style.bottom = `${adHeight + whatsappSize + gap + 20}px`;
    }

    positionRadio();
    window.addEventListener("resize", positionRadio, { passive: true });

    const RADIO_STREAM_URL = "https://sslyayin.radyoyayini.com:7103/stream";

    toggle.addEventListener("click", () => {
        radio.classList.add("active");
    });

    close.addEventListener("click", () => {
        radio.classList.remove("active");
    });

    audio.volume = 0.25;
    volume.value = 0.25;

    volume.addEventListener("input", () => {
        const value = Number(volume.value);
        audio.volume = value;

        if (value === 0) {
            muteButton.textContent = "🔇";
        } else if (value < 0.5) {
            muteButton.textContent = "🔉";
        } else {
            muteButton.textContent = "🔊";
        }
    });

    muteButton.addEventListener("click", () => {
        audio.muted = !audio.muted;
        muteButton.textContent = audio.muted ? "🔇" : "🔊";
    });

    playButton.addEventListener("click", async () => {
        if (!RADIO_STREAM_URL) {
            status.textContent = "RADYO YAYINI HAZIR DEĞİL";
            return;
        }

        if (!audio.paused) {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
            playButton.textContent = "▶";
            status.textContent = "DURAKLATILDI";
            radio.classList.remove("playing");
            return;
        }

        status.textContent = "YAYINA BAĞLANILIYOR...";
        playButton.textContent = "⋯";
        audio.src = RADIO_STREAM_URL;
        audio.load();

        try {
            await audio.play();
            playButton.textContent = "Ⅱ";
            status.textContent = "CANLI YAYIN";
            radio.classList.add("playing");
        } catch (error) {
            console.error("Radyo başlatma hatası:", error);
            playButton.textContent = "▶";
            status.textContent = "YAYIN BAŞLATILAMADI";
            radio.classList.remove("playing");
        }
    });

    audio.addEventListener("playing", () => {
        playButton.textContent = "Ⅱ";
        status.textContent = "CANLI YAYIN";
        radio.classList.add("playing");
    });

    audio.addEventListener("pause", () => {
        if (!audio.ended) {
            playButton.textContent = "▶";
        }
    });

    audio.addEventListener("error", (event) => {
        console.error("Radyo bağlantı hatası:", event);
        playButton.textContent = "▶";
        status.textContent = "RADYO BAĞLANTISI HATASI";
        radio.classList.remove("playing");
    });

});
