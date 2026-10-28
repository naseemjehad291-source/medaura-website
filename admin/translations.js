import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.MEDAURA_SUPABASE, db=createClient(cfg.url,cfg.publishableKey);
const $=id=>document.getElementById(id);
const clean=s=>String(s??'').trim();
let map={},source=new Set();
function collect(obj){if(!obj||typeof obj!=='object')return;for(const [k,v] of Object.entries(obj)){if(k.endsWith('_en')||k==='id'||k==='created_at'||k==='updated_at')continue;if(typeof v==='string'&&/[\u0600-\u06ff]/.test(v)&&v.length<=1200){source.add(v.trim())}else if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object')collect(v)}}
function row(ar){const div=document.createElement('div');div.className='pair';const left=document.createElement('div'),right=document.createElement('div'),l=document.createElement('label'),r=document.createElement('label'),a=document.createElement('textarea'),en=document.createElement('textarea');l.textContent='العربية';r.textContent='English';a.value=ar;a.readOnly=true;en.value=map[ar]||'';en.dir='ltr';en.dataset.ar=ar;left.append(l,a);right.append(r,en);div.append(left,right);return div}
function sync(){for(const el of document.querySelectorAll('[data-ar]')){const ar=el.dataset.ar,value=clean(el.value);if(value)map[ar]=value;else delete map[ar]}}
function draw(){const q=clean($('filter').value).toLowerCase();const list=[...new Set([...source,...Object.keys(map)])].filter(ar=>ar.toLowerCase().includes(q));$('pairs').replaceChildren(...list.map(row));$('status').textContent=`${list.length} نص متاح للترجمة`}
async function load(){const {data:{user}}=await db.auth.getUser();if(!user)throw Error('يجب تسجيل الدخول أولًا');const {data:role,error:e}=await db.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();if(e||role?.role!=='super_admin')throw Error('هذه الصفحة مخصصة لحساب Super Admin فقط');
const {data:settings,error}=await db.from('site_settings').select('key,value');if(error)throw error;
const raw=settings.find(x=>x.key==='publicTranslationsEN')?.value;try{map=JSON.parse(raw||'{}')||{}}catch{map={}}
for(const x of settings){if(x.key==='publicTranslationsEN')continue;if(x.key==='resourcesJSON'){try{collect(JSON.parse(x.value))}catch{}}else if(typeof x.value==='string'&&/[\u0600-\u06ff]/.test(x.value))source.add(x.value.trim())}
for(const table of ['courses','events','team_members','gallery_albums','work_posts']){try{const {data}=await db.from(table).select('*').limit(300);(data||[]).forEach(collect)}catch{}}
$('editor').hidden=false;draw()}
$('filter').addEventListener('input',()=>{sync();draw()});
$('add').onclick=()=>{sync();const ar=clean($('new-ar').value),en=clean($('new-en').value);if(!ar||!en){$('status').textContent='أدخل النص العربي والإنجليزي';return}map[ar]=en;source.add(ar);$('new-ar').value='';$('new-en').value='';$('filter').value='';draw()};
$('save').onclick=async()=>{sync();const btn=$('save');btn.disabled=true;$('status').textContent='جارٍ الحفظ...';try{const {data:{user}}=await db.auth.getUser();if(!user)throw Error('سجّل الدخول');const {data:role}=await db.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();if(role?.role!=='super_admin')throw Error('غير مصرح');const {error}=await db.from('site_settings').upsert({key:'publicTranslationsEN',value:JSON.stringify(map)},{onConflict:'key'});if(error)throw error;$('status').textContent='تم حفظ الترجمات بنجاح. افتح الموقع وبدّل إلى EN.'}catch(e){$('status').textContent='تعذر الحفظ: '+e.message}finally{btn.disabled=false}};
load().catch(e=>$('status').textContent='تعذر فتح الصفحة: '+e.message);
