#!/usr/bin/env node
// Uploads the clips produced by clip.mjs to YouTube as Shorts.
//
//   YT_CLIENT_ID=... YT_CLIENT_SECRET=... YT_REFRESH_TOKEN=... \
//     node scripts/clips/upload.mjs <videoId> [--privacy private]
//
// Needs an OAuth client with the youtube.upload scope — an API key cannot
// upload. One-time setup:
//   1. Google Cloud Console → APIs & Services → Credentials → Create OAuth
//      client ID (Desktop app). Enable "YouTube Data API v3".
//   2. Run: node scripts/clips/upload.mjs --auth   (prints a URL, paste the code)
//      It prints the refresh token to export as YT_REFRESH_TOKEN.
//
// Uploads default to PRIVATE so you can review before publishing.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;
const argv = process.argv.slice(2);

if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
  console.error('Set YT_CLIENT_ID and YT_CLIENT_SECRET (OAuth Desktop client). See header comment.');
  process.exit(1);
}

// --------------------------------------------------------------- auth flow
if (argv.includes('--auth')) {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: YT_CLIENT_ID,
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
    access_type: 'offline',
    prompt: 'consent',
  });
  console.log(`Open this URL, authorize with the channel's Google account, and paste the code:\n\n${authUrl}\n`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = (await rl.question('Code: ')).trim();
  rl.close();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!data.refresh_token) {
    console.error('Token exchange failed:', data);
    process.exit(1);
  }
  console.log(`\nexport YT_REFRESH_TOKEN="${data.refresh_token}"`);
  process.exit(0);
}

// ------------------------------------------------------------------ upload
const videoId = argv.find((a) => !a.startsWith('--'));
if (!videoId || !YT_REFRESH_TOKEN) {
  console.error('Usage: node scripts/clips/upload.mjs <videoId>  (with YT_REFRESH_TOKEN set; run --auth first)');
  process.exit(1);
}
const privacy = argv.includes('--privacy') ? argv[argv.indexOf('--privacy') + 1] : 'private';

const outDir = path.join(import.meta.dirname, 'out', videoId);
const metadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      refresh_token: YT_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

const token = await accessToken();

for (const clip of metadata) {
  const file = path.join(outDir, clip.file);
  const body = {
    snippet: {
      title: clip.title,
      description: clip.description,
      categoryId: '27', // Education
      defaultLanguage: 'es',
      defaultAudioLanguage: 'es',
    },
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
  };

  console.log(`Uploading ${clip.file}  (${privacy})  ${clip.title}`);

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
}

console.log('\nDone. Review the private uploads in YouTube Studio, then publish/schedule them.');
