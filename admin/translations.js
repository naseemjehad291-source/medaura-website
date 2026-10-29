import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const c=window.MEDAURA_SUPABASE,db=createClient(c.url,c.publishableKey),$=id=>document.getElementById(id);
let user=null,rows=[],localizations=new Map(),drafts=new Map(),saving=new Set();
const fields={
 home:[['heroSubtitle','وصف الرئيسية'],['impactLabel','وصف عدد المستفيدين'],['homePathHeading','عنوان المسار'],['homePathDescription','وصف المسار'],['homeCoursesHeading','عنوان الدورات'],['homeWorkHeading','عنوان أعمالنا'],['homeWorkDescription','وصف أعمالنا'],['homeJoinHeading','عنوان الانضمام'],['homeJoinDescription','وصف الانضمام']],
 about:[['aboutSubtitle','وصف من نحن'],['aboutHeading','العنوان الرئيسي'],['aboutIntro','تعريف الفريق'],['vision','الرؤية'],['mission','الرسالة'],['values','القيم'],['educationalMethod','المنهج التعليمي'],['teamIntro','مقدمة الأعضاء']],
 courses:[['coursesIntro','مقدمة الدورات']],library:[['resourcesIntro','مقدمة المكتبة']],
 join:[['joinIntro','مقدمة الانضمام'],['joinHeading','عنوان الانضمام'],['joinDescription','وصف الانضمام'],...['volunteer','membership','trainer','partner'].flatMap(x=>[['join_'+x+'_title',x+' عنوان'],['join_'+x+'_description',x+' وصف'],['join_'+x+'_button',x+' زر']])],
 contact:[['contactIntro','مقدمة التواصل'],['contactChannelsHeading','عنوان القنوات'],['contactPartnerHeading','عنوان الشراكات']]
};
const key=r=>[r.entity_type,r.entity_id,r.field_name].join('::');
const say=t=>$('status').textContent=t;
async function init(){const {data:{user:u}}=await db.auth.getUser();user=u;$('editor').hidden=true;if(!u){window.location.replace('index.html');return}
const [{data:role},{data:editor}]=await Promise.all([db.from('admin_roles').select('role').eq('user_id',u.id).maybeSingle(),db.from('medaura_translation_editors').select('user_id').eq('user_id',u.id).maybeSingle()]);
if(role?.role!=='super_admin'&&!editor){say('هذا الحساب غير مخوّل للترجمة.');return}
$('editor').hidden=false;await refresh();}
async function refresh(){say('جارٍ تحميل المحتوى...');const queries=[
 db.from('site_settings').select('key,value'),db.from('courses').select('id,title,description,instructor'),db.from('events').select('id,title,description'),db.from('team_members').select('id,name,position,bio'),db.from('medaura_content_localizations').select('*'),db.from('work_posts').select('id,title,excerpt,blocks'),];
const results=await Promise.all(queries);if(results[0].error)throw results[0].error;
if(results[4].error)throw Error('شغّل ملف TRANSLATION-CONTENT-SQL.sql في Supabase أولًا: '+results[4].error.message);
localizations=new Map((results[4].data||[]).map(x=>[key(x),x]));rows=[];
const settings=Object.fromEntries((results[0].data||[]).map(x=>[x.key,x.value]));
for(const [section,list] of Object.entries(fields))for(const [field,label] of list){const ar=settings[field];if(typeof ar==='string'&&ar.trim())rows.push({entity_type:'site_settings',entity_id:field,field_name:field,ar,label,section});}
let resourceItems=[];try{const raw=settings.resourcesJSON;resourceItems=typeof raw==='string'?JSON.parse(raw||'[]'):(Array.isArray(raw)?raw:[]);if(!Array.isArray(resourceItems))resourceItems=[];}catch{}
for(const [i,item] of resourceItems.entries())for(const [field,label] of [['title','اسم المورد'],['cat','تصنيف المورد'],['type','نوع المورد']]){if(typeof item[field]==='string'&&item[field].trim())rows.push({entity_type:'resources',entity_id:String(i),field_name:field,ar:item[field],label,section:'المكتبة الطبية — الموارد',context:item.title||''});}
const workResult=results[5];if(workResult.error)console.warn('Work translations unavailable:',workResult.error.message);if(!workResult.error)for(const item of workResult.data||[]){for(const [field,label] of [['title','عنوان العمل'],['excerpt','وصف العمل']])if(typeof item[field]==='string'&&item[field].trim())rows.push({entity_type:'work_posts',entity_id:String(item.id),field_name:field,ar:item[field],label,section:'أعمالنا',context:item.title||''});for(const [i,b] of (Array.isArray(item.blocks)?item.blocks:[]).entries())for(const field of ['text','caption'])if(typeof b[field]==='string'&&b[field].trim())rows.push({entity_type:'work_posts',entity_id:String(item.id),field_name:`blocks:${i}:${field}`,ar:b[field],label:field==='text'?'نص المحتوى':'تعليق الصورة',section:'أعمالنا',context:item.title||''});}
for(const [type,section,allowed] of [['courses','الدورات',[['title','عنوان الدورة'],['description','وصف الدورة'],['instructor','اسم المحاضر']]],['events','الفعاليات',[['title','العنوان'],['description','الوصف']]],['team_members','أعضاء الفريق',[['name','الاسم'],['position','الدور'],['bio','التعريف']]]]){
const result=results[['courses','events','team_members'].indexOf(type)+1];if(result.error){say('تعذر تحميل '+section+': '+result.error.message);continue}
for(const item of result.data||[])for(const [field,label] of allowed){const ar=item[field];if(typeof ar==='string'&&ar.trim())rows.push({entity_type:type,entity_id:String(item.id),field_name:field,ar,label,section,context:item.title||item.name||''});}}
render();say('تم تحميل '+rows.length+' حقلًا نصيًا. المحتوى الجديد يظهر عند التحديث.');}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function render(){
 const q=$('search').value.trim().toLowerCase(),box=$('list');box.replaceChildren();let previous='',count=0;
 for(const r of rows.filter(x=>!q||[x.ar,x.label,x.section,x.context].some(v=>String(v).toLowerCase().includes(q)))){
  count++;if(previous!==r.section){previous=r.section;box.append(el('h3','section-heading',previous));}
  const k=key(r),loc=localizations.get(k),draft=drafts.get(k),card=el('article','translation-row');
  const head=el('div','translation-head');const meta=el('div','translation-meta');meta.append(el('strong','field-title',r.label),el('span','field-context',r.context||r.section));
  const state=el('span','state '+(loc?.translation_en?(loc.source_snapshot===r.ar?'done':'review'):'pending'),loc?.translation_en?(loc.source_snapshot===r.ar?'مترجم':'يحتاج مراجعة'):'بانتظار الترجمة');head.append(meta,state);
  const grid=el('div','inline-grid');
  const arPanel=el('div','language-box');const arLabel=el('label','lang-label','العربية');const ar=el('textarea','inline-text');ar.dir='rtl';ar.lang='ar';ar.value=draft?.ar??r.ar;ar.setAttribute('aria-label','النص العربي: '+r.label);ar.rows=3;
  const enPanel=el('div','language-box');const enLabel=el('label','lang-label','English');const en=el('textarea','inline-text');en.dir='ltr';en.lang='en';en.value=draft?.en??loc?.translation_en??'';en.placeholder='Write the English translation…';en.setAttribute('aria-label','English translation: '+r.label);en.rows=3;
  arPanel.append(arLabel,ar);enPanel.append(enLabel,en);grid.append(arPanel,enPanel);
  const foot=el('div','row-footer'),hint=el('span','row-hint','التغييرات تُحفظ عند الضغط على حفظ');const save=el('button','save-btn','حفظ التعديل');save.type='button';
  const dirty=()=>{drafts.set(k,{ar:ar.value,en:en.value});save.classList.add('unsaved');hint.textContent='تعديلات غير محفوظة';};ar.addEventListener('input',dirty);en.addEventListener('input',dirty);
  save.disabled=saving.has(k);if(saving.has(k))save.textContent='جارٍ الحفظ…';
  save.onclick=async()=>{const arValue=ar.value.trim(),enValue=en.value.trim();if(!arValue){hint.textContent='النص العربي لا يمكن أن يكون فارغًا';hint.className='row-hint error';ar.focus();return;}
   if(saving.has(k))return;saving.add(k);save.disabled=true;save.textContent='جارٍ الحفظ…';hint.textContent='';
   const {error}=await db.rpc(['resources','work_posts'].includes(r.entity_type)?'medaura_save_extended_translation':'medaura_save_localized_content',{p_entity_type:r.entity_type,p_entity_id:r.entity_id,p_field:r.field_name,p_ar:arValue,p_en:enValue});
   saving.delete(k);save.disabled=false;save.textContent='حفظ التعديل';
   if(error){hint.textContent='تعذر الحفظ: '+error.message;hint.className='row-hint error';return;}
   r.ar=arValue;localizations.set(k,{source_snapshot:arValue,translation_en:enValue});drafts.delete(k);save.classList.remove('unsaved');hint.textContent='✓ تم الحفظ في Supabase';hint.className='row-hint success';state.textContent=enValue?'مترجم':'بانتظار الترجمة';state.className='state '+(enValue?'done':'pending');say('تم حفظ '+r.label+' بنجاح.');
  };
  foot.append(hint,save);card.append(head,grid,foot);box.append(card);
 }
 if(!count)box.append(el('p','empty','لا توجد نصوص مطابقة للبحث.'));
}
$('reload').onclick=()=>{drafts.clear();refresh().catch(e=>say(e.message))};$('search').oninput=render;
$('sign-out').onclick=async()=>{const btn=$('sign-out');btn.disabled=true;say('جارٍ تسجيل الخروج...');const {error}=await db.auth.signOut();if(error){btn.disabled=false;say('تعذر تسجيل الخروج: '+error.message);return;}window.location.replace('index.html');};init().catch(e=>say('تعذر فتح لوحة الترجمة: '+e.message));
