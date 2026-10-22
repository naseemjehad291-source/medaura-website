/* Fetch published content only; RLS is enforced by Supabase, not by this script. */
(async function(){
 const cfg=window.MEDAURA_SUPABASE;
 if(!cfg||!window.MEDAURA)return;
 const headers={'apikey':cfg.publishableKey};
 const root=cfg.url+'/rest/v1/';
 async function load(table){
   const r=await fetch(root+table+'?select=*&status=neq.draft&order=created_at.desc',{headers});
   if(!r.ok)throw Error('HTTP '+r.status);
   return r.json();
 }
 try{
  const [courses,events]=await Promise.all([load('courses'),load('events')]);
  const d=window.MEDAURA;
  d.courses=courses.map(c=>({id:c.id,title:c.title,cat:'دورات MEDAURA',level:'جميع المستويات',duration:'التفاصيل قريباً',format:c.location||'يُحدد لاحقاً',status:c.status==='completed'?'done':c.status,instructor:c.instructor||'MEDAURA TEAM',photo:c.image_url||'',register:c.registration_url||'',summary:c.description||'',goals:[],sample:false}));
  d.events=events.map(e=>({id:e.id,title:e.title,date:e.event_date||e.created_at,place:e.location||'',course:'',summary:e.description||'',photos:e.image_url?[e.image_url]:[],sample:false}));
  if(typeof window.MEDAURA_REFRESH==='function')window.MEDAURA_REFRESH();
 }catch(e){console.warn('MEDAURA: published content could not be loaded',e);const d=window.MEDAURA;d.courses=[];d.events=[];if(typeof window.MEDAURA_REFRESH==='function')window.MEDAURA_REFRESH();}
})();
