#!/usr/bin/env node
// Downloads Spanish captions for EVERY video on the channel into
// scripts/clips/corpus/<videoId>.vtt and reports which videos have none.
// The corpus feeds clip generation, ebooks, chapters, and the RAG knowledge
// base — run once, keep forever (gitignored; ~100MB total).
//
//   YOUTUBE_API_KEY=... node scripts/clips/sweep-captions.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://www.googleapis.com/youtube/v3';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCNV3OUmerDvoj-PQIArnTkw';
const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) {
  console.error('Set YOUTUBE_API_KEY.');
  process.exit(1);
}

const corpusDir = path.join(import.meta.dirname, 'corpus');
fs.mkdirSync(corpusDir, { recursive: true });

async function yt(p, params) {
  const res = await fetch(`${API}/${p}?${new URLSearchParams({ ...params, key: KEY })}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`YouTube ${p}: ${data?.error?.message}`);
  return data;
}

const ch = await yt('channels', { part: 'contentDetails', id: CHANNEL_ID });
const uploads = ch.items[0].contentDetails.relatedPlaylists.uploads;
const ids = [];
let page = '';
do {
  const r = await yt('playlistItems', {
    part: 'contentDetails', playlistId: uploads, maxResults: '50',
    ...(page ? { pageToken: page } : {}),
  });
  ids.push(...r.items.map((i) => i.contentDetails.videoId));
  page = r.nextPageToken ?? '';
} while (page);

console.log(`${ids.length} videos. Sweeping captions…`);
const missing = [];
let done = 0;
for (const id of ids) {
  done++;
  const target = path.join(corpusDir, `${id}.vtt`);
  if (fs.existsSync(target)) { console.log(`[${done}/${ids.length}] ${id} cached`); continue; }
  try {
    execFileSync('yt-dlp', [
      '--skip-download', '--write-sub', '--write-auto-sub',
      '--sub-lang', 'es,es-419,es-orig', '--sub-format', 'vtt',
      '-o', path.join(corpusDir, id),
      `https://www.youtube.com/watch?v=${id}`,
    ], { stdio: 'ignore', timeout: 120_000 });
  } catch { /* fall through to the existence check */ }

  // yt-dlp names files <id>.<lang>.vtt — normalize the best one to <id>.vtt
  const candidates = fs.readdirSync(corpusDir).filter((f) => f.startsWith(id + '.') && f.endsWith('.vtt'));
  const preferred = ['es.vtt', 'es-419.vtt', 'es-orig.vtt']
    .map((suffix) => `${id}.${suffix}`)
    .find((name) => candidates.includes(name)) ?? candidates[0];
  if (preferred) {
    fs.renameSync(path.join(corpusDir, preferred), target);
    for (const extra of candidates) {
      const p = path.join(corpusDir, extra);
      if (extra !== preferred && fs.existsSync(p)) fs.unlinkSync(p);
    }
    console.log(`[${done}/${ids.length}] ${id} ok`);
  } else {
    missing.push(id);
    console.log(`[${done}/${ids.length}] ${id} NO CAPTIONS`);
  }
  await new Promise((r) => setTimeout(r, 1500)); // be gentle with YouTube
}

fs.writeFileSync(path.join(corpusDir, '_missing.json'), JSON.stringify(missing, null, 2));
console.log(`\nDone. ${ids.length - missing.length}/${ids.length} have captions.`);
console.log(`${missing.length} need Whisper — listed in corpus/_missing.json`);
