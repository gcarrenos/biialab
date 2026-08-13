#!/usr/bin/env node
// AI character Short: recurring 3D character delivering a scripted topic in
// per-scene text-to-video generations with native voice + lip-sync (Veo via
// fal), concatenated and captioned in the house style.
//
//   FAL_KEY=... node scripts/clips/character.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error('Set FAL_KEY.'); process.exit(1); }

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'character-catrin');
const model = path.join(here, 'models', 'ggml-large-v3-turbo.bin');
fs.mkdirSync(outDir, { recursive: true });

// The recurring character — this exact description repeats in EVERY prompt;
// that repetition is what keeps him consistent across scenes.
const CATRIN =
  'a friendly stylized 3D animated skeleton character in Día de los Muertos catrín style, ' +
  'polished ivory bone skull with subtle elegant black floral face-paint around the eye sockets, ' +
  'expressive animated eye glow, wearing a black beanie and a bright orange t-shirt, ' +
  'photorealistic render quality, warm cinematic lighting';

const VOICE = 'He speaks natural Latin American Spanish, energetic charismatic young male voice, clear lip sync.';

const SCENES = [
  {
    prompt: `${CATRIN}, sitting at a modern warm kitchen table, leaning toward the camera like a vlogger filming himself. ${VOICE} He says: "¿Sabías que TODO lo que compras... lo compras por miedo? Todo. Y te lo voy a probar."`,
  },
  {
    prompt: `${CATRIN}, walking down a sunny city street holding the camera selfie-style, gesturing with his bony hand. ${VOICE} He says: "¿Ese carro nuevo? Miedo a verte menos que los demás. ¿Esa ropa de marca? Miedo a no encajar."`,
  },
  {
    prompt: `${CATRIN}, close-up in the kitchen, tapping his skull with one bony finger, raising a brow ridge knowingly. ${VOICE} He says: "Tu cerebro no compra productos. Compra tranquilidad. Así funciona la mente."`,
  },
  {
    prompt: `${CATRIN}, back at the kitchen table, pointing directly at the camera with a confident grin. ${VOICE} He says: "Aprende a venderle a la mente, no a la gente. Cursos gratis en biialab punto org. ¡Nos vemos!"`,
  },
];

const ENDPOINTS = ['fal-ai/veo3/fast', 'fal-ai/veo3.1/fast', 'fal-ai/veo3'];

async function generateScene(prompt, file) {
  let lastErr;
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`https://fal.run/${ep}`, {
        method: 'POST',
        headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspect_ratio: '9:16', duration: '8s', generate_audio: true }),
        signal: AbortSignal.timeout(900_000),
      });
      const data = await res.json();
      if (!res.ok) { lastErr = JSON.stringify(data).slice(0, 200); continue; }
      const url = data.video?.url ?? data.videos?.[0]?.url;
      if (!url) { lastErr = JSON.stringify(data).slice(0, 200); continue; }
      const v = await fetch(url);
      fs.writeFileSync(file, Buffer.from(await v.arrayBuffer()));
      console.log(`   ok via ${ep}`);
      return;
    } catch (error) {
      lastErr = String(error).slice(0, 200);
    }
  }
  throw new Error(`all endpoints failed: ${lastErr}`);
}

console.log('1/3 Generating scenes…');
for (const [i, scene] of SCENES.entries()) {
  const file = path.join(outDir, `scene-${i + 1}.mp4`);
  if (!fs.existsSync(file)) {
    console.log(`   scene ${i + 1}/${SCENES.length}…`);
    await generateScene(scene.prompt, file);
  }
}

console.log('2/3 Concatenating…');
const parts = [];
SCENES.forEach((_, i) => {
  const src = path.join(outDir, `scene-${i + 1}.mp4`);
  const norm = path.join(outDir, `scene-${i + 1}.norm.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-pix_fmt', 'yuv420p', norm]);
  parts.push(norm);
});
const listFile = path.join(outDir, 'concat.txt');
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
const joined = path.join(outDir, 'joined.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', joined]);

console.log('3/3 Captions…');
function parseTime(t) { const [h, m, s] = t.split(':'); return +h * 3600 + +m * 60 + +s.replace(',', '.'); }
function assTime(sec) { const s = Math.max(0, sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; }
const wav = path.join(outDir, 'audio.wav');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', joined, '-vn', '-ar', '16000', '-ac', '1', wav]);
execFileSync('whisper-cli', ['-m', model, '-f', wav, '-l', 'es', '-ml', '22', '-sow', '-ovtt', '-of', path.join(outDir, 'captions')], { stdio: 'ignore' });
fs.unlinkSync(wav);
const totalDur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', joined], { encoding: 'utf8' }).trim());
const vtt = fs.readFileSync(path.join(outDir, 'captions.vtt'), 'utf8');
const chunks = [];
for (const block of vtt.split(/\n\n+/)) {
  const m = block.match(/([\d:.]+) --> ([\d:.]+)/);
  if (!m) continue;
  const t = block.slice(block.indexOf('\n') + 1).replace(/\s+/g, ' ').trim();
  if (t) {
    // Whisper writes the spoken URL phonetically — normalize every variant
    const clean = t.replace(/[{}]/g, '')
      .replace(/(b[ií]+a?\s*-?\s*lab|v[ií]a\s*lab|bialab|biialab)[\s.,]*(punto|\.)\s*org/gi, 'biialab.org');
    chunks.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: clean });
  }
}
const assFile = path.join(outDir, 'overlay.ass');
fs.writeFileSync(assFile, `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Accent,Permanent Marker,52,&H001AD9FF,&H00FFFFFF,&H001A1A1A,&H001A1A1A,0,0,0,0,100,100,0,3,1,4,0,8,70,70,120,1
Style: Caption,Archivo Black,66,&H00FFFFFF,&H00FFFFFF,&H001A1A1A,&HA0000000,0,0,0,0,100,100,0,0,1,6,2,2,70,70,300,1
Style: Url,Anton,92,&H00144DFF,&H00FFFFFF,&H00FFFFFF,&H641A1A1A,0,0,0,0,100,100,1,0,1,7,3,2,60,60,520,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 2,0:00:00.00,0:00:04.00,Accent,,0,0,0,,{\\fad(100,150)\\frz-3}El Catrín de BiiA LAB
Dialogue: 2,${assTime(Math.max(0, totalDur - 5))},${assTime(totalDur)},Url,,0,0,0,,{\\fad(200,0)}biialab.org
` + chunks.map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${c.text}`).join('\n') + '\n');

const final = path.join(outDir, 'catrin-miedo.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', joined,
  '-vf', `ass=${assFile}:fontsdir=${fontsDir}`,
  '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', final]);
console.log(`Done: ${final}`);
