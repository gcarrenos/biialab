#!/usr/bin/env node
// Uploads the clips produced by clip.mjs to YouTube as Shorts.
//
// One-time authorization (opens a browser, captures the code on localhost):
//   node scripts/clips/upload.mjs --auth --client-secrets ~/Downloads/client_secret_*.json
//
// Then upload a batch:
//   node scripts/clips/upload.mjs <videoId>
//
// Drip-publish instead of reviewing manually — one clip per day from 3pm UTC:
//   node scripts/clips/upload.mjs <videoId> --schedule 2026-08-14T15:00:00Z
//   (add --every-hours 12 for two per day)
//
// Credentials resolve in this order:
//   1. --client-secrets <path> to the Google OAuth client JSON (Desktop app)
//   2. GOOGLE_CLIENT_SECRETS env var pointing at the same file
//   3. YT_CLIENT_ID + YT_CLIENT_SECRET env vars
// The refresh token is stored in scripts/clips/.youtube-token.json (gitignored,
// chmod 600) so it never has to be pasted into a shell. YT_REFRESH_TOKEN
// overrides it if set.
//
// Uploads default to PRIVATE so you can review before publishing.

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';

const argv = process.argv.slice(2);
const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);

const TOKEN_FILE = path.join(import.meta.dirname, '.youtube-token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
].join(' ');

// ------------------------------------------------------------- credentials
function loadClient() {
  const secretsPath = flag('--client-secrets') ?? process.env.GOOGLE_CLIENT_SECRETS;
  if (secretsPath) {
    const expanded = secretsPath.replace(/^~/, process.env.HOME ?? '~');
    const json = JSON.parse(fs.readFileSync(expanded, 'utf8'));
    // Google ships desktop clients under "installed", web clients under "web"
    const cfg = json.installed ?? json.web;
    if (!cfg?.client_id || !cfg?.client_secret) {
      throw new Error(`${expanded} is not a Google OAuth client JSON (no installed/web section).`);
    }
    return { clientId: cfg.client_id, clientSecret: cfg.client_secret };
  }
  const { YT_CLIENT_ID, YT_CLIENT_SECRET } = process.env;
  if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
    throw new Error(
      'No OAuth client. Pass --client-secrets <path to client_secret_*.json>, ' +
      'or set GOOGLE_CLIENT_SECRETS, or set YT_CLIENT_ID + YT_CLIENT_SECRET.',
    );
  }
  return { clientId: YT_CLIENT_ID, clientSecret: YT_CLIENT_SECRET };
}

let client;
try {
  client = loadClient();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

async function exchange(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token endpoint ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// --------------------------------------------------------------- auth flow
// Google blocked the out-of-band (copy/paste code) flow in 2022. Desktop
// clients now redirect to http://localhost:<port>, so we run a throwaway
// server on an ephemeral port and capture the code there. PKCE is included
// because Google recommends it for installed apps.
if (argv.includes('--auth')) {
  const verifier = crypto.randomBytes(64).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('base64url');

  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const redirectUri = `http://localhost:${server.address().port}`;

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  console.log('Authorize with the Google account that owns the @BiiALAB channel.');
  console.log(`\nIf a browser does not open, paste this URL:\n\n${authUrl}\n`);
  execFile('open', [authUrl], () => {}); // macOS; harmless failure elsewhere

  const code = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out after 5 minutes.')), 300_000);
    server.on('request', (req, res) => {
      const url = new URL(req.url, redirectUri);
      const respond = (message) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body style="font-family:system-ui;padding:3rem">
          <h2>${message}</h2><p>You can close this tab and return to the terminal.</p>
        </body></html>`);
      };
      if (url.searchParams.get('error')) {
        respond('Authorization denied.');
        clearTimeout(timeout);
        reject(new Error(`Authorization denied: ${url.searchParams.get('error')}`));
        return;
      }
      const received = url.searchParams.get('code');
      if (!received) return; // favicon and other stray requests
      if (url.searchParams.get('state') !== state) {
        respond('State mismatch — request rejected.');
        clearTimeout(timeout);
        reject(new Error('State mismatch; possible CSRF. Re-run --auth.'));
        return;
      }
      respond('Authorized. BiiALAB clips can now upload to YouTube.');
      clearTimeout(timeout);
      resolve(received);
    });
  }).finally(() => server.close());

  const tokens = await exchange({
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });

  if (!tokens.refresh_token) {
    console.error('No refresh token returned. Revoke the app at ' +
      'https://myaccount.google.com/permissions and re-run --auth.');
    process.exit(1);
  }

  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ refresh_token: tokens.refresh_token }, null, 2), { mode: 0o600 });
  console.log(`\nSaved refresh token to ${TOKEN_FILE} (gitignored, chmod 600).`);
  console.log('You will not need to authorize again. Next: node scripts/clips/upload.mjs <videoId>');
  process.exit(0);
}

// ------------------------------------------------------------------ upload
const videoId = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
if (!videoId) {
  console.error('Usage: node scripts/clips/upload.mjs <videoId> [--schedule <ISO>] [--every-hours N]');
  process.exit(1);
}

const refreshToken = process.env.YT_REFRESH_TOKEN
  ?? (fs.existsSync(TOKEN_FILE) ? JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')).refresh_token : null);
if (!refreshToken) {
  console.error('Not authorized yet. Run: node scripts/clips/upload.mjs --auth --client-secrets <path>');
  process.exit(1);
}

const privacy = flag('--privacy') ?? 'private';

// --schedule staggers the clips one per interval starting at the given time,
// so YouTube publishes them on a daily drip without touching Studio.
// Scheduling requires privacyStatus 'private' — YouTube flips it to public itself.
const scheduleFrom = flag('--schedule');
const intervalHours = Number(flag('--every-hours')) || 24;

let publishAt = null;
if (scheduleFrom) {
  publishAt = new Date(scheduleFrom);
  if (Number.isNaN(publishAt.getTime())) {
    console.error(`Invalid --schedule value "${scheduleFrom}". Use an ISO timestamp, e.g. 2026-08-14T15:00:00Z`);
    process.exit(1);
  }
  if (publishAt.getTime() <= Date.now()) {
    console.error('--schedule must be in the future; YouTube rejects past publish times.');
    process.exit(1);
  }
  if (privacy !== 'private') {
    console.error('--schedule requires --privacy private (YouTube publishes it for you at publishAt).');
    process.exit(1);
  }
}

const outDir = path.join(import.meta.dirname, 'out', videoId);
const metadataFile = path.join(outDir, 'metadata.json');
if (!fs.existsSync(metadataFile)) {
  console.error(`No clips found at ${outDir}. Run: node scripts/clips/clip.mjs ${videoId}`);
  process.exit(1);
}
const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));

const { access_token: token } = await exchange({
  refresh_token: refreshToken,
  grant_type: 'refresh_token',
});

for (const [i, clip] of metadata.entries()) {
  const file = path.join(outDir, clip.file);
  const slot = publishAt
    ? new Date(publishAt.getTime() + i * intervalHours * 3600_000)
    : null;

  const body = {
    snippet: {
      title: clip.title,
      description: clip.description,
      categoryId: '27', // Education
      defaultLanguage: 'es',
      defaultAudioLanguage: 'es',
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
      ...(slot ? { publishAt: slot.toISOString() } : {}),
    },
  };

  const when = slot ? `publishes ${slot.toISOString()}` : privacy;
  console.log(`Uploading ${clip.file}  (${when})  ${clip.title}`);

  // Resumable upload: init, then PUT the bytes
  const init = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!init.ok) {
    console.error(`  init failed: ${init.status} ${await init.text()}`);
    continue;
  }
  const uploadUrl = init.headers.get('location');
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: fs.readFileSync(file),
  });
  const result = await put.json();
  if (!put.ok) {
    console.error(`  upload failed: ${put.status} ${JSON.stringify(result)}`);
    continue;
  }
  console.log(`  → https://youtube.com/shorts/${result.id}`);

  // Record in the ledger so future runs know this segment is used
  const ledgerFile = path.join(import.meta.dirname, 'ledger.json');
  const ledger = fs.existsSync(ledgerFile)
    ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8'))
    : { uploads: [] };
  ledger.uploads.push({
    sourceVideo: clip.sourceVideoId ?? videoId,
    segment: [clip.start, clip.end],
    youtubeId: result.id,
    title: clip.title,
    style: clip.style ?? (clip.hook ? 'captioned' : 'clean'),
    publishAt: slot ? slot.toISOString() : privacy,
    uploadedAt: new Date().toISOString().slice(0, 10),
  });
  fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
}

console.log(publishAt
  ? '\nDone. Clips are scheduled — YouTube will publish them automatically.'
  : '\nDone. Review the private uploads in YouTube Studio, then publish/schedule them.');
