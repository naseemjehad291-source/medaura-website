import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const c=window.MEDAURA_SUPABASE,db=createClient(c.url,c.publishableKey),$=id=>document.getElementById(id);
let user=null,rows=[],selected=null,localizations=new Map();
const fields={
 home:[['heroSubtitle','وصف الرئيسية'],['impactLabel','وصف عدد المستفيدين'],['homePathHeading','عنوان المسار'],['homePathDescription','وصف المسار'],['homeCoursesHeading','عنوان الدورات'],['homeWorkHeading','عنوان أعمالنا'],['homeWorkDescription','وصف أعمالنا'],['homeJoinHeading','عنوان الانضمام'],['homeJoinDescription','وصف الانضمام']],
 about:[['aboutSubtitle','وصف من نحن'],['aboutHeading','العنوان الرئيسي'],['aboutIntro','تعريف الفريق'],['vision','الرؤية'],['mission','الرسالة'],['values','القيم'],['educationalMethod','المنهج التعليمي'],['teamIntro','مقدمة الأعضاء']],
 courses:[['coursesIntro','مقدمة الدورات']],library:[['resourcesIntro','مقدمة المكتبة']],
 join:[['joinIntro','مقدمة الانضمام'],['joinHeading','عنوان الانضمام'],['joinDescription','وصف الانضمام'],...['volunteer','membership','trainer','partner'].flatMap(x=>[['join_'+x+'_title',x+' عنوان'],['join_'+x+'_description',x+' وصف'],['join_'+x+'_button',x+' زر']])],
 contact:[['contactIntro','مقدمة التواصل'],['contactChannelsHeading','عنوان القنوات'],['contactPartnerHeading','عنوان الشراكات']]
};
const key=r=>[r.entity_type,r.entity_id,r.field_name].join('::');
const say=t=>$('status').textContent=t;
async function init(){const {data:{user:u}}=await db.auth.getUser();user=u;$('login').hidden=false;$('editor').hidden=true;if(!u){say('سجّل الدخول بحساب Translation Admin أو Super Admin.');return}
const [{data:role},{data:editor}]=await Promise.all([db.from('admin_roles').select('role').eq('user_id',u.id).maybeSingle(),db.from('medaura_translation_editors').select('user_id').eq('user_id',u.id).maybeSingle()]);
if(role?.role!=='super_admin'&&!editor){say('هذا الحساب غير مخوّل للترجمة.');return}
$('login').hidden=true;$('editor').hidden=false;await refresh();}
async function refresh(){say('جارٍ تحميل المحتوى...');const queries=[
 db.from('site_settings').select('key,value'),db.from('courses').select('id,title,description,instructor'),db.from('events').select('id,title,description'),db.from('team_members').select('id,name,position,bio'),db.from('medaura_content_localizations').select('*')];
const results=await Promise.all(queries);if(results[0].error)throw results[0].error;
if(results[4].error)throw Error('شغّل ملف TRANSLATION-CONTENT-SQL.sql في Supabase أولًا: '+results[4].error.message);
localizations=new Map((results[4].data||[]).map(x=>[key(x),x]));rows=[];
const settings=Object.fromEntries((results[0].data||[]).map(x=>[x.key,x.value]));
for(const [section,list] of Object.entries(fields))for(const [field,label] of list){const ar=settings[field];if(typeof ar==='string'&&ar.trim())rows.push({entity_type:'site_settings',entity_id:field,field_name:field,ar,label,section});}
for(const [type,section,allowed] of [['courses','الدورات',[['title','عنوان الدورة'],['description','وصف الدورة'],['instructor','اسم المحاضر']]],['events','الفعاليات',[['title','العنوان'],['description','الوصف']]],['team_members','أعضاء الفريق',[['name','الاسم'],['position','الدور'],['bio','التعريف']]]]){
const result=results[['courses','events','team_members'].indexOf(type)+1];if(result.error){say('تعذر تحميل '+section+': '+result.error.message);continue}
for(const item of result.data||[])for(const [field,label] of allowed){const ar=item[field];if(typeof ar==='string'&&ar.trim())rows.push({entity_type:type,entity_id:String(item.id),field_name:field,ar,label,section,context:item.title||item.name||''});}}
render();say('تم تحميل '+rows.length+' حقلًا نصيًا. المحتوى الجديد يظهر عند التحديث.');}
function render(){const q=$('search').value.trim().toLowerCase(),box=$('list');box.replaceChildren();let previous='';for(const r of rows.filter(x=>!q||[x.ar,x.label,x.section,x.context].some(v=>String(v).toLowerCase().includes(q)))){
if(previous!==r.section){previous=r.section;const h=document.createElement('h3');h.textContent=previous;h.className='section-heading';box.append(h)}
const item=document.createElement('div');item.className='item';const info=document.createElement('div');const loc=localizations.get(key(r));const name=document.createElement('strong');name.textContent=r.label+(r.context?' — '+r.context:'');const ar=document.createElement('p');ar.textContent=r.ar;const badge=document.createElement('small');badge.textContent=loc?.translation_en?(loc.source_snapshot===r.ar?'✓ مترجم':'⚠ يحتاج مراجعة'):'بانتظار الترجمة';const b=document.createElement('button');b.textContent='تعديل وترجمة';b.onclick=()=>edit(r);info.append(name,ar,badge);item.append(info,b);box.append(item)}}
function edit(r){selected=r;const loc=localizations.get(key(r));$('edit-heading').textContent=r.label+' — '+r.section;$('edited-ar').value=r.ar;$('english').value=loc?.translation_en||'';$('edit-card').hidden=false;$('edit-card').scrollIntoView({behavior:'smooth'});}
$('save').onclick=async()=>{if(!selected)return;const ar=$('edited-ar').value.trim(),en=$('english').value.trim();$('save').disabled=true;$('save').textContent='جارٍ الحفظ...';if(!ar){say('النص العربي لا يمكن أن يكون فارغًا.');$('save').disabled=false;$('save').textContent='حفظ التعديل والترجمة';return}const {error}=await db.rpc('medaura_save_localized_content',{p_entity_type:selected.entity_type,p_entity_id:selected.entity_id,p_field:selected.field_name,p_ar:ar,p_en:en});$('save').disabled=false;$('save').textContent='حفظ التعديل والترجمة';if(error){say('فشل الحفظ: '+error.message);return}$('edit-card').hidden=true;selected=null;await refresh();say('✓ تم حفظ النص العربي والترجمة بنجاح.');};
$('cancel').onclick=()=>{$('edit-card').hidden=true;selected=null};$('reload').onclick=()=>refresh().catch(e=>say(e.message));$('search').oninput=render;
$('sign-in').onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)say(error.message);else init().catch(e=>say(e.message))};
$('sign-out').onclick=async()=>{await db.auth.signOut();init()};init().catch(e=>say('تعذر فتح لوحة الترجمة: '+e.message));
