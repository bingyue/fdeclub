process.loadEnvFile('/opt/fdeclub/shared/app.env');
const mode=process.argv[2]==='retention'?'?mode=retention':'';
const r=await fetch('http://127.0.0.1:3216/api/internal/maintenance'+mode,{method:'POST',headers:{authorization:'Bearer '+process.env.CRON_SECRET},signal:AbortSignal.timeout(60000)});
if(!r.ok)throw Error(`Maintenance failed: ${r.status}`);
console.log('FDEClub maintenance completed',await r.json());
