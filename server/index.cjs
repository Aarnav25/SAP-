// Simple Express server for email OTP via SMTP (CommonJS)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Gracefully handle invalid JSON bodies so we return JSON instead of an HTML error page
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(err);
});

// Helpers: delay and fetch with retry/backoff
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, opts = {}) {
  const {
    attempts = 3,
    initialDelayMs = 250,
    timeoutMs = 15000,
  } = opts || {};

  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const r = await fetch(url, { ...(options || {}), signal: controller.signal });
      clearTimeout(timer);
      if (r.ok) return r;
      // Retry on 5xx/429
      if ([429, 500, 502, 503, 504].includes(r.status)) {
        const text = await r.text().catch(() => '');
        lastErr = new Error(`HTTP ${r.status}: ${text}`);
      } else {
        // Do not retry other errors
        return r;
      }
    } catch (err) {
      lastErr = err;
    }
    const delayMs = initialDelayMs * Math.pow(2, i - 1);
    console.warn(`[api/message] retry ${i}/${attempts - 1} after error`, lastErr?.message || String(lastErr));
    await delay(delayMs);
  }
  throw lastErr || new Error('Request failed after retries');
}

// In-memory store for OTPs (for demo). In production, use Redis/DB with TTL.
const otpStore = new Map(); // key: email, value: { code, expiresAt }

// In-memory data stores (no hardcoded seed). You can manage these via future admin APIs or connect a DB.
const dataStore = {
  dashboard: {
    metrics: [], // e.g., [{ title, value, icon, color, bgColor }]
    recentTasks: [], // e.g., [{ id, title, assignee, deadline, risk }]
  },
  tasks: [], // e.g., [{ id, title, assignee, status }]
  team: [], // e.g., [{ id, name, role }]
  analytics: {
    overview: {}, // e.g., { taskCompletion, onTime, predictedDelays }
  },
  events: [], // e.g., [{ id, name, date, status }]
  checkins: [], // e.g., [{ id, eventId, role, name, createdAt }]
  vendors: [], // e.g., [{ id, name, contactPerson, serviceType, phone, email, status }]
  volunteers: [],
  speakers: [],
  agenda: [], // sessions
  feedback: [],
  gallery: [],
  templates: [], // certificate/email templates
};

// MongoDB setup (optional; falls back to in-memory if unavailable)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const MONGO_DB = process.env.MONGO_DB || 'eventai';
let mongoClient; // MongoClient instance
let mongoDb;     // Connected DB instance
let mongoRetryTimer = null; // reconnect timer id

async function connectMongo() {
  try {
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGO_DB);
    console.log(`Connected to MongoDB at ${MONGO_URI} db=${MONGO_DB}`);
    if (mongoRetryTimer) {
      clearTimeout(mongoRetryTimer);
      mongoRetryTimer = null;
    }
  } catch (err) {
    console.warn('MongoDB connection failed; using in-memory store.', err?.message || err);
    mongoClient = null;
    mongoDb = null;
    // Schedule a reconnect attempt in 5 seconds
    if (!mongoRetryTimer) {
      mongoRetryTimer = setTimeout(() => {
        mongoRetryTimer = null;
        connectMongo();
      }, 5000);
    }
  }
}

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const missing = [
      !process.env.SMTP_HOST && 'SMTP_HOST',
      !process.env.SMTP_PORT && 'SMTP_PORT',
      !process.env.SMTP_USER && 'SMTP_USER',
      !process.env.SMTP_PASS && 'SMTP_PASS',
    ].filter(Boolean);
    throw new Error(`SMTP environment variables are not set${missing.length ? `: missing ${missing.join(', ')}` : ''}`);
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// Vendors CRUD
app.get('/api/vendors', async (req, res) => {
  try {
    if (mongoDb) {
      const items = await mongoDb
        .collection('vendors')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      return res.json({ success: true, data: items });
    }
    return res.json({ success: true, data: dataStore.vendors });
  } catch (err) {
    console.error('list-vendors error', err);
    return res.status(500).json({ success: false, error: 'Failed to list vendors' });
  }
});
  
  app.put('/api/vendors/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const body = req.body || {};
      if (mongoDb) {
        const current = await mongoDb.collection('vendors').findOne({ id });
        if (!current) return res.status(404).json({ success: false, error: 'Vendor not found' });
        const update = { ...current, ...body, id };
        await mongoDb.collection('vendors').updateOne({ id }, { $set: update });
        return res.json({ success: true, data: update });
      }
      const idx = dataStore.vendors.findIndex(v => Number(v.id) === id);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Vendor not found' });
      dataStore.vendors[idx] = { ...dataStore.vendors[idx], ...body };
      return res.json({ success: true, data: dataStore.vendors[idx] });
    } catch (err) {
      console.error('update-vendor error', err);
      return res.status(500).json({ success: false, error: 'Failed to update vendor' });
    }
  });
  
  app.delete('/api/vendors/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (mongoDb) {
        const result = await mongoDb.collection('vendors').findOneAndDelete({ id });
        if (!result.value) return res.status(404).json({ success: false, error: 'Vendor not found' });
        return res.json({ success: true, data: result.value });
      }
      const idx = dataStore.vendors.findIndex(v => Number(v.id) === id);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Vendor not found' });
      const [removed] = dataStore.vendors.splice(idx, 1);
      return res.json({ success: true, data: removed });
    } catch (err) {
      console.error('delete-vendor error', err);
      return res.status(500).json({ success: false, error: 'Failed to delete vendor' });
    }
  });

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !/[^@\s]+@[^@\s]+\.[^@\s]+/.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email' });
    }

    const code = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(email, { code, expiresAt });

    let transporter;
    let from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if ((process.env.SMTP_PROVIDER || '').toLowerCase() === 'ethereal') {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      from = `EventAI <${testAccount.user}>`;
    } else {
      transporter = createTransport();
    }

    const mail = {
      from,
      to: email,
      subject: 'Your EventAI verification code',
      text: `Your verification code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your verification code is <b>${code}</b>.</p><p>It expires in 5 minutes.</p>`,
    };

    const info = await transporter.sendMail(mail);

    const payload = { success: true };
    if ((process.env.SMTP_PROVIDER || '').toLowerCase() === 'ethereal') {
      const preview = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal preview URL:', preview);
      payload.previewUrl = preview;
    }
    return res.json(payload);
  } catch (err) {
    console.error('send-otp error', err);
    return res.status(500).json({ success: false, error: `Failed to send OTP: ${err?.message || 'unknown error'}` });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Missing email or otp' });
    }

    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({ success: false, error: 'OTP not found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, error: 'OTP expired. Please request a new code.' });
    }

    if (String(otp) !== String(record.code)) {
      return res.status(400).json({ success: false, error: 'Invalid code' });
    }

    otpStore.delete(email);
    // Issue a mock token for demo
    return res.json({ success: true, token: 'demo-token', user: { email } });
  } catch (err) {
    console.error('verify-otp error', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Basic health endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'EventAI SMTP Auth Server',
    status: 'ok',
    time: new Date().toISOString(),
    docs: '/api',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint to call Gemini API server-side
app.get('/api/message', (req, res) => {
  return res.status(405).json({ error: 'Method Not Allowed. Use POST with JSON: { "message": "..." }' });
});
app.post('/api/message', async (req, res) => {
  try {
    const { message } = req.body || {};
    console.log('[api/message] incoming', { message: typeof message === 'string' ? message.slice(0, 120) : message });
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-pro';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    console.log('[api/message] calling Gemini', { url });
    let r = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      }),
    }, { attempts: 3, initialDelayMs: 300, timeoutMs: 20000 });

    if (!r.ok) {
      const text = await r.text();
      console.error('[api/message] Gemini error', r.status, text);
      // Auto-fallback if model not found
      if (r.status === 404 && /not found|is not supported/i.test(text) && model !== 'gemini-pro') {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`;
        console.warn('[api/message] retrying with fallback model gemini-pro');
        r = await fetchWithRetry(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: message }],
              },
            ],
          }),
        }, { attempts: 2, initialDelayMs: 300, timeoutMs: 20000 });
        if (!r.ok) {
          const t2 = await r.text();
          console.error('[api/message] Fallback gemini-pro failed', r.status, t2);
          return res.status(r.status).json({ error: 'Gemini error', details: t2 });
        }
      } else {
        return res.status(r.status).json({ error: 'Gemini error', details: text });
      }
    }

    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[api/message] success, reply length', reply.length);
    return res.json({ reply });
  } catch (err) {
    console.error('proxy /api/message error', err);
    return res.status(500).json({ error: 'Proxy failed', details: err?.message || String(err) });
  }
});

// SMTP debug endpoint (non-authenticated; use only in local dev)
app.get('/debug/smtp-verify', async (req, res) => {
  try {
    const transporter = createTransport();
    const ok = await transporter.verify();
    return res.json({ success: true, verify: ok });
  } catch (err) {
    console.error('smtp-verify error', err);
    return res.status(500).json({ success: false, error: err?.message || 'SMTP verify failed' });
  }
});

// Read-only dynamic data endpoints (initially empty arrays/objects)
app.get('/api/dashboard/metrics', (req, res) => {
  return res.json({ success: true, data: dataStore.dashboard.metrics });
});

app.get('/api/dashboard/recent-tasks', (req, res) => {
  return res.json({ success: true, data: dataStore.dashboard.recentTasks });
});

app.get('/api/tasks', (req, res) => {
  return res.json({ success: true, data: dataStore.tasks });
});

app.get('/api/team', (req, res) => {
  return res.json({ success: true, data: dataStore.team });
});

app.get('/api/analytics/overview', (req, res) => {
  return res.json({ success: true, data: dataStore.analytics.overview || {} });
});

// Dynamic analytics series endpoints (chart-ready)
app.get('/api/analytics/overview-series', (req, res) => {
  // Expect an array of { name, tasks, onTime, pending }
  const series = dataStore.analytics.overviewSeries || [
    { name: 'Mon', tasks: 24, onTime: 18, pending: 6 },
    { name: 'Tue', tasks: 30, onTime: 22, pending: 8 },
    { name: 'Wed', tasks: 28, onTime: 21, pending: 7 },
    { name: 'Thu', tasks: 32, onTime: 25, pending: 7 },
    { name: 'Fri', tasks: 20, onTime: 16, pending: 4 },
    { name: 'Sat', tasks: 14, onTime: 10, pending: 4 },
    { name: 'Sun', tasks: 10, onTime: 8, pending: 2 },
  ];
  return res.json({ success: true, data: series });
});

app.get('/api/analytics/risk-series', (req, res) => {
  // Expect an array of { name, delays }
  const series = dataStore.analytics.riskSeries || [
    { name: 'Week 1', delays: 4 },
    { name: 'Week 2', delays: 6 },
    { name: 'Week 3', delays: 3 },
    { name: 'Week 4', delays: 5 },
  ];
  return res.json({ success: true, data: series });
});

app.get('/api/analytics/team', (req, res) => {
  // Expect an array of { name, completedTasks, efficiency }
  const series = dataStore.team && dataStore.team.length
    ? dataStore.team.map(m => ({
        name: m.name || 'Member',
        completedTasks: Number(m.completedTasks || 0),
        efficiency: Number(m.efficiency || 0),
      }))
    : [
        { name: 'Aarav', completedTasks: 42, efficiency: 86 },
        { name: 'Priya', completedTasks: 38, efficiency: 80 },
        { name: 'Rohan', completedTasks: 29, efficiency: 72 },
      ];
  return res.json({ success: true, data: series });
});

app.get('/api/events', async (req, res) => {
  try {
    if (mongoDb) {
      const items = await mongoDb.collection('events').find({}).sort({ createdAt: -1 }).toArray();
      return res.json({ success: true, data: items });
    }
    return res.json({ success: true, data: dataStore.events });
  } catch (err) {
    console.error('list-events error', err);
    return res.status(500).json({ success: false, error: 'Failed to list events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (mongoDb) {
      const event = await mongoDb.collection('events').findOne({ id });
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
      return res.json({ success: true, data: event });
    }
    const event = dataStore.events.find(e => Number(e.id) === id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (err) {
    console.error('get-event error', err);
    return res.status(500).json({ success: false, error: 'Failed to get event' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const body = req.body || {};
    // Support new schema coming from frontend as well as legacy flat fields
    const name = body.name || body.eventName;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Event name is required' });
    }

    const id = Date.now();
    const type = body.type || body.eventType || '';
    const schedule = body.schedule || {
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      startTime: body.startTime || null,
      endTime: body.endTime || null,
      location: body.location || body.venue || '',
      isVirtual: !!body.isVirtual,
    };
    const targetAudience = body.targetAudience || '';
    const registration = body.registration || {
      required: !!body.registrationRequired,
      type: body.registrationType || null,
      url: body.registrationUrl || '',
    };
    const budget = body.budget || {
      total: typeof body.totalBudget === 'number' ? body.totalBudget : (typeof body.budgetTotal === 'number' ? body.budgetTotal : null),
      allocation: body.budgetAllocation || '',
      breakdown: body.budgetBreakdown || undefined,
    };
    const expectedParticipants = typeof body.expectedParticipants === 'number' ? body.expectedParticipants : (body.expectedParticipants ? Number(body.expectedParticipants) : null);

    const normalisedDate = schedule?.startDate || body.date || null;

    // Team fields from body
    const head = body.head && typeof body.head === 'object' ? {
      id: body.head.id || Date.now() + 1,
      name: String(body.head.name || '').trim(),
      role: String(body.head.role || '').trim(),
    } : undefined;
    const members = Array.isArray(body.members) ? body.members.map((m, idx) => ({
      id: m?.id || Date.now() + 2 + idx,
      name: String(m?.name || '').trim(),
      role: String(m?.role || '').trim(),
    })).filter(m => m.name) : [];

    const event = {
      id,
      name: String(name).trim(),
      type,
      schedule,
      expectedParticipants,
      targetAudience,
      registration,
      mainTasks: body.mainTasks || body.activities || '',
      resourcesNeeded: body.resourcesNeeded || '',
      budget: {
        total: typeof budget.total === 'number' ? budget.total : null,
        allocation: budget.allocation || '',
        breakdown: budget.breakdown ? {
          catering: budget.breakdown.catering ?? null,
          venue: budget.breakdown.venue ?? null,
          staff: budget.breakdown.staff ?? null,
          other: budget.breakdown.other ?? null,
        } : undefined,
      },
      commsPlan: body.commsPlan || body.description || '',
      // Backward-compat fields used by UI lists
      date: normalisedDate,
      organiser: body.organiser || { name: '' },
      status: body.status || 'planned',
      createdAt: new Date().toISOString(),
      // Optional team fields for UI consumption
      ...(head ? { head } : {}),
      ...(members && members.length ? { members } : {}),
    };

    if (mongoDb) {
      await mongoDb.collection('events').insertOne(event);
      return res.json({ success: true, data: event });
    }
    dataStore.events.unshift(event);
    return res.json({ success: true, data: event });
  } catch (err) {
    console.error('create-event error', err);
    return res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    let current;
    if (mongoDb) {
      current = await mongoDb.collection('events').findOne({ id });
      if (!current) return res.status(404).json({ success: false, error: 'Event not found' });
    } else {
      const idx = dataStore.events.findIndex(e => Number(e.id) === id);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Event not found' });
      current = dataStore.events[idx];
    }

    const update = {};
    // Allow direct fields
    const allowed = ['name','date','time','venue','type','organiser','targetAudience','description','activities','budget','budgetTotal','budgetBreakdown','staffInvolved','expensesNotes','status','schedule','registration','expectedParticipants','mainTasks','resourcesNeeded','commsPlan'];
    for (const key of allowed) {
      if (typeof body[key] !== 'undefined') update[key] = body[key];
    }

    // Normalise legacy budget fields to budget object
    if (typeof body.budgetTotal !== 'undefined' || typeof body.budgetBreakdown !== 'undefined') {
      update.budget = {
        total: typeof body.budgetTotal === 'number' ? body.budgetTotal : (current.budget?.total ?? null),
        breakdown: {
          catering: body.budgetBreakdown?.catering ?? current.budget?.breakdown?.catering ?? null,
          venue: body.budgetBreakdown?.venue ?? current.budget?.breakdown?.venue ?? null,
          staff: body.budgetBreakdown?.staff ?? current.budget?.breakdown?.staff ?? null,
          other: body.budgetBreakdown?.other ?? current.budget?.breakdown?.other ?? null,
        },
      };
    }

    // If schedule provided, set top-level date for UI compatibility
    if (update.schedule) {
      update.date = update.schedule.startDate ?? current.date ?? null;
    }

    // If only individual schedule fields provided in legacy style
    const legacySchedule = {
      startDate: body.startDate,
      endDate: body.endDate,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location ?? body.venue,
      isVirtual: typeof body.isVirtual === 'boolean' ? body.isVirtual : undefined,
    };
    if (Object.values(legacySchedule).some(v => typeof v !== 'undefined')) {
      update.schedule = {
        ...(current.schedule || {}),
        ...Object.fromEntries(Object.entries(legacySchedule).filter(([,v]) => typeof v !== 'undefined')),
      };
      update.date = update.schedule.startDate ?? current.date ?? null;
    }

    const updated = { ...current, ...update };
    if (mongoDb) {
      await mongoDb.collection('events').updateOne({ id }, { $set: updated });
      return res.json({ success: true, data: updated });
    }
    const idx = dataStore.events.findIndex(e => Number(e.id) === id);
    dataStore.events[idx] = updated;
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('update-event error', err);
    return res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (mongoDb) {
    const result = await mongoDb.collection('events').findOneAndDelete({ id });
    if (!result.value) return res.status(404).json({ success: false, error: 'Event not found' });
    return res.json({ success: true, data: result.value });
  }
  const idx = dataStore.events.findIndex(e => Number(e.id) === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Event not found' });
  const [removed] = dataStore.events.splice(idx, 1);
  return res.json({ success: true, data: removed });
});

connectMongo().finally(() => {
  app.listen(PORT, () => {
    console.log(`Auth server listening on http://localhost:${PORT}`);
  });
});
