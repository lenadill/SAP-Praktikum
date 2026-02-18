require('dotenv').config(); // loads .env in development
const express = require('express');
const path    = require('path');
const app = express();

// ── Statische Dateien aus dem App-Ordner servieren ────────────────────────
const APP_DIR = path.join(__dirname, 'App');
app.use('/static',    express.static(path.join(APP_DIR, 'static')));
app.use('/assets',    express.static(path.join(APP_DIR, 'assets')));
app.use('/templates', express.static(path.join(APP_DIR, 'templates')));
app.get('/', (req, res) => res.redirect('/templates/index.html'));
// ─────────────────────────────────────────────────────────────────────────

// prefer global fetch (Node 18+), fallback to node-fetch
let fetchFn = globalThis.fetch;
try {
  if (!fetchFn) fetchFn = require('node-fetch');
} catch (e) {
  // node-fetch not installed; if Node has fetch this is fine
}

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
if (!GROQ_KEY) {
  console.warn('Warning: GROQ_API_KEY not set. Proxy will fail until configured.');
}

app.use(express.json());

// Basic health endpoint
app.get('/health', (req, res) => res.json({ ok: true }));

// Groq chat proxy
app.post('/api/chat', async (req, res) => {
  try {
    if (!GROQ_KEY) return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });

    const resp = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
        'User-Agent':    'node-groq-proxy/1.0'
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages: req.body.messages })
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server listening on ${PORT}`));
