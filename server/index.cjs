// Simple Express server for email OTP via SMTP (CommonJS)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
// MongoDB removed; using in-memory store only

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

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
};

// Removed MongoDB connection; all data is in-memory

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

app.get('/api/events', (req, res) => {
  return res.json({ success: true, data: dataStore.events });
});

app.get('/api/events/:id', (req, res) => {
  const id = Number(req.params.id);
  const event = dataStore.events.find(e => Number(e.id) === id);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
  return res.json({ success: true, data: event });
});

app.post('/api/events', (req, res) => {
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
    };

    dataStore.events.unshift(event);
    return res.json({ success: true, data: event });
  } catch (err) {
    console.error('create-event error', err);
    return res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

app.put('/api/events/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const idx = dataStore.events.findIndex(e => Number(e.id) === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Event not found' });
    const current = dataStore.events[idx];

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
    dataStore.events[idx] = updated;
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('update-event error', err);
    return res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = dataStore.events.findIndex(e => Number(e.id) === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Event not found' });
  const [removed] = dataStore.events.splice(idx, 1);
  return res.json({ success: true, data: removed });
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
