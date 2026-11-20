import {execFileSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(existsSync('.env.local'))throw new Error('.env.local already exists; preserve and edit it explicitly.');
const data=JSON.parse(execFileSync('npx',['supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(data.API_URL))throw new Error('Local Supabase URL required.');
const env={NEXT_PUBLIC_SITE_URL:'http://localhost:3000',NEXT_PUBLIC_SUPABASE_URL:data.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:data.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:data.SERVICE_ROLE_KEY,DATA_HASH_SECRET:randomBytes(32).toString('hex'),CRON_SECRET:randomBytes(32).toString('hex'),LAUNCH_APPROVED:'false',CLIENT_IP_MODE:'shared',NOTIFICATION_PROVIDER:'none'};
writeFileSync('.env.local',Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});
console.log('Created ignored .env.local using local-only credentials. No secrets printed.');
