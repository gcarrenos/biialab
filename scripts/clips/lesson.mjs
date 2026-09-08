#!/usr/bin/env node
// 16:9 course lesson: animated cold open (doña Carmen, Gemini image + Veo, same
// character sheet as the Shorts), a REAL phone-screen recording from the iOS
// Simulator composed centre-frame with side panels (step label left, doña
// Carmen + captions right), a recap card and an outro card. Rada narration.
//
//   GEMINI_API_KEY=... ELEVEN_API_KEY=... node scripts/clips/lesson.mjs <config.json> --google
//   node scripts/clips/lesson.mjs <config.json> --dry [--real-vo]
//
// Inputs in out/lesson/<name>/: character.png (copy the pilot's), screen.mp4 +
// marks.json (from lesson-record.sh). --dry uses colour cards for anything
// missing so timing/captions/layout can be checked for free.
// Output: out/lesson/<name>/<name>.mp4 (1920x1080, 30fps) + metadata.json.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const REAL_VO = argv.includes('--real-vo');
const GOOGLE = argv.includes('--google');
const configFile = argv.find((a) => !a.startsWith('--'));
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!configFile || (!DRY && !GOOGLE) || (GOOGLE && !GEMINI_KEY)) {
  console.error('Usage: GEMINI_API_KEY=... node lesson.mjs <config.json> --google | node lesson.mjs <config.json> --dry [--real-vo]');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'lesson', cfg.name);
fs.mkdirSync(outDir, { recursive: true });
const W = 1920, H = 1080, FPS = 30;
const ENC = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-r', String(FPS), '-pix_fmt', 'yuv420p'];
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args]);
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim());
const b64 = (file) => fs.readFileSync(file).toString('base64');

// ---------------------------------------------------------------- Gemini (images) + Veo, 16:9
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const gHeaders = { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' };
async function geminiImage(prompt, outFile, refFile) {
  const parts = [{ text: prompt }];
  if (refFile) parts.push({ inline_data: { mime_type: 'image/png', data: b64(refFile) } });
  let lastErr;
  for (const model of ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']) {
    const res = await fetch(`${GEMINI}/models/${model}:generateContent`, {
      method: 'POST', headers: gHeaders, signal: AbortSignal.timeout(240_000),
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } } }),
    });
    const data = await res.json();
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (res.ok && img) { fs.writeFileSync(outFile, Buffer.from(img.inlineData.data, 'base64')); return model; }
    lastErr = JSON.stringify(data).slice(0, 300);
  }
  throw new Error(`gemini image: ${lastErr}`);
}
async function veoAnimate(prompt, imgFile, outFile) {
  let lastErr;
  const ladder = ['veo-3.1-fast-generate-preview', 'veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'];
  for (const [attempt, model] of ladder.entries()) {
    if (attempt === 1) {
      if (!/429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|quota|rate/i.test(lastErr ?? '')) continue;
      console.log(`   ${model} transient error, retrying in 20s…`);
      await new Promise((r) => setTimeout(r, 20_000));
    }
    const start = await fetch(`${GEMINI}/models/${model}:predictLongRunning`, {
      method: 'POST', headers: gHeaders, signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        instances: [{ prompt, image: { bytesBase64Encoded: b64(imgFile), mimeType: 'image/png' } }],
        parameters: { aspectRatio: '16:9', resolution: '720p', durationSeconds: 8, negativePrompt: 'blur, distort, morph, extra limbs, text' },
      }),
    });
    const op = await start.json();
    if (!start.ok || !op.name) { lastErr = JSON.stringify(op).slice(0, 300); console.log(`   ${model} rejected: ${lastErr.slice(0, 140)}`); continue; }
    const deadline = Date.now() + 600_000;
    let done = op;
    while (!done.done && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10_000));
      done = await (await fetch(`${GEMINI}/${op.name}`, { headers: gHeaders })).json();
    }
    const uri = done.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ?? done.response?.generatedVideos?.[0]?.video?.uri;
    if (!done.done || done.error || !uri) { lastErr = JSON.stringify(done.error ?? done).slice(0, 300); console.log(`   ${model} failed: ${lastErr.slice(0, 140)}`); continue; }
    const v = await fetch(uri, { headers: { 'x-goog-api-key': GEMINI_KEY } });
    fs.writeFileSync(outFile, Buffer.from(await v.arrayBuffer()));
    return model;
  }
  throw new Error(`veo: ${lastErr}`);
}

// ---------------------------------------------------------------- narration (ElevenLabs direct, cached per key)
async function narrate(key, text) {
  const f = path.join(outDir, `vo-${key}.wav`);
  if (fs.existsSync(f)) return f;
  const tmp = path.join(outDir, `vo-${key}.src`);
  if ((!DRY || REAL_VO) && process.env.ELEVEN_API_KEY) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.elevenVoiceId ?? 'HJmys3t5KLr6DUWl0kSe'}`, {
      method: 'POST', headers: { 'xi-api-key': process.env.ELEVEN_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3 } }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) throw new Error(`elevenlabs ${key}: ${(await r.text()).slice(0, 200)}`);
    fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  } else {
    if (REAL_VO) throw new Error('--real-vo needs ELEVEN_API_KEY');
    execFileSync('say', ['-v', 'Paulina', '-r', '165', '-o', tmp + '.aiff', text]);
    fs.renameSync(tmp + '.aiff', tmp);
  }
  ff(['-i', tmp, '-ar', '48000', '-ac', '2', f]);
  fs.unlinkSync(tmp);
  return f;
}

// ---------------------------------------------------------------- ASS helpers (1920x1080)
const assTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h}:${String(m).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; };
const esc = (t) => t.replace(/[{}]/g, '');
const STYLES = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Eyebrow,Anton,44,&H00144DFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,3,0,1,0,0,7,80,1300,70,1
Style: LessonTitle,Archivo Black,42,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,80,1300,135,1
Style: StepLabel,Archivo Black,36,&H00FFFFFF,&H00FFFFFF,&H00144DFF,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,80,1300,470,1
Style: StepNum,Anton,120,&H00144DFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,80,1300,320,1
Style: CapRight,Archivo Black,34,&H00FFFFFF,&H00FFFFFF,&H001A1A1A,&HA0000000,0,0,0,0,100,100,0,0,1,4,2,2,1300,80,90,1
Style: CapCenter,Archivo Black,46,&H00FFFFFF,&H00FFFFFF,&H001A1A1A,&HA0000000,0,0,0,0,100,100,0,0,1,5,2,2,220,220,70,1
Style: OverlayTitle,Anton,110,&H00144DFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,4,0,1,4,2,8,60,60,90,1
Style: OverlayEp,Archivo Black,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,2,0,1,3,2,8,60,60,220,1
Style: CardTitle,Anton,96,&H00144DFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,3,0,1,0,0,7,160,160,140,1
Style: CardLine,Archivo Black,52,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,160,160,300,1
Style: CardUrl,Anton,84,&H00144DFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,2,60,60,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
function card(name, seconds, lines) {
  const ass = path.join(outDir, `${name}.ass`);
  fs.writeFileSync(ass, STYLES + lines.join('\n') + '\n');
  const file = path.join(outDir, `${name}.mp4`);
  ff(['-f', 'lavfi', '-i', `color=c=0x0d0d0d:s=${W}x${H}:d=${seconds}`, '-vf', `ass=${ass}:fontsdir=${fontsDir}`, '-t', String(seconds), ...ENC, file]);
  return file;
}
function holdTo(src, seconds, out) {
  // play at 1x, then freeze the last frame until `seconds` (never slow down, never cut narration)
  const d = dur(src);
  const vf = d + 0.05 < seconds ? `tpad=stop_mode=clone:stop_duration=${(seconds - d).toFixed(2)}` : 'null';
  ff(['-i', src, '-vf', vf, '-t', String(seconds), '-an', ...ENC, out]);
  return out;
}

// ---------------------------------------------------------------- timeline
const segs = []; // { file, seconds, vo?, voText?, label?, num?, capStyle }
const sheet = path.join(outDir, 'character.png');
if (!fs.existsSync(sheet)) { console.error(`missing ${sheet} — copy the pilot's character.png there first`); process.exit(1); }

// 1. opener
console.log('1/4 Opener…');
for (const [i, shot] of cfg.opener.shots.entries()) {
  const n = i + 1;
  const vo = await narrate(`op-${n}`, shot.vo);
  const seconds = Math.max(8, dur(vo) + 0.6);
  let src = path.join(outDir, `op-${n}.veo.mp4`);
  if (DRY && !fs.existsSync(src)) {
    src = path.join(outDir, `op-${n}.dry.mp4`);
    ff(['-f', 'lavfi', '-i', `color=c=0x${['2b1d17', '17262b', '2b2517'][i % 3]}:s=${W}x${H}:d=8`, '-t', '8', ...ENC, src]);
  } else if (!fs.existsSync(src)) {
    const img = path.join(outDir, `op-${n}.png`);
    if (!fs.existsSync(img)) { const m = await geminiImage(`${cfg.style}. Keep the exact same character from the reference image (same face, hair, clothes): ${cfg.character}. Scene: ${shot.prompt}`, img, sheet); console.log(`   shot ${n} image ok (${m})`); }
    const m = await veoAnimate(`cinematic animated film, character and style strictly preserved, ${shot.motion}`, img, src);
    console.log(`   shot ${n} animated (${m})`);
  }
  const scaled = path.join(outDir, `op-${n}.scaled.mp4`);
  ff(['-i', src, '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS}`, '-an', ...ENC, scaled]);
  segs.push({ file: holdTo(scaled, seconds, path.join(outDir, `seg-op-${n}.mp4`)), seconds, vo, voText: shot.vo, capStyle: 'CapCenter', overlay: n === 1 });
}

// 2. screen: static side panels once, then each step = recording slice over the panels
console.log('2/4 Screen…');
const bg = path.join(outDir, 'panels.png');
ff(['-f', 'lavfi', '-i', `color=c=0x0d0d0d:s=${W}x${H}:d=1`, '-i', sheet, '-filter_complex', '[1]crop=iw:ih*0.56:0:ih*0.14,scale=380:-2[c];[0][c]overlay=1420:70:format=auto', '-frames:v', '1', bg]);
const rec = path.join(outDir, cfg.screen.recording);
const marksFile = path.join(outDir, 'marks.json');
const haveRec = fs.existsSync(rec) && fs.existsSync(marksFile);
let cfr = null, marks = [];
if (haveRec) {
  cfr = path.join(outDir, 'screen.cfr.mp4');
  if (!fs.existsSync(cfr)) ff(['-i', rec, '-vf', `fps=${FPS}`, '-fps_mode', 'cfr', '-an', ...ENC, cfr]);
  marks = JSON.parse(fs.readFileSync(marksFile, 'utf8'));
} else if (!DRY) { console.error('missing screen.mp4 / marks.json — record the lesson first (lesson-record.sh)'); process.exit(1); }
const recTotal = cfr ? dur(cfr) : 0;
for (const [i, step] of cfg.screen.steps.entries()) {
  const n = i + 1;
  const vo = await narrate(`st-${n}`, step.vo);
  const out = path.join(outDir, `seg-st-${n}.mp4`);
  let seconds;
  if (cfr) {
    // marks[i] is either { t } (step runs until the next mark) or { ranges: [[start, end], ...] } —
    // several ranges are jump-cut together so idle stretches of the take can be dropped without re-recording.
    const m = marks[i] ?? {};
    const ranges = m.ranges ?? [[m.t ?? 0, marks[i + 1]?.t ?? recTotal]];
    const natural = ranges.reduce((a, [s, e]) => a + Math.max(0.2, e - s), 0);
    seconds = Math.max(natural, dur(vo) + 0.8);
    const slice = path.join(outDir, `st-${n}.slice.mp4`);
    const trims = ranges.map(([s, e], k) => `[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[r${k}]`).join(';');
    const cat = ranges.length > 1 ? `${ranges.map((_, k) => `[r${k}]`).join('')}concat=n=${ranges.length}:v=1:a=0[rec];` : '[r0]null[rec];';
    // recording 1206x2622 → 460x1000 centred, thin border, over the static panels
    ff(['-i', cfr, '-loop', '1', '-i', bg, '-filter_complex',
      `${trims};${cat}[rec]scale=-2:1000[p];[1][p]overlay=730:40:shortest=1,drawbox=x=727:y=37:w=466:h=1006:color=0x3a3a3a@0.9:t=3`, '-an', ...ENC, slice]);
    holdTo(slice, seconds, out);
  } else {
    seconds = dur(vo) + 1.0;
    ff(['-loop', '1', '-i', bg, '-t', String(seconds), '-vf', `drawbox=x=730:y=40:w=460:h=1000:color=0x222222:t=fill`, ...ENC, out]);
  }
  segs.push({ file: out, seconds, vo, voText: step.vo, label: step.label, num: n, capStyle: 'CapRight' });
}

// 3. recap + outro cards
console.log('3/4 Cards…');
for (const [key, c, title] of [['recap', cfg.recap, 'Lo que aprendiste hoy'], ['outro', cfg.outro, `Lección ${cfg.lesson + 1}`]]) {
  const vo = await narrate(key, c.vo);
  const seconds = dur(vo) + 1.2;
  const lines = [`Dialogue: 0,0:00:00.00,${assTime(seconds)},CardTitle,,0,0,0,,{\\fad(200,300)}${esc(title)}`];
  c.lines.forEach((l, k) => lines.push(`Dialogue: 0,${assTime(0.4 + k * 0.5)},${assTime(seconds)},CardLine,,0,0,${300 + k * 90},,{\\fad(200,300)}${esc(l)}`));
  if (key === 'outro') lines.push(`Dialogue: 0,${assTime(0.8)},${assTime(seconds)},CardUrl,,0,0,0,,{\\fad(200,300)}biialab.org`);
  segs.push({ file: card(`seg-${key}`, seconds, lines), seconds, vo, voText: c.vo, capStyle: 'CapCenter' });
}

// 4. concat + captions/labels + audio
console.log('4/4 Mix…');
const list = path.join(outDir, 'concat.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s.file}'`).join('\n'));
const visual = path.join(outDir, 'visual.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', visual]);

let t = 0;
const events = [], inputs = [], delays = [];
segs.forEach((s, i) => {
  const start = t + 0.3, voLen = dur(s.vo), end = t + s.seconds;
  inputs.push('-i', s.vo);
  delays.push(`[${i}:a]adelay=${Math.round(start * 1000)}|${Math.round(start * 1000)}[v${i}]`);
  if (s.overlay) {
    events.push(`Dialogue: 0,${assTime(t)},${assTime(t + 2.5)},OverlayTitle,,0,0,0,,{\\fad(150,400)}${esc(cfg.series)}`);
    events.push(`Dialogue: 0,${assTime(t + 0.2)},${assTime(t + 2.5)},OverlayEp,,0,0,0,,{\\fad(150,400)}Lección ${cfg.lesson}: ${esc(cfg.lessonTitle)}`);
  }
  if (s.label) {
    events.push(`Dialogue: 0,${assTime(t)},${assTime(end)},Eyebrow,,0,0,0,,${esc(cfg.series)}`);
    events.push(`Dialogue: 0,${assTime(t)},${assTime(end)},LessonTitle,,0,0,0,,Lección ${cfg.lesson}\\N${esc(cfg.lessonTitle)}`);
    events.push(`Dialogue: 0,${assTime(t)},${assTime(end)},StepNum,,0,0,0,,{\\fad(150,0)}${String(s.num).padStart(2, '0')}`);
    events.push(`Dialogue: 0,${assTime(t)},${assTime(end)},StepLabel,,0,0,0,,{\\fad(150,0)}${esc(s.label)}`);
  }
  const words = s.voText.split(/\s+/), per = s.capStyle === 'CapRight' ? 4 : 6, chunks = [];
  for (let w = 0; w < words.length; w += per) chunks.push(words.slice(w, w + per).join(' '));
  const each = voLen / chunks.length;
  chunks.forEach((c, k) => events.push(`Dialogue: 0,${assTime(start + k * each)},${assTime(start + (k + 1) * each)},${s.capStyle},,0,0,0,,${esc(c)}`));
  t = end;
});
const total = t;
const ass = path.join(outDir, 'captions.ass');
fs.writeFileSync(ass, STYLES + events.join('\n') + '\n');
const mixed = path.join(outDir, 'audio.m4a');
ff([...inputs, '-f', 'lavfi', '-t', String(total), '-i', 'anoisesrc=color=brown:amplitude=0.005:r=48000',
  '-filter_complex', `${delays.join(';')};[${segs.length}:a]aformat=channel_layouts=stereo[bed];${segs.map((_, i) => `[v${i}]`).join('')}[bed]amix=inputs=${segs.length + 1}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5[out]`,
  '-map', '[out]', '-t', String(total), '-c:a', 'aac', '-ar', '48000', mixed]);
const finalFile = path.join(outDir, `${cfg.name}${DRY ? '.dry' : ''}.mp4`);
ff(['-i', visual, '-i', mixed, '-vf', `ass=${ass}:fontsdir=${fontsDir}`, '-map', '0:v', '-map', '1:a', '-shortest', ...ENC, '-c:a', 'copy', finalFile]);
fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify([{
  file: path.basename(finalFile), sourceVideoId: 'lesson', start: 0, end: Math.round(total),
  title: cfg.title, description: cfg.description, style: 'lesson', syntheticMedia: true,
}], null, 2));
console.log(`Done: ${finalFile}  (${total.toFixed(1)}s, ${segs.length} segments${haveRec ? '' : ', NO recording — placeholder screen'})`);
