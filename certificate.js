import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {downloadCertificate,certId} from './certificate-render.js';
const db=createClient(window.MEDAURA_SUPABASE.url,window.MEDAURA_SUPABASE.publishableKey);const $=id=>document.getElementById(id);
$('lookup-form').addEventListener('submit',async e=>{e.preventDefault();$('results').replaceChildren();$('status').textContent='جارٍ البحث...';$('lookup-btn').disabled=true;
 try{const student_id=$('student-id').value.trim();if(!student_id||student_id.length>100)throw Error('أدخل رقمًا جامعيًا صالحًا.');
 const {data,error}=await db.rpc('medaura_lookup_certificates',{p_student_id:student_id});if(error)throw Error('خدمة الشهادات غير جاهزة. تأكد من تشغيل ملف SQL الخاص بالمرحلة الثالثة.');
 $('status').textContent=data?.length?`تم العثور على ${data.length} شهادة.`:'لم نجد شهادات صادرة لهذا الرقم الجامعي.';
 for(const c of data||[]){const box=document.createElement('div');box.className='item';const h=document.createElement('h2');h.textContent=c.course_title;box.appendChild(h);const sub=document.createElement('p');sub.className='muted';sub.textContent=`${c.student_name} · ${c.issue_date} · ${certId(c)}`;box.appendChild(sub);const btn=document.createElement('button');btn.textContent='⬇ تحميل الشهادة PDF';btn.onclick=async()=>{btn.disabled=true;try{await downloadCertificate(c)}catch(err){alert(err.message)}finally{btn.disabled=false}};box.appendChild(btn);$('results').appendChild(box)}
 }catch(err){$('status').textContent=err.message;$('status').className='error'}finally{$('lookup-btn').disabled=false}});
