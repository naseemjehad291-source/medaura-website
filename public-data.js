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
  const [courses,events,settings,team,albums,photos]=await Promise.all([
  load('courses'),load('events'),
  fetch(root+'site_settings?select=key,value',{headers}).then(r=>r.ok?r.json():[]),
  fetch(root+'team_members?select=*&is_published=eq.true&order=display_order.asc',{headers}).then(r=>r.ok?r.json():[]),
  fetch(root+'gallery_albums?select=*&is_published=eq.true&order=display_order.asc',{headers}).then(r=>r.ok?r.json():[]),
  fetch(root+'gallery_photos?select=*&is_published=eq.true&order=display_order.asc',{headers}).then(r=>r.ok?r.json():[])
 ]);
  const d=window.MEDAURA;
  d.site=Object.fromEntries(settings.map(x=>[x.key,x.value]));
  // Optional English translations are entered as site settings ending in _en.
  // The Arabic originals remain authoritative and are never machine-translated.
  d.bilingualFields={};
  // Stable entity/field translations; new records are included on every page load.
  try {
    const lr=await fetch(root+'medaura_content_localizations?select=entity_type,entity_id,field_name,source_snapshot,translation_en',{headers});
    if(lr.ok){const translations=await lr.json();const lookup={courses,events,team_members:team};
      for(const t of translations){if(!t.translation_en)continue;
        let ar='';if(t.entity_type==='site_settings')ar=d.site[t.field_name]||'';
        else {const record=(lookup[t.entity_type]||[]).find(x=>String(x.id)===t.entity_id);ar=record?.[t.field_name]||'';}
        if(ar && ar===t.source_snapshot)d.bilingualFields[ar.trim()]=t.translation_en;
      }
    }
  } catch(e){console.warn('Content localizations unavailable',e)}

  for(const [key,value] of Object.entries(d.site))if(key.endsWith('_en')&&typeof value==='string'){
    const ar=d.site[key.slice(0,-3)];if(typeof ar==='string'&&ar.trim()&&value.trim())d.bilingualFields[ar.trim()]=value.trim();
  }
  for(const item of [...courses,...events,...team])for(const field of ['title','description','name','position','bio','excerpt','location','instructor']){
    if(typeof item[field]==='string'&&typeof item[field+'_en']==='string'&&item[field+'_en'].trim())d.bilingualFields[item[field].trim()]=item[field+'_en'].trim();
  }
  if(d.site.resourcesJSON){try{const parsed=JSON.parse(d.site.resourcesJSON);if(Array.isArray(parsed))d.resources=parsed.filter(x=>x&&typeof x.title==='string').map(x=>({title:x.title,cat:x.cat||'',type:x.type||'مورد تعليمي',url:x.url||'',sample:false}));}catch(err){console.warn('Invalid resourcesJSON',err)}}
  d.team=team;
  d.albums=albums.map(a=>({...a,photos:photos.filter(p=>p.album_id===a.id)}));
  if(d.site.studentsReached!==undefined)d.impact.studentsReached=d.site.studentsReached;
  if(d.site.impactLabel)d.impact.impactLabel=d.site.impactLabel;
  for(const key of ['email','instagram','telegram','joinForm','contactForm','partnerForm'])if(d.site[key])d.links[key]=d.site[key];
  d.courses=courses.map(c=>({id:c.id,title:c.title,cat:'دورات MEDAURA',level:'جميع المستويات',duration:'التفاصيل قريباً',format:c.location||'يُحدد لاحقاً',status:c.status==='completed'?'done':c.status,instructor:c.instructor||'MEDAURA TEAM',photo:c.image_url||'',register:c.registration_url||'',summary:c.description||'',goals:[],sample:false}));
  d.events=events.map(e=>({id:e.id,title:e.title,date:e.event_date||e.created_at,place:e.location||'',course:'',summary:e.description||'',photos:e.image_url?[e.image_url]:[],sample:false}));
  if(typeof window.MEDAURA_REFRESH==='function')window.MEDAURA_REFRESH();
 }catch(e){console.warn('MEDAURA: published content could not be loaded',e);const d=window.MEDAURA;d.courses=[];d.events=[];if(typeof window.MEDAURA_REFRESH==='function')window.MEDAURA_REFRESH();}
})();
