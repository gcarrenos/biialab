#!/bin/bash
# For each id: unlisted → full-quality download → private again. Absolute paths everywhere; revert runs on any exit.
CLIPS=/Users/gustavocarreno/biialab/.claude/worktrees/youtube-monetization-ai-ee0840/scripts/clips
SECRETS=/Users/gustavocarreno/Downloads/client_secret_508292309976-fbfvd4nudmjaactmmc85d8s4mi3st433.apps.googleusercontent.com.json
export SECRETS CLIPS
setpriv() { NODE_OPTIONS=--dns-result-order=ipv4first node --input-type=module -e '
import fs from "node:fs";
const [id,priv]=process.argv.slice(1);
const s=JSON.parse(fs.readFileSync(process.env.SECRETS,"utf8")).installed;
const {refresh_token}=JSON.parse(fs.readFileSync(process.env.CLIPS+"/.youtube-token.json","utf8"));
const tok=await (await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:s.client_id,client_secret:s.client_secret,refresh_token,grant_type:"refresh_token"})})).json();
const H={Authorization:`Bearer ${tok.access_token}`,"Content-Type":"application/json"};
for(let i=0;i<4;i++){ const r=await fetch("https://www.googleapis.com/youtube/v3/videos?part=status",{method:"PUT",headers:H,body:JSON.stringify({id,status:{privacyStatus:priv,selfDeclaredMadeForKids:false}})}); const d=await r.json();
  const now=(await (await fetch("https://www.googleapis.com/youtube/v3/videos?part=status&id="+id,{headers:H})).json()).items?.[0]?.status?.privacyStatus;
  console.log(new Date().toISOString(),id,"→",priv,"| set:",d.status?.privacyStatus??JSON.stringify(d).slice(0,120),"| read:",now); if(now===priv)break; await new Promise(r=>setTimeout(r,8000)); }
' "$1" "$2"; }
CUR=""
revert() { [ -n "$CUR" ] && setpriv "$CUR" private; }
trap revert EXIT
for ID in "$@"; do
  CUR=$ID
  if [ -s "$CLIPS/wave3/src/$ID.mp4" ]; then echo "$ID already downloaded"; CUR=""; continue; fi
  setpriv $ID unlisted; sleep 15
  yt-dlp --cookies-from-browser chrome -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --merge-output-format mp4 -o "$CLIPS/wave3/src/$ID.%(ext)s" "https://www.youtube.com/watch?v=$ID" 2>&1 | grep -vE "^\[download\] +[0-9.]+%" | tail -3
  setpriv $ID private; CUR=""
  ls -lh "$CLIPS/wave3/src/$ID.mp4" 2>/dev/null | awk '{print $9, $5}'
done
echo "ALL DONE"
