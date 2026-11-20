// Production validation: uses explicit synthetic records and removes them in finally.
import {readFileSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('/opt/fdeclub/shared/app.env');
const origin='https://fdeclub.net',gateway=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=JSON.parse(readFileSync('/opt/fdeclub/shared/admin-credentials.json','utf8'));
const service={apikey:key,authorization:'Bearer '+key,'Content-Type':'application/json'};
const marker='上线验证-'+randomUUID().slice(0,8),records=[],users=[];
let cookie='';
async function rest(path,{method='GET',body,token=key}={}){const r=await fetch(gateway+'/rest/v1/'+path,{method,headers:{apikey:anon,authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});const t=await r.text();assert(r.ok,`REST ${path.split('?')[0]} failed ${r.status}: ${t.slice(0,150)}`);return t?JSON.parse(t):null;}
async function post(path,body,authenticated=true){const r=await fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(authenticated?{cookie}: {})},body:JSON.stringify(body)});const data=await r.json();assert(r.ok,`${path} failed ${r.status}: ${data.error||''}`);return data;}
async function testUser(role){const email=`deploy-${randomUUID()}@example.test`,password=randomBytes(24).toString('base64url');const r=await fetch(gateway+'/auth/v1/admin/users',{method:'POST',headers:service,body:JSON.stringify({email,password,email_confirm:true})});assert(r.ok);const user=await r.json();users.push(user.id);await rest('profiles?id=eq.'+user.id,{method:'PATCH',body:{role}});const login=await fetch(gateway+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const session=await login.json();assert(session.access_token);return {id:user.id,token:session.access_token};}
try{
 const unauth=await fetch(origin+'/api/admin/export',{redirect:'manual'});assert([401,403].includes(unauth.status));
 const login=await fetch(origin+'/api/auth',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({mode:'password',...admin})});assert(login.ok,'Admin login failed');const cookies=login.headers.getSetCookie();assert(cookies.length);assert(cookies.every(c=>c.includes('HttpOnly')&&c.includes('Secure')));cookie=cookies.map(c=>c.split(';')[0]).join('; ');
 const common={city_name:'上海',contact_name:'部署验证',contact:'deployment-check@example.test',consent:true};
 const enterprise={...common,company:marker,industry:'制造业',company_size:'50人以下',pain_points:'部署验证临时记录，请忽略',goals:'验证正式数据库业务闭环',budget:'暂未明确',timeline:'先沟通了解',source_channel:'官网访问'};
 const lead=(await post('/api/applications',{kind:'enterprise',data:enterprise},false)).id;records.push(['enterprise_leads',lead]);
 const city=(await post('/api/applications',{kind:'city',data:{...common,organization:marker,identity:'企业负责人',resources:'上线验证临时资源说明',experience:'上线验证临时经验说明',vision:'上线验证临时合作设想'}},false)).id;records.push(['city_applications',city]);
 const partner=(await post('/api/applications',{kind:'partner',data:{...common,organization:marker,institution_type:'产业园区',direction:'产业活动联合举办',resources:'上线验证临时资源说明',vision:'上线验证临时合作设想'}},false)).id;records.push(['partner_applications',partner]);
 for(const section of ['enterprise','city','partner']){const r=await fetch(origin+'/admin?section='+section,{headers:{cookie}});assert(r.ok);assert((await r.text()).includes(marker));}
 await post('/api/admin/action',{action:'update',kind:'enterprise',id:lead,patch:{status:'triaged'}});
 await post('/api/admin/action',{action:'note',id:lead,note:'部署验证：数据库写入、鉴权和操作审计正常。'});
 for(const status of ['review','interview','approved'])await post('/api/admin/action',{action:'update',kind:'city',id:city,patch:{status}});
 await post('/api/admin/action',{action:'update',kind:'partner',id:partner,patch:{status:'review',note:'部署验证记录'}});
 const [saved]=await rest('enterprise_leads?id=eq.'+lead);assert.equal(saved.status,'triaged');assert(saved.created_at&&saved.source_channel);
 const audit=await rest('audit_logs?record_id=eq.'+lead);assert(audit.length>=2);
 const anonymous=await fetch(gateway+'/rest/v1/enterprise_leads?select=id',{headers:{apikey:anon,authorization:'Bearer '+anon}});assert([401,403].includes(anonymous.status));
 const member=await testUser('member');assert.equal((await rest('enterprise_leads?select=id',{token:member.token})).length,0);
 const manager=await testUser('city_manager');
 const [shanghai]=await rest('cities?slug=eq.shanghai&select=id');
 const [membership]=await rest('city_members',{method:'POST',body:{city_id:shanghai.id,user_id:manager.id,application_id:city,status:'active'}});records.push(['city_members',membership.id]);
 assert.equal((await rest('enterprise_leads?select=id',{token:manager.token})).length,0);
 await post('/api/admin/action',{action:'update',kind:'enterprise',id:lead,patch:{assigned_to:manager.id}});
 const foreign=(await post('/api/applications',{kind:'enterprise',data:{...enterprise,company:marker+'-跨城',city_name:'北京'}},false)).id;records.push(['enterprise_leads',foreign]);
 const visible=await rest('enterprise_leads?select=id',{token:manager.token});assert.deepEqual(visible.map(x=>x.id),[lead]);
 const csv=await fetch(origin+'/api/admin/export?q='+encodeURIComponent(marker),{headers:{cookie}});assert(csv.ok);assert((await csv.text()).includes(marker));
 const denial=await fetch(origin+'/api/applications',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(denial.status,403);
 console.log('PASS: HTTPS, anonymous admin denial, secure admin cookies, three P0 forms persisted, admin visibility, state changes, city approval, follow-up, CSV, audit, member isolation, assigned city manager isolation, and CSRF rejection.');
}finally{
 for(const [table,id] of records.reverse()){await rest(table+'?id=eq.'+id,{method:'DELETE'});await rest('notification_outbox?entity_id=eq.'+id,{method:'DELETE'});}
 for(const id of users){const r=await fetch(gateway+'/auth/v1/admin/users/'+id,{method:'DELETE',headers:service});assert(r.ok);}
 console.log('Temporary validation records removed. Security audit history retained.');
}
