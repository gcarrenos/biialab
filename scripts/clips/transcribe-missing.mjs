#!/usr/bin/env node
// Whisper-transcribes the videos listed in corpus/_missing.json (those with
// no Spanish captions on YouTube) into corpus/<id>.vtt, completing the corpus.
//
//   node scripts/clips/transcribe-missing.mjs
//
// Requires: whisper-cli (brew install whisper-cpp) and the model at
// models/ggml-large-v3-turbo.bin. Roughly 3-5 min per hour of video.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const corpusDir = path.join(here, 'corpus');
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
const missing = JSON.parse(fs.readFileSync(path.join(corpusDir, '_missing.json'), 'utf8'));

if (!fs.existsSync(model)) {
  console.error('Model missing — see README (Whisper fallback section).');
  process.exit(1);
}

console.log(`${missing.length} videos to transcribe.`);
const stillMissing = [];
for (const [i, id] of missing.entries()) {
  const target = path.join(corpusDir, `${id}.vtt`);
  if (fs.existsSync(target)) { console.log(`[${i + 1}/${missing.length}] ${id} cached`); continue; }
  const audio = path.join(corpusDir, `${id}.wav`);
  try {
    console.log(`[${i + 1}/${missing.length}] ${id} downloading audio…`);
    execFileSync('yt-dlp', ['-f', 'bestaudio', '-x', '--audio-format', 'wav',
      '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
      '-o', audio, `https://www.youtube.com/watch?v=${id}`,
    ], { stdio: 'ignore', timeout: 600_000 });
    console.log(`[${i + 1}/${missing.length}] ${id} transcribing…`);
    execFileSync('whisper-cli', ['-m', model, '-f', audio, '-l', 'es', '-ovtt',
      '-of', path.join(corpusDir, id),
    ], { stdio: 'ignore', timeout: 3600_000 });
    console.log(`[${i + 1}/${missing.length}] ${id} done`);
  } catch (error) {
    console.error(`[${i + 1}/${missing.length}] ${id} FAILED: ${String(error).slice(0, 100)}`);
    stillMissing.push(id);
  } finally {
    if (fs.existsSync(audio)) fs.unlinkSync(audio);
  }
}

fs.writeFileSync(path.join(corpusDir, '_missing.json'), JSON.stringify(stillMissing, null, 2));
console.log(`\nDone. ${missing.length - stillMissing.length} transcribed, ${stillMissing.length} failed.`);
