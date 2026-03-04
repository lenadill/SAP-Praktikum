require('dotenv').config();
const express = require('express');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs      = require('fs');
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const app = express();

const APP_DIR = path.join(__dirname, 'App');
const DB_PATH = path.join(APP_DIR, 'db', 'system.db');

const sysDb = new sqlite3.Database(DB_PATH);

function getCompanyDb(companyId) {
    if (!companyId || isNaN(companyId)) throw new Error("Valid Company ID required.");
    const dbPath = path.join(APP_DIR, 'db', `company_${companyId}.db`);
    const cDb = new sqlite3.Database(dbPath);
    cDb.serialize(() => {
        cDb.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'user')`);
        cDb.run(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, name TEXT, kategorie TEXT, wert REAL, timestamp TEXT, sender TEXT, empfaenger TEXT, user_id INTEGER)`);
        cDb.run(`CREATE TABLE IF NOT EXISTS invites (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, used BOOLEAN DEFAULT 0, expires_at TEXT)`);
        cDb.run(`CREATE TABLE IF NOT EXISTS user_settings (user_id INTEGER PRIMARY KEY, nickname TEXT, theme TEXT DEFAULT 'light', notifications_enabled BOOLEAN DEFAULT 1, FOREIGN KEY (user_id) REFERENCES users(id))`);
    });
    return cDb;
}

app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use('/static',    express.static(path.join(APP_DIR, 'static')));
app.use('/assets',    express.static(path.join(APP_DIR, 'assets')));

const APP_VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;

// Helper to serve HTML with injected version
function sendTemplate(res, fileName) {
    const filePath = path.join(APP_DIR, 'templates', fileName);
    if (!fs.existsSync(filePath)) return res.status(404).send("Template not found");
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace all occurrences of {{VERSION}} with the current version
    content = content.replace(/{{VERSION}}/g, APP_VERSION);
    res.send(content);
}

// --- Page Routes ---
app.get('/', (req, res) => sendTemplate(res, 'index.html'));
app.get('/login', (req, res) => sendTemplate(res, 'login.html'));
app.get('/signup', (req, res) => sendTemplate(res, 'signup.html'));
app.get('/register-company', (req, res) => sendTemplate(res, 'register-company.html'));
app.get('/dashboard', (req, res) => sendTemplate(res, 'dashboard.html'));
app.get('/insights', (req, res) => sendTemplate(res, 'insights.html'));
app.get('/settings', (req, res) => sendTemplate(res, 'settings.html'));
app.get('/support', (req, res) => sendTemplate(res, 'support.html'));
app.get('/admin', (req, res) => sendTemplate(res, 'admin.html'));
app.get('/logout', (req, res) => sendTemplate(res, 'logout.html'));
app.get('/tos', (req, res) => sendTemplate(res, 'tos.html'));
app.get('/impressum', (req, res) => sendTemplate(res, 'impressum.html'));

app.get('/templates/:page.html', (req, res) => {
    const page = req.params.page;
    const target = page === 'index' ? '/' : '/' + page;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, target + queryString);
});

let fetchFn = globalThis.fetch || require('node-fetch');

async function getDatabaseSummary(companyId, userId) {
    if (!companyId) return "No company context available.";
    return new Promise((resolve) => {
        try {
            const cDb = getCompanyDb(companyId);
            
            // Get recent transactions
            cDb.all("SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 15", [userId], (err, rows) => {
                if (err) return resolve("Error accessing database context.");
                
                const todayStr = new Date().toISOString().split('T')[0];
                let summary = `### DATABASE CONTEXT (TODAY IS ${todayStr}) ###\n`;
                
                if (rows && rows.length > 0) {
                    summary += "Recent Transactions:\n";
                    rows.forEach(r => summary += `- [${r.timestamp.split('T')[0]}] ${r.name}: ${r.wert}€ (${r.kategorie})\n`);
                } else {
                    summary += "No transaction history found.\n";
                }

                // Get category stats
                cDb.all("SELECT kategorie, SUM(wert) as total FROM transactions WHERE user_id = ? GROUP BY kategorie ORDER BY total DESC", [userId], (err, stats) => {
                    if (!err && stats && stats.length > 0) {
                        summary += "\n### SPENDING BY CATEGORY (All Time) ###\n";
                        stats.forEach(s => summary += `- ${s.kategorie}: ${s.total.toFixed(2)}€\n`);
                        
                        const totalSpending = stats.reduce((acc, s) => acc + s.total, 0);
                        summary += `\nTOTAL SPENDING: ${totalSpending.toFixed(2)}€\n`;
                    }
                    resolve(summary);
                });
            });
        } catch(e) { resolve("Error accessing database context."); }
    });
}

// --- Multi-User Onboarding & Auth API ---

app.get('/api/companies/domain', (req, res) => {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: "Company name required" });
    const domain = name.toLowerCase().replace(/\s+/g, '-') + ".com";
    res.json({ domain });
});

app.post('/api/onboarding/admin', async (req, res) => {
    const { company_name, domain, full_name, email, password } = req.body;
    sysDb.get("SELECT email FROM user_index WHERE email = ?", [email], async (err, indexed) => {
        if (indexed) return res.status(400).json({ error: "A user with this email already exists." });
        sysDb.run("INSERT INTO companies (name, domain) VALUES (?, ?)", [company_name, domain], async function(err) {
            if (err) return res.status(400).json({ error: "Domain already registered." });
            const companyId = this.lastID;
            const cDb = getCompanyDb(companyId);
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                cDb.run("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)", 
                    [full_name, email, hashedPassword, 'admin'], function(err) {
                    if (err) { sysDb.run("DELETE FROM companies WHERE id = ?", [companyId]); return res.status(500).json({ error: "Failed." }); }
                    const userId = this.lastID;
                    sysDb.run("INSERT INTO user_index (email, company_id) VALUES (?, ?)", [email, companyId], () => {
                        res.json({ success: true, company_id: companyId, user_id: userId });
                    });
                });
            } catch (e) { res.status(500).json({ error: "Security processing failed." }); }
        });
    });
});

app.post('/api/users/signup', async (req, res) => {
    const { full_name, email, password, company_id, role, invite_code } = req.body;
    const cDb = getCompanyDb(company_id);
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const completeSignup = () => {
            cDb.run("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)", 
                [full_name, email, hashedPassword, role || 'user'], function(err) {
                if (err) return res.status(400).json({ error: "Email already taken in this company." });
                sysDb.run("INSERT INTO user_index (email, company_id) VALUES (?, ?)", [email, company_id], (err) => {
                    res.json({ success: true, user_id: this.lastID });
                });
            });
        };
        if (role === 'user') {
            cDb.get("SELECT * FROM invites WHERE code = ? AND used = 0", [invite_code], (err, inv) => {
                if (err || !inv) return res.status(400).json({ error: "Invalid invite code." });
                cDb.run("UPDATE invites SET used = 1 WHERE code = ?", [invite_code]);
                completeSignup();
            });
        } else { completeSignup(); }
    } catch (e) { res.status(500).json({ error: "Hashing failed." }); }
});

app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[Login Attempt] Email: ${email}, Password: ${password}`);
    sysDb.get("SELECT company_id FROM user_index WHERE email = ?", [email], (err, index) => {
        if (err || !index) return res.status(401).json({ error: "Invalid credentials." });
        const cDb = getCompanyDb(index.company_id);
        cDb.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
            if (err || !row || !(await bcrypt.compare(password, row.password))) return res.status(401).json({ error: "Invalid credentials." });
            sysDb.get("SELECT name FROM companies WHERE id = ?", [index.company_id], (err, comp) => {
                res.json({ success: true, user: { ...row, company_id: index.company_id, company_name: comp ? comp.name : "Organization" } });
            });
        });
    });
});

// --- Invites & Management ---

app.post('/api/invites', (req, res) => {
    const { company_id, expires_in_hours } = req.body;
    const cDb = getCompanyDb(company_id);
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    let expiresAt = expires_in_hours ? new Date(Date.now() + expires_in_hours * 3600000).toISOString() : null;
    cDb.run("INSERT INTO invites (code, expires_at) VALUES (?, ?)", [code, expiresAt], (err) => {
        res.json({ success: true, code, expires_at: expiresAt });
    });
});

app.get('/api/invites', (req, res) => {
    const { company_id } = req.query;
    const cDb = getCompanyDb(company_id);
    cDb.all("SELECT * FROM invites ORDER BY id DESC", [], (err, rows) => res.json({ invites: rows || [] }));
});

app.post('/api/invites/cancel', (req, res) => {
    const { code, company_id } = req.body;
    const cDb = getCompanyDb(company_id);
    cDb.run("UPDATE invites SET used = 1 WHERE code = ?", [code], () => res.json({ success: true }));
});

app.get('/api/invites/validate', (req, res) => {
    const { code } = req.query;
    const dbDir = path.join(APP_DIR, 'db');
    const files = fs.readdirSync(dbDir).filter(f => f.startsWith('company_'));
    let processed = 0; let found = false;
    if (files.length === 0) return res.status(404).json({ error: "No companies." });
    files.forEach(file => {
        const compId = file.match(/\d+/)[0];
        const cDb = getCompanyDb(compId);
        cDb.get("SELECT * FROM invites WHERE code = ? AND used = 0", [code], (err, row) => {
            processed++;
            if (row && !found) {
                found = true;
                sysDb.get("SELECT * FROM companies WHERE id = ?", [compId], (err, comp) => {
                    res.json({ success: true, invite: { ...row, company_id: compId, company_name: comp.name, company_domain: comp.domain } });
                });
            } else if (processed === files.length && !found) {
                res.status(404).json({ error: "Invalid or used invite code." });
            }
        });
    });
});

// --- User Management ---

app.get('/api/users', (req, res) => {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "Required." });
    try {
        const cDb = getCompanyDb(company_id);
        cDb.all("SELECT id, full_name, email, role FROM users", [], (err, rows) => res.json({ users: rows || [] }));
    } catch(e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/users/:id', (req, res) => {
    const { company_id, role } = req.body;
    const cDb = getCompanyDb(company_id);
    const userId = req.params.id;
    if (role === 'user') {
        cDb.get("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'", (err, row) => {
            if (row.cnt <= 1) return res.status(403).json({ error: "last_admin", message: "Cannot demote last admin." });
            cDb.run("UPDATE users SET role = ? WHERE id = ?", [role, userId], () => res.json({ success: true }));
        });
    } else { cDb.run("UPDATE users SET role = ? WHERE id = ?", [role, userId], () => res.json({ success: true })); }
});

app.delete('/api/users/:id', (req, res) => {
    const { company_id } = req.query;
    const cDb = getCompanyDb(company_id);
    const userId = req.params.id;
    cDb.get("SELECT role, email FROM users WHERE id = ?", [userId], (err, user) => {
        if (!user) return res.status(404).json({ error: "Not found." });
        const performDelete = () => {
            cDb.run("DELETE FROM users WHERE id = ?", [userId], () => {
                sysDb.run("DELETE FROM user_index WHERE email = ?", [user.email]);
                cDb.run("DELETE FROM user_settings WHERE user_id = ?", [userId]);
                res.json({ success: true });
            });
        };
        if (user.role === 'admin') {
            cDb.get("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'", (err, row) => {
                if (row.cnt <= 1) return res.status(403).json({ error: "last_admin", message: "Cannot delete last admin." });
                performDelete();
            });
        } else performDelete();
    });
});

// --- Settings & Transactions ---

app.get('/api/config', (req, res) => {
    const { user_id, company_id } = req.query;
    if (!user_id || !company_id) return res.json({ app_version: APP_VERSION });
    try {
        sysDb.get("SELECT id FROM companies WHERE id = ?", [company_id], (err, comp) => {
            if (err || !comp) return res.status(404).json({ error: "Not found" });
            const cDb = getCompanyDb(company_id);
            cDb.get("SELECT id FROM users WHERE id = ?", [user_id], (err, user) => {
                if (err || !user) return res.status(404).json({ error: "Not found" });
                cDb.get("SELECT * FROM user_settings WHERE user_id = ?", [user_id], (err, row) => res.json({ ...row, app_version: APP_VERSION }));
            });
        });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config', (req, res) => {
    const { user_id, company_id, nickname } = req.body;
    const cDb = getCompanyDb(company_id);
    cDb.run("INSERT INTO user_settings (user_id, nickname) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname", [user_id, nickname], () => res.json({ success: true }));
});

app.get("/api/transactions", (req, res) => {
    const { company_id, user_id, id, category, search, date, sort="timestamp", order="DESC", limit=25, offset=0 } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id required" });
    try {
        const cDb = getCompanyDb(company_id);
        let query = "SELECT * FROM transactions", where = ["user_id = ?"], params = [user_id];
        if (id) { where.push("id = ?"); params.push(id); }
        if (category && category !== "all") { where.push("kategorie = ?"); params.push(category); }
        if (date) { where.push("timestamp LIKE ?"); params.push(`${date}%`); }
        if (search) { where.push("(name LIKE ? OR sender LIKE ? OR empfaenger LIKE ? OR kategorie LIKE ? OR CAST(wert AS TEXT) LIKE ?)"); const p = `%${search}%`; params.push(p,p,p,p,p); }
        if (where.length) query += " WHERE " + where.join(" AND ");
        const allowed = ["timestamp", "wert", "name", "kategorie", "sender", "empfaenger"];
        const finalSort = allowed.includes(sort) ? sort : "timestamp";
        query += ` ORDER BY ${finalSort} ${order.toUpperCase() === "ASC" ? "ASC" : "DESC"} LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        cDb.all(query, params, (err, rows) => res.json({ eintraege: rows || [] }));
    } catch(e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/transactions', (req, res) => {
    const { company_id, user_id, name, kategorie, wert, sender, empfaenger, timestamp, beschreibung } = req.body;
    if (!company_id) return res.status(400).json({ error: "Required." });
    const cDb = getCompanyDb(company_id);
    cDb.run("INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id, beschreibung) VALUES (?,?,?,?,?,?,?,?,?)",
        [Date.now() + Math.random(), name || "Unbenannt", kategorie || "Sonstiges", parseFloat(wert || 0), timestamp || new Date().toISOString(), sender || "", empfaenger || "", user_id, beschreibung || ""],
        () => res.json({ success: true }));
});

app.put('/api/transactions/:id', (req, res) => {
    const { company_id, name, kategorie, wert, sender, empfaenger, timestamp, beschreibung } = req.body;
    const cDb = getCompanyDb(company_id);
    cDb.run("UPDATE transactions SET name = ?, kategorie = ?, wert = ?, sender = ?, empfaenger = ?, timestamp = ?, beschreibung = ? WHERE id = ?", [name, kategorie, parseFloat(wert), sender, empfaenger, timestamp, beschreibung || "", req.params.id], () => res.json({ success: true }));
});

app.delete('/api/transactions/:id', (req, res) => {
    const { company_id } = req.query;
    const cDb = getCompanyDb(company_id);
    cDb.run("DELETE FROM transactions WHERE id = ?", req.params.id, () => res.json({ success: true }));
});

// --- AI Tools Definitions ---
const AI_TOOLS = [
    {
        type: "function",
        function: {
            name: "add_transaction",
            description: "Adds a new financial transaction (expense or income) to the database.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Short name of the transaction (e.g. 'Coffee')" },
                    description: { type: "string", description: "More details about the transaction (e.g. 'Latte Macchiato at Starbucks')" },
                    amount: { type: "number", description: "The amount. NEGATIVE for expenses, POSITIVE for income." },
                    category: { type: "string", description: "The category (e.g. Food, Housing, Transportation, Leisure, Shopping, Health, Income, Miscellaneous)" },
                    date: { type: "string", description: "ISO8601 date string. Use 'today' if current date is needed." },
                    sender: { type: "string", description: "Who sent the money" },
                    empfaenger: { type: "string", description: "Who received the money" }
                },
                required: ["name", "amount", "category"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "filter_dashboard",
            description: "Filters the dashboard view to show specific transactions.",
            parameters: {
                type: "object",
                properties: {
                    search: { type: "string", description: "Search term (e.g. 'Coffee', '15.50')" },
                    category: { type: "string", description: "Filter by category" },
                    date: { type: "string", description: "Filter by date (YYYY-MM-DD)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_spending_analysis",
            description: "Analyzes spending habits, trends, and provides a summary of the user's financial status.",
            parameters: {
                type: "object",
                properties: {
                    timeframe: { type: "string", enum: ["month", "year", "all"], description: "The period to analyze" }
                }
            }
        }
    }
];

// --- Joule Chat API (Native Tool Use) ---

const dbQuery = (db, sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
const dbRun = (db, sql, params = []) => new Promise((res, rej) => db.run(sql, params, (err) => err ? rej(err) : res()));

app.post('/api/chat', async (req, res) => {
    const { company_id, user_id, messages } = req.body;
    if (!company_id || !user_id) return res.status(400).json({ error: "Missing IDs" });
    
    try {
        const cDb = getCompanyDb(company_id);
        const summary = await getDatabaseSummary(company_id, user_id);
        const userRow = await dbQuery(cDb, "SELECT users.full_name, user_settings.nickname FROM users LEFT JOIN user_settings ON users.id = user_settings.user_id WHERE users.id = ?", [user_id]);
        
        let nickname = userRow?.nickname || (userRow?.full_name ? userRow.full_name.split(' ')[0] : "User");
        const now = new Date();
        const nowStr = now.toISOString().split('T')[0];
        
        const systemContent = `You are Clair, a senior financial advisor for "Clarity".
You are proactive, professional, and precise. 
User: ${nickname}
TODAY'S DATE: ${nowStr}
${summary}

### CORE MISSION:
- Help the user manage their finances by adding transactions, analyzing trends, and answering questions.
- Identify potential savings or unusual spending patterns.
- Be proactive: if you see a trend, point it out.
- **ATTACHMENTS:** If a message contains "[BEREITS IN DATENBANK]", this transaction ALREADY exists. Never say "I have saved/added" this specific transaction. Just use its data.

### LANGUAGE & TONE:
- **QUALITY:** Use perfect German grammar and a natural, helpful tone. Avoid robotic or incomplete sentences.
- **STYLE:** Instead of "Du hast bei Aldi einkaufen gehen", say "Du hast bei Aldi eingekauft" or "Das war dein Einkauf bei Aldi".
- **BREVITY:** Keep responses focused (max 3 sentences) but eloquent.

### GUIDELINES:
- Use tools to perform actions or fetch deeper data.
- **AFTER USING A TOOL (NEW TRANSACTIONS ONLY):** You MUST explicitly tell the user what you just did in a natural way.
- Expenses MUST be negative, Income MUST be positive.
- If details for a transaction are missing, ASK for them instead of making them up.
- **MARKERS:** Never repeat the technical markers (like FILTER_DASHBOARD) in your conversational text. Just use the tool or append it at the very end.
- Don't show technical JSON to the user.`;

        let finalMessages = [...messages];
        let sysIdx = finalMessages.findIndex(m => m.role === 'system');
        if (sysIdx !== -1) finalMessages[sysIdx].content = systemContent;
        else finalMessages.unshift({ role: 'system', content: systemContent });

        const groqCall = async (msgs, model = "llama-3.3-70b-versatile", useTools = true) => {
            const body = { 
                model: model, 
                messages: msgs, 
                temperature: 0.4,
                max_tokens: 1024
            };
            if (useTools) {
                body.tools = AI_TOOLS;
                body.tool_choice = "auto";
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);
            try {
                const response = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error?.message || "Groq API error");
                return data;
            } catch (err) {
                clearTimeout(timeoutId);
                throw err;
            }
        };

        let aiResponse;
        try {
            console.log("[Groq] Calling primary model...");
            aiResponse = await groqCall(finalMessages, "llama-3.3-70b-versatile");
        } catch (e) {
            console.warn("[Groq] primary model failed, trying fallback 8b...", e.message);
            aiResponse = await groqCall(finalMessages, "llama-3.1-8b-instant");
        }

        if (!aiResponse.choices?.[0]) throw new Error("No choices in response");

        let message = aiResponse.choices[0].message;
        let toolMarkers = "";

        if (message.tool_calls) {
            console.log("[Groq] Tool calls detected:", message.tool_calls.length);
            const toolResults = [];
            for (const toolCall of message.tool_calls) {
                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    let result = { success: true };

                    if (toolCall.function.name === "add_transaction") {
                        const t = {
                            name: args.name || args.item || "Unbenannt",
                            kategorie: args.category || args.kategorie || "Sonstiges",
                            wert: parseFloat(args.amount || args.wert || 0),
                            timestamp: (args.date === "today" || !args.date) ? new Date().toISOString() : new Date(args.date).toISOString(),
                            sender: args.sender || nickname,
                            empfaenger: args.empfaenger || "Clarity",
                            user_id: user_id,
                            beschreibung: args.description || ""
                        };
                        await dbRun(cDb, "INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id, beschreibung) VALUES (?,?,?,?,?,?,?,?,?)",
                            [Math.floor(Date.now() + Math.random()), t.name, t.kategorie, t.wert, t.timestamp, t.sender, t.empfaenger, t.user_id, t.beschreibung]);
                        toolMarkers += `\nADD_TRANSACTION:${JSON.stringify(args)}`;
                    } 
                    else if (toolCall.function.name === "filter_dashboard") {
                        toolMarkers += `\nQUERY:${JSON.stringify(args)}`;
                        result = { success: true, action: "filter" };
                    }
                    else if (toolCall.function.name === "get_spending_analysis") {
                        result = { summary: summary, note: "User spending is consistent." };
                    }

                    toolResults.push({ role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: JSON.stringify(result) });
                } catch (e) { console.error("[Tool Exec Error]", e); }
            }

            finalMessages.push(message);
            finalMessages.push(...toolResults);
            try {
                console.log("[Groq] Requesting conversational follow-up...");
                const followUp = await groqCall(finalMessages, "llama-3.1-8b-instant", false);
                if (followUp.choices?.[0]?.message?.content) message = followUp.choices[0].message;
            } catch (e) { 
                console.error("[Follow-up Error]", e); 
                if (!message.content) message.content = "Ich habe die gewünschte Aktion durchgeführt.";
            }
        }

        // --- MANUAL FALLBACK PARSING (If AI wrote markers in text instead of tool call) ---
        const addMatch = message.content ? message.content.match(/ADD_TRANSACTION:(\{.*?\})/) : null;
        const filterMatch = message.content ? message.content.match(/(QUERY|FILTER_DASHBOARD):(\{.*?\})/) : null;
        const functionMatch = message.content ? message.content.match(/<function=(\w+)>\s*(\{[\s\S]*?\})/) : null;

        if (addMatch && (!message.tool_calls || !message.tool_calls.some(tc => tc.function.name === 'add_transaction'))) {
            try {
                const args = JSON.parse(addMatch[1]);
                await dbRun(cDb, "INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id, beschreibung) VALUES (?,?,?,?,?,?,?,?,?)",
                    [Math.floor(Date.now() + Math.random()), args.name || "Unbenannt", args.category || "Sonstiges", parseFloat(args.amount || 0), new Date().toISOString(), nickname, "Clarity", user_id, args.description || ""]);
                if (!toolMarkers.includes("ADD_TRANSACTION")) toolMarkers += `\nADD_TRANSACTION:${addMatch[1]}`;
            } catch(e) {}
        }
        
        if (filterMatch && !toolMarkers.includes("QUERY")) {
            toolMarkers += `\nQUERY:${filterMatch[2]}`;
        }

        // Support for <function=name> {args} format
        if (functionMatch && !toolMarkers.includes("QUERY") && !toolMarkers.includes("ADD_TRANSACTION")) {
            const funcName = functionMatch[1];
            const funcArgs = functionMatch[2];
            if (funcName === "filter_dashboard") {
                toolMarkers += `\nQUERY:${funcArgs}`;
            } else if (funcName === "add_transaction") {
                try {
                    const args = JSON.parse(funcArgs);
                    await dbRun(cDb, "INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger, user_id, beschreibung) VALUES (?,?,?,?,?,?,?,?,?)",
                        [Math.floor(Date.now() + Math.random()), args.name || "Unbenannt", args.category || "Sonstiges", parseFloat(args.amount || 0), new Date().toISOString(), nickname, "Clarity", user_id, args.description || ""]);
                    toolMarkers += `\nADD_TRANSACTION:${funcArgs}`;
                } catch(e) {}
            }
        }

        if (!message.content) message.content = "Ich habe die gewünschte Aktion durchgeführt.";
        if (toolMarkers) message.content += toolMarkers;

        res.json({ choices: [{ message }] });

    } catch(e) { 
        console.error("[Chat API Fatal]", e);
        res.status(500).json({ error: e.message || "Internal server error" }); 
    }
});

app.use('/api', (err, req, res, next) => {
    console.error("[API Error]", err);
    res.status(err.status || 500).json({ error: err.message || "Unexpected error." });
});

app.listen(3000, () => console.log('Clarity Server running on Port 3000'));
