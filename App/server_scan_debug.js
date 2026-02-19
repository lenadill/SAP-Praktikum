require('dotenv').config();
const express = require('express');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs      = require('fs');
const multer  = require('multer');
const ip      = require('ip');
const app = express();

const APP_DIR = path.join(__dirname, 'App');
const DB_PATH = path.join(APP_DIR, 'db', 'transactions.db');
const CONFIG_PATH = path.join(APP_DIR, 'db', 'user_config.json');

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
const upload = multer({ dest: 'uploads/' });

app.use('/static',    express.static(path.join(APP_DIR, 'static')));
app.use('/assets',    express.static(path.join(APP_DIR, 'assets')));
app.use('/templates', express.static(path.join(APP_DIR, 'templates')));
app.get('/', (req, res) => res.redirect('/templates/index.html'));

let fetchFn = globalThis.fetch;
try { if (!fetchFn) fetchFn = require('node-fetch'); } catch (e) {}

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const VISION_MODEL = 'llama-3.2-11b-vision-preview';

let userConfig = {};
try { if (fs.existsSync(CONFIG_PATH)) userConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch (e) {}

const scanSessions = {};

app.use(express.json());

// Scan Routes
app.get('/scan/:sessionId', (req, res) => {
    res.sendFile(path.join(APP_DIR, 'templates', 'scan.html'));
});

app.get('/api/scan/init', (req, res) => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const localIp = ip.address();
    const port = 3000;
    const url = `http://${localIp}:${port}/scan/${sessionId}`;
    scanSessions[sessionId] = { status: 'pending', data: null };
    res.json({ sessionId, url });
});

app.get('/api/scan/status/:sessionId', (req, res) => {
    const session = scanSessions[req.params.sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

app.post('/api/scan/upload', upload.single('receipt'), async (req, res) => {
    const { sessionId } = req.body;
    if (!req.file || !sessionId || !scanSessions[sessionId]) {
        return res.status(400).json({ error: 'Missing data or session' });
    }

    try {
        console.log(">>> Processing receipt upload for session:", sessionId);
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        console.log(">>> Calling Groq Vision API...");
        const resp = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this receipt and extract: name (store name), category (Income, Housing, Transportation, Food, Leisure, Shopping, or Miscellaneous), amount (numeric value only), sender (usually the store), recipient (use 'SAP'), and date (YYYY-MM-DD). Return ONLY a JSON object." },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        const result = await resp.json();
        console.log(">>> Groq Vision Response:", JSON.stringify(result, null, 2));

        if (result.error) {
            throw new Error(`Groq API Error: ${result.error.message || JSON.stringify(result.error)}`);
        }

        if (!result.choices || !result.choices[0]) {
            throw new Error("Groq API returned no choices.");
        }

        const extractedData = JSON.parse(result.choices[0].message.content);
        scanSessions[sessionId] = { status: 'completed', data: extractedData };
        
        fs.unlinkSync(req.file.path);
        res.json({ success: true });
    } catch (err) {
        console.error("!!! Scan Error:", err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

// Config API
app.get("/api/config", (req, res) => res.json(userConfig));
app.post("/api/config", (req, res) => {
    if (req.body.user) userConfig.user = { ...userConfig.user, ...req.body.user };
    for (let key in req.body) if (key !== 'user') userConfig[key] = req.body[key];
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(userConfig, null, 2)); res.json({ success: true }); } catch (e) { res.status(500).json({ error: "Save failed" }); }
});

app.get("/api/transactions", (req, res) => {
    const { id, category, search, date, sort="timestamp", order="DESC", limit=10000, offset=0 } = req.query;
    let query = "SELECT * FROM transactions", where = [], params = [];
    if (id) { where.push("id = ?"); params.push(id); }
    if (category && category !== "all") { where.push("kategorie = ?"); params.push(category); }
    if (date) { where.push("timestamp LIKE ?"); params.push(`${date}%`); }
    if (search) { where.push("(name LIKE ? OR sender LIKE ? OR empfaenger LIKE ? OR kategorie LIKE ?)"); const p = `%${search}%`; params.push(p,p,p,p); }
    if (where.length) query += " WHERE " + where.join(" AND ");
    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    db.all(query, params, (err, rows) => err ? res.status(500).json({error:err.message}) : res.json({eintraege:rows}));
});

app.post('/api/transactions', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger, timestamp } = req.body;
    db.run("INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger) VALUES (?,?,?,?,?,?,?)",
        [Date.now(), name||"Unbenannt", kategorie||"Sonstiges", parseFloat(wert||0), timestamp || new Date().toISOString(), sender||"", empfaenger||""],
        function(err) { if (err) return res.status(500).json({error:err.message}); res.json({success:true, id: this.lastID}); }
    );
});

app.put('/api/transactions/:id', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger, timestamp } = req.body;
    db.run("UPDATE transactions SET name=?, kategorie=?, wert=?, sender=?, empfaenger=?, timestamp=? WHERE id=?",
        [name, kategorie, parseFloat(wert), sender, empfaenger, timestamp, req.params.id],
        function(err) { err ? res.status(500).json({error:err.message}) : res.json({success:true}); }
    );
});

app.delete('/api/transactions/:id', (req, res) => {
    db.run("DELETE FROM transactions WHERE id=?", [req.params.id], function(err) { err ? res.status(500).json({error:err.message}) : res.json({success:true}); });
});

app.post('/api/chat', async (req, res) => {
  try {
    const summary = "Guthaben vorhanden.";
    const clientMessages = (req.body.messages || []).map(({attachment, ...rest}) => rest).filter(m => m.role !== 'system');
    const nickname = userConfig.user?.nickname || userConfig.user?.full_name || "Nutzer";
    const systemPrompt = `Du bist Joule. Professionell. Nutzer: ${nickname}.`;
    const resp = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
        body: JSON.stringify({ model: GROQ_MODEL, messages: [{role:"system", content:systemPrompt}, ...clientMessages] })
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) { res.status(500).json({error: 'Proxy error'}); }
});

app.listen(3000, () => console.log('>>> JOULE DEBUG SERVER ONLINE'));
