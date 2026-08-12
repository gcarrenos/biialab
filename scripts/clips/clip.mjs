#!/usr/bin/env node
// Turns one long BiiALAB video into N vertical Shorts with burned-in captions.
//
//   ANTHROPIC_API_KEY=... node scripts/clips/clip.mjs <videoIdOrUrl> [--max 5]
//
// Pipeline: yt-dlp (Spanish auto-subs + 720p video) → Claude Opus 5 picks the
// most viral-worthy moments and writes Spanish hooks/titles → ffmpeg cuts each
// clip to 9:16 (blurred pad) and burns the captions.
//
// Requires: yt-dlp, ffmpeg on PATH. Anthropic credentials via ANTHROPIC_API_KEY
// or an `ant auth login` profile. Output: scripts/clips/out/<videoId>/.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const argv = process.argv.slice(2);
const input = argv.find((a) => !a.startsWith('--'));
if (!input) {
  console.error('Usage: node scripts/clips/clip.mjs <videoIdOrUrl> [--max 5]');
  process.exit(1);
}
const maxClips = Number(argv[argv.indexOf('--max') + 1]) || 5;
const videoId = input.includes('http') ? new URL(input).searchParams.get('v') ?? input.split('/').pop() : input;
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

for (const bin of ['yt-dlp', 'ffmpeg']) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
  } catch {
    console.error(`${bin} not found. Install with: brew install ${bin}`);
    process.exit(1);
  }
}

const outDir = path.join(import.meta.dirname, 'out', videoId);
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- subtitles
console.log('1/4 Downloading Spanish subtitles…');
execFileSync('yt-dlp', [
  '--skip-download',
  '--write-sub', '--write-auto-sub',
  '--sub-lang', 'es,es-419,es-orig',
  '--sub-format', 'vtt',
  '-o', path.join(outDir, 'source'),
  videoUrl,
], { stdio: 'inherit' });

let vttFile = fs.readdirSync(outDir).find((f) => f.endsWith('.vtt'));
if (!vttFile) {
  // Whisper fallback: extract audio and transcribe locally (whisper.cpp).
  // Model: scripts/clips/models/ggml-large-v3-turbo.bin (see README).
  const model = path.join(import.meta.dirname, 'models', 'ggml-large-v3-turbo.bin');
  let whisperBin = null;
  for (const bin of ['whisper-cli', 'whisper-cpp']) {
    try { execFileSync('which', [bin], { stdio: 'ignore' }); whisperBin = bin; break; } catch {}
  }
  if (!whisperBin || !fs.existsSync(model)) {
    console.error('No Spanish captions on this video and no local Whisper available.');
    console.error('Install: brew install whisper-cpp, then download the model per scripts/clips/README.md');
    process.exit(1);
  }
  console.log('   No captions on YouTube — transcribing locally with Whisper (a few minutes)…');
  const audio = path.join(outDir, 'audio.wav');
  execFileSync('yt-dlp', ['-f', 'bestaudio', '-x', '--audio-format', 'wav',
    '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1', '-o', audio, videoUrl], { stdio: 'ignore' });
  execFileSync(whisperBin, ['-m', model, '-f', audio, '-l', 'es', '-ovtt',
    '-of', path.join(outDir, 'source.whisper')], { stdio: 'ignore' });
  fs.unlinkSync(audio);
  vttFile = 'source.whisper.vtt';
}

// Parse VTT → [{start, end, text}] in seconds
function parseTime(t) {
  const [h, m, s] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s.replace(',', '.'));
}
const cues = [];
const vtt = fs.readFileSync(path.join(outDir, vttFile), 'utf8');
for (const block of vtt.split(/\n\n+/)) {
  const match = block.match(/([\d:.]+) --> ([\d:.]+)/);
  if (!match) continue;
  const text = block
    .slice(block.indexOf('\n') + 1)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) continue;
  const cue = { start: parseTime(match[1]), end: parseTime(match[2]), text };
  // auto-subs repeat lines across cues; keep only new text
  if (cues.length === 0 || !cues[cues.length - 1].text.includes(text)) cues.push(cue);
}
console.log(`   ${cues.length} caption cues parsed.`);

// ------------------------------------------------- most-replayed heatmap
// YouTube's "most replayed" graph is embedded in the public watch page and
// yt-dlp exposes it as `heatmap` (100 segments, value 0..1). Real audience
// data on which moments people rewind to — the strongest clip signal we have.
let heatPeaks = [];
try {
  const info = JSON.parse(execFileSync('yt-dlp', ['--skip-download', '--dump-json', videoUrl],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));
  if (Array.isArray(info.heatmap) && info.heatmap.length > 0) {
    heatPeaks = [...info.heatmap]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .sort((a, b) => a.start_time - b.start_time)
      .map((h) => ({ start: Math.round(h.start_time), end: Math.round(h.end_time), value: Number(h.value.toFixed(3)) }));
    console.log('   Most-replayed peaks (audience data):');
    for (const h of heatPeaks) console.log(`     ${h.start}s-${h.end}s  intensity ${h.value}`);
  }
} catch { /* heatmap is best-effort — not all videos have one */ }

// ------------------------------------------------------------- pick moments
// --plan <file> skips the Claude call and uses a pre-curated selection
// (same shape as the model output: {clips: [{start_seconds, end_seconds,
// title, description, hook}]}). Useful for hand-picked batches or when no
// API credentials are available.
const planFile = argv.includes('--plan') ? argv[argv.indexOf('--plan') + 1] : null;

const clips = planFile ? loadPlan() : await pickWithClaude();

function loadPlan() {
  console.log(`2/4 Using curated plan ${planFile}…`);
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  if (!Array.isArray(plan.clips) || plan.clips.length === 0) {
    console.error('Plan file must contain {clips: [...]}.');
    process.exit(1);
  }
  return plan.clips;
}

async function pickWithClaude() {
console.log('2/4 Asking Claude to pick the best moments…');
const transcript = cues.map((c) => `[${Math.round(c.start)}s] ${c.text}`).join('\n');

const client = new Anthropic();
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['clips'],
  properties: {
    clips: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['start_seconds', 'end_seconds', 'title', 'description', 'hook'],
        properties: {
          start_seconds: { type: 'integer', description: 'Clip start, at a natural sentence boundary' },
          end_seconds: { type: 'integer', description: 'Clip end; 30-60s after start' },
          title: { type: 'string', description: 'YouTube Shorts title in Spanish, <90 chars, high CTR, no clickbait falso' },
          description: { type: 'string', description: 'Spanish description, 2-3 lines, ends with hashtags' },
          hook: { type: 'string', description: 'One-line hook in Spanish shown as on-screen text, <60 chars' },
        },
      },
    },
  },
};

const response = await client.messages.stream({
  model: 'claude-opus-5',
  max_tokens: 16000,
  system:
    'Eres editor de video para BiiA LAB, el canal de Jürgen Klarić (neuroventas, ' +
    'neuromarketing, desarrollo personal). Seleccionas momentos de videos largos que ' +
    'funcionan como Shorts virales: ideas contraintuitivas, frases citables, historias ' +
    'con giro, consejos accionables. Cada clip debe sostenerse solo, empezar en una ' +
    'frase completa con gancho inmediato y durar 30-60 segundos.',
  messages: [{
    role: 'user',
    content:
      `Transcripción con marcas de tiempo del video ${videoUrl}:\n\n${transcript}\n\n` +
      (heatPeaks.length
        ? 'DATOS REALES DE AUDIENCIA — los momentos más re-vistos del video según YouTube ' +
          '(prioriza clips que se solapen con estos picos, especialmente los de mayor intensidad):\n' +
          heatPeaks.map((h) => `  ${h.start}s-${h.end}s (intensidad ${h.value})`).join('\n') + '\n\n'
        : '') +
      `Elige los ${maxClips} mejores momentos para Shorts. Los tiempos deben caer en límites ` +
      'de frase según las marcas. En cada descripción incluye "Curso gratis completo en https://www.biialab.org".',
  }],
  output_config: { format: { type: 'json_schema', schema } },
}).finalMessage();

if (response.stop_reason === 'refusal') {
  console.error('Model declined the request:', response.stop_details?.explanation ?? '');
  process.exit(1);
}
return JSON.parse(response.content.find((b) => b.type === 'text').text).clips;
}

console.log(`   ${clips.length} clips selected.`);

// ------------------------------------------------------------------- video
console.log('3/4 Downloading video (720p)…');
const videoFile = path.join(outDir, 'source.mp4');
if (!fs.existsSync(videoFile)) {
  execFileSync('yt-dlp', [
    '-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
    '--merge-output-format', 'mp4',
    '-o', videoFile,
    videoUrl,
  ], { stdio: 'inherit' });
}

// -------------------------------------------------------------------- cuts
// Text rendering needs libass (ffmpeg from the homebrew-ffmpeg tap; the core
// formula dropped it). When available, each clip gets:
//   - the hook line: big yellow text, top of frame, first 3 seconds
//   - word-tight captions: Whisper re-transcribes the clip's own audio into
//     short chunks (proper punctuation, no [__] censoring)
// Without libass, clips are cut clean and per-clip .srt files remain.
// Skip text entirely with --no-text (A/B testing).
const noText = argv.includes('--no-text');
const hasLibass = (() => {
  try {
    return execFileSync('ffmpeg', ['-hide_banner', '-filters'], { encoding: 'utf8' })
      .split('\n').some((l) => /\bass\b/.test(l));
  } catch {
    return false;
  }
})();
const whisperModel = path.join(import.meta.dirname, 'models', 'ggml-large-v3-turbo.bin');
const hasWhisper = fs.existsSync(whisperModel) && (() => {
  try { execFileSync('which', ['whisper-cli'], { stdio: 'ignore' }); return true; } catch { return false; }
})();
const renderText = !noText && hasLibass;
if (!noText && !hasLibass) {
  console.log('   NOTE: this ffmpeg lacks libass — cutting without on-screen text. Install: brew install homebrew-ffmpeg/ffmpeg/ffmpeg');
}
console.log(`4/4 Cutting vertical clips${renderText ? ' with hook + captions' : ''}…`);

function srtTime(sec) {
  const d = new Date(Math.max(0, sec) * 1000);
  return d.toISOString().slice(11, 23).replace('.', ',');
}
function assTime(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
}
const assEscape = (t) => t.replace(/[{}\\]/g, '').replace(/\n/g, '\\N');

// Two-style ASS track rendered with the bundled display fonts (fonts/):
//   Hook — Anton, uppercase, yellow, top of frame, first 3s, slight pop-in
//   Caption — Archivo Black, white with heavy outline + soft shadow
const fontsDir = path.join(import.meta.dirname, 'fonts');
function buildAss(hook, chunks) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Anton,78,&H0000E8FF,&H00FFFFFF,&H00000000,&HA0000000,0,0,0,0,100,100,1,0,1,5,2,8,70,70,280,1
Style: Caption,Archivo Black,58,&H00FFFFFF,&H00FFFFFF,&H00000000,&HA0000000,0,0,0,0,100,100,0,0,1,5,2,2,70,70,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = [];
  if (hook) {
    // \fad pop-in + uppercase — the standard Shorts hook treatment
    lines.push(`Dialogue: 1,0:00:00.00,0:00:03.20,Hook,,0,0,0,,{\\fad(120,200)}${assEscape(hook.toUpperCase())}`);
  }
  for (const c of chunks) {
    lines.push(`Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${assEscape(c.text)}`);
  }
  return header + lines.join('\n') + '\n';
}

// Whisper the clip's own audio into short caption chunks (clip-local timing).
// -ml 24 caps segment length so captions come out 2-5 words at a time.
function whisperChunks(clipVideo, n) {
  const wav = path.join(outDir, `clip-${n}.wav`);
  const prefix = path.join(outDir, `clip-${n}.whisper`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', clipVideo, '-vn', '-ar', '16000', '-ac', '1', wav]);
  execFileSync('whisper-cli', ['-m', whisperModel, '-f', wav, '-l', 'es', '-ml', '24', '-sow', '-ovtt', '-of', prefix], { stdio: 'ignore' });
  fs.unlinkSync(wav);
  const text = fs.readFileSync(`${prefix}.vtt`, 'utf8');
  fs.unlinkSync(`${prefix}.vtt`);
  const chunks = [];
  for (const block of text.split(/\n\n+/)) {
    const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
    if (!m) continue;
    const t = block.slice(block.indexOf('\n') + 1).replace(/\s+/g, ' ').trim();
    if (t) chunks.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: t });
  }
  return chunks;
}

const metadata = [];
clips.forEach((clip, i) => {
  const n = i + 1;
  const clipFile = path.join(outDir, `clip-${n}.mp4`);
  const srtFile = path.join(outDir, `clip-${n}.srt`);

  // Per-clip SRT from the source transcript (upload as YouTube closed captions)
  const clipCues = cues.filter((c) => c.end > clip.start_seconds && c.start < clip.end_seconds);
  fs.writeFileSync(srtFile, clipCues.map((c, j) =>
    `${j + 1}\n${srtTime(c.start - clip.start_seconds)} --> ${srtTime(c.end - clip.start_seconds)}\n${c.text}\n`
  ).join('\n'));

  // Pass 1 — clean 9:16 cut: blurred pad + centered video
  const baseFilter =
    '[0:v]split[bg][fg];' +
    '[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20[bgb];' +
    '[fg]scale=1080:-2[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2';
  const rawFile = renderText ? path.join(outDir, `clip-${n}.raw.mp4`) : clipFile;
  execFileSync('ffmpeg', [
    '-y', '-ss', String(clip.start_seconds), '-to', String(clip.end_seconds),
    '-i', videoFile, '-vf', baseFilter,
    '-c:a', 'aac', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21',
    rawFile,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  // Pass 2 — burn hook + captions
  if (renderText) {
    const chunks = hasWhisper
      ? whisperChunks(rawFile, n)
      : clipCues.map((c) => ({ start: c.start - clip.start_seconds, end: c.end - clip.start_seconds, text: c.text }));
    const assFile = path.join(outDir, `clip-${n}.ass`);
    fs.writeFileSync(assFile, buildAss(clip.hook, chunks));
    execFileSync('ffmpeg', [
      '-y', '-i', rawFile, '-vf', `ass=${assFile}:fontsdir=${fontsDir}`,
      '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21',
      clipFile,
    ], { stdio: ['ignore', 'ignore', 'inherit'] });
    fs.unlinkSync(rawFile);
  }

  metadata.push({
    file: path.basename(clipFile),
    sourceVideo: videoUrl,
    start: clip.start_seconds,
    end: clip.end_seconds,
    title: clip.title,
    description: `${clip.description}\n\nVideo completo: ${videoUrl}`,
    hook: clip.hook,
  });
  console.log(`   clip-${n}.mp4  [${clip.start_seconds}s-${clip.end_seconds}s]  ${clip.title}`);
});

fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
console.log(`\nDone. Output in ${outDir}`);
console.log('Upload with: node scripts/clips/upload.mjs ' + videoId);
