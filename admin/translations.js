import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const c=window.MEDAURA_SUPABASE,db=createClient(c.url,c.publishableKey),$=id=>document.getElementById(id);let user=null,canManage=false,entries=[];
const say=t=>$('status').textContent=t;
async function init(){const {data}=await db.auth.getUser();user=data.user;$('login').hidden=!!user;$('editor').hidden=true;if(!user){say('سجّل الدخول بحساب Translation Admin أو Super Admin.');return}
const {data:role}=await db.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();canManage=role?.role==='super_admin';
const {data:editor}=await db.from('medaura_translation_editors').select('user_id').eq('user_id',user.id).maybeSingle();if(!canManage&&!editor){say('هذا الحساب غير مخوّل للترجمة.');return}
$('editor').hidden=false;await refresh();say('جاهز. يمكنك إضافة الترجمات وتعديلها.');}
async function refresh(){const {data,error}=await db.from('medaura_public_translations').select('source_ar,edited_ar,translation_en,updated_at').order('updated_at',{ascending:false}).limit(1000);if(error)throw error;entries=data||[];render()}
function render(){const q=$('search').value.trim().toLowerCase(),box=$('list');box.replaceChildren();for(const x of entries.filter(x=>!q||x.source_ar.toLowerCase().includes(q)||x.translation_en.toLowerCase().includes(q))){const item=document.createElement('div');item.className='item';const ar=document.createElement('div');ar.textContent=x.edited_ar||x.source_ar;const en=document.createElement('div');en.textContent=x.translation_en;en.dir='ltr';const edit=document.createElement('button');edit.textContent='تعديل';edit.onclick=()=>{$('source').value=x.source_ar;$('edited-ar').value=x.edited_ar||'';$('english').value=x.translation_en;$('source').focus()};item.append(ar,en,edit);box.append(item)}}
$('sign-in').onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)say(error.message);else init().catch(e=>say(e.message))};
$('sign-out').onclick=async()=>{await db.auth.signOut();init()};
$('save').onclick=async()=>{const source_ar=$('source').value.trim(),edited_ar=$('edited-ar').value.trim(),translation_en=$('english').value.trim();if(!source_ar||!translation_en){say('اكتب النص العربي وترجمته الإنجليزية.');return}const {error}=await db.from('medaura_public_translations').upsert({source_ar,edited_ar:edited_ar||null,translation_en,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'source_ar'});if(error){say('فشل الحفظ: '+error.message);return}say('تم حفظ الترجمة.');$('source').value='';$('edited-ar').value='';$('english').value='';await refresh()};
$('search').oninput=render;
init().catch(e=>say('تعذر فتح لوحة الترجمة: '+e.message));
