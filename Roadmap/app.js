/* ============================================
   ROADMAP – COMPLETE 14-ITEM 3D (STABLE)
   ============================================ */

const DATA = [
    { id: 1, major: true, cat: "ai", title: "Intelligente Dashboards", desc: "Automatische Erkennung von Trends in Ihren Daten.", persona: "Data Scientist", x: 0, y: 0, z: 0 },
    { id: 2, major: false, cat: "ai", title: "Automatisierte Berichte", desc: "KI-Insights direkt per Mail.", persona: "Manager", x: 400, y: -150, z: -800 },
    { id: 3, major: true, cat: "backend", title: "API v3 Release", desc: "Neue Architektur für Echtzeit-Datensynchronisation.", persona: "Architekt", x: -400, y: 200, z: -1600 },
    { id: 4, major: false, cat: "backend", title: "Microservices", desc: "Modulare Skalierung der Dienste.", persona: "DevOps", x: 300, y: -100, z: -2400 },
    { id: 5, major: false, cat: "backend", title: "Performance-Optimierung", desc: "40% schnellere Server-Antworten.", persona: "DevOps", x: -500, y: -250, z: -3200 },
    { id: 6, major: true, cat: "frontend", title: "UI/UX Redesign", desc: "Modernes Interface für effizienteres Arbeiten.", persona: "Designer", x: 400, y: 150, z: -4000 },
    { id: 7, major: false, cat: "frontend", title: "Mobile App Update", desc: "Native Erfahrung auf iOS & Android.", persona: "User", x: -300, y: -150, z: -4800 },
    { id: 8, major: false, cat: "frontend", title: "Barrierefreiheit 2.0", desc: "WCAG Konformität für alle Module.", persona: "User", x: 500, y: 200, z: -5600 },
    { id: 9, major: true, cat: "security", title: "2FA Security Update", desc: "Biometrischer Login & Hardware-Keys.", persona: "Security", x: -450, y: -100, z: -6400 },
    { id: 10, major: false, cat: "security", title: "Datenverschlüsselung", desc: "End-to-End Schutz auf Datenbank-Ebene.", persona: "Admin", x: 250, y: 250, z: -7200 },
    { id: 11, major: false, cat: "security", title: "Pentest-Automatik", desc: "Permanente Sicherheitsprüfung.", persona: "Admin", x: -500, y: -200, z: -8000 },
    { id: 12, major: true, cat: "database", title: "Cloud SQL Migration", desc: "Hochverfügbare Datenbank-Cluster.", persona: "DevOps", x: 400, y: 100, z: -8800 },
    { id: 13, major: false, cat: "database", title: "In-Memory Caching", desc: "Blitzschneller Datenzugriff.", persona: "DevOps", x: -200, y: -150, z: -9600 },
    { id: 14, major: false, cat: "database", title: "Auto-Backup System", desc: "Kein Datenverlust durch Point-in-Time Recovery.", persona: "Admin", x: 350, y: 200, z: -10400 }
];

let index = 0;
const scene = document.getElementById('scene');
const progress = document.getElementById('progress-fill');

function init() {
    render();
    setupEvents();
}

function render() {
    scene.innerHTML = DATA.map((item, i) => `
        <div class="road-card" id="card-${i}" 
             style="transform: translate3d(${item.x}px, ${item.y}px, ${item.z}px)">
            <div class="card-category ${item.cat}">${item.cat}</div>
            <h2 class="card-title">${item.title}</h2>
            <p class="card-desc">${item.desc}</p>
            <div class="card-persona">👤 ${item.persona}</div>
        </div>
    `).join('');
}

function setupEvents() {
    document.getElementById('start-btn').onclick = () => {
        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('viewport').classList.add('active');
        update();
    };

    window.onkeydown = (e) => {
        if (e.code === 'ArrowRight' || e.code === 'Space') move(1);
        if (e.code === 'ArrowLeft') move(-1);
    };
}

function move(dir) {
    if (index + dir >= 0 && index + dir < DATA.length) {
        index += dir;
        update();
    }
}

function update() {
    const data = DATA[index];
    // Kamera-Positionierung
    scene.style.transform = `translate3d(${-data.x}px, ${-data.y}px, ${-data.z + 600}px)`;

    document.querySelectorAll('.road-card').forEach((c, i) => {
        c.classList.toggle('active', i === index);
    });

    progress.style.width = `${((index + 1) / DATA.length) * 100}%`;
    document.getElementById('counter-current').textContent = index + 1;
}

init();
