#!/bin/bash
# Screen-record the iOS Simulator for a lesson and mark step boundaries.
#
#   lesson-record.sh start <udid> <outdir>   # begins recording → <outdir>/screen.mp4
#   lesson-record.sh mark  <outdir> [label]  # appends {t, label} to <outdir>/marks.json (t = seconds since start)
#   lesson-record.sh stop  <outdir>          # stops recording (SIGINT), waits for the file to be written
#
# marks.json is what lesson.mjs uses to slice the recording per step: mark once
# at the START of each step, in order.
set -euo pipefail
cmd=${1:?start|mark|stop}
case "$cmd" in
  start)
    udid=${2:?udid}; out=${3:?outdir}; mkdir -p "$out"
    rm -f "$out/screen.mp4" "$out/marks.json"
    xcrun simctl io "$udid" recordVideo --codec h264 --force "$out/screen.mp4" >"$out/record.log" 2>&1 &
    echo $! > "$out/record.pid"
    sleep 1
    date +%s.%N > "$out/record.start"
    echo "recording → $out/screen.mp4 (pid $(cat "$out/record.pid"))"
    ;;
  mark)
    out=${2:?outdir}; label=${3:-}
    start=$(cat "$out/record.start"); now=$(date +%s.%N)
    t=$(echo "$now - $start" | bc)
    [ -f "$out/marks.json" ] || echo "[]" > "$out/marks.json"
    node -e '
      const fs=require("fs"); const f=process.argv[1]; const m=JSON.parse(fs.readFileSync(f,"utf8"));
      m.push({ t: Number(process.argv[2]), label: process.argv[3] }); fs.writeFileSync(f, JSON.stringify(m, null, 1));
      console.log(`mark ${m.length} @ ${Number(process.argv[2]).toFixed(1)}s ${process.argv[3]}`);
    ' "$out/marks.json" "$t" "$label"
    ;;
  stop)
    out=${2:?outdir}
    kill -INT "$(cat "$out/record.pid")" 2>/dev/null || true
    for i in $(seq 1 30); do grep -q "Wrote video" "$out/record.log" 2>/dev/null && break; sleep 1; done
    ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/screen.mp4" | sed 's/^/recorded seconds: /'
    ;;
esac
