# AI Clips Pipeline — BiiALAB Shorts machine

Turns the channel's 225 long videos into vertical Shorts with burned-in
Spanish captions, titles, and descriptions — no recording needed. Each Short
funnels viewers to the source video and to biialab.org.

## Setup (once)

```bash
brew install yt-dlp ffmpeg
```

Env vars (put in your shell profile or a local `.env` you don't commit):

| Var | Used by | Where to get it |
|---|---|---|
| `YOUTUBE_API_KEY` | `list.mjs` | Existing YouTube Data API key (read-only) |
| `ANTHROPIC_API_KEY` | `clip.mjs` | console.anthropic.com (or use `ant auth login` — no var needed) |
| `YT_CLIENT_ID` / `YT_CLIENT_SECRET` | `upload.mjs` | Google Cloud Console → OAuth client (Desktop), enable YouTube Data API v3 |
| `YT_REFRESH_TOKEN` | `upload.mjs` | `node scripts/clips/upload.mjs --auth` (one-time browser flow) |

## Workflow

```bash
# 1. Pick source material — channel videos ranked by views
node scripts/clips/list.mjs

# 2. Generate 5 Shorts from a video (subs → Claude picks moments → ffmpeg cuts 9:16)
node scripts/clips/clip.mjs <videoId> --max 5

# 3. Review scripts/clips/out/<videoId>/ (mp4s + metadata.json), then upload as PRIVATE
node scripts/clips/upload.mjs <videoId>

# 4. Publish/schedule from YouTube Studio (or --privacy public to skip review)
```

## Notes

- `clip.mjs` uses the video's Spanish auto-captions; if a video has none,
  transcribe it first (e.g. `whisper source.mp4 --language es`) and retry.
- Uploads default to **private** so nothing goes live without review.
- Cost: one Claude call per video (transcript in, ~5 clip specs out).
- Suggested cadence: 1–2 Shorts/day. 225 videos × 5 clips ≈ 2+ years of daily
  content from the existing archive.
- `out/` is gitignored — clips are build artifacts, not source.
