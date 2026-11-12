import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import https from 'node:https';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_API_BASE = (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

app.disable('x-powered-by');

// Keep Firebase Google sign-in working without COOP opener restrictions.
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(cors({ origin: true }));
app.use(express.json({ limit: '512kb' }));

const ALLOWED_ROLES = new Set(['user', 'assistant', 'model']);

const rateBuckets = new Map();
function rateLimit(req, res, next) {
  const key = req.ip || 'anon';
  const now = Date.now();
  const windowMs = 60_000;
  const max = 30;
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > windowMs) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > max) {
    return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  }
  next();
}

const SYSTEM_PROMPT = `You are Pulse AI, the embedded project assistant inside a project management app.
You ALWAYS answer using the live workspace data supplied by the client. Never invent projects, tasks, or people.
If a request references something that does not exist, say so and list the closest matches.

Return ONLY valid JSON with this exact shape:
{
  "reply": "string (markdown-lite: plain text, optional newlines, no code fences)",
  "actions": [ ...zero or more action objects... ],
  "requiresConfirmation": boolean
}

Action objects must be one of:
1. { "type": "project.update", "projectId": "id", "changes": { "name"?, "description"?, "status"?: "planning|in-progress|on-hold|completed", "priority"?: "low|medium|high|urgent", "dueDate"?: "YYYY-MM-DD", "startDate"?: "YYYY-MM-DD", "memberIds"?: ["id"] } }
2. { "type": "project.delete", "projectId": "id" }
3. { "type": "task.create", "data": { "title": "string", "projectId"?: "id", "assigneeId"?: "id", "status"?: "todo|in-progress|in-review|completed", "priority"?: "low|medium|high|urgent", "dueDate"?: "YYYY-MM-DD", "description"?: "string" } }
4. { "type": "task.update", "taskId": "id", "changes": { "title"?, "status"?, "priority"?, "assigneeId"?, "dueDate"?, "description"? } }
5. { "type": "task.updateMany", "taskIds": ["id"], "changes": { ...same as task.update changes... } }
6. { "type": "task.delete", "taskId": "id" }
7. { "type": "member.add", "data": { "name": "string", "email"?: "string", "role"?: "string" } }
8. { "type": "member.remove", "memberId": "id" }

Rules:
- Use ONLY ids that appear in the workspace context.
- Dates must be ISO YYYY-MM-DD. Resolve relative dates (today, tomorrow, next Friday) using the provided today's date.
- For read-only questions, return "actions": [] and answer from the data. Compute counts precisely.
- For mutations, still write a concise reply describing what you will do.
- Set "requiresConfirmation": true only for delete operations or bulk updates affecting 3+ items.
- Never generate code, SQL, or scripts. Never output anything outside the JSON object.
- Keep replies under 120 words unless the user asks for a detailed report.
- Be concrete: mention project names and dates, not vague generalities.`;

function buildContents(messages) {
  const contents = [];
  for (const msg of messages.slice(-16)) {
    const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
    const text = String(msg.content || '').slice(0, 6000);
    if (!text.trim()) continue;
    if (contents.length && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }
  if (!contents.length || contents[0].role === 'model') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }
  return contents;
}

function safeContext(context) {
  if (!context || typeof context !== 'object') return '{}';
  const serialized = JSON.stringify(context);
  if (serialized.length > 120_000) {
    return serialized.slice(0, 120_000) + '… (truncated)';
  }
  return serialized;
}


function postJson(urlString, bodyString, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(urlString);
    } catch (error) {
      reject(error);
      return;
    }
    const transport = url.protocol === 'http:' ? http : https;
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: url.pathname + url.search,
        method: 'POST',
        // Force IPv4: some networks cannot reach Google APIs over IPv6.
        family: 4,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyString),
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode || 0,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );
    const timeout = setTimeout(() => {
      const error = new Error('Gemini request timed out.');
      error.name = 'TimeoutError';
      request.destroy(error);
    }, timeoutMs);
    request.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    request.on('close', () => clearTimeout(timeout));
    request.write(bodyString);
    request.end();
  });
}

async function callGemini({ messages, context, today }) {
  const systemText = `${SYSTEM_PROMPT}\n\nToday's date: ${today}\n\nLIVE WORKSPACE CONTEXT (source of truth):\n${safeContext(context)}`;
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: buildContents(messages),
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 1400,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  });

  const response = await postJson(
    `${GEMINI_API_BASE}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`,
    requestBody,
    45000
  );

  let payload = null;
  try {
    payload = JSON.parse(response.text);
  } catch {
    payload = null;
  }

  if (response.status < 200 || response.status >= 300) {
    const detail = payload?.error?.message || `Gemini request failed (${response.status})`;
    const err = new Error(detail);
    err.status = response.status;
    err.apiStatus = payload?.error?.status || null;
    throw err;
  }

  const text =
    payload?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') || '';
  if (!text) throw new Error('Gemini returned an empty response.');

  return text;
}

app.get('/api/ai/health', (_req, res) => {
  res.json({
    configured: Boolean(GEMINI_KEY),
    model: GEMINI_MODEL,
    engine: GEMINI_KEY ? 'gemini' : 'local',
    base: GEMINI_API_BASE,
  });
});

app.post('/api/ai/chat', rateLimit, async (req, res) => {
  if (!GEMINI_KEY) {
    return res.status(503).json({
      error: 'AI proxy is not configured.',
      code: 'NOT_CONFIGURED',
      hint: 'Add GEMINI_API_KEY to .env and restart the server. The app will fall back to the local assistant engine.',
    });
  }

  const { messages, context, today } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] is required.' });
  }
  if (messages.length > 40) {
    return res.status(400).json({ error: 'Too many messages in one request.' });
  }
  for (const m of messages) {
    if (!ALLOWED_ROLES.has(m?.role) || typeof m?.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format.' });
    }
  }
  if (typeof context !== 'object' || context === null) {
    return res.status(400).json({ error: 'context object is required.' });
  }

  try {
    const todayIso = typeof today === 'string' ? today.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const raw = await callGemini({ messages, context, today: todayIso });
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.json({ reply: cleaned, actions: [], requiresConfirmation: false, engine: 'gemini' });
    }

    res.json({
      reply: typeof parsed.reply === 'string' ? parsed.reply : 'Done.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      requiresConfirmation: Boolean(parsed.requiresConfirmation),
      engine: 'gemini',
    });
  } catch (err) {
    const status = err.status === 429 ? 429 : 502;
    const message =
      (err.name === 'AbortError' || err.name === 'TimeoutError') ? 'Gemini request timed out.' : err.message || 'AI request failed.';

    if (/location is not supported/i.test(message)) {
      return res.status(status).json({
        error:
          'Gemini API is not available from this server location. The local assistant engine answered instead.',
        detail: message,
        code: 'LOCATION_NOT_SUPPORTED',
        hint: 'Use a system-wide VPN/proxy in a supported region, host the API proxy in a supported region, or set GEMINI_API_BASE to a supported gateway.',
      });
    }

    if (err.status === 404 || /no longer available|is not found for API version/i.test(message)) {
      return res.status(status).json({
        error:
          'Gemini model "' + GEMINI_MODEL + '" is not available. Update GEMINI_MODEL in .env (for example gemini-3.8-flash).',
        detail: message,
        code: 'MODEL_UNAVAILABLE',
      });
    }

    res.status(status).json({
      error: message,
      code: 'UPSTREAM_ERROR',
      detail: err.apiStatus || undefined,
    });
  }
});

const distDir = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Pulse AI proxy listening on http://localhost:${PORT}`);
  console.log(`Engine: ${GEMINI_KEY ? `Gemini (${GEMINI_MODEL})` : 'NOT CONFIGURED — local fallback will be used'}`);
});
