/* ============================================
   ROADMAP PITCH – LOGIC
   ============================================ */

// Roadmap Data: 14 improvements, 5 highlights (major: true)
const ROADMAP_DATA = [
    {
        id: 1, major: true, category: "ai",
        title: "Intelligente Dashboards",
        description: "Automatische Erkennung von Trends und Anomalien in Ihren Geschäftsdaten durch fortschrittliche Machine Learning Modelle.",
        persona: "Data Scientist",
        x: 0, y: 0, z: 0
    },
    {
        id: 2, major: false, category: "ai",
        title: "Automatisierte Berichte",
        x: 500, y: -150, z: -800
    },
    {
        id: 3, major: true, category: "backend",
        title: "API v3 Release",
        description: "Eine komplett neue, performantere API-Architektur für schnellere Integrationen und Echtzeit-Datensynchronisation.",
        persona: "System Architekt",
        x: -400, y: 200, z: -1600
    },
    {
        id: 4, major: false, category: "backend",
        title: "Microservices-Migration",
        x: 300, y: -100, z: -2200
    },
    {
        id: 5, major: false, category: "backend",
        title: "Performance-Optimierung",
        x: -600, y: -250, z: -2800
    },
    {
        id: 6, major: true, category: "frontend",
        title: "UI/UX Redesign",
        description: "Ein modernes, intuitives Interface für eine gesteigerte Benutzererfahrung und effizienteres Arbeiten auf allen Geräten.",
        persona: "Product Designer",
        x: 400, y: 150, z: -3600
    },
    {
        id: 7, major: false, category: "frontend",
        title: "Mobile App Update",
        x: -300, y: -150, z: -4200
    },
    {
        id: 8, major: false, category: "frontend",
        title: "Barrierefreiheit 2.0",
        x: 550, y: 200, z: -4800
    },
    {
        id: 9, major: true, category: "security",
        title: "2FA Security Update",
        description: "Verbesserter Schutz durch moderne Zwei-Faktor-Authentisierung und biometrische Login-Optionen für alle Nutzer.",
        persona: "Security Engineer",
        x: -450, y: -100, z: -5600
    },
    {
        id: 10, major: false, category: "security",
        title: "Datenverschlüsselung",
        x: 250, y: 250, z: -6200
    },
    {
        id: 11, major: false, category: "security",
        title: "Pentest-Automatisierung",
        x: -500, y: -200, z: -6800
    },
    {
        id: 12, major: true, category: "database",
        title: "Cloud SQL Migration",
        description: "Skalierbare Datenbank-Infrastruktur für maximale Verfügbarkeit und Performance auch bei hohen Lastspitzen.",
        persona: "DevOps Engineer",
        x: 400, y: 100, z: -7600
    },
    {
        id: 13, major: false, category: "database",
        title: "In-Memory Caching",
        x: -200, y: -150, z: -8200
    },
    {
        id: 14, major: false, category: "database",
        title: "Auto-Backup System",
        x: 350, y: 200, z: -8800
    }
];

// State Management
let currentIndex = -1; // -1 means before start
let currentCameraPos = { x: 0, y: 0, z: 1200 };
let targetCameraPos = { x: 0, y: 0, z: 1200 };

// DOM Elements
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const viewport = document.getElementById('viewport');
const scene = document.getElementById('scene');
const progressFill = document.getElementById('progress-fill');
const counterCurrent = document.getElementById('counter-current');
const counterTotal = document.getElementById('counter-total');
const endScreen = document.getElementById('end-screen');
const restartBtn = document.getElementById('restart-btn');

// Initialization
function init() {
    counterTotal.textContent = ROADMAP_DATA.length;
    renderCards();
    setupEventListeners();
    animate();
}

function renderCards() {
    scene.innerHTML = '';
    ROADMAP_DATA.forEach(data => {
        const card = document.createElement('div');
        card.className = `road-card ${data.major ? '' : 'minor'}`;
        card.id = `card-${data.id}`;
        card.style.setProperty('--wx', `${data.x}px`);
        card.style.setProperty('--wy', `${data.y}px`);
        card.style.setProperty('--wz', `${data.z}px`);

        card.innerHTML = `
            <div class="card-header">
                <span class="card-category ${data.category}">${data.category}</span>
                ${data.major ? '<span class="card-star">✦</span>' : ''}
            </div>
            <h2 class="card-title">${data.title}</h2>
            ${data.major ? `
                <p class="card-description">${data.description}</p>
                <div class="card-divider"></div>
                <div class="card-persona">
                    <span>👤 ${data.persona}</span>
                </div>
            ` : ''}
        `;
        scene.appendChild(card);
    });
}

function setupEventListeners() {
    startBtn.addEventListener('click', startRoadmap);
    restartBtn.addEventListener('click', restartRoadmap);
    
    window.addEventListener('keydown', (e) => {
        if (currentIndex === -1) {
            if (e.code === 'Space') startRoadmap();
            return;
        }
        
        if (e.code === 'ArrowRight' || e.code === 'Space') nextStep();
        if (e.code === 'ArrowLeft') prevStep();
    });
}

function startRoadmap() {
    startOverlay.classList.add('fade-out');
    viewport.classList.add('active');
    currentIndex = -1;
    nextStep();
}

function restartRoadmap() {
    currentIndex = -1;
    targetCameraPos = { x: 0, y: 0, z: 1200 };
    endScreen.classList.remove('visible');
    endScreen.classList.add('hidden');
    startRoadmap();
}

function nextStep() {
    if (currentIndex < ROADMAP_DATA.length - 1) {
        currentIndex++;
        updateActiveCard();
    } else {
        finishRoadmap();
    }
}

function prevStep() {
    if (currentIndex > 0) {
        currentIndex--;
        updateActiveCard();
    }
}

function updateActiveCard() {
    const activeData = ROADMAP_DATA[currentIndex];
    
    // Update camera target
    targetCameraPos = {
        x: -activeData.x,
        y: -activeData.y,
        z: -activeData.z + 800 // offset to see the card
    };

    // Update UI
    counterCurrent.textContent = currentIndex + 1;
    progressFill.style.width = `${((currentIndex + 1) / ROADMAP_DATA.length) * 100}%`;

    // Highlight card
    document.querySelectorAll('.road-card').forEach(card => card.classList.remove('active'));
    const activeCard = document.getElementById(`card-${activeData.id}`);
    if (activeCard) activeCard.classList.add('active');
}

function finishRoadmap() {
    viewport.classList.remove('active');
    endScreen.classList.remove('hidden');
    setTimeout(() => {
        endScreen.classList.add('visible');
    }, 100);
}

// Animation loop (rAF) for smooth camera movement
function animate() {
    const dx = targetCameraPos.x - currentCameraPos.x;
    const dy = targetCameraPos.y - currentCameraPos.y;
    const dz = targetCameraPos.z - currentCameraPos.z;
    
    // Stop animating if we're close enough (performance save)
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 && Math.abs(dz) < 0.01) {
        requestAnimationFrame(animate);
        return;
    }

    // Lerp (Linear Interpolation) for smooth movement
    currentCameraPos.x += dx * 0.08;
    currentCameraPos.y += dy * 0.08;
    currentCameraPos.z += dz * 0.08;

    scene.style.transform = `translate3d(${currentCameraPos.x.toFixed(2)}px, ${currentCameraPos.y.toFixed(2)}px, ${currentCameraPos.z.toFixed(2)}px)`;

    requestAnimationFrame(animate);
}

init();
