import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'Unauthorized'},401);
  const client=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
  const {data:{user},error:ae}=await client.auth.getUser(token);if(ae||!user)return reply({error:'Unauthorized'},401);
  const {data:role,error:re}=await client.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();
  if(re||role?.role!=='super_admin')return reply({error:'Forbidden'},403);
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const body=await req.json(),action=String(body.action||'');
  const {data:editors,error:ee}=await admin.from('medaura_translation_editors').select('user_id,created_at').order('created_at');if(ee)throw ee;
  if(action==='list'){
   const users=[];for(const e of editors||[]){const r=await admin.auth.admin.getUserById(e.user_id);if(r.error)throw r.error;users.push({...e,email:r.data.user?.email||'',disabled:!!r.data.user?.banned_until&&new Date(r.data.user.banned_until).getTime()>Date.now()});}
   return reply({users});
  }
  if(action==='create'){
   const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
   if(!/^\S+@\S+\.\S+$/.test(email)||password.length<12)return reply({error:'أدخل بريدًا صحيحًا وكلمة مرور لا تقل عن 12 حرفًا'},400);
   const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error||!created.data.user)throw created.error||Error('تعذر إنشاء الحساب');
   const id=created.data.user.id;const ins=await admin.from('medaura_translation_editors').insert({user_id:id});
   if(ins.error){await admin.auth.admin.deleteUser(id);throw ins.error;}return reply({ok:true});
  }
  const id=String(body.user_id||'');if(!editors?.some(e=>e.user_id===id))return reply({error:'حساب المترجم غير موجود'},404);
  if(action==='password'){
   const password=String(body.password||'');if(password.length<12)return reply({error:'كلمة المرور يجب أن تكون 12 حرفًا على الأقل'},400);
   const r=await admin.auth.admin.updateUserById(id,{password});if(r.error)throw r.error;return reply({ok:true});
  }
  if(action==='toggle'){
   if(typeof body.disabled!=='boolean')return reply({error:'Invalid status'},400);
   const r=await admin.auth.admin.updateUserById(id,{ban_duration:body.disabled?'876000h':'none'});if(r.error)throw r.error;
   return reply({ok:true});
  }
  if(action==='revoke'){
   const r=await admin.from('medaura_translation_editors').delete().eq('user_id',id);if(r.error)throw r.error;
   const ban=await admin.auth.admin.updateUserById(id,{ban_duration:'876000h'});if(ban.error)throw ban.error;
   return reply({ok:true});
  }
  return reply({error:'Unknown action'},400);
 }catch(e){return reply({error:e instanceof Error?e.message:'Server error'},500)}
});
