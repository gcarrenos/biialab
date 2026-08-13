#!/usr/bin/env node
// Performance report for every Short in the ledger, grouped by style cohort
// (clean vs captioned vs comic). Views/likes/comments via the YouTube Data
// API. Retention ("viewed vs swiped away") is only in Studio — this report
// covers the public metrics and flags what's live vs still scheduled.
//
//   YOUTUBE_API_KEY=... node scripts/clips/stats.mjs

import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.error('Set YOUTUBE_API_KEY.'); process.exit(1); }

const ledger = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'ledger.json'), 'utf8'));
const ids = ledger.uploads.map((u) => u.youtubeId);

const res = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?part=statistics,status,snippet&id=${ids.join(',')}&key=${KEY}`,
);
const data = await res.json();
if (!res.ok) { console.error(data?.error?.message); process.exit(1); }
const byId = new Map(data.items.map((v) => [v.id, v]));

const cohorts = {};
console.log('Per Short:\n');
for (const u of ledger.uploads) {
  const v = byId.get(u.youtubeId);
  if (!v) {
    // scheduled/private videos are invisible to API-key reads
    console.log(`  [${u.style.padEnd(9)}]       scheduled ${String(u.publishAt).slice(0, 10).padEnd(32)} ${u.title.slice(0, 60)}`);
    continue;
  }
  const live = v.status.privacyStatus === 'public';
  const views = Number(v.statistics.viewCount ?? 0);
  const likes = Number(v.statistics.likeCount ?? 0);
  const comments = Number(v.statistics.commentCount ?? 0);
  const status = live ? `${views.toLocaleString('en-US')} views · ${likes} likes · ${comments} comments`
    : `scheduled ${u.publishAt.slice(0, 10)}`;
  console.log(`  [${u.style.padEnd(9)}] ${live ? 'LIVE ' : '     '} ${status.padEnd(42)} ${u.title.slice(0, 60)}`);
  if (live) {
    cohorts[u.style] ??= { n: 0, views: 0, likes: 0, comments: 0 };
    cohorts[u.style].n++;
    cohorts[u.style].views += views;
    cohorts[u.style].likes += likes;
    cohorts[u.style].comments += comments;
  }
}

console.log('\nStyle cohorts (live Shorts only):\n');
for (const [style, c] of Object.entries(cohorts)) {
  console.log(`  ${style.padEnd(10)} n=${c.n}  avg views ${Math.round(c.views / c.n).toLocaleString('en-US')}  avg likes ${(c.likes / c.n).toFixed(1)}  like-rate ${(c.views ? (100 * c.likes / c.views) : 0).toFixed(2)}%`);
}
console.log('\nRetention (viewed vs swiped away) lives in Studio → Content → Shorts.');
