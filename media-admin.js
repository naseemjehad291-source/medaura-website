import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.MEDAURA_SUPABASE;
const db=createClient(cfg.url,cfg.publishableKey);
const panel=document.getElementById('v2-panel');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function isSuper(){const {data:{user}}=await db.auth.getUser();if(!user)return false;const r=await db.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();return r.data?.role==='super_admin';}
async function call(action,payload={}){const {data:{session}}=await db.auth.getSession();if(!session)throw Error('يرجى تسجيل الدخول');const res=await fetch(`${cfg.url}/functions/v1/media-users`,{method:'POST',headers:{'content-type':'application/json','apikey':cfg.publishableKey,'authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action,...payload})});const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||'تعذر تنفيذ العملية');return data;}
function openPanel(title,html){$('legacy-panels').hidden=true;panel.hidden=false;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed','false'));panel.innerHTML=`<h2>${title}</h2>${html}`;}
async function users(){openPanel('إدارة الإعلاميين',`<p class="muted">حسابان للجنة الإعلامية. يستخدمان نفس زر تسجيل الدخول في الموقع.</p><p id="media-notice" role="status"></p><form id="media-create"><div class="row"><div><label>البريد الإلكتروني</label><input name="email" type="email" required></div><div><label>الاسم الظاهر</label><input name="display_name" maxlength="80" required></div></div><label>كلمة المرور الأولية</label><input name="password" type="password" autocomplete="new-password" minlength="12" required><p><button>إنشاء حساب إعلامي</button></p></form><hr><div id="media-list">جارٍ التحميل...</div>`);
const notice=$('media-notice');const refresh=async()=>{const data=await call('list');$('media-list').replaceChildren();for(const u of data.users||[]){const row=document.createElement('div');row.className='item';const info=document.createElement('div');info.textContent=`${u.display_name} · ${u.email} · ${u.disabled?'معطّل':'نشط'}`;const actions=document.createElement('div');for(const [label,action] of [['تغيير الاسم','rename'],['تعيين كلمة مرور','password'],[u.disabled?'تفعيل':'تعطيل','toggle']]){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.onclick=async()=>{try{let payload={user_id:u.user_id};if(action==='rename'){const name=prompt('الاسم الجديد',u.display_name);if(name===null)return;payload.display_name=name;}if(action==='password'){const dialog=document.createElement('dialog');dialog.innerHTML='<form method="dialog"><label>كلمة المرور الجديدة (12 حرفًا على الأقل)</label><input type="password" minlength="12" autocomplete="new-password" required><div class="toolbar"><button value="save">تغيير</button><button class="secondary" value="cancel" formnovalidate>إلغاء</button></div></form>';document.body.append(dialog);dialog.showModal();const result=await new Promise(resolve=>{dialog.addEventListener('close',()=>resolve({choice:dialog.returnValue,password:dialog.querySelector('input').value}),{once:true})});dialog.remove();if(result.choice!=='save')return;payload.password=result.password;}if(action==='toggle'){if(!confirm(`تأكيد ${u.disabled?'تفعيل':'تعطيل'} الحساب؟`))return;payload.disabled=!u.disabled;}await call(action,payload);notice.textContent='تم التحديث';await refresh();}catch(e){notice.textContent=e.message;}};actions.append(b);}row.append(info,actions);$('media-list').append(row);}if(!data.users?.length)$('media-list').textContent='لا توجد حسابات إعلامية بعد.';};
$('media-create').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const f=new FormData(e.currentTarget);await call('create',{email:f.get('email'),display_name:f.get('display_name'),password:f.get('password')});e.currentTarget.reset();notice.textContent='تم إنشاء الحساب';await refresh();}catch(err){notice.textContent=err.message;}finally{b.disabled=false;}};
try{await refresh();}catch(e){notice.textContent=e.message;}}
const fieldLabels={title:'عنوان العمل',excerpt:'النبذة',activity_date:'تاريخ النشاط',location:'المكان',cover_url:'صورة الغلاف',display_order:'ترتيب العرض',is_published:'حالة النشر',blocks:'محتوى المقالة',album_id:'الألبوم',caption:'وصف الصورة',image_url:'الصورة',url:'الرابط',name:'الاسم',description:'الوصف',is_cover:'صورة الغلاف'};
const tableLabels={work_posts:'عمل',gallery_albums:'ألبوم',gallery_photos:'صورة'};
const actionLabels={INSERT:'أضاف',UPDATE:'عدّل',DELETE:'حذف'};
function readableValue(key,value){if(value===null||value===undefined||value==='')return 'فارغ';if(key==='is_published')return value?'منشور':'مسودة';if(typeof value==='boolean')return value?'نعم':'لا';if(key==='blocks')return Array.isArray(value)?`محتوى المقالة (${value.length} عناصر)`:'محتوى المقالة';if(key==='cover_url'||key==='image_url'||key==='url')return value?'رابط أو صورة مرفقة':'فارغ';if(typeof value==='object')return 'بيانات مركّبة';return String(value).slice(0,250);}
function addText(parent,tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent.append(el);return el;}
function changedFields(oldData,newData){const old=oldData&&typeof oldData==='object'?oldData:{};const next=newData&&typeof newData==='object'?newData:{};return Object.keys(fieldLabels).filter(key=>Object.hasOwn(old,key)&&Object.hasOwn(next,key)&&JSON.stringify(old[key])!==JSON.stringify(next[key]));}
async function activity(){
 openPanel('سجل النشاط',`<p class="muted">سجل واضح للإضافات والتعديلات والحذف في أعمالنا. رفع وحذف ملفات Storage مباشرةً ليس مشمولًا بعد.</p><div id="activity-list">جارٍ التحميل...</div>`);
 const host=$('activity-list');
 const [logs,profiles]=await Promise.all([
  db.from('admin_activity_log').select('id,actor_id,action,table_name,record_id,old_data,new_data,created_at').order('created_at',{ascending:false}).limit(100),
  db.from('media_admin_profiles').select('user_id,display_name')
 ]);
 if(logs.error){host.textContent='تعذر عرض سجل النشاط: '+logs.error.message;return;}
 const names=new Map((profiles.data||[]).map(p=>[p.user_id,p.display_name]));
 host.replaceChildren();
 for(const entry of logs.data||[]){
  const card=document.createElement('div');card.className='v5-resource';
  const before=entry.old_data&&typeof entry.old_data==='object'?entry.old_data:{};
  const after=entry.new_data&&typeof entry.new_data==='object'?entry.new_data:{};
  const title=after.title||before.title||after.name||before.name||after.caption||before.caption||null;
  const actor=entry.actor_id?(names.get(entry.actor_id)||'مدير الموقع أو مستخدم سابق'):'مستخدم غير محدد';
  const verb=actionLabels[entry.action]||'أجرى عملية على';
  const type=tableLabels[entry.table_name]||'عنصر';
  addText(card,'strong',`${actor} ${verb} ${type}${title?' «'+String(title).slice(0,130)+'»':''}`);
  addText(card,'div',new Date(entry.created_at).toLocaleString('ar'),'muted');
  if(entry.action==='UPDATE'){
   const changes=changedFields(before,after);
   if(!changes.length)addText(card,'p','لم تتوفر تفاصيل حقول قابلة للعرض لهذا التعديل.','muted');
   for(const key of changes){
    const line=document.createElement('p');line.style.margin='8px 0';
    addText(line,'strong',(fieldLabels[key]||key)+': ');
    if(key==='blocks'){
     addText(line,'span','تم تعديل محتوى المقالة (نصوص أو صور أو ترتيب العناصر)');
    }else{
     addText(line,'span',`من «${readableValue(key,before[key])}» إلى «${readableValue(key,after[key])}»`);
    }
    card.append(line);
   }
  }else if(entry.action==='INSERT'){
   addText(card,'p',after.is_published===true?'أُضيف المحتوى بحالة منشور.':'تمت إضافة العنصر.','muted');
  }else if(entry.action==='DELETE'){
   addText(card,'p','تم حذف العنصر.','muted');
  }
  host.append(card);
 }
 if(!logs.data?.length)host.textContent='لا يوجد نشاط مسجّل بعد.';
 if(profiles.error)addText(host,'p','تعذر جلب أسماء الإعلاميين؛ قد تظهر تسميات عامة بدل الأسماء.','muted');
}
async function init(){if(!(await isSuper()))return;for(const id of ['media-users-tab','activity-tab'])$(id).hidden=false;$('media-users-tab').onclick=()=>users();$('activity-tab').onclick=()=>activity();}
// Refresh after authentication, without affecting existing login flow.
db.auth.onAuthStateChange(()=>{setTimeout(init,0)});init();
