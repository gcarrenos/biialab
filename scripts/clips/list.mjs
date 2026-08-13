#!/usr/bin/env node
// Lists the channel's videos sorted by views — use it to pick which videos to
// turn into Shorts first.
//
//   YOUTUBE_API_KEY=... node scripts/clips/list.mjs [--max 25]
//
// The key is the same read-only YouTube Data API key the site uses. Never
// commit it; pass it via env.

const API = 'https://www.googleapis.com/youtube/v3';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCNV3OUmerDvoj-PQIArnTkw'; // @BiiALAB
const KEY = process.env.YOUTUBE_API_KEY;

if (!KEY) {
  console.error('Set YOUTUBE_API_KEY (YouTube Data API v3 key).');
  process.exit(1);
}

const max = Number(process.argv[process.argv.indexOf('--max') + 1]) || 25;

async function yt(path, params) {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: KEY })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(`YouTube API ${path}: ${data?.error?.message ?? res.status}`);
  return data;
}

const channel = await yt('channels', { part: 'contentDetails', id: CHANNEL_ID });
const uploadsPlaylist = channel.items[0].contentDetails.relatedPlaylists.uploads;

// Walk the uploads playlist, collect all video ids
const videoIds = [];
let pageToken = '';
do {
  const page = await yt('playlistItems', {
    part: 'contentDetails',
    playlistId: uploadsPlaylist,
    maxResults: '50',
    ...(pageToken ? { pageToken } : {}),
  });
  videoIds.push(...page.items.map((i) => i.contentDetails.videoId));
  pageToken = page.nextPageToken ?? '';
} while (pageToken);

// Fetch stats in batches of 50
const videos = [];
for (let i = 0; i < videoIds.length; i += 50) {
  const batch = await yt('videos', {
    part: 'snippet,statistics,contentDetails',
    id: videoIds.slice(i, i + 50).join(','),
  });
  videos.push(...batch.items);
}

videos.sort((a, b) => Number(b.statistics.viewCount) - Number(a.statistics.viewCount));

console.log(`${videos.length} videos on the channel. Top ${max} by views:\n`);
for (const v of videos.slice(0, max)) {
  const views = Number(v.statistics.viewCount).toLocaleString('en-US');
  console.log(`${v.id}  ${views.padStart(12)} views  ${v.contentDetails.duration.padEnd(10)}  ${v.snippet.title}`);
}
console.log('\nNext: node scripts/clips/clip.mjs <videoId>');
