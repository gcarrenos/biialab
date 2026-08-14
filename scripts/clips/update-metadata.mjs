#!/usr/bin/env node
// Prepends chapters + the biialab.org funnel link to videos' descriptions.
// The original description is ALWAYS preserved below a divider. Titles are
// never changed. Idempotent: skips videos whose description already carries
// the funnel marker.
//
//   node scripts/clips/update-metadata.mjs <chapters.json> \
//     --client-secrets <google-oauth-json>
//
// chapters.json: { "<videoId>": "⏱️ Capítulos:\n00:00 ...", ... }
// Requires the same OAuth refresh token as upload.mjs (.youtube-token.json).

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const chaptersFile = argv.find((a) => !a.startsWith('--'));
const secretsPath = argv.includes('--client-secrets') ? argv[argv.indexOf('--client-secrets') + 1] : null;
if (!chaptersFile || !secretsPath) {
  console.error('Usage: node scripts/clips/update-metadata.mjs <chapters.json> --client-secrets <oauth.json>');
  process.exit(1);
}

const FUNNEL = '🎓 Curso gratis completo con certificado: https://www.biialab.org/?utm_source=youtube&utm_medium=description&utm_campaign=backcatalog';

const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')).installed;
const { refresh_token } = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '.youtube-token.json'), 'utf8'),
);
const chapters = JSON.parse(fs.readFileSync(chaptersFile, 'utf8'));

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: secrets.client_id,
    client_secret: secrets.client_secret,
    refresh_token,
    grant_type: 'refresh_token',
  }),
});
const { access_token } = await tokenRes.json();
if (!access_token) {
  console.error('Token refresh failed.');
  process.exit(1);
}

for (const [id, chapterBlock] of Object.entries(chapters)) {
  const current = await (await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  )).json();
  const snippet = current.items?.[0]?.snippet;
  if (!snippet) { console.log(`${id}: not found, skipping`); continue; }
  if (snippet.description.includes('utm_campaign=backcatalog')) {
    console.log(`${id}: already updated, skipping`);
    continue;
  }

  const safeChapters = chapterBlock.replace(/[<>]/g, '');
  const description = `${FUNNEL}\n\n${safeChapters}\n\n————————————\n${snippet.description}`;
  if (description.length > 4900) {
    console.log(`${id}: SKIP — combined description too long (${description.length})`);
    continue;
  }

  const res = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      snippet: {
        title: snippet.title,               // unchanged
        categoryId: snippet.categoryId,     // unchanged
        defaultAudioLanguage: snippet.defaultAudioLanguage ?? 'es',
        description,
      },
    }),
  });
  if (res.ok) {
    console.log(`${id}: UPDATED (${description.length} chars) — https://youtube.com/watch?v=${id}`);
  } else {
    console.log(`${id}: FAILED ${JSON.stringify(await res.json()).slice(0, 200)}`);
  }
}
