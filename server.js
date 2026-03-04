require('dotenv').config();
const express = require('express');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs      = require('fs');
const crypto  = require('crypto');
const app = express();

const APP_DIR = path.join(__dirname, 'App');
const DB_PATH = path.join(APP_DIR, 'db', 'system.db');
const CONFIG_PATH = path.join(APP_DIR, 'db', 'user_config.json');

const sysDb = new sqlite3.Database(DB_PATH);

sysDb.serialize(() => {
    sysDb.run(`CREATE TABLE IF NOT EXISTS invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        company_id INTEGER NOT NULL,
        used BOOLEAN DEFAULT 0,
        expires_at TEXT,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    )`);
});

// Helper to get company DB connection (Strictly isolated)
const companyDbs = {};
function getCompanyDb(companyId) {
    if (!companyId || isNaN(companyId)) throw new Error("Valid Company ID required for data access.");
    if (companyDbs[companyId]) return companyDbs[companyId];
    
    const dbPath = path.join(APP_DIR, 'db', `company_${companyId}.db`);
    const cDb = new sqlite3.Database(dbPath);
    
    // Ensure transactions table exists
    cDb.serialize(() => {
        cDb.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY,
            name TEXT,
            kategorie TEXT,
            wert REAL,
            timestamp TEXT,
            sender TEXT,
            empfaenger TEXT,
            user_id INTEGER
        )`);
    });
    
    companyDbs[companyId] = cDb;
    return cDb;
}

app.use('/static',    express.static(path.join(APP_DIR, 'static')));
app.use('/assets',    express.static(path.join(APP_DIR, 'assets')));

// Redirect /templates/page.html to /page
app.get('/templates/:page.html', (req, res) => {
    const page = req.params.page;
    if (page === 'index') return res.redirect('/');
    res.redirect('/' + page);
});

// --- Page Routes ---
app.get('/', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'signup.html')));
app.get('/register-company', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'register-company.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'dashboard.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'settings.html')));
app.get('/support', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'support.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'admin.html')));
app.get('/logout', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'logout.html')));
app.get('/tos', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'tos.html')));
app.get('/impressum', (req, res) => res.sendFile(path.join(APP_DIR, 'templates', 'impressum.html')));

let fetchFn = globalThis.fetch;
try { if (!fetchFn) fetchFn = require('node-fetch'); } catch (e) {}

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const APP_VERSION = pkg.version;

// Joule's personal context from config
let userConfig = {};
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
            userConfig = JSON.parse(configData);
            userConfig.app_version = APP_VERSION;
            console.log("User Config loaded for: " + (userConfig.user ? userConfig.user.full_name : "Unknown"));
        } else {
            console.error("Config not found at: " + CONFIG_PATH);
        }
    } catch (e) { console.error("Could not load user_config.json", e); }
}
loadConfig();

async function getDatabaseSummary(companyId) {
    if (!companyId) return "No company context available.";
    return new Promise((resolve) => {
        try {
            const cDb = getCompanyDb(companyId);
            cDb.all("SELECT * FROM transactions ORDER BY timestamp DESC", [], (err, rows) => {
                if (err || !rows || rows.length === 0) return resolve("No transaction data available.");
                let totalIn = 0, totalOut = 0;
                const cats = {}, months = {};
                
                const now = new Date();
                const currentMonthStr = now.toISOString().substring(0, 7);
                let currentMonthIn = 0, currentMonthOut = 0;

                rows.forEach(r => {
                    const v = parseFloat(r.wert) || 0;
                    if (v >= 0) totalIn += v; else totalOut += Math.abs(v);
                    cats[r.kategorie] = (cats[r.kategorie] || 0) + v;
                    const m = r.timestamp.substring(0, 7);
                    if (m === currentMonthStr) {
                        if (v >= 0) currentMonthIn += v; else currentMonthOut += Math.abs(v);
                    }
                });

                let s = "### FINANCIAL ANALYTICS CONTEXT (STRICTLY CONFIDENTIAL) ###\n";
                s += `Global Version: v${APP_VERSION}\n`;
                s += `Current Month (${currentMonthStr}): Revenue: +${currentMonthIn.toFixed(2)}€ | Expenses: -${currentMonthOut.toFixed(2)}€ | Surplus: ${(currentMonthIn - currentMonthOut).toFixed(2)}€\n`;
                s += `Lifetime Balance: ${(totalIn - totalOut).toFixed(2)}€ (Total In: ${totalIn.toFixed(2)}€ / Total Out: ${totalOut.toFixed(2)}€)\n\n`;
                
                s += "### TOP CATEGORIES (NET BALANCE) ###\n";
                Object.entries(cats).sort((a,b) => a[1]-b[1]).slice(0, 5).forEach(([c,v]) => s += `- ${c}: ${v.toFixed(2)}€\n`);
                
                s += "\n### RECENT 10 TRANSACTIONS ###\n";
                rows.slice(0, 10).forEach(r => s += `- [${r.timestamp.split('T')[0]}] ${r.name}: ${parseFloat(r.wert).toFixed(2)}€ (${r.kategorie})\n`);
                resolve(s);
            });
        } catch(e) { resolve("Error accessing database context."); }
    });
}

app.use(express.json());

// --- Multi-User API ---

app.post('/api/companies', (req, res) => {
    const { name, domain } = req.body;
    sysDb.run("INSERT INTO companies (name, domain) VALUES (?, ?)", [name, domain], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "This domain is already registered." });
            }
            return res.status(500).json({ error: "Internal server error." });
        }
        const companyId = this.lastID;
        try {
            getCompanyDb(companyId);
            res.json({ success: true, company_id: companyId });
        } catch (dbErr) {
            res.status(500).json({ error: "Failed to initialize company database." });
        }
    });
});

app.post('/api/invites', (req, res) => {
    const { company_id, expires_in_hours } = req.body;
    if (!company_id) return res.status(400).json({ error: "Company ID required" });
    
    // Check if company exists (prevents issues with stale sessions)
    sysDb.get("SELECT id FROM companies WHERE id = ?", [company_id], (err, company) => {
        if (err || !company) return res.status(400).json({ error: "Your session is invalid (Company not found). Please log out and back in." });

        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        let expiresAt = null;
        if (expires_in_hours) {
            const d = new Date();
            d.setHours(d.getHours() + parseInt(expires_in_hours));
            expiresAt = d.toISOString();
        }

        sysDb.run("INSERT INTO invites (code, company_id, expires_at) VALUES (?, ?, ?)", [code, company_id, expiresAt], function(err) {
            if (err) return res.status(500).json({ error: "Failed to generate invite code" });
            res.json({ success: true, code: code, expires_at: expiresAt });
        });
    });
});

app.get('/api/invites', (req, res) => {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "Company ID required" });
    
    sysDb.all("SELECT * FROM invites WHERE company_id = ? ORDER BY id DESC", [company_id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to fetch invites" });
        res.json({ invites: rows });
    });
});

app.post('/api/invites/cancel', (req, res) => {
    const { code, company_id } = req.body;
    sysDb.run("UPDATE invites SET used = 1 WHERE code = ? AND company_id = ?", [code, company_id], function(err) {
        if (err) return res.status(500).json({ error: "Failed to cancel invite" });
        res.json({ success: true });
    });
});

app.get('/api/invites/validate', (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "No code provided." });
    
    const now = new Date().toISOString();
    console.log(`[AUTH] Validating code: ${code}`);

    sysDb.get(`
        SELECT invites.*, companies.name as company_name, companies.domain as company_domain 
        FROM invites 
        JOIN companies ON invites.company_id = companies.id 
        WHERE code = ?
    `, [code], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!row) return res.status(404).json({ error: "Invite code not found." });
        
        if (row.used) {
            console.warn(`[AUTH] Code ${code} rejected: Already used.`);
            return res.status(410).json({ error: "This invite has already been used." });
        }
        
        if (row.expires_at && row.expires_at < now) {
            console.warn(`[AUTH] Code ${code} rejected: Expired at ${row.expires_at}.`);
            return res.status(410).json({ error: "This invite code has expired." });
        }

        console.log(`[AUTH] Code ${code} successfully validated for ${row.company_name}.`);
        res.json({ success: true, invite: row });
    });
});

app.post('/api/users/signup', (req, res) => {
    const { full_name, email, password, company_id, role, invite_code } = req.body;
    
    if (role === 'user') {
        if (!invite_code) return res.status(400).json({ error: "Invite code required for employee registration." });
        
        sysDb.get("SELECT * FROM invites WHERE code = ? AND company_id = ? AND used = 0", [invite_code, company_id], (err, invite) => {
            if (err || !invite) return res.status(400).json({ error: "Invalid or expired invite code." });
            
            sysDb.run("INSERT INTO users (full_name, email, password, company_id, role) VALUES (?, ?, ?, ?, ?)", 
                [full_name, email, password, company_id, 'user'], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: "A user with this email already exists." });
                    }
                    return res.status(500).json({ error: "Internal server error." });
                }
                sysDb.run("UPDATE invites SET used = 1 WHERE code = ?", [invite_code]);
                res.json({ success: true, user_id: this.lastID });
            });
        });
    } else {
        sysDb.run("INSERT INTO users (full_name, email, password, company_id, role) VALUES (?, ?, ?, ?, ?)", 
            [full_name, email, password, company_id, 'admin'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "A user with this email already exists." });
                }
                return res.status(500).json({ error: "Internal server error." });
            }
            res.json({ success: true, user_id: this.lastID });
        });
    }
});

app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    sysDb.get("SELECT users.*, companies.name as company_name FROM users JOIN companies ON users.company_id = companies.id WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err || !row) return res.status(401).json({ error: "Invalid credentials" });
        res.json({ success: true, user: { 
            id: row.id, 
            full_name: row.full_name, 
            email: row.email, 
            role: row.role, 
            company_id: row.company_id,
            company_name: row.company_name
        }});
    });
});

app.get('/api/users', (req, res) => {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "Company ID required" });
    sysDb.all("SELECT id, full_name, email, role FROM users WHERE company_id = ?", [company_id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to fetch users" });
        res.json({ users: rows });
    });
});

app.put('/api/users/:id', (req, res) => {
    const { role } = req.body;
    sysDb.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: "Failed to update user" });
        res.json({ success: true });
    });
});

app.delete('/api/users/:id', (req, res) => {
    // Note: In a real app, verify permissions (self or admin of same company)
    sysDb.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: "Failed to delete account" });
        res.json({ success: true });
    });
});

app.get('/api/companies/domain', (req, res) => {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: "Company name required" });
    const domain = name.toLowerCase().replace(/\s+/g, '-') + ".com";
    res.json({ domain });
});

// --- Config API ---

app.get("/api/config", (req, res) => {
    userConfig.app_version = APP_VERSION;
    res.json(userConfig);
});

app.post("/api/config", (req, res) => {
    if (req.body.user) userConfig.user = { ...userConfig.user, ...req.body.user };
    for (let key in req.body) {
        if (key !== 'user') userConfig[key] = req.body[key];
    }
    try {
        userConfig.app_version = APP_VERSION;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(userConfig, null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Could not save config" }); }
});

// --- Transactions API ---

app.get("/api/transactions", (req, res) => {
    const { id, limit=25, offset=0, category, search, date, sort="timestamp", order="DESC", user_id, company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id is required" });
    try {
        const cDb = getCompanyDb(company_id);
        let query = "SELECT * FROM transactions", where = [], params = [];
        if (user_id) { where.push("user_id = ?"); params.push(parseInt(user_id)); }
        if (id) { const idNum = Number(id); if (!isNaN(idNum)) { where.push("id = ?"); params.push(idNum); } else { where.push("id = ?"); params.push(id); } }
        if (category && category !== "all") { where.push("kategorie = ?"); params.push(category); }
        if (date) { where.push("timestamp LIKE ?"); params.push(`${date}%`); }
        if (search) { where.push("(name LIKE ? OR sender LIKE ? OR empfaenger LIKE ? OR kategorie LIKE ?)"); const p = `%${search}%`; params.push(p,p,p,p); }
        if (where.length) query += " WHERE " + where.join(" AND ");
        query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        cDb.all(query, params, (err, rows) => err ? res.status(500).json({error:err.message}) : res.json({eintraege:rows}));
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/transactions', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger, user_id, company_id } = req.body;
    if (!company_id) return res.status(400).json({ error: "company_id is required" });
    try {
        const cDb = getCompanyDb(company_id);
        cDb.run("INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id) VALUES (?,?,?,?,?,?,?,?)",
            [Date.now(), name||"Unbenannt", kategorie||"Sonstiges", parseFloat(wert||0), new Date().toISOString(), sender||"", empfaenger||"", user_id || null],
            function(err) { err ? res.status(500).json({error:err.message}) : res.json({success:true}); }
        );
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.put('/api/transactions/:id', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger, company_id } = req.body;
    if (!company_id) return res.status(400).json({ error: "company_id is required" });
    try {
        const cDb = getCompanyDb(company_id);
        cDb.run(
            "UPDATE transactions SET name = ?, kategorie = ?, wert = ?, sender = ?, empfaenger = ? WHERE id = ?",
            [name, kategorie, parseFloat(wert), sender, empfaenger, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/transactions/:id', (req, res) => {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id is required" });
    try {
        const cDb = getCompanyDb(company_id);
        cDb.run("DELETE FROM transactions WHERE id = ?", req.params.id, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- Joule Chat API ---

app.post('/api/chat', async (req, res) => {
  try {
    const { company_id } = req.body;
    const summary = await getDatabaseSummary(company_id);
    const clientMessages = (req.body.messages || []).map(({attachment, ...rest}) => rest).filter(m => m.role !== 'system');
    
    const nickname = userConfig.user?.nickname || userConfig.user?.full_name || "Nutzer";
    const userContext = userConfig.user ? 
        `NUTZER-PROFIL:\n- Name: ${userConfig.user.full_name}\n- Nickname: ${userConfig.user.nickname || "N/A"}\n- E-Mail: ${userConfig.user.email}\n- Abteilung: ${userConfig.user.department}\n- Standort: ${userConfig.user.location}\n- ID: ${userConfig.user.employee_id}\n` : "";

    const systemPrompt = `You are Joule, the highly specialized AI core of "Clarity" (Financial Intelligence Platform). 
PERSONALITY: Professional, discrete, sharp, and proactive. You are not just a chatbot; you are a financial advisor.

SECURITY CLEARANCE: STRICT ISOLATION
You are currently sandboxed to the database of the active company. You physically cannot access data from any other organization. You must never attempt to infer, mention, or hypothesize about data outside the provided context.

${userContext}
${summary}

### CORE DIRECTIVES:
1. PERSONALIZED GREETING: You MUST always address the user by their name (${nickname}) in the initial greeting of a session.
2. ANALYTIC DEPTH: Provide insights, not just numbers. Identify trends (e.g., "Your spending in Leisure is 15% higher this month").
3. PROACTIVE ADVICE: If you see a high expense or a deficit in the current month, suggest optimizations. Be encouraging but realistic.
4. STYLE: Max 3-4 sentences. Use Markdown (**bold**) for all currency amounts and categories.
5. NO BRACKETS: Never use [ ] in your final output.
6. CLARITY VERSION: You are operating on Clarity Global Version ${APP_VERSION}.

Current Date: ${new Date().toISOString().split('T')[0]}`;

    const resp = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
        body: JSON.stringify({ model: GROQ_MODEL, messages: [{role:"system", content:systemPrompt}, ...clientMessages] })
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) { res.status(500).json({error: 'Proxy error'}); }
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(APP_DIR, 'templates', '404.html'));
});

app.listen(3000, () => console.log('Joule System Perfected on Port 3000'));
