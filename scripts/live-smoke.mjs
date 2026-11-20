import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.env.local');
const apiUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,origin=process.env.NEXT_PUBLIC_SITE_URL;
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(apiUrl||'')||!/^http:\/\/(127\.0\.0\.1|localhost):/.test(origin||''))throw new Error('Live smoke test permits local services only.');
const db=createClient(apiUrl,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const prefix=`验收测试-${randomUUID().slice(0,8)}`;
const password=randomBytes(24).toString('base64url');
const userIds=[],created=[];
let browser;
async function http(context,path,data){const response=await context.request.post(origin+path,{headers:{Origin:origin},data});const body=await response.json();assert(response.ok(),`${path}: ${response.status()} ${body.error||''}`);return body;}
try{
 const {data:auth,error}=await db.auth.admin.createUser({email:`smoke-${randomUUID()}@example.test`,password,email_confirm:true,user_metadata:{full_name:prefix}});assert.ifError(error);userIds.push(auth.user.id);
 assert.ifError((await db.from('profiles').update({role:'super_admin'}).eq('id',auth.user.id)).error);
 browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/enterprise');
 await page.getByLabel('企业名称').fill(prefix);
 await page.getByLabel('所属行业').selectOption('制造业');await page.getByLabel('企业规模').selectOption('50人以下');await page.getByLabel('联系人').fill('自动测试联系人');await page.getByLabel('手机号或邮箱').fill('smoke@example.test');await page.getByLabel('所在城市').fill('上海');await page.getByLabel('当前业务痛点').fill('自动化验收使用的测试需求');await page.getByLabel('希望达成的目标').fill('确认提交与数据库闭环正常');await page.getByLabel('预算区间').selectOption('暂未明确');await page.getByLabel('启动周期').selectOption('先沟通了解');await page.getByLabel('从哪里了解我们').selectOption('官网访问');await page.getByRole('checkbox').check();
 const submitted=page.waitForResponse(r=>r.url().endsWith('/api/applications'));await page.getByRole('button',{name:'提交企业AI需求'}).click();const submittedResponse=await submitted;assert.equal(submittedResponse.status(),201);const lead=(await submittedResponse.json()).id;created.push(['enterprise_leads',lead]);await page.getByText('我们已收到你的资料').waitFor();
 const common={contact_name:'自动测试联系人',contact:'smoke@example.test',city_name:'上海',consent:true};
 const city=(await http(context,'/api/applications',{kind:'city',data:{...common,organization:prefix,identity:'企业负责人',resources:'自动测试本地企业资源',experience:'自动测试活动组织经验',vision:'自动测试城市共建设想'}})).id;created.push(['city_applications',city]);
 const partner=(await http(context,'/api/applications',{kind:'partner',data:{...common,institution_type:'产业园区',organization:prefix,direction:'产业活动联合举办',resources:'自动测试活动场地资源',vision:'自动测试机构合作目标'}})).id;created.push(['partner_applications',partner]);
 console.log('PASS: three P0 forms persisted through real HTTP + Supabase.');
 await http(context,'/api/auth',{mode:'password',email:auth.user.email,password});
 for(const section of ['enterprise','city','partner']){await page.goto(origin+`/admin?section=${section}`);await page.getByText(prefix,{exact:true}).first().waitFor();}
 await http(context,'/api/admin/action',{action:'update',kind:'enterprise',id:lead,patch:{status:'triaged',assigned_to:auth.user.id,tags:['验收测试']}});
 await http(context,'/api/admin/action',{action:'note',id:lead,note:'通过真实接口完成跟进记录验证'});
 for(const status of ['review','interview','approved'])await http(context,'/api/admin/action',{action:'update',kind:'city',id:city,patch:{status}});
 await http(context,'/api/admin/action',{action:'update',kind:'partner',id:partner,patch:{status:'review',note:'通过真实接口完成机构合作验证'}});
 const leads=await db.from('enterprise_leads').select('status,source_channel,created_at').eq('id',lead).single();assert.ifError(leads.error);assert.equal(leads.data.status,'triaged');assert.equal(leads.data.source_channel,'官网访问');assert(leads.data.created_at);
 const audits=await db.from('audit_logs').select('id').eq('record_id',lead);assert(audits.data.length>=2);
 const csv=await context.request.get(origin+`/api/admin/export?q=${encodeURIComponent(prefix)}`);assert(csv.ok());assert((await csv.text()).includes(prefix));
 console.log('PASS: authenticated admin visibility, workflows, follow-up, audit, and CSV.');
 const {data:cities}=await db.from('cities').select('id').eq('slug','shanghai').single();
 const slug=`smoke-${randomUUID().slice(0,8)}`;
 await http(context,'/api/admin/action',{action:'update',kind:'event',id:null,patch:{slug,title:prefix,status:'draft'}});
 const {data:event}=await db.from('events').select('id').eq('slug',slug).single();created.push(['events',event.id]);
 const starts=new Date(Date.now()+24*3600*1000),ends=new Date(Date.now()+26*3600*1000),deadline=new Date(Date.now()+20*3600*1000);
 await http(context,'/api/admin/action',{action:'update',kind:'event',id:event.id,patch:{city_id:cities.id,location:'仅本地验收测试场地',organizer:'本地测试主办',audience:'自动化测试账号',starts_at:starts.toISOString(),ends_at:ends.toISOString(),registration_deadline:deadline.toISOString(),capacity:1,description:'自动化验收活动，测试后清理。',status:'published'}});
 await page.goto(origin+`/events/${slug}`);await page.getByRole('heading',{name:prefix,exact:true}).waitFor();
 await http(context,`/api/events/${event.id}`,{action:'register',contact_name:'自动测试',contact:'smoke@example.test',consent:true});
 await http(context,`/api/events/${event.id}`,{action:'cancel'});
 await page.setViewportSize({width:375,height:812});await page.reload();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.setViewportSize({width:1440,height:1000});await page.goto(origin+'/admin?section=enterprise');await page.locator('.admin-record').filter({hasText:prefix}).locator('summary').click();await page.screenshot({path:'docs/admin-preview.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: real event publication, public details, registration/cancellation, mobile detail.');
}finally{
 if(browser)await browser.close();
 for(const [table,id] of created.reverse()){if(table==='city_applications')await db.from('city_members').delete().eq('application_id',id);await db.from(table).delete().eq('id',id);await db.from('notification_outbox').delete().eq('entity_id',id);}
 for(const id of userIds)await db.auth.admin.deleteUser(id);
 console.log('Local test records and temporary accounts cleaned.');
}
