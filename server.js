require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const allowedOrigin = process.env.ALLOWED_ORIGIN?.trim();
app.use(cors({
  origin: allowedOrigin || true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

app.use('/api/contact', formLimiter);
app.use('/api/appointment', formLimiter);
app.use('/api/whatsapp', formLimiter);

const emailReady = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.HOSPITAL_EMAIL);
const whatsappReady = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

const transporter = emailReady
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })
  : null;

function clean(value, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (!clean(body[field])) return `Please provide ${field}.`;
  }
  return null;
}

async function sendHospitalEmail({ subject, html, replyTo }) {
  if (!transporter) {
    throw new Error('Gmail is not configured. Add GMAIL_USER, GMAIL_APP_PASSWORD and HOSPITAL_EMAIL to .env.');
  }

  return transporter.sendMail({
    from: `David's Hospital Website <${process.env.GMAIL_USER}>`,
    to: process.env.HOSPITAL_EMAIL,
    replyTo: replyTo || undefined,
    subject,
    html
  });
}

async function sendWhatsAppText(to, textMessage) {
  if (!whatsappReady) {
    throw new Error('WhatsApp Cloud API is not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env.');
  }

  const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const url = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: textMessage }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error?.message || 'WhatsApp API request failed.';
    throw new Error(detail);
  }

  return data;
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: "David's Hospital backend",
    gmailConfigured: emailReady,
    whatsappCloudConfigured: whatsappReady,
    whatsappNumber: process.env.WHATSAPP_NUMBER || '2348136217095'
  });
});

app.post('/api/contact', async (req, res) => {
  try {
    const name = clean(req.body.name, 100);
    const email = clean(req.body.email, 160);
    const phone = clean(req.body.phone, 50);
    const subject = clean(req.body.subject, 180);
    const message = clean(req.body.message, 5000);

    const missing = requireFields({ name, email, phone, subject, message }, ['name', 'email', 'phone', 'subject', 'message']);
    if (missing) return res.status(400).json({ success: false, message: missing });
    if (!isEmail(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });

    await sendHospitalEmail({
      subject: `Website Contact: ${subject}`,
      replyTo: email,
      html: `
        <h2>New Contact Message — David's Hospital</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ success: true, message: 'Your message has been sent to David\'s Hospital.' });
  } catch (error) {
    console.error('Contact error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Unable to send your message right now.' });
  }
});

app.post('/api/appointment', async (req, res) => {
  try {
    const name = clean(req.body.name, 100);
    const phone = clean(req.body.phone, 50);
    const email = clean(req.body.email, 160);
    const department = clean(req.body.department, 120);
    const date = clean(req.body.date, 30);
    const time = clean(req.body.time, 30);
    const reason = clean(req.body.reason, 3000);

    const missing = requireFields(
      { name, phone, email, department, date, time, reason },
      ['name', 'phone', 'email', 'department', 'date', 'time', 'reason']
    );
    if (missing) return res.status(400).json({ success: false, message: missing });
    if (!isEmail(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });

    await sendHospitalEmail({
      subject: `New Appointment Request: ${name}`,
      replyTo: email,
      html: `
        <h2>New Appointment Request — David's Hospital</h2>
        <p><strong>Patient:</strong> ${escapeHtml(name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Department:</strong> ${escapeHtml(department)}</p>
        <p><strong>Preferred date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Preferred time:</strong> ${escapeHtml(time)}</p>
        <p><strong>Reason:</strong></p>
        <p>${escapeHtml(reason).replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ success: true, message: 'Your appointment request has been sent to David\'s Hospital.' });
  } catch (error) {
    console.error('Appointment error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Unable to send the appointment request right now.' });
  }
});

app.post('/api/whatsapp', async (req, res) => {
  try {
    const to = clean(req.body.to, 30).replace(/[^0-9]/g, '');
    const message = clean(req.body.message, 4000);

    if (!to || to.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid WhatsApp number in international format.' });
    }
    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a WhatsApp message.' });
    }

    await sendWhatsAppText(to, message);
    res.json({ success: true, message: 'WhatsApp message sent successfully.' });
  } catch (error) {
    console.error('WhatsApp error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Unable to send the WhatsApp message.' });
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

app.use(express.static(publicDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`David's Hospital server running at http://localhost:${PORT}`);
  console.log(`Gmail configured: ${emailReady ? 'YES' : 'NO — configure .env'}`);
  console.log(`WhatsApp Cloud API configured: ${whatsappReady ? 'YES' : 'NO — optional until credentials are added'}`);
});
