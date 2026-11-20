import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
process.loadEnvFile('.env.local');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(!url||!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))throw new Error('This command only permits local Supabase.');
if(existsSync('.local-admin.json'))throw new Error('Local admin file exists. Do not overwrite credentials.');
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const email='admin@fdeclub.local';
const password=randomBytes(24).toString('base64url');
const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'本地运营管理员'}});
if(error)throw new Error('Could not create local administrator; inspect local Auth setup.');
const result=await db.from('profiles').update({role:'super_admin'}).eq('id',data.user.id);
if(result.error){await db.auth.admin.deleteUser(data.user.id);throw new Error('Could not assign administrator role.');}
writeFileSync('.local-admin.json',JSON.stringify({email,password,login:'http://localhost:3000/login'},null,2),{mode:0o600});
console.log('Local administrator created. Credentials saved only in ignored .local-admin.json (0600).');
