
/* ==========================================================
   AMINE FAKHRI — PRESENTATION ENGINE 2026
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const slides = [...document.querySelectorAll(".slide")];

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    const progressBar = document.getElementById("progressBar");
    const currentNum = document.getElementById("currentSlideNum");
    const totalNum = document.getElementById("totalSlidesNum");

    const indicatorsContainer =
        document.getElementById("slideIndicators");

    const notesBtn =
        document.getElementById("toggleNotesBtn");

    const fullscreenBtn =
        document.getElementById("fullscreenBtn");

    const presentationTimer =
        document.getElementById("presentationTimer");

    const timerControl =
        document.querySelector(".timer-control");

    const timerToggleBtn =
        document.getElementById("timerToggleBtn");

    const timerResetBtn =
        document.getElementById("timerResetBtn");

    const timerAlert = document.getElementById("timerAlert");
    const homeBtn = document.getElementById("homeBtn");

    const transitionLayer =
        document.getElementById("slideTransition");

    const transitionTitle =
        document.getElementById("transitionTitle");

    const transitionSlideNumber =
        document.getElementById("transitionSlideNumber");

    const restartBtn =
        document.getElementById("restartBtn");

    const synthesisDialog = document.getElementById("synthesisDialog");
    const openSynthesisBtn = document.getElementById("openSynthesisBtn");
    const closeSynthesisBtn = document.getElementById("closeSynthesisBtn");

    const slider =
        document.getElementById("slider");

    const total = slides.length;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    let current = 0;
    let notesWindow = null;
    let touchX = 0;
    let touchY = 0;
    let elapsedBeforePause = 0;
    let timerStartedAt = 0;
    let timerInterval = null;
    let timerRunning = false;
    let timerWarningShown = false;
    let timerAlertTimeout = null;
    let transitionHoldTimeout = null;
    let transitionEndTimeout = null;
    let transitionBusy = false;
    const presentationTargetMs = 10 * 60 * 1000;
    const presentationWarningMs = 8 * 60 * 1000;
    const transitionTitleReadMs = 1300;
    const transitionRevealMs = 700;

    totalNum.textContent = String(total).padStart(2, "0");


    function getElapsedTime() {
        return elapsedBeforePause + (timerRunning ? Date.now() - timerStartedAt : 0);
    }


    function updateTimer() {
        if (!presentationTimer) return;

        const elapsedMs = getElapsedTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
        const seconds = String(elapsedSeconds % 60).padStart(2, "0");
        presentationTimer.textContent = `${minutes}:${seconds}`;
        presentationTimer.setAttribute(
            "aria-label",
            `Temps écoulé : ${minutes} minutes et ${seconds} secondes sur 10 minutes`
        );
        const warningActive = elapsedMs >= presentationWarningMs && elapsedMs < presentationTargetMs;
        timerControl?.classList.toggle("warning", warningActive);
        timerControl?.classList.toggle("over-limit", elapsedMs >= presentationTargetMs);

        if (elapsedMs >= presentationWarningMs && !timerWarningShown) {
            timerWarningShown = true;
            if (timerAlert) timerAlert.hidden = false;
            window.clearTimeout(timerAlertTimeout);
            timerAlertTimeout = window.setTimeout(() => {
                if (timerAlert) timerAlert.hidden = true;
            }, 7000);
        }
        timerToggleBtn?.setAttribute("aria-pressed", String(timerRunning));
        timerToggleBtn?.setAttribute(
            "aria-label",
            timerRunning ? "Mettre le chronomètre en pause" : "Reprendre le chronomètre"
        );
        if (timerToggleBtn) timerToggleBtn.textContent = timerRunning ? "Ⅱ" : "▶";
    }


    function startTimer() {
        if (timerRunning) return;

        timerRunning = true;
        timerStartedAt = Date.now();
        timerInterval = window.setInterval(updateTimer, 250);
        updateTimer();
    }


    function pauseTimer() {
        if (!timerRunning) return;

        elapsedBeforePause = getElapsedTime();
        timerRunning = false;
        timerStartedAt = 0;
        window.clearInterval(timerInterval);
        timerInterval = null;
        updateTimer();
    }


    function resetTimer({ resume = timerRunning } = {}) {
        window.clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        timerStartedAt = 0;
        elapsedBeforePause = 0;
        timerWarningShown = false;
        window.clearTimeout(timerAlertTimeout);
        timerAlertTimeout = null;
        if (timerAlert) timerAlert.hidden = true;
        if (resume) startTimer();
        else updateTimer();
    }


    function getSlideTitle(slide) {
        const explicitTitle = slide.dataset.transitionTitle;
        if (explicitTitle) return explicitTitle.trim();

        const heading = slide.querySelector(".slide-title, .conclusion-title, .hero-title");
        return heading?.textContent.replace(/\s+/g, " ").trim() || "Présentation";
    }


    function playSlideTransition(slide, index, revealSlide) {
        if (reducedMotion || !transitionLayer || !transitionTitle) {
            revealSlide();
            return;
        }

        transitionTitle.textContent = getSlideTitle(slide);
        if (transitionSlideNumber) {
            transitionSlideNumber.textContent = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        }

        transitionBusy = true;
        window.clearTimeout(transitionHoldTimeout);
        window.clearTimeout(transitionEndTimeout);
        transitionLayer.classList.remove("is-visible", "revealing");
        void transitionLayer.offsetWidth;
        transitionLayer.classList.add("is-visible");

        transitionHoldTimeout = window.setTimeout(() => {
            revealSlide();
            transitionLayer.classList.add("revealing");

            transitionEndTimeout = window.setTimeout(() => {
                transitionLayer.classList.remove("is-visible", "revealing");
                transitionBusy = false;
            }, transitionRevealMs);
        }, transitionTitleReadMs);
    }


    // ------------------------------------------------------
    // INDICATORS
    // ------------------------------------------------------

    slides.forEach((slide, index) => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "indicator";

        button.setAttribute(
            "aria-label",
            `Aller à la diapositive ${index + 1} : ${getSlideTitle(slide)}`
        );

        button.addEventListener("click", () => {
            goToSlide(index);
        });

        indicatorsContainer.appendChild(button);

    });

    const indicators = [
        ...indicatorsContainer.querySelectorAll(".indicator")
    ];


    // ------------------------------------------------------
    // NAVIGATION
    // ------------------------------------------------------

    function activateSlide(index) {

        slides[current].classList.remove("active");

        current = index;

        slides[current].classList.add("active");

        updateUI();
        refreshSpeakerNotes();

        history.replaceState(
            null,
            "",
            `#slide-${current + 1}`
        );

        slides[current].scrollTop = 0;

        if (current === 0 && scrambleEffect) {
            scrambleEffect.setText("Amine Fakhri.");
        }

    }


    function goToSlide(index) {

        if (index < 0 || index >= total) return;

        if (index === current) return;

        if (transitionBusy) return;

        if (current === 0 && index > 0) startTimer();

        playSlideTransition(slides[index], index, () => activateSlide(index));

    }


    function nextSlide() {
        goToSlide(current + 1);
    }


    function previousSlide() {
        goToSlide(current - 1);
    }


    // ------------------------------------------------------
    // INTERFACE
    // ------------------------------------------------------

    function refreshSpeakerNotes() {
        if (!notesWindow || notesWindow.closed) return;
        const source = slides[current].querySelector(".oral-notes");
        const content = notesWindow.document.querySelector(".speaker-content");
        const title = notesWindow.document.querySelector(".speaker-title");
        if (!source || !content || !title) return;
        content.replaceChildren(...[...source.childNodes].map(node => node.cloneNode(true)));
        title.textContent = source.querySelector("h3")?.textContent.trim() || "Notes orales";
    }

    function openSpeakerNotes() {
        if (notesWindow && !notesWindow.closed) {
            notesWindow.close();
            notesWindow = null;
            notesBtn.setAttribute("aria-pressed", "false");
            return;
        }

        notesWindow = window.open("", "btsSioSpeakerNotes", "popup,width=560,height=760,resizable,scrollbars");
        if (!notesWindow) {
            notesBtn.setAttribute("aria-pressed", "false");
            return;
        }

        notesWindow.document.open();
        notesWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Notes de présentation</title><style>
            *{box-sizing:border-box}body{margin:0;padding:24px;background:#07101f;color:#f2f7ff;font:16px/1.65 system-ui,sans-serif}
            header{position:sticky;top:0;background:#07101f;padding:0 0 16px;border-bottom:1px solid #35d9ff55;margin-bottom:20px}
            h1{font-size:1.15rem;color:#35d9ff;margin:0 0 5px}.hint{font-size:.82rem;color:#98a9c1}
            .speaker-content{font-size:1rem}.speaker-content h3{color:#35d9ff;font-size:1.1rem}
            .speaker-content p{margin:0 0 14px}.speaker-content strong{color:#3de4ae}
            a{color:#35d9ff}button{position:fixed;right:16px;top:16px;background:#10243a;color:#fff;border:1px solid #35d9ff88;border-radius:8px;padding:8px 12px}
            @media(max-width:500px){body{padding:18px}button{position:static;margin-bottom:14px}}
        </style></head><body><header><button type="button" onclick="window.close()">Fermer</button><h1 class="speaker-title">Notes orales</h1><div class="hint">Fenêtre séparée — cible globale : 10 minutes · chronomètre visible dans la présentation</div></header><main class="speaker-content"></main></body></html>`);
        notesWindow.document.close();
        notesWindow.addEventListener("beforeunload", () => {
            notesWindow = null;
            notesBtn.setAttribute("aria-pressed", "false");
        });
        notesBtnsState(true);
        refreshSpeakerNotes();
    }

    function notesBtnsState(opened) {
        notesBtn.setAttribute("aria-pressed", String(opened));
    }

    function updateUI() {

        const progress = ((current + 1) / total) * 100;

        progressBar.style.width = `${progress}%`;

        currentNum.textContent = String(
            current + 1
        ).padStart(2, "0");

        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === total - 1;

        indicators.forEach((button, index) => {

            const active = index === current;

            button.classList.toggle("active", active);

            if (active) {
                button.setAttribute("aria-current", "step");
            } else {
                button.removeAttribute("aria-current");
            }

        });

    }


    prevBtn.addEventListener("click", previousSlide);

    nextBtn.addEventListener("click", nextSlide);

    timerToggleBtn?.addEventListener("click", () => {
        timerRunning ? pauseTimer() : startTimer();
    });

    timerResetBtn?.addEventListener("click", () => resetTimer());

    homeBtn?.addEventListener("click", () => {
        resetTimer({ resume: true });
        goToSlide(0);
    });

    restartBtn?.addEventListener("click", () => {
        resetTimer({ resume: false });
        goToSlide(0);
    });


    // ------------------------------------------------------
    // NOTES ORALES
    // ------------------------------------------------------

    notesBtn.addEventListener("click", openSpeakerNotes);

    openSynthesisBtn?.addEventListener("click", async () => {
        if (!synthesisDialog) return;
        synthesisDialog.showModal();
        try { await synthesisDialog.requestFullscreen?.(); } catch (_) { /* Le dialogue reste en grand format. */ }
    });
    closeSynthesisBtn?.addEventListener("click", async () => {
        if (document.fullscreenElement === synthesisDialog) {
            try { await document.exitFullscreen(); } catch (_) { /* Fermeture du dialogue ci-dessous. */ }
        }
        synthesisDialog?.close();
    });
    synthesisDialog?.addEventListener("click", event => {
        if (event.target === synthesisDialog) synthesisDialog.close();
    });


    // ------------------------------------------------------
    // KEYBOARD SHORTCUTS
    // ------------------------------------------------------

    document.addEventListener("keydown", event => {

        if (synthesisDialog?.open) return;

        const target = event.target;

        if (
            target instanceof HTMLElement &&
            (
                target.isContentEditable ||
                ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
            )
        ) {
            return;
        }

        switch (event.key) {

            case "ArrowRight":
            case "PageDown":

                event.preventDefault();
                nextSlide();
                break;

            case "ArrowLeft":
            case "PageUp":

                event.preventDefault();
                previousSlide();
                break;

            case "Home":

                event.preventDefault();
                goToSlide(0);
                break;

            case "End":

                event.preventDefault();
                goToSlide(total - 1);
                break;

            case " ":

                if (target.closest("button, a")) return;

                event.preventDefault();
                nextSlide();
                break;

            case "n":
            case "N":

                if (target.closest("button, a")) return;

                notesBtn.click();
                break;

            case "Escape":

                if (notesWindow && !notesWindow.closed) notesWindow.close();
                notesWindow = null;
                notesBtn.setAttribute("aria-pressed", "false");
                break;

        }

    });


    // ------------------------------------------------------
    // TOUCH NAVIGATION
    // ------------------------------------------------------

    slider.addEventListener("touchstart", event => {

        touchX = event.changedTouches[0].screenX;
        touchY = event.changedTouches[0].screenY;

    }, { passive: true });


    slider.addEventListener("touchend", event => {

        const dx = touchX - event.changedTouches[0].screenX;
        const dy = touchY - event.changedTouches[0].screenY;

        if (
            Math.abs(dx) > 65 &&
            Math.abs(dx) > Math.abs(dy) * 1.3
        ) {

            dx > 0 ? nextSlide() : previousSlide();

        }

    }, { passive: true });


    // ------------------------------------------------------
    // FULLSCREEN
    // ------------------------------------------------------

    fullscreenBtn.addEventListener("click", async () => {

        try {

            if (!document.fullscreenElement) {

                await document.documentElement.requestFullscreen();

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.error("Plein écran indisponible :", error);

        }

    });


    document.addEventListener("fullscreenchange", () => {

        fullscreenBtn.textContent =
            document.fullscreenElement ? "⛶" : "⛶";

        fullscreenBtn.setAttribute(
            "aria-label",
            document.fullscreenElement
                ? "Quitter le plein écran"
                : "Activer le plein écran"
        );

    });


    // ------------------------------------------------------
    // TEXT SCRAMBLE
    // ------------------------------------------------------

    class TextScramble {

        constructor(element) {

            this.element = element;
            this.characters = "!<>-_\\/[]{}—=+*^?#";
            this.frame = 0;

        }

        setText(text) {

            if (reducedMotion) {
                this.element.textContent = text;
                return;
            }

            cancelAnimationFrame(this.frameRequest);

            const oldText = this.element.textContent;

            const length = Math.max(
                oldText.length,
                text.length
            );

            this.queue = [];

            for (let i = 0; i < length; i++) {

                this.queue.push({

                    from: oldText[i] || "",
                    to: text[i] || "",
                    start: Math.floor(Math.random() * 15),
                    end: 20 + Math.floor(Math.random() * 25),
                    char: ""

                });

            }

            this.frame = 0;

            this.update();

        }

        randomChar() {

            return this.characters[
                Math.floor(
                    Math.random() * this.characters.length
                )
            ];

        }

        update = () => {

            let output = "";
            let complete = 0;

            this.queue.forEach(item => {

                if (this.frame >= item.end) {

                    complete++;
                    output += item.to;

                } else if (this.frame >= item.start) {

                    if (!item.char || Math.random() < .3) {
                        item.char = this.randomChar();
                    }

                    output += item.char;

                } else {

                    output += item.from;

                }

            });

            this.element.textContent = output;

            if (complete === this.queue.length) return;

            this.frame++;

            this.frameRequest = requestAnimationFrame(
                this.update
            );

        };

    }


    const titleElement = document.getElementById(
        "scramble-text"
    );

    let scrambleEffect = null;

    if (titleElement) {

        scrambleEffect = new TextScramble(titleElement);

        if (!reducedMotion) {

            setTimeout(() => {
                scrambleEffect.setText("Amine Fakhri.");
            }, 400);

        }

    }


    // ------------------------------------------------------
    // SPOTLIGHT CARDS
    // ------------------------------------------------------

    document.querySelectorAll(".glass-panel").forEach(card => {

        card.addEventListener("pointermove", event => {

            const rect = card.getBoundingClientRect();

            card.style.setProperty(
                "--mouse-x",
                `${event.clientX - rect.left}px`
            );

            card.style.setProperty(
                "--mouse-y",
                `${event.clientY - rect.top}px`
            );

        });

    });


    // ------------------------------------------------------
    // PARTICLE SYSTEM
    // ------------------------------------------------------

    const canvas = document.getElementById("particleCanvas");

    if (canvas && !reducedMotion) {

        const ctx = canvas.getContext("2d");

        if (ctx) {

            let width = 0;
            let height = 0;

            let particles = [];

            let animationId = null;

            const count = Math.min(
                55,
                Math.floor(window.innerWidth / 22)
            );


            function resize() {

                const ratio = Math.min(
                    window.devicePixelRatio || 1,
                    2
                );

                width = window.innerWidth;
                height = window.innerHeight;

                canvas.width = width * ratio;
                canvas.height = height * ratio;

                ctx.setTransform(
                    ratio, 0, 0, ratio, 0, 0
                );

                particles = Array.from(
                    { length: count },
                    () => ({

                        x: Math.random() * width,
                        y: Math.random() * height,

                        vx: (Math.random() - .5) * .3,
                        vy: (Math.random() - .5) * .3,

                        size: Math.random() * 1.5 + .4

                    })
                );

            }


            function animate() {

                if (document.hidden) {
                    animationId = null;
                    return;
                }

                ctx.clearRect(0, 0, width, height);

                particles.forEach((p, i) => {

                    p.x += p.vx;
                    p.y += p.vy;

                    if (p.x < 0 || p.x > width) p.vx *= -1;
                    if (p.y < 0 || p.y > height) p.vy *= -1;

                    ctx.beginPath();

                    ctx.arc(
                        p.x,
                        p.y,
                        p.size,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle = "rgba(53,217,255,.5)";
                    ctx.fill();

                    for (let j = i + 1; j < particles.length; j++) {

                        const other = particles[j];

                        const dx = p.x - other.x;
                        const dy = p.y - other.y;

                        const distance = Math.hypot(dx, dy);

                        if (distance < 110) {

                            ctx.beginPath();

                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(other.x, other.y);

                            ctx.strokeStyle =
                                `rgba(53,217,255,${.09 * (1 - distance / 110)})`;

                            ctx.lineWidth = .6;
                            ctx.stroke();

                        }

                    }

                });

                animationId = requestAnimationFrame(animate);

            }


            function startAnimation() {

                if (!animationId && !document.hidden) {
                    animate();
                }

            }


            function stopAnimation() {

                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }

            }


            resize();
            startAnimation();

            window.addEventListener("resize", resize);

            document.addEventListener(
                "visibilitychange",
                () => {
                    document.hidden
                        ? stopAnimation()
                        : startAnimation();
                }
            );

        }

    }


    // ------------------------------------------------------
    // INITIALIZATION / URL
    // ------------------------------------------------------

    const match = window.location.hash.match(
        /^#slide-(\d+)$/
    );

    if (match) {

        const requested = Number(match[1]) - 1;

        if (
            Number.isInteger(requested) &&
            requested >= 0 &&
            requested < total
        ) {

            current = requested;

            slides.forEach((slide, index) => {

                slide.classList.toggle(
                    "active",
                    index === current
                );

            });

        }

    }

    if (current > 0) startTimer();

    updateUI();
    refreshSpeakerNotes();
    updateTimer();

    console.log(
        "%c AMINE FAKHRI — SISR PRESENTATION ",
        "background:#071b32;color:#35d9ff;font-weight:bold;padding:10px"
    );

});
