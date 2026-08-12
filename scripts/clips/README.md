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
| `GOOGLE_CLIENT_SECRETS` | `upload.mjs` | Path to the `client_secret_*.json` downloaded from Google Cloud Console (OAuth Desktop client with YouTube Data API v3 enabled). Or pass `--client-secrets <path>` per run. |

Authorize once (opens a browser, captures the code on localhost, stores the
refresh token in `scripts/clips/.youtube-token.json` — gitignored, chmod 600):

```bash
node scripts/clips/upload.mjs --auth --client-secrets ~/Downloads/client_secret_*.json
```

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

### Drip-publishing without Studio

`--schedule` staggers the batch one clip per day, so YouTube publishes them for
you — no manual scheduling:

```bash
# first clip at 15:00 UTC on Aug 14, then one per day after
node scripts/clips/upload.mjs <videoId> --schedule 2026-08-14T15:00:00Z

# two per day instead
node scripts/clips/upload.mjs <videoId> --schedule 2026-08-14T15:00:00Z --every-hours 12
```

The timestamp must be ISO-8601 and in the future, and scheduling only works with
`--privacy private` (that's YouTube's rule — it flips each video public itself at
its `publishAt` time).

## Extra tools

```bash
# YouTube's "most replayed" graph in your terminal — real audience data on
# which moments to clip. clip.mjs also feeds these peaks into the selection.
node scripts/clips/heatmap.mjs <videoId>

# Download Spanish captions for ALL channel videos into scripts/clips/corpus/
# (reusable for ebooks, chapters, RAG). Writes corpus/_missing.json for videos
# that need Whisper.
node scripts/clips/sweep-captions.mjs

# Curated selection without an API call: write a plan JSON and cut from it
node scripts/clips/clip.mjs <videoId> --plan path/to/plan.json
```

## Whisper fallback (videos without captions)

`clip.mjs` transcribes locally when YouTube has no Spanish captions. One-time setup:

```bash
brew install whisper-cpp
curl -L -o scripts/clips/models/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

## Notes

- `clip.mjs` uses the video's Spanish auto-captions; if a video has none,
  transcribe it first (e.g. `whisper source.mp4 --language es`) and retry.
- Uploads default to **private** so nothing goes live without review.
- Cost: one Claude call per video (transcript in, ~5 clip specs out).
- Suggested cadence: 1–2 Shorts/day. 225 videos × 5 clips ≈ 2+ years of daily
  content from the existing archive.
- `out/` is gitignored — clips are build artifacts, not source.
