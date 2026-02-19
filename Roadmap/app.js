/* ============================================
   ROADMAP PITCH – 3D SPACE CARD ENGINE
   ============================================ */

// ── DATA ────────────────────────────────────
const ROADMAP_ITEMS = [
    // ── FEATURED 1: RBAC ──
    {
        featured: true,
        title: "Rollen- & Rechtesystem",
        category: "BACKEND",
        categoryCls: "backend",
        description: "Implementierung eines Benutzer- und Rollensystem in unserer Datenbank und Backend-Middleware, um Ansichten und Zugriffsrechte zu steuern und damit sich der Benutzer sein personalisiertes Dashboard erstellen kann.",
        persona: "CFO · Buchhalter"
    },
    // ── Minor ──
    {
        featured: false,
        title: "Multi-Konten-Verwaltung",
        category: "DATABASE",
        categoryCls: "database",
        description: "",
        persona: ""
    },
    // ── FEATURED 2: Trendlinien ──
    {
        featured: true,
        title: "Trendlinien & Prognose",
        category: "UX / DESIGN",
        categoryCls: "frontend",
        description: "Ergänzung des Finanzdiagramms im Frontend um eine Trendlinie, die basierend auf aktuellen Daten eine Prognose für das nächste Quartal anzeigt.",
        persona: "Controllerin"
    },
    // ── Minor ──
    {
        featured: false,
        title: "Live-Währungsumrechnung",
        category: "BACKEND",
        categoryCls: "backend",
        description: "",
        persona: ""
    },
    {
        featured: false,
        title: "Erkannte Abonnements",
        category: "AI / ML",
        categoryCls: "ai",
        description: "",
        persona: ""
    },
    // ── FEATURED 3: Joule AI ──
    {
        featured: true,
        title: "Proaktiver AI-Assistent Joule",
        category: "AI / ML",
        categoryCls: "ai",
        description: "Joule erstellt Vorschläge basierend auf externen Faktoren, wie dem aktuellen Weltgeschehen und Aktienmarkttrends.",
        persona: "Geschäftsführer"
    },
    // ── Minor ──
    {
        featured: false,
        title: "Burn-Rate & Runway",
        category: "UX / DESIGN",
        categoryCls: "frontend",
        description: "",
        persona: ""
    },
    {
        featured: false,
        title: "Dynamische Historie",
        category: "UX / DESIGN",
        categoryCls: "frontend",
        description: "",
        persona: ""
    },
    // ── FEATURED 4: AI-Kategorie ──
    {
        featured: true,
        title: "AI-Kategorie-Vorschläge",
        category: "AI / ML",
        categoryCls: "ai",
        description: "Nutzen der vorhandenen AI-Schnittstelle um vor einer Transaktion automatisch eine passende Kategorie sowie das aktuelle Datum vorzuschlagen.",
        persona: "Buchhalter"
    },
    // ── Minor ──
    {
        featured: false,
        title: "What-If-Simulation",
        category: "UX / DESIGN",
        categoryCls: "frontend",
        description: "",
        persona: ""
    },
    // ── FEATURED 5: Dauerbuchungen ──
    {
        featured: true,
        title: "Automatische Dauerbuchungen",
        category: "BACKEND",
        categoryCls: "backend",
        description: "Einfügen einer Backend-Logik, die automatisch wiederkehrende Zahlungen erkennt und bucht.",
        persona: "Buchhalter"
    },
    // ── Minor ──
    {
        featured: false,
        title: "Audit-Trail & Compliance",
        category: "SECURITY",
        categoryCls: "security",
        description: "",
        persona: ""
    },
    {
        featured: false,
        title: "Kommentarfunktion",
        category: "UX / DESIGN",
        categoryCls: "frontend",
        description: "",
        persona: ""
    },
    // ── FEATURED 6: OCR ──
    {
        featured: true,
        title: "OCR-Belegscan",
        category: "UX / DESIGN",
        categoryCls: "frontend",
        description: "Implementierung eines OCR-Belegscans, der es erlaubt, Rechnungen per Drag & Drop hochzuladen, wobei Daten erkannt und vorausgefüllt werden.",
        persona: "Buchhalter"
    }
];

// ── Pre-computed 3D positions for each card ──
const CARD_POSITIONS = [
    { x: 0, y: 0, z: 0 },         // 1  – Featured: RBAC
    { x: 480, y: -130, z: -650 },       // 2  – Minor
    { x: -280, y: 60, z: -1250 },      // 3  – Featured: Trendlinien
    { x: 400, y: 170, z: -1900 },      // 4  – Minor
    { x: -420, y: -140, z: -2500 },      // 5  – Minor
    { x: 200, y: -70, z: -3100 },      // 6  – Featured: Joule AI
    { x: -350, y: 190, z: -3750 },      // 7  – Minor
    { x: 440, y: -110, z: -4350 },      // 8  – Minor
    { x: -180, y: 40, z: -4950 },      // 9  – Featured: AI-Kategorie
    { x: 380, y: -170, z: -5550 },      // 10 – Minor
    { x: -260, y: 100, z: -6150 },      // 11 – Featured: Dauerbuchungen
    { x: 350, y: -90, z: -6750 },      // 12 – Minor
    { x: -400, y: 150, z: -7350 },      // 13 – Minor
    { x: 100, y: -30, z: -7950 },      // 14 – Featured: OCR
];

// ── CONFIG ───────────────────────────────────
const FEATURED_PAUSE_MS = 5500;
const MINOR_SKIP_MS = 700;
const CAMERA_TRANSITION_MS = 1200;

// ── STATE ────────────────────────────────────
let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let phase = "idle";
let autoTimeout = null;

// Camera animated position
let camX = 0, camY = 0, camZ = 0;
let targetCamX = 0, targetCamY = 0, targetCamZ = 0;
let cameraAnim = null;
let cameraStartTime = 0;
let cameraStartX = 0, cameraStartY = 0, cameraStartZ = 0;

// ── DOM ──────────────────────────────────────
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const viewport = document.getElementById("viewport");
const scene = document.getElementById("scene");
const progressFill = document.getElementById("progress-fill");
const counterCur = document.getElementById("counter-current");
const endScreen = document.getElementById("end-screen");
const restartBtn = document.getElementById("restart-btn");

let cardEls = [];

// ── INIT ─────────────────────────────────────
function init() {
    buildCards();
    bindEvents();
    // Place camera at first card position
    camX = CARD_POSITIONS[0].x;
    camY = CARD_POSITIONS[0].y;
    camZ = CARD_POSITIONS[0].z;
    renderScene();
}

function buildCards() {
    ROADMAP_ITEMS.forEach((item, i) => {
        const card = document.createElement("div");
        card.className = `road-card${item.featured ? "" : " minor"}`;
        card.dataset.index = i;

        // Place card at its fixed 3D world position
        const pos = CARD_POSITIONS[i];
        card.style.setProperty("--wx", pos.x + "px");
        card.style.setProperty("--wy", pos.y + "px");
        card.style.setProperty("--wz", pos.z + "px");

        card.innerHTML = `
            <div class="card-header">
                <span class="card-category ${item.categoryCls}">${item.category}</span>
                ${item.featured ? '<span class="card-star">⭐</span>' : ''}
            </div>
            <h2 class="card-title">${item.title}</h2>
            ${item.description ? `<p class="card-description">${item.description}</p>` : '<p class="card-description"></p>'}
            <div class="card-divider"></div>
            ${item.persona ? `<div class="card-persona">${item.persona}</div>` : '<div class="card-persona"></div>'}
        `;

        scene.appendChild(card);
        cardEls.push(card);
    });
}

// ── RENDER ───────────────────────────────────
// The "camera" is simulated by translating the whole scene
// so the target card ends up centered on screen.
function renderScene() {
    // Move the scene so the camera position maps to screen center
    // Cards are at fixed world coords; we offset the entire scene.
    const offsetX = -camX;
    const offsetY = -camY;
    const offsetZ = -camZ;

    scene.style.transform = `translate3d(${offsetX}px, ${offsetY}px, ${offsetZ}px)`;

    // Update card classes based on distance from camera
    cardEls.forEach((card, i) => {
        const pos = CARD_POSITIONS[i];
        const dz = pos.z - camZ;
        const dx = pos.x - camX;
        const dy = pos.y - camY;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        card.classList.toggle("active", i === currentIndex);

        // Cards far behind the camera → hide
        if (dz > 400) {
            card.style.opacity = "0";
            card.style.pointerEvents = "none";
        } else {
            // Opacity based on distance, active always full
            const opac = i === currentIndex ? 1 : Math.max(0.12, 0.8 - dist / 3000);
            card.style.opacity = opac;
            card.style.pointerEvents = i === currentIndex ? "auto" : "none";
        }
    });
}

// ── CAMERA ANIMATION ─────────────────────────
function flyTo(targetIdx, duration, callback) {
    const pos = CARD_POSITIONS[targetIdx];
    targetCamX = pos.x;
    targetCamY = pos.y;
    targetCamZ = pos.z;
    cameraStartX = camX;
    cameraStartY = camY;
    cameraStartZ = camZ;
    cameraStartTime = performance.now();

    if (cameraAnim) cancelAnimationFrame(cameraAnim);

    function tick(now) {
        const elapsed = now - cameraStartTime;
        let t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        t = 1 - Math.pow(1 - t, 3);

        camX = cameraStartX + (targetCamX - cameraStartX) * t;
        camY = cameraStartY + (targetCamY - cameraStartY) * t;
        camZ = cameraStartZ + (targetCamZ - cameraStartZ) * t;

        renderScene();

        if (t < 1) {
            cameraAnim = requestAnimationFrame(tick);
        } else {
            cameraAnim = null;
            if (callback) callback();
        }
    }

    cameraAnim = requestAnimationFrame(tick);
}

// ── EVENTS ───────────────────────────────────
function bindEvents() {
    startBtn.addEventListener("click", startAnimation);

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            if (!isPlaying && phase === "idle") startAnimation();
            else if (isPlaying) togglePause();
        }
        if (e.code === "ArrowRight" || e.code === "ArrowDown") {
            e.preventDefault();
            goNext();
        }
        if (e.code === "ArrowLeft" || e.code === "ArrowUp") {
            e.preventDefault();
            goPrev();
        }
    });

    restartBtn.addEventListener("click", restart);
}

// ── ANIMATION CONTROL ────────────────────────
function startAnimation() {
    startOverlay.classList.add("fade-out");
    viewport.classList.add("active");

    setTimeout(() => {
        startOverlay.style.display = "none";
        isPlaying = true;
        currentIndex = 0;

        // Camera is already at position 0
        renderScene();
        updateUI();

        if (ROADMAP_ITEMS[0].featured) {
            phase = "pausing";
            scheduleAutoAdvance(FEATURED_PAUSE_MS);
        } else {
            phase = "traveling";
            scheduleAutoAdvance(MINOR_SKIP_MS);
        }
    }, 700);
}

function togglePause() {
    if (isPaused) {
        isPaused = false;
        const item = ROADMAP_ITEMS[currentIndex];
        scheduleAutoAdvance(item && item.featured ? FEATURED_PAUSE_MS : MINOR_SKIP_MS);
    } else {
        isPaused = true;
        clearAutoAdvance();
    }
}

function scheduleAutoAdvance(delay) {
    clearAutoAdvance();
    autoTimeout = setTimeout(() => {
        if (!isPaused && isPlaying) advanceToNext();
    }, delay);
}

function clearAutoAdvance() {
    if (autoTimeout) { clearTimeout(autoTimeout); autoTimeout = null; }
}

function advanceToNext() {
    currentIndex++;
    if (currentIndex >= ROADMAP_ITEMS.length) { finishAnimation(); return; }

    updateUI();

    const item = ROADMAP_ITEMS[currentIndex];
    const flyDuration = item.featured ? CAMERA_TRANSITION_MS : 700;

    flyTo(currentIndex, flyDuration, () => {
        if (item.featured) {
            phase = "pausing";
            scheduleAutoAdvance(FEATURED_PAUSE_MS);
        } else {
            phase = "traveling";
            scheduleAutoAdvance(MINOR_SKIP_MS);
        }
    });
}

function goNext() {
    if (!isPlaying || phase === "done") return;
    clearAutoAdvance();
    if (cameraAnim) { cancelAnimationFrame(cameraAnim); cameraAnim = null; }
    isPaused = false;
    advanceToNext();
}

function goPrev() {
    if (!isPlaying || currentIndex <= 0) return;
    clearAutoAdvance();
    if (cameraAnim) { cancelAnimationFrame(cameraAnim); cameraAnim = null; }
    isPaused = false;

    currentIndex--;
    updateUI();

    const item = ROADMAP_ITEMS[currentIndex];
    flyTo(currentIndex, CAMERA_TRANSITION_MS, () => {
        if (item.featured) {
            phase = "pausing";
            scheduleAutoAdvance(FEATURED_PAUSE_MS);
        } else {
            phase = "traveling";
            scheduleAutoAdvance(MINOR_SKIP_MS);
        }
    });
}

function updateUI() {
    counterCur.textContent = currentIndex + 1;
    progressFill.style.width = ((currentIndex + 1) / ROADMAP_ITEMS.length * 100) + "%";
}

// ── FINISH ───────────────────────────────────
function finishAnimation() {
    phase = "done";
    isPlaying = false;
    clearAutoAdvance();
    setTimeout(() => {
        endScreen.classList.remove("hidden");
        endScreen.classList.add("visible");
    }, 600);
}

function restart() {
    endScreen.classList.remove("visible");
    endScreen.classList.add("hidden");

    currentIndex = 0;
    phase = "idle";
    isPaused = false;
    progressFill.style.width = "0%";
    counterCur.textContent = "0";

    camX = CARD_POSITIONS[0].x;
    camY = CARD_POSITIONS[0].y;
    camZ = CARD_POSITIONS[0].z;
    renderScene();
    updateUI();

    setTimeout(() => {
        isPlaying = true;
        phase = ROADMAP_ITEMS[0].featured ? "pausing" : "traveling";
        scheduleAutoAdvance(ROADMAP_ITEMS[0].featured ? FEATURED_PAUSE_MS : MINOR_SKIP_MS);
    }, 400);
}

// ── BOOT ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
