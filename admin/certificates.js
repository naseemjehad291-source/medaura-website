import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.MEDAURA_SUPABASE;
const db=createClient(cfg.url,cfg.publishableKey);
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
 if(!data.length){$('courses-list').textContent='لم تُضف دورات شهادات بعد.';return}
 $('courses-list').innerHTML='<div class="tablewrap"><table><thead><tr><th>الدورة</th><th>تاريخ الإصدار</th></tr></thead><tbody>'+data.map(c=>`<tr><td>${escapeHTML(c.title)}</td><td>${escapeHTML(c.issue_date)}</td></tr>`).join('')+'</tbody></table></div>';
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
// RFC 4180-style CSV parser: quoted fields, embedded commas/newlines and doubled quotes.
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
$('csv-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>5*1024*1024)throw Error('حجم الملف أكبر من 5MB.');
  const rows=parseCSV(await file.text());if(!rows.length)throw Error('الملف فارغ.');
  const headers=rows[0],samples=rows.slice(1,6);
  $('csv-preview').innerHTML=`<p>عدد السجلات: ${Math.max(0,rows.length-1)} — عرض أول 5 سجلات للمعاينة فقط.</p><table><thead><tr>${headers.map(h=>`<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${samples.map(row=>`<tr>${headers.map((_,i)=>`<td>${escapeHTML(row[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 }catch(err){$('csv-preview').textContent=err.message}
});
init();
