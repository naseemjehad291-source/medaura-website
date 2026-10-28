
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const cfg=window.MEDAURA_SUPABASE;
const supabase=createClient(cfg.url,cfg.publishableKey,{
  auth:{
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:false
  }
});

const $=id=>document.getElementById(id);

let current='courses', rows=[],role=null;

const opts={
  courses:[
    ['draft','مسودة'],
    ['open','التسجيل مفتوح'],
    ['upcoming','قريباً'],
    ['completed','مكتملة']
  ]
};

function message(s,error=false){
  $('message').hidden=false;
  $('message').className='msg'+(error?' error':'');
  $('message').textContent=s;
  window.scrollTo({top:0,behavior:'smooth'});
}

function clearMessage(){
  $('message').hidden=true;
}

function validURL(v){
  if(!v)return null;
  const u=new URL(v);
  if(!['https:','http:'].includes(u.protocol)){
    throw Error('رابط غير صالح');
  }
  return u.href;
}

function reset(){
  $('entry-form').reset();
  $('entry-id').value='';
  $('preview').hidden=true;
  $('preview').removeAttribute('src');
  $('form-title').textContent=current==='courses'
    ?'إضافة دورة':'إضافة فعالية';

  $('status').innerHTML='';

  for(const [value,label] of opts[current]){
    const o=document.createElement('option');
    o.value=value;
    o.textContent=label;
    $('status').append(o);
  }

  $('instructor-wrap').hidden=current==='events';
}

async function check(){
  // Keep dashboard hidden until authentication
  // and authorization are completed.
  $('dashboard').hidden=true;
  $('login').hidden=true;
  $('legacy-panels').hidden=true;
  $('v2-panel').hidden=true;
  role=null;

  const {data:{user},error}=await supabase.auth.getUser();

  if(error||!user){
    $('login').hidden=false;
    return;
  }

  const result=await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id',user.id)
    .maybeSingle();

  const verifiedRole=result.data?.role;

  // Translator accounts use a separate allowlist: route to restricted editor.
  if(!verifiedRole && !result.error){
    const {data:translator,error:translatorError}=await supabase
      .from('medaura_translation_editors')
      .select('user_id')
      .eq('user_id',user.id)
      .maybeSingle();
    if(!translatorError && translator){
      window.location.replace('translations.html');
      return;
    }
  }

  if(
    result.error||
    !['super_admin','admin','media_admin'].includes(verifiedRole)
  ){
    await supabase.auth.signOut();
    $('login').hidden=false;
    message('هذا الحساب لا يملك صلاحية إدارة المحتوى.',true);
    return;
  }

  if(verifiedRole==='media_admin'){
    const active=await supabase.rpc('is_active_media_admin');

    if(active.error||active.data!==true){
      await supabase.auth.signOut();
      $('login').hidden=false;
      message('حساب الإعلامي غير مفعل.',true);
      return;
    }
  }

  role=verifiedRole;
  $('forms-tab').hidden=verifiedRole!=='super_admin';
  $('certificates-tab').hidden=verifiedRole!=='super_admin';
  const media=role==='media_admin';

  document.querySelectorAll('.admin-menu button').forEach(b=>{
    b.hidden=media&&b.id!=='v2-work-tab';
  });

  $('legacy-panels').hidden=media;
  $('who').textContent=user.email+' · '+role;

  $('login').hidden=true;
  $('dashboard').hidden=false;

  if(media){
    $('v2-work-tab').click();
    return;
  }

  $('legacy-panels').hidden=false;
  reset();
  await load();
}

async function load(){
  const {data,error}=await supabase
    .from(current)
    .select('*')
    .order('created_at',{ascending:false});

  if(error){
    message('تعذر جلب المحتوى: '+error.message,true);
    return;
  }

  rows=data||[];
  render();
}

function render(){
  const area=$('entries');
  area.replaceChildren();

  $('list-title').textContent=current==='courses'
    ?'الدورات المسجلة':'الفعاليات المسجلة';

  if(!rows.length){
    area.textContent='لا توجد عناصر بعد. أضف أول عنصر من النموذج بالأعلى.';
    return;
  }

  for(const row of rows){
    const el=document.createElement('div');
    el.className='item';

    const detail=document.createElement('div');
    const title=document.createElement('strong');
    title.textContent=row.title;

    const meta=document.createElement('div');
    meta.className='muted';
    meta.textContent=row.status+' · '+(row.location||'بدون مكان');

    detail.append(title,meta);

    const actions=document.createElement('div');

    const edit=document.createElement('button');
    edit.type='button';
    edit.className='secondary';
    edit.textContent='تعديل';
    edit.onclick=()=>editRow(row);

    const del=document.createElement('button');
    del.type='button';
    del.className='danger';
    del.textContent='حذف';
    del.onclick=()=>deleteRow(row);

    actions.append(edit,del);
    el.append(detail,actions);
    area.append(el);
  }
}

function editRow(row){
  clearMessage();

  $('entry-id').value=row.id;
  $('title').value=row.title||'';
  $('description').value=row.description||'';
  $('location').value=row.location||'';
  $('instructor').value=row.instructor||'';

  $('date').value=(current==='courses'
    ?row.start_date:row.event_date)
    ?localDatetime(current==='courses'
      ?row.start_date:row.event_date)
    :'';

  $('registration').value=row.registration_url||'';
  $('status').value=row.status;
  $('image').value='';

  $('preview').hidden=!row.image_url;

  if(row.image_url){
    $('preview').src=row.image_url;
  }

  $('form-title').textContent='تعديل: '+row.title;
  $('entry-form').scrollIntoView({behavior:'smooth'});
}

function localDatetime(v){
  const d=new Date(v);
  const z=n=>String(n).padStart(2,'0');

  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

async function deleteRow(row){
  if(!confirm('هل تريد حذف «'+row.title+'» نهائيًا؟')){
    return;
  }

  const {error}=await supabase
    .from(current)
    .delete()
    .eq('id',row.id);

  if(error){
    message('فشل الحذف: '+error.message,true);
    return;
  }

  reset();
  await load();
  message('تم الحذف بنجاح.');
}

async function upload(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){
    throw Error('الصورة يجب أن تكون JPG أو PNG أو WebP');
  }

  if(file.size>20*1024*1024){
    throw Error('حجم الصورة يتجاوز 20 MB');
  }

  const ext={
    'image/jpeg':'jpg',
    'image/png':'png',
    'image/webp':'webp'
  }[file.type];

  const path=`content/${crypto.randomUUID()}.${ext}`;

  const {error}=await supabase.storage
    .from(cfg.imageBucket)
    .upload(path,file,{
      contentType:file.type,
      upsert:false
    });

  if(error)throw error;

  return supabase.storage
    .from(cfg.imageBucket)
    .getPublicUrl(path).data.publicUrl;
}

$('login-form').addEventListener('submit',async e=>{
  e.preventDefault();
  clearMessage();

  const b=e.submitter;
  b.disabled=true;

  try{
    const {error}=await supabase.auth.signInWithPassword({
      email:$('email').value.trim(),
      password:$('password').value
    });

    if(error)throw error;

    $('password').value='';
    await check();
  }catch(err){
    message('تعذر تسجيل الدخول: '+err.message,true);
  }finally{
    b.disabled=false;
  }
});

$('logout').onclick=async()=>{
  await supabase.auth.signOut();
  role=null;
  await check();
  clearMessage();
};

document.querySelectorAll('[data-tab]').forEach(b=>{
  b.onclick=async()=>{
    if(role==='media_admin')return;

    document.getElementById('v2-panel').hidden=true;
    document.getElementById('legacy-panels').hidden=false;

    current=b.dataset.tab;

    document.querySelectorAll('[data-tab]').forEach(x=>{
      x.setAttribute('aria-pressed',String(x===b));
    });

    reset();
    clearMessage();
    await load();
  };
});

$('clear').onclick=()=>{
  reset();
  clearMessage();
};

$('image').onchange=()=>{
  const f=$('image').files[0];

  if(f){
    $('preview').src=URL.createObjectURL(f);
    $('preview').hidden=false;
  }
};

$('entry-form').addEventListener('submit',async e=>{
  e.preventDefault();
  clearMessage();

  const b=$('save');
  b.disabled=true;

  try{
    if(!['super_admin','admin'].includes(role)){
      throw Error('ليس لديك صلاحية');
    }

    const id=$('entry-id').value;
    const title=$('title').value.trim();

    if(!title){
      throw Error('العنوان مطلوب');
    }

    const existing=rows.find(r=>r.id===id);

    const values={
      title,
      description:$('description').value.trim()||null,
      location:$('location').value.trim()||null,
      status:$('status').value,
      image_url:existing?.image_url||null
    };

    const dt=$('date').value
      ?new Date($('date').value).toISOString()
      :null;

    if(current==='courses'){
      values.instructor=$('instructor').value.trim()||null;
      values.start_date=dt;
      values.registration_url=validURL(
        $('registration').value.trim()
      );
    }else{
      values.event_date=dt;
      values.registration_url=validURL(
        $('registration').value.trim()
      );
    }

    const file=$('image').files[0];

    if(file){
      values.image_url=await upload(file);
    }

    let q=supabase.from(current);

    const result=id
      ?await q.update(values).eq('id',id).select().single()
      :await q.insert(values).select().single();

    if(result.error)throw result.error;

    reset();
    await load();
    message('تم حفظ المحتوى بنجاح. سيظهر للزوار إن لم يكن مسودة.');
  }catch(err){
    message('تعذر الحفظ: '+err.message,true);
  }finally{
    b.disabled=false;
  }
});

reset();
check();
