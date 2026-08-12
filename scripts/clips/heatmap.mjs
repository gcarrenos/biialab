#!/usr/bin/env node
// Prints YouTube's "most replayed" graph for a video as a terminal chart.
// No API key needed — the heatmap is embedded in the public watch page.
//
//   node scripts/clips/heatmap.mjs <videoIdOrUrl>

import { execFileSync } from 'node:child_process';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/clips/heatmap.mjs <videoIdOrUrl>');
  process.exit(1);
}
const videoId = input.includes('http') ? new URL(input).searchParams.get('v') ?? input.split('/').pop() : input;

const info = JSON.parse(execFileSync('yt-dlp', [
  '--skip-download', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`,
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));

if (!Array.isArray(info.heatmap) || info.heatmap.length === 0) {
  console.log(`No replay heatmap available for "${info.title}" (needs enough views/watch time).`);
  process.exit(0);
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
console.log(`${info.title}\n${Number(info.view_count).toLocaleString('en-US')} views · ${fmt(info.duration)}\n`);

const WIDTH = 50;
for (const seg of info.heatmap) {
  const bar = '█'.repeat(Math.max(1, Math.round(seg.value * WIDTH)));
  const mark = seg.value >= 0.5 ? '  ◀ PEAK' : '';
  console.log(`${fmt(seg.start_time).padStart(7)}  ${bar}${mark}`);
}

const top = [...info.heatmap].sort((a, b) => b.value - a.value).slice(0, 5)
  .sort((a, b) => a.start_time - b.start_time);
console.log('\nTop 5 most-replayed (clip candidates):');
for (const h of top) console.log(`  ${fmt(h.start_time)}-${fmt(h.end_time)}  intensity ${h.value.toFixed(2)}`);
