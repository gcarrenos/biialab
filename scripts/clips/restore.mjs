#!/usr/bin/env node
// Restore private catalog videos to public via the Data API (privacy is writable; monetization is not).
// Keeps the title that earned, appends the certificate CTA to the description, logs every change to
// restore-log.json so it can be reverted. User-authorized bulk action (Sep 9 2026): batches of 20 from
// the lifetime-revenue ranked list, 48h claim watch between batches.
//
//   node scripts/clips/restore.mjs --client-secrets <oauth.json> --top 20 [--skip 20]
//   node scripts/clips/restore.mjs --client-secrets <oauth.json> <id> [id...]
//   node scripts/clips/restore.mjs --client-secrets <oauth.json> --revert      # everything in the log → private

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const here = import.meta.dirname;
const secretsPath = (flag('--client-secrets') ?? process.env.GOOGLE_CLIENT_SECRETS ?? '').replace(/^~/, process.env.HOME);
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')).installed;
const { refresh_token } = JSON.parse(fs.readFileSync(path.join(here, '.youtube-token.json'), 'utf8'));
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: secrets.client_id, client_secret: secrets.client_secret, refresh_token, grant_type: 'refresh_token' }),
})).json();
const H = { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' };
const CTA = '\n\nCursos gratis con certificado: https://www.biialab.org/courses?utm_source=youtube&utm_medium=video&utm_campaign=catalogo';
const LIST = flag('--list') ?? '/private/tmp/claude-501/-Users-gustavocarreno-biialab--claude-worktrees-video-traffic-strategy-1b8979/b8140d11-d340-42f6-b186-e8cd237ee189/scratchpad/private-lifetime-sorted.txt';
const logFile = path.join(here, 'restore-log.json');
const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : [];

async function fetchVideos(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const d = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${ids.slice(i, i + 50).join(',')}`, { headers: H })).json();
    if (d.error) console.error("videos.list error:", JSON.stringify(d.error).slice(0, 300));
    out.push(...(d.items ?? []));
  }
  return out;
}
async function setPrivacy(v, privacy) {
  const desc = privacy === 'public' && !v.snippet.description.includes('utm_campaign=catalogo') ? v.snippet.description + CTA : v.snippet.description;
  const body = {
    id: v.id,
    snippet: { title: v.snippet.title, description: desc, categoryId: v.snippet.categoryId, tags: v.snippet.tags, defaultLanguage: v.snippet.defaultLanguage },
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false, license: v.status.license, embeddable: v.status.embeddable },
  };
  const r = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', { method: 'PUT', headers: H, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d.error).slice(0, 160));
}

if (argv.includes('--revert')) {
  for (const v of await fetchVideos(log.map((l) => l.id))) { await setPrivacy(v, 'private'); console.log(`  private again: ${v.id}  ${v.snippet.title.slice(0, 55)}`); }
  fs.writeFileSync(logFile, '[]');
  console.log(`\nreverted ${log.length}`);
  process.exit(0);
}

let ids = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
if (flag('--top')) {
  const skip = Number(flag('--skip') ?? 0), top = Number(flag('--top'));
  ids = fs.readFileSync(LIST, 'utf8').split('\n').slice(1).filter(Boolean).slice(skip, skip + top).map((l) => l.trim().split(/\s+/)[2]);
}
if (!ids.length) { console.error('nothing to do: pass ids or --top N'); process.exit(1); }
console.log('ids:', ids.length, ids.slice(0, 3).join(' '), '…');

const TARGET = flag('--privacy') ?? 'public'; // 'unlisted' = playable on biialab.org, invisible on the channel (course lessons)
let done = 0;
for (const v of await fetchVideos(ids)) {
  const tag = `${v.id}  ${v.snippet.title.slice(0, 55)}`;
  if (v.status.privacyStatus !== 'private' || v.status.publishAt) { console.log(`  skip (${v.status.privacyStatus}${v.status.publishAt ? ', scheduled' : ''}): ${tag}`); continue; }
  if (v.status.uploadStatus !== 'processed') { console.log(`  skip (${v.status.uploadStatus} ${v.status.rejectionReason ?? ''}): ${tag}`); continue; }
  try {
    await setPrivacy(v, TARGET);
    log.push({ id: v.id, title: v.snippet.title, to: TARGET, restoredAt: new Date().toISOString() });
    done++;
    console.log(`  ${TARGET}: ${tag}`);
  } catch (e) { console.log(`  FAILED: ${tag} — ${e.message}`); }
}
fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
console.log(`\nthis run: ${done} restored · total in log: ${log.length}  (${logFile})`);
