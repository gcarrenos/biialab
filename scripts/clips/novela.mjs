#!/usr/bin/env node
// Animated novela episode: consistent AI character (nano-banana-pro on fal),
// each shot animated with Kling i2v, Spanish narration VO, captions, series
// title card + cliffhanger end card. Config-driven:
//
//   FAL_KEY=... node scripts/clips/novela.mjs <config.json> [--dry] [--real-vo] [--veo]
//   GEMINI_API_KEY=... node scripts/clips/novela.mjs <config.json> --google
//
// --google skips fal entirely: shot images via Gemini (Nano Banana Pro,
// character sheet as reference) and animation via Veo 3.1 fast image-to-video,
// both on the Gemini API (billed to the Google project, not fal credits).
//
// --dry skips fal (uses colour cards) so the VO, timing and captions can be
// previewed for free before spending on images/animation.
// --real-vo generates the ElevenLabs narration even on a --dry run (cheap:
// characters on the plan, not fal credits) and caches it for the real render.
// --veo animates shots with Veo 3.1 image-to-video (8s native clips, no
// slow-mo stretch) instead of Kling 2.1 (5s). ~3-4x the per-shot cost.
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
const REAL_VO = argv.includes('--real-vo');
const VEO = argv.includes('--veo');
const GOOGLE = argv.includes('--google');
const configFile = argv.find((a) => !a.startsWith('--'));
const FAL_KEY = process.env.FAL_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!configFile || (!DRY && !GOOGLE && !FAL_KEY) || (!DRY && GOOGLE && !GEMINI_KEY)) {
  console.error('Usage: FAL_KEY=... node novela.mjs <config.json> [--dry] [--real-vo] [--veo]\n       GEMINI_API_KEY=... node novela.mjs <config.json> --google');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));

const here = import.meta.dirname;
const fontsDir = path.join(here, 'fonts');
const outDir = path.join(here, 'out', 'novela', cfg.name);
fs.mkdirSync(outDir, { recursive: true });

const ENC = ['-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-r', '30', '-pix_fmt', 'yuv420p'];
const ASPECT = cfg.aspect ?? '9:16';
const [OW, OH] = ASPECT === '16:9' ? [1920, 1080] : [1080, 1920];
const VF = `scale=${OW}:${OH}:force_original_aspect_ratio=increase,crop=${OW}:${OH},fps=30`;

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

// ---------------------------------------------------------------- Gemini API (--google): images + Veo, no fal
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const gHeaders = { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' };
const b64 = (file) => fs.readFileSync(file).toString('base64');
// fetch with retries on network-level failures (ETIMEDOUT / EHOSTUNREACH / reset) — a flaky uplink must not kill a 20-minute render.
async function gfetch(url, opts, tries = 4) {
  for (let i = 1; ; i++) {
    try { return await fetch(url, opts); } catch (e) {
      if (i >= tries) throw e;
      console.log(`   network error (${e.cause?.code ?? e.message}), retry ${i}/${tries - 1} in 15s…`);
      await new Promise((r) => setTimeout(r, 15_000));
    }
  }
}

// Nano Banana Pro (gemini-3-pro-image-preview) with an optional reference image for character consistency.
async function geminiImage(prompt, outFile, refFile) {
  const parts = [{ text: prompt }];
  if (refFile) parts.push({ inline_data: { mime_type: 'image/png', data: b64(refFile) } });
  let lastErr;
  for (const model of ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']) {
    const res = await gfetch(`${GEMINI}/models/${model}:generateContent`, {
      method: 'POST', headers: gHeaders, signal: AbortSignal.timeout(240_000),
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ASPECT } } }),
    });
    const data = await res.json();
    const img = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (res.ok && img) { fs.writeFileSync(outFile, Buffer.from(img.inlineData.data, 'base64')); return model; }
    lastErr = JSON.stringify(data).slice(0, 300);
  }
  throw new Error(`gemini image: ${lastErr}`);
}

// Veo 3.1 fast image-to-video: long-running operation, poll until done, download the file.
async function veoAnimate(prompt, imgFile, outFile) {
  let lastErr;
  // Fast is ~1/3 the price of standard: on a rate-limit style error, wait and retry fast once before falling through.
  const ladder = ['veo-3.1-fast-generate-preview', 'veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'];
  for (const [attempt, model] of ladder.entries()) {
    if (attempt === 1) {
      if (!/429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|quota|rate/i.test(lastErr ?? '')) continue; // non-transient: skip the retry
      console.log(`   ${model} transient error, retrying in 20s…`);
      await new Promise((r) => setTimeout(r, 20_000));
    }
    const start = await gfetch(`${GEMINI}/models/${model}:predictLongRunning`, {
      method: 'POST', headers: gHeaders, signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        instances: [{ prompt, image: { bytesBase64Encoded: b64(imgFile), mimeType: 'image/png' } }],
        parameters: { aspectRatio: ASPECT, resolution: '720p', durationSeconds: 8, negativePrompt: 'blur, distort, morph, extra limbs, text' },
      }),
    });
    const op = await start.json();
    if (!start.ok || !op.name) { lastErr = JSON.stringify(op).slice(0, 300); console.log(`   ${model} rejected: ${lastErr.slice(0, 140)}`); continue; }
    const deadline = Date.now() + 600_000;
    let done = op;
    while (!done.done && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10_000));
      done = await (await gfetch(`${GEMINI}/${op.name}`, { headers: gHeaders })).json();
    }
    const uri = done.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
      ?? done.response?.generatedVideos?.[0]?.video?.uri;
    if (!done.done || done.error || !uri) { lastErr = JSON.stringify(done.error ?? done).slice(0, 300); console.log(`   ${model} failed: ${lastErr.slice(0, 140)}`); continue; }
    const v = await gfetch(uri, { headers: { 'x-goog-api-key': GEMINI_KEY } });
    fs.writeFileSync(outFile, Buffer.from(await v.arrayBuffer()));
    return model;
  }
  throw new Error(`veo: ${lastErr}`);
}

// ---------------------------------------------------------------- 1. character sheet
const sheet = path.join(outDir, 'character.png');
if (!DRY && !fs.existsSync(sheet)) {
  const sheetPrompt = `${cfg.style}. ${cfg.characterSheet}. Character: ${cfg.character}.`;
  if (GOOGLE) {
    console.log('1/5 Character sheet (gemini image)…');
    await geminiImage(sheetPrompt, sheet);
  } else {
    console.log('1/5 Character sheet (nano-banana-pro)…');
    const d = await fal('fal-ai/nano-banana-pro', { prompt: sheetPrompt, aspect_ratio: ASPECT, num_images: 1, output_format: 'png' }, 240_000);
    await download(d.images[0].url, sheet);
  }
}

// ---------------------------------------------------------------- 2. shots (image via edit w/ reference, then kling)
console.log('2/5 Shots…');
for (const [i, shot] of cfg.shots.entries()) {
  const n = i + 1;
  const img = path.join(outDir, DRY ? `dry-${n}.png` : `shot-${n}.png`);
  // Veo and Kling clips are cached under different names so switching animators never reuses the wrong one.
  const anim = path.join(outDir, DRY ? `dry-${n}.anim.mp4` : (VEO || GOOGLE) ? `shot-${n}.veo.mp4` : `shot-${n}.anim.mp4`);
  if (DRY) {
    if (!fs.existsSync(img)) execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x${['1a1a1a', '2b1d17', '17262b', '2b2517', '1a2b17', '2b1726'][i % 6]}:s=1080x1920:d=1`, '-frames:v', '1', img]);
    continue;
  }
  if (!fs.existsSync(img)) {
    const shotPrompt = `${cfg.style}. Keep the exact same character from the reference image (same face, hair, clothes): ${cfg.character}. Scene: ${shot.prompt}`;
    if (GOOGLE) {
      const model = await geminiImage(shotPrompt, img, sheet);
      console.log(`   shot ${n} image ok (${model})`);
    } else {
      const d = await fal('fal-ai/nano-banana-pro/edit', { prompt: shotPrompt, image_urls: [dataUri(sheet)], aspect_ratio: ASPECT, num_images: 1, output_format: 'png' }, 240_000);
      await download(d.images[0].url, img);
      console.log(`   shot ${n} image ok`);
    }
  }
  if (!fs.existsSync(anim)) {
    if (GOOGLE) {
      console.log(`   shot ${n} animating (veo via gemini api)…`);
      const model = await veoAnimate(`cinematic animated film, character and style strictly preserved, ${shot.motion}`, img, anim);
      console.log(`   ok via ${model}`);
    } else if (VEO) {
      console.log(`   shot ${n} animating (veo 3.1 i2v)…`);
      // Same fallback ladder as character.mjs: fast 3.1 first, then older fast, then full.
      let d, lastErr;
      for (const ep of ['fal-ai/veo3.1/fast/image-to-video', 'fal-ai/veo3/fast/image-to-video', 'fal-ai/veo3.1/image-to-video']) {
        try {
          d = await fal(ep, {
            prompt: `cinematic animated film, character and style strictly preserved, ${shot.motion}`,
            image_url: dataUri(img), aspect_ratio: ASPECT, duration: '8s', generate_audio: false, resolution: '720p',
          }, 900_000);
          console.log(`   ok via ${ep}`);
          break;
        } catch (e) { lastErr = e.message; d = null; }
      }
      if (!d) throw new Error(`veo failed on shot ${n}: ${lastErr}`);
      await download(d.video?.url ?? d.videos?.[0]?.url, anim);
    } else {
      console.log(`   shot ${n} animating (kling)…`);
      const d = await fal('fal-ai/kling-video/v2.1/standard/image-to-video', {
        prompt: `cinematic animated film, character and style strictly preserved, ${shot.motion}`,
        image_url: dataUri(img), duration: '5', negative_prompt: 'blur, distort, morph, extra limbs, text',
      });
      await download(d.video?.url ?? d.videos?.[0]?.url, anim);
    }
  }
}

// ---------------------------------------------------------------- 3. narration
console.log('3/5 Narration…');
const voFiles = [];
for (const [i, shot] of cfg.shots.entries()) {
  const f = path.join(outDir, `vo-${i + 1}.wav`);
  if (!fs.existsSync(f)) {
    let done = false;
    if ((!DRY || REAL_VO) && process.env.ELEVEN_API_KEY) {
      // Direct ElevenLabs (paid plan: library voices allowed). cfg.elevenVoiceId e.g. Alberto HJmys3t5KLr6DUWl0kSe
      try {
        const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.elevenVoiceId ?? "HJmys3t5KLr6DUWl0kSe"}`, {
          method: "POST", headers: { "xi-api-key": process.env.ELEVEN_API_KEY, "Content-Type": "application/json" },
          // cfg.elevenModel: "eleven_v3" (expressive narration, honours "..." pauses and [tags]) or "eleven_multilingual_v2" (default).
          // cfg.voiceSettings overrides the defaults; v3 ignores `style`.
          body: JSON.stringify({ text: shot.vo, model_id: cfg.elevenModel ?? "eleven_multilingual_v2", voice_settings: cfg.voiceSettings ?? { stability: 0.45, similarity_boost: 0.8, style: 0.3 } }),
          signal: AbortSignal.timeout(120_000),
        });
        if (!r.ok) throw new Error(await r.text());
        const tmp = path.join(outDir, `vo-${i + 1}.src`);
        fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
        execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-ar", "48000", "-ac", "2", f]);
        fs.unlinkSync(tmp);
        done = true;
      } catch (e) { console.log(`   (elevenlabs direct failed) ${e.message.slice(0, 80)}`); }
    }
    if (!done && !DRY && FAL_KEY) {
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
      // --real-vo asked for ElevenLabs explicitly: fail loudly rather than cache the Mac voice.
      if (REAL_VO) throw new Error(`ElevenLabs narration failed for shot ${i + 1} (is ELEVEN_API_KEY set?)`);
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
const shotDur = cfg.shots.map((s, i) => Math.max(s.dur, dur(voFiles[i]) + 0.5));
// cfg.titleOverlay: no black title card — the series title is overlaid on shot 1 (hook opens inside the scene).
// cfg.endSeconds / cfg.endCard: override the 3.5s "CONTINUARÁ" card (e.g. a CTA card for a series that isn't a cliffhanger).
const TITLE = cfg.titleOverlay ? 0 : 2.0, END = cfg.endSeconds ?? 3.5;

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
if (!cfg.titleOverlay) card('card-title', TITLE, [
  `Dialogue: 0,0:00:00.00,0:00:${TITLE.toFixed(2).padStart(5, '0')},Series,,0,0,0,,{\\fad(200,300)}${cfg.series}`,
  `Dialogue: 0,0:00:00.30,0:00:${TITLE.toFixed(2).padStart(5, '0')},Ep,,0,0,0,,{\\fad(200,300)}${cfg.episode}`,
  `Dialogue: 0,0:00:00.60,0:00:${TITLE.toFixed(2).padStart(5, '0')},Small,,0,0,0,,una serie de BiiA LAB`,
]);
cfg.shots.forEach((shot, i) => {
  const n = i + 1, d = shotDur[i];
  const anim = path.join(outDir, DRY ? 'none' : (VEO || GOOGLE) ? `shot-${n}.veo.mp4` : `shot-${n}.anim.mp4`), img = path.join(outDir, DRY ? `dry-${n}.png` : `shot-${n}.png`);
  const clip = path.join(outDir, `shot-${n}.mp4`);
  if (fs.existsSync(anim)) {
    // Kling clips are 5s, Veo clips 8s. Never speed up (factor < 1 just trims via -t); slow down at most 1.6x.
    const srcLen = (VEO || GOOGLE) ? 8 : 5;
    const factor = Math.max(1, d / srcLen);
    if (factor <= 1.6) {
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', anim, '-vf', `setpts=${factor.toFixed(4)}*PTS,${VF}`, '-t', String(d), '-an', ...ENC, clip]);
    } else {
      // hold the last frame instead of over-slowing
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', anim, '-vf', `setpts=1.6*PTS,${VF},tpad=stop_mode=clone:stop_duration=${(d - srcLen * 1.6).toFixed(2)}`, '-t', String(d), '-an', ...ENC, clip]);
    }
  } else {
    const frames = Math.round(d * 30);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-t', String(d), '-i', img,
      '-vf', `scale=-2:3840,crop=2160:3840,zoompan=z='min(1+0.10*on/${frames},1.10)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1080x1920:fps=30`, '-an', ...ENC, clip]);
  }
  parts.push(clip);
});
const endCard = cfg.endCard ?? { top: 'CONTINUARÁ', url: 'biialab.org', small: 'cursos gratis con certificado' };
// endSeconds: 0 → no end card at all: the Short ends on the last line and loops straight back to the hook.
if (END > 0) card('card-end', END, [
  `Dialogue: 0,0:00:00.00,0:00:${END.toFixed(2).padStart(5, '0')},Ep,,0,0,0,,{\\fad(200,300)}${endCard.top}`,
  `Dialogue: 0,0:00:00.40,0:00:${END.toFixed(2).padStart(5, '0')},Url,,0,0,0,,{\\fad(200,300)}${endCard.url}`,
  `Dialogue: 0,0:00:00.80,0:00:${END.toFixed(2).padStart(5, '0')},Small,,0,0,0,,${endCard.small}`,
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
  '-filter_complex', `${delays.join(';')};[${cfg.shots.length}:a]aformat=channel_layouts=stereo[bed];${delays.map((_, i) => `[v${i}]`).join('')}[bed]amix=inputs=${cfg.shots.length + 1}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${(total - (END > 0 ? 1.5 : 0.4)).toFixed(2)}:d=${END > 0 ? 1.5 : 0.4}[out]`,
  '-map', '[out]', '-t', String(total), '-c:a', 'aac', '-ar', '48000', mixed]);

const ass = path.join(outDir, 'captions.ass');
fs.writeFileSync(ass, `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Archivo Black,60,&H00FFFFFF,&H00FFFFFF,&H001A1A1A,&HA0000000,0,0,0,0,100,100,0,0,1,5,2,2,80,80,300,1
Style: OverlayTitle,Anton,120,&H00144DFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,4,0,1,4,2,8,60,60,200,1
Style: OverlayEp,Archivo Black,44,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,2,0,1,3,2,8,60,60,350,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${(cfg.titleOverlay ? [
  // Series title + episode fade in over the top of shot 1 while the scene is already playing.
  `Dialogue: 0,0:00:00.00,0:00:02.00,OverlayTitle,,0,0,0,,{\\fad(150,400)}${cfg.series}`,
  `Dialogue: 0,0:00:00.20,0:00:02.00,OverlayEp,,0,0,0,,{\\fad(150,400)}${cfg.episode}`,
] : []).concat(capLines).join('\n')}
`);
const finalFile = path.join(outDir, `${cfg.name}${DRY ? '.dry' : ''}.mp4`);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', visual, '-i', mixed, '-vf', `ass=${ass}:fontsdir=${fontsDir}`,
  '-map', '0:v', '-map', '1:a', '-shortest', ...ENC, '-c:a', 'copy', finalFile]);

fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify([{
  file: path.basename(finalFile), sourceVideoId: 'novela', start: 0, end: Math.round(total),
  title: cfg.title, description: cfg.description, style: 'novela', syntheticMedia: true,
}], null, 2));
console.log(`Done: ${finalFile}  (${total.toFixed(1)}s)`);
