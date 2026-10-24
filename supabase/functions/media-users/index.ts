import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const url=Deno.env.get('SUPABASE_URL')!;
const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token)return reply({error:'Unauthorized'},401);
  const client=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await client.auth.getUser(token);
  if(authError||!user)return reply({error:'Unauthorized'},401);
  const {data:role,error:roleError}=await client.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();
  if(roleError||role?.role!=='super_admin')return reply({error:'Forbidden'},403);
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=await req.json();const action=body.action;
  const {data:profiles,error:pe}=await admin.from('media_admin_profiles').select('user_id,display_name,disabled,created_at').order('created_at');
  if(pe)throw pe;
  if(action==='list'){
   const users=[];for(const p of profiles||[]){const r=await admin.auth.admin.getUserById(p.user_id);users.push({...p,email:r.data.user?.email||''});}
   return reply({users});
  }
  if(action==='create'){
   if((profiles||[]).length>=2)return reply({error:'الحد الأقصى حسابان إعلاميان'},400);
   const email=String(body.email||'').trim().toLowerCase(),name=String(body.display_name||'').trim(),password=String(body.password||'');
   if(!/^\S+@\S+\.\S+$/.test(email)||name.length<1||name.length>80||password.length<12)return reply({error:'بيانات الحساب غير صالحة؛ كلمة المرور 12 حرفًا على الأقل'},400);
   const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error||!created.data.user)throw created.error||Error('تعذر إنشاء الحساب');
   const id=created.data.user.id;
   const r=await admin.from('admin_roles').insert({user_id:id,role:'media_admin'});
   const p=await admin.from('media_admin_profiles').insert({user_id:id,display_name:name,disabled:false});
   if(r.error||p.error){await admin.auth.admin.deleteUser(id);throw r.error||p.error;}
   return reply({ok:true});
  }
  const id=String(body.user_id||'');if(!profiles?.some(p=>p.user_id===id))return reply({error:'الحساب غير موجود'},404);
  if(action==='rename'){
   const name=String(body.display_name||'').trim();if(name.length<1||name.length>80)return reply({error:'الاسم غير صالح'},400);
   const r=await admin.from('media_admin_profiles').update({display_name:name}).eq('user_id',id);if(r.error)throw r.error;return reply({ok:true});
  }
  if(action==='password'){
   const password=String(body.password||'');if(password.length<12)return reply({error:'كلمة المرور قصيرة'},400);
   const r=await admin.auth.admin.updateUserById(id,{password});if(r.error)throw r.error;return reply({ok:true});
  }
  if(action==='toggle'){
   if(typeof body.disabled!=='boolean')return reply({error:'Invalid status'},400);
   const r=await admin.from('media_admin_profiles').update({disabled:body.disabled}).eq('user_id',id);if(r.error)throw r.error;
   if(body.disabled){const ban=await admin.auth.admin.updateUserById(id,{ban_duration:'876000h'});if(ban.error)throw ban.error;}
   else {const unban=await admin.auth.admin.updateUserById(id,{ban_duration:'none'});if(unban.error)throw unban.error;}
   return reply({ok:true});
  }
  return reply({error:'Unknown action'},400);
 }catch(e){return reply({error:e instanceof Error?e.message:'Server error'},500)}
});
