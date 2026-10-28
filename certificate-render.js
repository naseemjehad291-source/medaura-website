export function certId(c){return `MED-${String(c.issue_date||'').slice(0,4)}-${String(c.certificate_number).padStart(6,'0')}`}
export function verificationUrl(c){return new URL(`verify.html?id=${encodeURIComponent(c.id)}`,location.href).href}
export async function downloadCertificate(c){
 if(!window.html2canvas||!window.jspdf||!window.QRCode)throw Error('تعذر تحميل مكتبات PDF أو QR. تحقق من اتصال الإنترنت.');
 const stage=document.createElement('div');stage.id='certificate-stage';document.body.appendChild(stage);
 const el=document.createElement('div');el.className='cert';stage.appendChild(el);
 const add=(tag,cls,txt)=>{const n=document.createElement(tag);n.className=cls;if(txt!==undefined)n.textContent=txt;el.appendChild(n);return n};
 const logo=add('img','cert-logo');logo.src=new URL('./logo.png',import.meta.url).href;
 add('div','cert-title','CERTIFICATE');add('div','cert-sub','OF COMPLETION');add('div','cert-label','THIS CERTIFICATE IS PROUDLY PRESENTED TO');
 const name=add('div','cert-name',c.student_name);if(c.student_name.length>34)name.style.fontSize='38px';
 add('div','cert-copy','For successfully completing the');add('div','cert-course',c.course_title);
 add('div','cert-copy','Organized by MEDAURA MEDICAL TEAM, in recognition of their dedication and commitment to continuous learning and professional development.');
 for(const side of ['left','right']){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 170 90');svg.setAttribute('class',`pulse ${side}`);svg.innerHTML='<path d="M0 45 H48 L60 38 L69 70 L79 9 L90 63 L99 40 L110 45 H170" fill="none" stroke="#128d96" stroke-width="4"/>';el.appendChild(svg)}
 const bottom=add('div','cert-bottom');const left=document.createElement('div');left.innerHTML='<div class="cert-small">ISSUE DATE</div>';const date=document.createElement('div');date.className='cert-small';date.style.marginTop='12px';date.textContent=c.issue_date;left.appendChild(date);bottom.appendChild(left);
 const mid=document.createElement('div');mid.innerHTML='<div class="cert-sign">MEDAURA TEAM</div><div class="cert-signlabel">MEDAURA TEAM</div>';bottom.appendChild(mid);
 const right=document.createElement('div');const qr=document.createElement('div');qr.className='cert-qr';right.appendChild(qr);const id=document.createElement('div');id.className='cert-id';id.textContent=certId(c);right.appendChild(id);bottom.appendChild(right);
 try{
  new window.QRCode(qr,{text:verificationUrl(c),width:94,height:94,correctLevel:window.QRCode.CorrectLevel.M});
  await Promise.all(Array.from(el.querySelectorAll('img')).map(i=>i.decode().catch(()=>{})));
  if(document.fonts?.ready)await document.fonts.ready;
  const canvas=await window.html2canvas(el,{scale:2,backgroundColor:'#fff',useCORS:true,logging:false});
  const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',0,0,297,210);
  pdf.save(`${certId(c)}.pdf`);
 }finally{stage.remove()}
}
