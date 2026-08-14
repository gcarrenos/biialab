#!/bin/bash
# Queued YouTube operations — run after the daily quota reset (midnight PT).
set -e
cd "$(dirname "$0")/../.."
SECRETS="/Users/gustavocarreno/Downloads/client_secret_508292309976-fbfvd4nudmjaactmmc85d8s4mi3st433.apps.googleusercontent.com.json"
echo "== illustrated cohort (Sept 1-4, 10am Colombia) =="
node scripts/clips/upload.mjs illustrated/mary-santera    --schedule 2026-09-01T15:00:00Z --client-secrets "$SECRETS"
node scripts/clips/upload.mjs illustrated/alejandra-toxicas --schedule 2026-09-02T15:00:00Z --client-secrets "$SECRETS"
node scripts/clips/upload.mjs illustrated/adriana-nada    --schedule 2026-09-03T15:00:00Z --client-secrets "$SECRETS"
node scripts/clips/upload.mjs illustrated-1               --schedule 2026-09-04T15:00:00Z --client-secrets "$SECRETS"
echo "== compilation publishes tomorrow 10am Colombia =="
node -e '
const fs=require("fs");
const s=JSON.parse(fs.readFileSync(process.env.HOME+"/Downloads/client_secret_508292309976-fbfvd4nudmjaactmmc85d8s4mi3st433.apps.googleusercontent.com.json","utf8")).installed;
const {refresh_token}=JSON.parse(fs.readFileSync("scripts/clips/.youtube-token.json","utf8"));
(async()=>{
  const tok=await (await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:s.client_id,client_secret:s.client_secret,refresh_token,grant_type:"refresh_token"})})).json();
  const r=await fetch("https://www.googleapis.com/youtube/v3/videos?part=status",{method:"PUT",headers:{Authorization:`Bearer ${tok.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({id:"4RSJzvrYShA",status:{privacyStatus:"private",publishAt:"2026-08-14T15:00:00Z",selfDeclaredMadeForKids:false}})});
  console.log(r.ok?"compilation scheduled":await r.text());
})();'
echo "== sweep stragglers =="
node scripts/clips/update-metadata.mjs scripts/clips/chapters/sweep.json --client-secrets "$SECRETS" | grep -v "already updated" | tail -12
echo "== ALL SHIPPED =="
