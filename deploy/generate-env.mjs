import {randomBytes,createHmac} from 'node:crypto';
import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
const dir=process.argv[2];
if(!dir)throw Error('Pass the private shared config directory');
mkdirSync(dir,{recursive:true,mode:0o750});
if(existsSync(dir+'/app.env')||existsSync(dir+'/.env'))throw Error('Refusing to overwrite production secrets');
const secret=randomBytes(48).toString('hex');
function jwt(role){const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const p=Buffer.from(JSON.stringify({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+5*365*86400})).toString('base64url');return `${h}.${p}.${createHmac('sha256',secret).update(`${h}.${p}`).digest('base64url')}`;}
const app={NODE_ENV:'production',NEXT_PUBLIC_SITE_URL:'https://fdeclub.net',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:8016',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:jwt('anon'),SUPABASE_SERVICE_ROLE_KEY:jwt('service_role'),DATA_HASH_SECRET:randomBytes(48).toString('hex'),CRON_SECRET:randomBytes(48).toString('hex'),LAUNCH_APPROVED:'true',OPERATOR_NAME:'FDE前线（杭州集智光年科技有限公司）',PRIVACY_EMAIL:'fdechina@163.com',CONTACT_EMAIL:'fdechina@163.com',ICP_NUMBER:'浙ICP备2025181284号-8',CLIENT_IP_MODE:'trusted-proxy',NOTIFICATION_PROVIDER:'none',EMAIL_AUTH_ENABLED:'false',DATA_STORAGE_DESCRIPTION:'本站应用、身份认证与数据库部署于腾讯云上海地域，由运营方自托管 PostgreSQL、Supabase Auth 和 PostgREST。表单资料存储于中国境内，当前不向外部邮件或消息平台传输申请资料。服务器每日生成数据库备份，默认保留7天。'};
const text=Object.entries(app).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n';
writeFileSync(dir+'/app.env',text,{mode:0o640});
writeFileSync(dir+'/.env',`POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\nJWT_SECRET=${secret}\n`,{mode:0o600});
console.log('Production configuration generated without printing secrets.');
