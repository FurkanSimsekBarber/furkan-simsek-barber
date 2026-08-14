document.addEventListener("DOMContentLoaded", () => {

    const radio = document.querySelector(".barber-radio");
    const player = document.querySelector("#radioPlayer");

    const toggle = document.querySelector("#radioToggle");
    const close = document.querySelector("#radioClose");

    const playButton = document.querySelector("#radioPlay");
    const muteButton = document.querySelector("#radioMute");

    const volume = document.querySelector("#radioVolume");

    const audio = document.querySelector("#barberRadioAudio");

    const status = document.querySelector("#radioStatus");


    /* =========================================
       RADYO YAYIN ADRESİ
       ========================================= */

    const RADIO_STREAM_URL = "";

    /*
     * Gerçek radyo stream adresini daha sonra
     * buraya koyacağız.
     */


    /* =========================================
       PLAYER AÇ / KAPAT
       ========================================= */

    toggle.addEventListener("click", () => {

        radio.classList.add("active");

    });


    close.addEventListener("click", () => {

        radio.classList.remove("active");

    });


    /* =========================================
       SES
       ========================================= */

    audio.volume = 0.7;

    volume.value = 0.7;


    volume.addEventListener("input", () => {

        audio.volume = volume.value;

        if (audio.volume === 0) {

            muteButton.textContent = "🔇";

        } else {

            muteButton.textContent = "🔊";

        }

    });


    /* =========================================
       MUTE
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

        if (!RADIO_STREAM_URL) {

            status.textContent =
                "RADYO YAYIN ADRESİ BEKLENİYOR";

            return;

        }


        if (audio.paused) {

            audio.src = RADIO_STREAM_URL;

            try {

                await audio.play();

                playButton.textContent = "Ⅱ";

                status.textContent = "CANLI YAYIN";

                radio.classList.add("playing");

            } catch (error) {

                status.textContent =
                    "YAYIN BAŞLATILAMADI";

            }

        } else {

            audio.pause();

            playButton.textContent = "▶";

            status.textContent = "DURAKLATILDI";

            radio.classList.remove("playing");

        }

    });


    /* =========================================
       YAYIN HATASI
       ========================================= */

    audio.addEventListener("error", () => {

        status.textContent =
            "YAYIN BAĞLANTISI KESİLDİ";

        playButton.textContent = "▶";

        radio.classList.remove("playing");

    });

});
