// Simple Express server for email OTP via SMTP
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory store for OTPs (for demo). In production, use Redis/DB with TTL.
const otpStore = new Map(); // key: email, value: { code, expiresAt }

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP environment variables are not set');
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

    const transporter = createTransport();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your EventAI verification code',
      text: `Your verification code is ${code}. It expires in 5 minutes.`,
      html: `<p>Your verification code is <b>${code}</b>.</p><p>It expires in 5 minutes.</p>`,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('send-otp error', err);
    return res.status(500).json({ success: false, error: 'Failed to send OTP' });
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

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
