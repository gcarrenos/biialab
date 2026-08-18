#!/usr/bin/env node
// Animated novela episode: consistent AI character (nano-banana-pro on fal),
// each shot animated with Kling i2v, Spanish narration VO, captions, series
// title card + cliffhanger end card. Config-driven:
//
//   FAL_KEY=... node scripts/clips/novela.mjs <config.json> [--dry]
//
// --dry skips fal (uses colour cards) so the VO, timing and captions can be
// previewed for free before spending on images/animation.
// VO: ELEVEN via fal (fal-ai/elevenlabs/tts/multilingual-v2) when available,
// falls back to macOS `say` (voice from config, e.g. Paulina) — good enough to
// preview, and cheap to swap later.
//
// Output: out/novela/<name>/<name>.mp4 (character sheet, shot images and
// animations are cached so re-runs only redo what's missing).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const configFile = argv.find((a) => !a.startsWith('--'));
const FAL_KEY = process.env.FAL_KEY;
if (!configFile || (!DRY && !FAL_KEY)) { console.error('Usage: FAL_KEY=... node novela.mjs <config.json> [--dry]'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'novela', cfg.name);
fs.mkdirSync(outDir, { recursive: true });

const ENC = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-r', '30', '-pix_fmt', 'yuv420p'];
const VF = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30';

async function fal(endpoint, body, timeout = 600_000) {
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
async function download(url, file) {
  const r = await fetch(url);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}
const dataUri = (file) => `data:image/${file.endsWith('.png') ? 'png' : 'jpeg'};base64,` + fs.readFileSync(file).toString('base64');

// ---------------------------------------------------------------- 1. character sheet
const sheet = path.join(outDir, 'character.png');
if (!DRY && !fs.existsSync(sheet)) {
  console.log('1/5 Character sheet (nano-banana-pro)…');
  const d = await fal('fal-ai/nano-banana-pro', {
    prompt: `${cfg.style}. ${cfg.characterSheet}. Character: ${cfg.character}.`,
    aspect_ratio: '9:16', num_images: 1, output_format: 'png',
  }, 240_000);
  await download(d.images[0].url, sheet);
}

// ---------------------------------------------------------------- 2. shots (image via edit w/ reference, then kling)
console.log('2/5 Shots…');
for (const [i, shot] of cfg.shots.entries()) {
  const n = i + 1;
  const img = path.join(outDir, DRY ? `dry-${n}.png` : `shot-${n}.png`);
  const anim = path.join(outDir, DRY ? `dry-${n}.anim.mp4` : `shot-${n}.anim.mp4`);
  if (DRY) {
    if (!fs.existsSync(img)) execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x${['1a1a1a', '2b1d17', '17262b', '2b2517', '1a2b17', '2b1726'][i % 6]}:s=1080x1920:d=1`, '-frames:v', '1', img]);
    continue;
  }
  if (!fs.existsSync(img)) {
    const d = await fal('fal-ai/nano-banana-pro/edit', {
      prompt: `${cfg.style}. Keep the exact same character from the reference image (same face, hair, clothes): ${cfg.character}. Scene: ${shot.prompt}`,
      image_urls: [dataUri(sheet)],
      aspect_ratio: '9:16', num_images: 1, output_format: 'png',
    }, 240_000);
    await download(d.images[0].url, img);
    console.log(`   shot ${n} image ok`);
  }
  if (!fs.existsSync(anim)) {
    console.log(`   shot ${n} animating (kling)…`);
    const d = await fal('fal-ai/kling-video/v2.1/standard/image-to-video', {
      prompt: `cinematic animated film, character and style strictly preserved, ${shot.motion}`,
      image_url: dataUri(img), duration: '5', negative_prompt: 'blur, distort, morph, extra limbs, text',
    });
    await download(d.video?.url ?? d.videos?.[0]?.url, anim);
  }
}

// ---------------------------------------------------------------- 3. narration
console.log('3/5 Narration…');
const voFiles = [];
for (const [i, shot] of cfg.shots.entries()) {
  const f = path.join(outDir, `vo-${i + 1}.wav`);
  if (!fs.existsSync(f)) {
    let done = false;
    if (!DRY && FAL_KEY) {
      try {
        const d = await fal('fal-ai/elevenlabs/tts/eleven-v3', { text: shot.vo, voice: cfg.elevenVoice ?? 'George', stability: 0.5, language_code: 'es' }, 120_000);
        const tmp = path.join(outDir, `vo-${i + 1}.src`);
        await download(d.audio.url, tmp);
        execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-ar', '48000', '-ac', '2', f]);
        fs.unlinkSync(tmp);
        done = true;
      } catch (e) { console.log(`   (elevenlabs unavailable, using say) ${e.message.slice(0, 80)}`); }
    }
    if (!done) {
      const aiff = path.join(outDir, `vo-${i + 1}.aiff`);
      execFileSync('say', ['-v', cfg.voice ?? 'Paulina', '-r', '165', '-o', aiff, shot.vo]);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', aiff, '-ar', '48000', '-ac', '2', f]);
      fs.unlinkSync(aiff);
    }
  }
  voFiles.push(f);
}
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim());
// Each shot lasts max(config dur, VO + 0.6s breathing room)
const shotDur = cfg.shots.map((s, i) => Math.max(s.dur, dur(voFiles[i]) + 0.4));
const TITLE = 2.0, END = 3.5;

// ---------------------------------------------------------------- 4. visuals
console.log('4/5 Visuals…');
const parts = [];
function card(name, seconds, lines) {
  const ass = path.join(outDir, `${name}.ass`);
  fs.writeFileSync(ass, `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Series,Anton,150,&H00144DFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,4,0,1,0,0,5,60,60,0,1
Style: Ep,Archivo Black,48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,5,60,60,-260,1
Style: Small,Archivo Black,40,&H00AAAAAA,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,1,0,1,0,0,2,60,60,120,1
Style: Url,Anton,96,&H00144DFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,5,60,60,-200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`);
  const file = path.join(outDir, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x0d0d0d:s=1080x1920:d=${seconds}`,
    '-vf', `ass=${ass}:fontsdir=${fontsDir}`, '-t', String(seconds), ...ENC, file]);
  parts.push(file);
}
card('card-title', TITLE, [
  `Dialogue: 0,0:00:00.00,0:00:${TITLE.toFixed(2).padStart(5, '0')},Series,,0,0,0,,{\\fad(200,300)}${cfg.series}`,
  `Dialogue: 0,0:00:00.30,0:00:${TITLE.toFixed(2).padStart(5, '0')},Ep,,0,0,0,,{\\fad(200,300)}${cfg.episode}`,
  `Dialogue: 0,0:00:00.60,0:00:${TITLE.toFixed(2).padStart(5, '0')},Small,,0,0,0,,una serie de BiiA LAB`,
]);
cfg.shots.forEach((shot, i) => {
  const n = i + 1, d = shotDur[i];
  const anim = path.join(outDir, DRY ? 'none' : `shot-${n}.anim.mp4`), img = path.join(outDir, DRY ? `dry-${n}.png` : `shot-${n}.png`);
  const clip = path.join(outDir, `shot-${n}.mp4`);
  if (fs.existsSync(anim)) {
    const factor = d / 5;
    if (factor <= 1.6) {
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', anim, '-vf', `setpts=${factor.toFixed(4)}*PTS,${VF}`, '-t', String(d), '-an', ...ENC, clip]);
    } else {
      // hold the last frame instead of over-slowing
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', anim, '-vf', `setpts=1.6*PTS,${VF},tpad=stop_mode=clone:stop_duration=${(d - 8).toFixed(2)}`, '-t', String(d), '-an', ...ENC, clip]);
    }
  } else {
    const frames = Math.round(d * 30);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-t', String(d), '-i', img,
      '-vf', `scale=-2:3840,crop=2160:3840,zoompan=z='min(1+0.10*on/${frames},1.10)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1080x1920:fps=30`, '-an', ...ENC, clip]);
  }
  parts.push(clip);
});
card('card-end', END, [
  `Dialogue: 0,0:00:00.00,0:00:${END.toFixed(2).padStart(5, '0')},Ep,,0,0,0,,{\\fad(200,300)}CONTINUARÁ`,
  `Dialogue: 0,0:00:00.40,0:00:${END.toFixed(2).padStart(5, '0')},Url,,0,0,0,,{\\fad(200,300)}biialab.org`,
  `Dialogue: 0,0:00:00.80,0:00:${END.toFixed(2).padStart(5, '0')},Small,,0,0,0,,cursos gratis con certificado`,
]);
const listFile = path.join(outDir, 'concat.txt');
fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
const visual = path.join(outDir, 'visual.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', visual]);

// ---------------------------------------------------------------- 5. audio + captions + mux
console.log('5/5 Mix + captions…');
// VO placed at each shot's start (+0.3s), silence elsewhere; soft room tone.
let t = TITLE;
const inputs = [], delays = [];
const assTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; };
const capLines = [];
cfg.shots.forEach((shot, i) => {
  const start = t + 0.3, voLen = dur(voFiles[i]);
  inputs.push('-i', voFiles[i]);
  delays.push(`[${i}:a]adelay=${Math.round(start * 1000)}|${Math.round(start * 1000)}[v${i}]`);
  // captions: split VO text into ~5-word chunks spread across the VO duration
  const words = shot.vo.replace(/[{}]/g, '').split(/\s+/);
  const per = 5, chunks = [];
  for (let w = 0; w < words.length; w += per) chunks.push(words.slice(w, w + per).join(' '));
  const each = voLen / chunks.length;
  chunks.forEach((c, k) => capLines.push(`Dialogue: 0,${assTime(start + k * each)},${assTime(start + (k + 1) * each)},Caption,,0,0,0,,${c}`));
  t += shotDur[i];
});
const total = t + END;
const mixed = path.join(outDir, 'audio.m4a');
execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs,
  '-f', 'lavfi', '-t', String(total), '-i', 'anoisesrc=color=brown:amplitude=0.006:r=48000',
  '-filter_complex', `${delays.join(';')};[${cfg.shots.length}:a]aformat=channel_layouts=stereo[bed];${delays.map((_, i) => `[v${i}]`).join('')}[bed]amix=inputs=${cfg.shots.length + 1}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5[out]`,
  '-map', '[out]', '-t', String(total), '-c:a', 'aac', '-ar', '48000', mixed]);

const ass = path.join(outDir, 'captions.ass');
fs.writeFileSync(ass, `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Archivo Black,60,&H00FFFFFF,&H00FFFFFF,&H001A1A1A,&HA0000000,0,0,0,0,100,100,0,0,1,5,2,2,80,80,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${capLines.join('\n')}
`);
const finalFile = path.join(outDir, `${cfg.name}${DRY ? '.dry' : ''}.mp4`);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', visual, '-i', mixed, '-vf', `ass=${ass}:fontsdir=${fontsDir}`,
  '-map', '0:v', '-map', '1:a', '-shortest', ...ENC, '-c:a', 'copy', finalFile]);

fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify([{
  file: path.basename(finalFile), sourceVideoId: 'novela', start: 0, end: Math.round(total),
  title: cfg.title, description: cfg.description, style: 'novela', syntheticMedia: true,
}], null, 2));
console.log(`Done: ${finalFile}  (${total.toFixed(1)}s)`);
