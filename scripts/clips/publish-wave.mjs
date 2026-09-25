#!/usr/bin/env node
// Re-packages already-uploaded (private) catalog videos and schedules them:
// new title, description, tags, optional custom thumbnail, publishAt.
// Dry by default — prints what it would do. --apply performs the updates.
//
//   node scripts/clips/publish-wave.mjs wave1/wave1.json --client-secrets <oauth.json> [--apply] [--only <id>]
//
// wave.json: [{ id, title, description, tags, publishAt, thumb? }]
// The original description is preserved under a divider. Every applied change
// is appended to <wave>.log.json so it can be audited or reverted.

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const APPLY = argv.includes('--apply');
const ONLY = flag('--only');
const waveFile = argv.find((a) => !a.startsWith('--') && a.endsWith('.json'));
const secretsPath = (flag('--client-secrets') ?? process.env.GOOGLE_CLIENT_SECRETS ?? '').replace(/^~/, process.env.HOME);
if (!waveFile || !secretsPath) { console.error('usage: publish-wave.mjs <wave.json> --client-secrets <oauth.json> [--apply]'); process.exit(1); }

const here = import.meta.dirname;
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')).installed;
const { refresh_token } = JSON.parse(fs.readFileSync(path.join(here, '.youtube-token.json'), 'utf8'));
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: secrets.client_id, client_secret: secrets.client_secret, refresh_token, grant_type: 'refresh_token' }),
})).json();
if (!tok.access_token) { console.error('token refresh failed:', JSON.stringify(tok)); process.exit(1); }
const H = { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' };

const wave = JSON.parse(fs.readFileSync(waveFile, 'utf8')).filter((w) => !ONLY || w.id === ONLY);
const logFile = waveFile.replace(/\.json$/, '.log.json');
const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];

const cur = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${wave.map((w) => w.id).join(',')}`, { headers: H })).json();
const byId = Object.fromEntries((cur.items ?? []).map((v) => [v.id, v]));

for (const w of wave) {
  const v = byId[w.id];
  if (!v) { console.log(`  ${w.id}  NOT FOUND`); continue; }
  if (v.status.privacyStatus !== 'private') { console.log(`  ${w.id}  skip: already ${v.status.privacyStatus}`); continue; }
  const orig = (v.snippet.description ?? '').trim();
  const description = orig && !w.description.includes(orig) ? `${w.description}\n\n—\nDescripción original: ${orig}` : w.description;
  const body = {
    id: w.id,
    snippet: { title: w.title, description, tags: w.tags, categoryId: '27', defaultLanguage: 'es', defaultAudioLanguage: 'es' },
    status: { privacyStatus: 'private', publishAt: w.publishAt, selfDeclaredMadeForKids: false, embeddable: true, license: v.status.license },
  };
  const thumb = w.thumb && fs.existsSync(path.resolve(here, w.thumb)) ? path.resolve(here, w.thumb) : null;
  console.log(`\n${w.id}  "${v.snippet.title.slice(0, 50)}"\n  → ${w.title}\n  → publishes ${w.publishAt}${thumb ? `\n  → thumbnail ${path.basename(thumb)}` : ''}`);
  if (!APPLY) continue;
  const r = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', { method: 'PUT', headers: H, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) { console.log(`  FAILED: ${JSON.stringify(d.error).slice(0, 200)}`); continue; }
  let thumbOk = null;
  if (thumb) {
    const t = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${w.id}&uploadType=media`, {
      method: 'POST', headers: { Authorization: H.Authorization, 'Content-Type': 'image/jpeg' }, body: fs.readFileSync(thumb),
    });
    thumbOk = t.ok; if (!t.ok) console.log(`  thumbnail FAILED: ${(await t.text()).slice(0, 200)}`);
  }
  log.push({ id: w.id, at: new Date().toISOString(), prevTitle: v.snippet.title, prevDescription: orig, title: w.title, publishAt: w.publishAt, thumb: thumbOk });
  console.log(`  applied${thumb ? ` · thumbnail ${thumbOk ? 'ok' : 'failed'}` : ''}`);
}
if (APPLY) fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
console.log(APPLY ? `\nlog: ${logFile}` : '\n(dry run — add --apply to write)');
