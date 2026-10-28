export function certId(c){return `MED-${String(c.issue_date||'').slice(0,4)}-${String(c.certificate_number).padStart(6,'0')}`}
export function verificationUrl(c){return new URL(`verify.html?id=${encodeURIComponent(c.id)}`,location.href).href}
export async function downloadCertificate(c){
 if(!window.html2canvas||!window.jspdf||!window.QRCode)throw Error('تعذر تحميل مكتبات PDF أو QR. تحقق من اتصال الإنترنت.');
 const stage=document.createElement('div');stage.id='certificate-stage';document.body.appendChild(stage);
 const el=document.createElement('div');el.className='cert cert-template';stage.appendChild(el);
 const add=(tag,cls,txt,parent=el)=>{const n=document.createElement(tag);n.className=cls;if(txt!==undefined)n.textContent=txt;parent.appendChild(n);return n};
 const name=add('div','cert-dynamic-name',c.student_name);
 if(/[\u0600-\u06FF]/.test(c.student_name||''))name.classList.add('cert-arabic');
 const nameLength=[...String(c.student_name||'')].length;
 if(nameLength>40)name.style.fontSize='43px';else if(nameLength>27)name.style.fontSize='54px';
 const course=add('div','cert-dynamic-course',c.course_title);
 const courseLength=[...String(c.course_title||'')].length;
 if(courseLength>42)course.style.fontSize='30px';else if(courseLength>27)course.style.fontSize='38px';
 const date=add('div','cert-dynamic-date',formatDate(c.issue_date));
 const qr=add('div','cert-dynamic-qr');
 add('div','cert-dynamic-id',certId(c));
 try{
  new window.QRCode(qr,{text:verificationUrl(c),width:91,height:91,correctLevel:window.QRCode.CorrectLevel.M});
  const background=new Image();background.src=new URL('./certificate-template.jpg',import.meta.url).href;
  await background.decode();
  if(document.fonts?.ready)await document.fonts.ready;
  const canvas=await window.html2canvas(el,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});
  const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  pdf.addImage(canvas.toDataURL('image/jpeg',.97),'JPEG',0,0,297,210);
  pdf.save(`${certId(c)}.pdf`);
 }finally{stage.remove()}
}
function formatDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return String(v||'');const [y,m,d]=v.split('-').map(Number);return `${d} ${['January','February','March','April','May','June','July','August','September','October','November','December'][m-1]} ${y}`}
