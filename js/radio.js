document.addEventListener("DOMContentLoaded", () => {

    const radio = document.querySelector(".barber-radio");

    const toggle = document.querySelector("#radioToggle");
    const close = document.querySelector("#radioClose");

    const playButton = document.querySelector("#radioPlay");
    const muteButton = document.querySelector("#radioMute");

    const volume = document.querySelector("#radioVolume");

    const audio = document.querySelector("#barberRadioAudio");

    const status = document.querySelector("#radioStatus");


    /* =========================================
       RADYO
       ========================================= */

    const RADIO_STREAM_URL = "http://yayin2.canliyayin.org:7424/";


    /* =========================================
       PLAYER AÇ
       ========================================= */

    toggle.addEventListener("click", () => {

        radio.classList.add("active");

    });


    /* =========================================
       PLAYER KAPAT
       ========================================= */

    close.addEventListener("click", () => {

        radio.classList.remove("active");

    });


    /* =========================================
       BAŞLANGIÇ SESİ
       ========================================= */

    audio.volume = 0.7;

    volume.value = 0.7;


    /* =========================================
       SES AYARI
       ========================================= */

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


    /* =========================================
       SESSİZE AL
       ========================================= */

    muteButton.addEventListener("click", () => {

        audio.muted = !audio.muted;

        muteButton.textContent =
            audio.muted ? "🔇" : "🔊";

    });


    /* =========================================
       PLAY / PAUSE
       ========================================= */

    playButton.addEventListener("click", async () => {

        /* Yayın adresi yoksa */

        if (!RADIO_STREAM_URL) {

            status.textContent =
                "RADYO YAYINI HAZIR DEĞİL";

            return;

        }


        /* Eğer çalıyorsa durdur */

        if (!audio.paused) {

            audio.pause();

            audio.removeAttribute("src");

            audio.load();

            playButton.textContent = "▶";

            status.textContent = "DURAKLATILDI";

            radio.classList.remove("playing");

            return;

        }


        /* =====================================
           YAYINI BAŞLAT
           ===================================== */

        status.textContent = "YAYINA BAĞLANILIYOR...";

        playButton.textContent = "⋯";


        audio.src = RADIO_STREAM_URL;

        audio.load();


        try {

            await audio.play();

            playButton.textContent = "Ⅱ";

            status.textContent = "CANLI YAYIN";

            radio.classList.add("playing");

        }

        catch (error) {

            console.error(
                "Radyo başlatma hatası:",
                error
            );

            playButton.textContent = "▶";

            status.textContent =
                "YAYIN BAŞLATILAMADI";

            radio.classList.remove("playing");

        }

    });


    /* =========================================
       YAYIN BAŞLADI
       ========================================= */

    audio.addEventListener("playing", () => {

        playButton.textContent = "Ⅱ";

        status.textContent = "CANLI YAYIN";

        radio.classList.add("playing");

    });


    /* =========================================
       YAYIN DURDU
       ========================================= */

    audio.addEventListener("pause", () => {

        if (!audio.ended) {

            playButton.textContent = "▶";

        }

    });


    /* =========================================
       HATA
       ========================================= */

    audio.addEventListener("error", (event) => {

        console.error(
            "Radyo bağlantı hatası:",
            event
        );

        playButton.textContent = "▶";

        status.textContent =
            "RADYO BAĞLANTISI HATASI";

        radio.classList.remove("playing");

    });


});
