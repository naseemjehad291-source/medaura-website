export function certId(c){return `MED-${String(c.issue_date||'').slice(0,4)}-${String(c.certificate_number).padStart(6,'0')}`}
export function verificationUrl(c){return new URL(`verify.html?id=${encodeURIComponent(c.id)}`,location.href).href}
export async function downloadCertificate(c){
 if(!window.html2canvas||!window.jspdf||!window.QRCode)throw Error('تعذر تحميل مكتبات PDF أو QR. تحقق من اتصال الإنترنت.');
 const stage=document.createElement('div');stage.id='certificate-stage';document.body.appendChild(stage);
 const el=document.createElement('div');el.className='cert';stage.appendChild(el);
 const add=(tag,cls,txt,parent=el)=>{const n=document.createElement(tag);n.className=cls;if(txt!==undefined)n.textContent=txt;parent.appendChild(n);return n};
 const decor=add('div','cert-decor');
 decor.innerHTML=`<div class="cert-corner cert-corner-tl"></div><div class="cert-corner cert-corner-br"></div><div class="cert-line cert-line-top"></div><div class="cert-line cert-line-bottom"></div><svg class="cert-heartline" viewBox="0 0 1000 120" xmlns="http://www.w3.org/2000/svg"><path d="M0 63 H280 L304 58 L324 75 L344 23 L366 101 L387 48 L404 63 H596 L619 57 L640 77 L662 22 L683 100 L705 48 L723 63 H1000" fill="none" stroke="#168c91" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="cert-watermark">✚</div>`;
 const logo=add('img','cert-logo');logo.src=new URL('./logo.png',import.meta.url).href;
 add('div','cert-kicker','MEDAURA MEDICAL TEAM');
 add('div','cert-title','CERTIFICATE');add('div','cert-sub','OF COMPLETION');
 add('div','cert-rule');
 add('div','cert-label','THIS CERTIFICATE IS PROUDLY PRESENTED TO');
 const name=add('div','cert-name',c.student_name);
 const len=[...String(c.student_name||'')].length;
 if(len>42)name.style.fontSize='37px';else if(len>30)name.style.fontSize='45px';
 add('div','cert-copy cert-intro','For successfully completing the');
 const course=add('div','cert-course',c.course_title);
 if([...String(c.course_title||'')].length>45)course.style.fontSize='30px';
 add('div','cert-copy cert-description','Organized by MEDAURA MEDICAL TEAM, in recognition of their dedication and commitment to continuous learning and professional development.');
 const bottom=add('div','cert-bottom');
 const dateBlock=add('div','cert-dateblock',undefined,bottom);
 add('div','cert-footer-title','ISSUE DATE',dateBlock);add('div','cert-footer-value',c.issue_date,dateBlock);
 const signBlock=add('div','cert-signblock',undefined,bottom);
 add('div','cert-sign','Medaura Team',signBlock);add('div','cert-signline',undefined,signBlock);add('div','cert-signlabel','MEDAURA TEAM',signBlock);
 const qrBlock=add('div','cert-qrblock',undefined,bottom);
 const qr=add('div','cert-qr',undefined,qrBlock);add('div','cert-id',certId(c),qrBlock);add('div','cert-verify','SCAN TO VERIFY',qrBlock);
 try{
  new window.QRCode(qr,{text:verificationUrl(c),width:96,height:96,correctLevel:window.QRCode.CorrectLevel.M});
  await Promise.all(Array.from(el.querySelectorAll('img')).map(i=>i.decode().catch(()=>{})));
  if(document.fonts?.ready)await document.fonts.ready;
  const canvas=await window.html2canvas(el,{scale:2,backgroundColor:'#fff',useCORS:true,logging:false});
  const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  pdf.addImage(canvas.toDataURL('image/jpeg',.96),'JPEG',0,0,297,210);
  pdf.save(`${certId(c)}.pdf`);
 }finally{stage.remove()}
}
