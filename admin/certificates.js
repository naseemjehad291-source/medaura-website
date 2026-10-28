import {downloadCertificate,certId} from '../certificate-render.js';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.MEDAURA_SUPABASE;
const db=createClient(cfg.url,cfg.publishableKey);
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let courses=[],headers=[],records=[],fileLoaded=false;
function message(id,text,error=false){const el=$(id);el.hidden=false;el.textContent=text;el.classList.toggle('error',error)}
async function init(){
 try{
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)throw Error('سجّل الدخول من لوحة الإدارة أولًا.');
  const role=await db.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();
  if(role.error||role.data?.role!=='super_admin')throw Error('هذه الصفحة مخصصة لـ Super Admin فقط.');
  $('gate').hidden=true;$('content').hidden=false;
  $('issue-date').value=new Date().toLocaleDateString('en-CA');
  await loadCourses();
 }catch(e){$('gate').textContent=e.message}
}
async function loadCourses(){
 const {data,error}=await db.from('medaura_certificate_courses').select('id,title,issue_date,created_at').order('created_at',{ascending:false});
 if(error){$('courses-list').textContent='تعذّر تحميل الدورات: '+error.message;return}
 courses=data||[];
 $('courses-list').innerHTML=!courses.length?'لم تُضف دورات شهادات بعد.':'<div class="tablewrap"><table><thead><tr><th>الدورة</th><th>تاريخ الإصدار</th></tr></thead><tbody>'+courses.map(c=>`<tr><td>${escapeHTML(c.title)}</td><td>${escapeHTML(c.issue_date)}</td></tr>`).join('')+'</tbody></table></div>';
 $('certificate-course').innerHTML='<option value="">اختر الدورة...</option>'+courses.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.title)} — ${escapeHTML(c.issue_date)}</option>`).join('');
 $('issued-course').innerHTML='<option value="">اختر دورة...</option>'+courses.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.title)}</option>`).join('');
}
$('course-form').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('save-course');btn.disabled=true;
 try{
  const title=$('course-title').value.trim(),issue_date=$('issue-date').value;
  if(title.length<2||!issue_date)throw Error('أدخل اسم الدورة والتاريخ.');
  const {error}=await db.from('medaura_certificate_courses').insert({title,issue_date});
  if(error)throw error;
  message('course-status','تم حفظ الدورة بنجاح.');$('course-title').value='';await loadCourses();
 }catch(err){message('course-status',err.message,true)}finally{btn.disabled=false}
});
function parseCSV(raw){
 const text=raw.replace(/^\uFEFF/,'');let rows=[],row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(c==='"'){
   if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted;
  }else if(c===','&&!quoted){row.push(field);field=''}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}
  else field+=c;
 }
 if(quoted)throw Error('ملف CSV يحتوي على علامات اقتباس غير مكتملة.');
 row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function suggestColumn(words){return headers.findIndex(h=>words.some(w=>h.toLowerCase().includes(w)))}
function refreshReview(){
 if(!fileLoaded)return;
 const nameIndex=Number($('name-column').value),idIndex=Number($('university-column').value);
 const valid=Number.isInteger(nameIndex)&&Number.isInteger(idIndex)&&nameIndex>=0&&idIndex>=0&&nameIndex!==idIndex;
 $('review-section').hidden=!valid;
 if(!valid)return;
 $('review-body').innerHTML=records.map((r,i)=>`<tr><td><input type="checkbox" class="eligible" data-row="${i}" ${r.eligible?'checked':''} aria-label="إصدار شهادة للطالب ${i+1}"></td><td>${escapeHTML(r.values[nameIndex]||'')}</td><td>${escapeHTML(r.values[idIndex]||'')}</td></tr>`).join('');
 $('review-count').textContent=`${records.length} سجلًا — حدّد الطلاب الذين أتمّوا الدورة فقط.`;
 $('review-body').querySelectorAll('.eligible').forEach(el=>el.addEventListener('change',()=>{records[Number(el.dataset.row)].eligible=el.checked;updateCount()}));
 updateCount();
}
function updateCount(){ $('selected-count').textContent=records.filter(r=>r.eligible).length+' طالب محدد للإصدار'; }
$('name-column').addEventListener('change',refreshReview);
$('university-column').addEventListener('change',refreshReview);
$('select-all').addEventListener('click',()=>{records.forEach(r=>r.eligible=true);refreshReview()});
$('select-none').addEventListener('click',()=>{records.forEach(r=>r.eligible=false);refreshReview()});
$('csv-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 fileLoaded=false;records=[];$('review-section').hidden=true;$('column-section').hidden=true;$('issue-status').hidden=true;
 try{
  if(file.size>5*1024*1024)throw Error('حجم الملف أكبر من 5MB.');
  const rows=parseCSV(await file.text());if(rows.length<2)throw Error('الملف لا يحتوي على سجلات طلاب.');
  headers=rows[0].map(s=>s.trim());if(headers.length<2)throw Error('يجب أن يحتوي الملف على عمودين على الأقل.');
  records=rows.slice(1).map(row=>({values:row,eligible:false}));
  if(records.length>500)throw Error('الحد الأقصى 500 سجل لكل ملف. قسّم الملف إلى دفعات.');
  $('csv-preview').innerHTML=`<p>عدد السجلات: ${records.length} — عرض أول 5 سجلات للمعاينة.</p><table><thead><tr>${headers.map(h=>`<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${records.slice(0,5).map(r=>`<tr>${headers.map((_,i)=>`<td>${escapeHTML(r.values[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const opts='<option value="-1">اختر العمود...</option>'+headers.map((h,i)=>`<option value="${i}">${escapeHTML(h||'عمود '+(i+1))}</option>`).join('');
  $('name-column').innerHTML=opts;$('university-column').innerHTML=opts;
  const name=suggestColumn(['اسم الطالب','الاسم الكامل','full name','student name']);
  const uid=suggestColumn(['الرقم الجامعي','رقم جامعي','university id','student id']);
  $('name-column').value=String(name);$('university-column').value=String(uid);
  $('column-section').hidden=false;fileLoaded=true;refreshReview();
 }catch(err){$('csv-preview').textContent=err.message}
});
$('issue-certificates').addEventListener('click',async()=>{
 const btn=$('issue-certificates');
 try{
  const courseId=$('certificate-course').value;
  const course=courses.find(c=>c.id===courseId);
  if(!course)throw Error('اختر دورة الشهادات أولًا.');
  const ni=Number($('name-column').value),ui=Number($('university-column').value);
  if(ni<0||ui<0||ni===ui)throw Error('اختر عمود الاسم والرقم الجامعي بشكل صحيح.');
  const selected=records.filter(r=>r.eligible).map(r=>({student_name:String(r.values[ni]||'').trim(),student_university_id:String(r.values[ui]||'').trim()}));
  if(!selected.length)throw Error('لم تحدد أي طالب مستحق.');
  const seen=new Set();
  for(const row of selected){
   if(row.student_name.length<2||row.student_name.length>200||!row.student_university_id||row.student_university_id.length>100)throw Error('يوجد اسم أو رقم جامعي ناقص/غير صالح في الطلاب المحددين.');
   if(seen.has(row.student_university_id))throw Error('يوجد رقم جامعي مكرر بين الطلاب المحددين: '+row.student_university_id);
   seen.add(row.student_university_id);
  }
  if(!confirm(`إصدار ${selected.length} شهادة إتمام لدورة «${course.title}»؟\nسيتم حفظ شهادات فعلية في قاعدة البيانات. تأكد أن جميع الطلاب المحددين أتمّوا الدورة.`))return;
  btn.disabled=true;message('issue-status','جارٍ حفظ الشهادات...');
  let created=0,skipped=0;const errors=[];
  // Individual inserts let us report duplicates and partial failures without overwriting existing certificates.
  for(const row of selected){
   const {error}=await db.from('medaura_certificates').insert({...row,course_id:courseId});
   if(!error)created++;
   else if(error.code==='23505')skipped++;
   else{errors.push(`${row.student_name}: ${error.message}`);if(errors.length>=5)break}
  }
  await loadIssued();
  message('issue-status',`تم إصدار ${created} شهادة. شهادات موجودة مسبقًا: ${skipped}. أخطاء: ${errors.length}.${errors.length?'\n'+errors.join('\n'):''}${errors.length?'\nتوقف الإصدار عند الخطأ. راجع النتائج قبل المحاولة مجددًا.':''}`,errors.length>0);
 }catch(err){message('issue-status',err.message,true)}finally{btn.disabled=false}
});
async function loadIssued(){
 const courseId=$('issued-course').value, list=$('issued-list');list.replaceChildren();if(!courseId)return;
 list.textContent='جارٍ تحميل الشهادات...';
 const {data,error}=await db.from('medaura_certificates').select('id,certificate_number,student_name,student_university_id,status').eq('course_id',courseId).order('certificate_number',{ascending:false}).limit(500);
 if(error){list.textContent='تعذر التحميل: '+error.message;return}
 list.replaceChildren();if(!data?.length){list.textContent='لا توجد شهادات في هذه الدورة.';return}
 const course=courses.find(c=>c.id===courseId);
 for(const c of data){const row=document.createElement('div');row.style.cssText='padding:12px;border-bottom:1px solid #ddd;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
 const txt=document.createElement('span');txt.style.flex='1';txt.textContent=`${c.student_name} — ${c.student_university_id} — ${certId({...c,issue_date:course.issue_date})} (${c.status})`;row.appendChild(txt);
 if(c.status==='issued'){const b=document.createElement('button');b.textContent='تحميل PDF';b.onclick=async()=>{b.disabled=true;try{await downloadCertificate({...c,course_title:course.title,issue_date:course.issue_date})}catch(e){alert(e.message)}finally{b.disabled=false}};row.appendChild(b)}list.appendChild(row)}
}
$('issued-course').addEventListener('change',loadIssued);
init();
