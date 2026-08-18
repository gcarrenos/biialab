#!/usr/bin/env node
// Retention + traffic report for every live Short in the ledger, via the
// YouTube Analytics API (channel owner OAuth). Answers "why did it stop at
// 800": average view %, swipe-through proxy, traffic sources, and the
// per-video audience-retention curve (where people leave).
//
//   node scripts/clips/analytics.mjs --client-secrets <oauth.json> [--curves] [--since 2026-08-10]

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const CURVES = argv.includes('--curves');
const since = flag('--since') ?? '2026-08-10';
const today = new Date().toISOString().slice(0, 10);
const here = import.meta.dirname;

const secrets = JSON.parse(fs.readFileSync(flag('--client-secrets'), 'utf8')).installed;
const { refresh_token } = JSON.parse(fs.readFileSync(path.join(here, '.youtube-token.json'), 'utf8'));
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: secrets.client_id, client_secret: secrets.client_secret, refresh_token, grant_type: 'refresh_token' }),
})).json();
const H = { Authorization: `Bearer ${tok.access_token}` };

async function report(params) {
  const q = new URLSearchParams({ ids: 'channel==MINE', startDate: since, endDate: today, ...params });
  const r = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${q}`, { headers: H });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d).slice(0, 300));
  const cols = d.columnHeaders.map((c) => c.name);
  return (d.rows ?? []).map((row) => Object.fromEntries(row.map((v, i) => [cols[i], v])));
}

const ledger = JSON.parse(fs.readFileSync(path.join(here, 'ledger.json'), 'utf8'));
const meta = new Map(ledger.uploads.map((u) => [u.youtubeId, u]));
const ids = [...meta.keys()];

// Per-video core metrics (only videos with data come back = the live ones)
const rows = [];
for (let i = 0; i < ids.length; i += 50) {
  rows.push(...await report({
    dimensions: 'video', filters: `video==${ids.slice(i, i + 50).join(',')}`,
    metrics: 'views,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,engagedViews',
    maxResults: '50', sort: '-views',
  }).catch(async () => report({
    dimensions: 'video', filters: `video==${ids.slice(i, i + 50).join(',')}`,
    metrics: 'views,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained',
    maxResults: '50', sort: '-views',
  })));
}

const hourCol = (iso) => { const d = new Date(iso); if (Number.isNaN(d)) return '?'; const h = (d.getUTCHours() + 19) % 24; return `${String(h).padStart(2, '0')}h COL`; };
console.log(`Retention per live Short (${since} → ${today}):\n`);
console.log('  style        slot     views  avg%   avgSec  likes  subs  title');
for (const r of rows) {
  const m = meta.get(r.video) ?? {};
  console.log(`  ${(m.style ?? '?').padEnd(12)} ${hourCol(m.publishAt).padEnd(8)} ${String(r.views).padStart(5)}  ${String(Math.round(r.averageViewPercentage)).padStart(3)}%  ${String(r.averageViewDuration).padStart(5)}s  ${String(r.likes).padStart(5)}  ${String(r.subscribersGained).padStart(4)}  ${(m.title ?? r.video).slice(0, 55)}`);
}

// Cohort roll-up
const groups = {};
for (const r of rows) {
  const s = meta.get(r.video)?.style ?? '?';
  (groups[s] ??= []).push(r);
}
const kinds = {};
for (const r of rows) { const k = meta.get(r.video)?.kind; if (k) (kinds[k] ??= []).push(r); }
if (Object.keys(kinds).length) {
  console.log('\nBy kind (story vs concept):');
  for (const [k, rs] of Object.entries(kinds)) { const v = rs.reduce((x, r) => x + r.views, 0); console.log(`  ${k.padEnd(8)} n=${rs.length} views ${v} avg ${(rs.reduce((x, r) => x + r.averageViewPercentage * r.views, 0) / v).toFixed(0)}%`); }
}
console.log('\nBy style (views-weighted avg view %):');
for (const [s, rs] of Object.entries(groups)) {
  const v = rs.reduce((a, r) => a + r.views, 0);
  const pct = rs.reduce((a, r) => a + r.averageViewPercentage * r.views, 0) / v;
  const subs = rs.reduce((a, r) => a + r.subscribersGained, 0);
  console.log(`  ${s.padEnd(12)} n=${rs.length}  views ${v}  avg ${pct.toFixed(0)}%  subs +${subs}`);
}

// Traffic sources for Shorts overall
const traffic = await report({ dimensions: 'insightTrafficSourceType', metrics: 'views,averageViewPercentage', filters: `video==${rows.map((r) => r.video).join(',')}`, sort: '-views' }).catch(() => []);
if (traffic.length) {
  console.log('\nTraffic sources (our Shorts):');
  for (const t of traffic) console.log(`  ${t.insightTrafficSourceType.padEnd(22)} ${String(t.views).padStart(6)} views  avg ${Math.round(t.averageViewPercentage)}%`);
}

// Retention curves (where they leave)
if (CURVES) {
  console.log('\nRetention curves (% of viewers still watching at 0/10/25/50/75/90/100% of the video):');
  for (const r of rows) {
    const c = await report({ dimensions: 'elapsedVideoTimeRatio', metrics: 'audienceWatchRatio', filters: `video==${r.video}`, sort: 'elapsedVideoTimeRatio' }).catch(() => []);
    if (!c.length) continue;
    const at = (x) => { const p = c.reduce((b, k) => (Math.abs(k.elapsedVideoTimeRatio - x) < Math.abs(b.elapsedVideoTimeRatio - x) ? k : b)); return Math.round(p.audienceWatchRatio * 100); };
    const m = meta.get(r.video) ?? {};
    console.log(`  ${(m.style ?? '?').padEnd(12)} ${[0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map((x) => String(at(x)).padStart(3)).join(' ')}   ${(m.title ?? r.video).slice(0, 45)}`);
  }
}
