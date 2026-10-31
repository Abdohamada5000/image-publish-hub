const MAX_BYTES=32*1024*1024;
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
function page(){return \`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مركز رفع الصور</title><style>
:root{font-family:system-ui;color:#172033;background:#f3f5fa}*{box-sizing:border-box}body{padding:18px;margin:0}main{max-width:760px;margin:4vh auto;background:#fff;padding:24px;border-radius:22px;box-shadow:0 12px 40px #0001}h1{font-size:26px;margin-top:0}p{line-height:1.8;color:#687386}.pick{display:block;border:2px dashed #b8c5da;border-radius:16px;padding:24px;text-align:center;margin:18px 0;background:#f9fbff}input{max-width:100%;margin-top:12px}button{border:0;background:#2864e8;color:white;font-weight:bold;padding:14px 18px;border-radius:12px;font-size:16px;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.actions{display:flex;gap:10px;flex-wrap:wrap}.actions button{flex:1;min-width:180px}.progress{height:12px;background:#e8edf5;border-radius:20px;overflow:hidden;margin:16px 0}.bar{height:100%;width:0;background:#2864e8;transition:width .2s}.item{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #edf0f5}.item img{width:64px;height:64px;object-fit:cover;border-radius:10px;background:#eee}.meta{min-width:0;flex:1}.name{font-weight:650;overflow-wrap:anywhere}.status{font-size:13px;color:#687386;margin-top:5px}.status.ok{color:#16834a}.status.err{color:#c0392b}.link{font-size:12px;overflow-wrap:anywhere;color:#2864e8}.summary{font-weight:700;margin-top:12px}
</style><main><h1>📷 مركز رفع الصور</h1><p>اختار حتى 50 صورة مرة واحدة. سيتم رفع 5 صور بالتوازي مع الحفاظ على ترتيب الصور المختارة.</p><label class="pick">اضغط لاختيار الصور من جهازك<input id="files" type="file" accept="image/*" multiple></label><div id="count">لم يتم اختيار صور بعد</div><div class="actions"><button id="start">رفع الصور</button><button id="copy" disabled>نسخ كل الروابط بالترتيب</button></div><div class="progress"><div class="bar" id="bar"></div></div><div class="summary" id="summary"></div><section id="results"></section><p>مفتاح ImgBB محفوظ على الخادم ولا يظهر في الصفحة.</p></main><script>
const input=document.getElementById('files'),start=document.getElementById('start'),copy=document.getElementById('copy'),results=document.getElementById('results'),count=document.getElementById('count'),bar=document.getElementById('bar'),summary=document.getElementById('summary');
let selected=[],links=[];
input.addEventListener('change',()=>{selected=Array.from(input.files||[]);if(selected.length>50){selected=selected.slice(0,50);count.textContent='تم اختيار أول 50 صورة فقط.'}else count.textContent=selected.length+' صورة محددة';results.innerHTML='';links=[];copy.disabled=true;summary.textContent='';bar.style.width='0%';selected.forEach((f,i)=>{const row=document.createElement('div');row.className='item';const img=document.createElement('img');img.src=URL.createObjectURL(f);const meta=document.createElement('div');meta.className='meta';const name=document.createElement('div');name.className='name';name.textContent=(i+1)+'. '+f.name;const status=document.createElement('div');status.className='status';status.textContent='في انتظار الرفع';meta.append(name,status);row.append(img,meta);results.append(row);f._status=status;f._row=row})});
async function uploadOne(file,index){const data=new FormData();data.append('image',file);try{const response=await fetch('/api/upload',{method:'POST',body:data});const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'فشل الرفع');links[index]=result.data.url;file._status.textContent='تم الرفع بنجاح';file._status.className='status ok';const a=document.createElement('a');a.className='link';a.href=result.data.url;a.target='_blank';a.rel='noopener';a.textContent=result.data.url;file._row.querySelector('.meta').append(a)}catch(error){file._status.textContent='فشل الرفع: '+error.message;file._status.className='status err';links[index]=null}}
start.addEventListener('click',async()=>{if(!selected.length){count.textContent='اختار صورة واحدة على الأقل أولًا.';return}start.disabled=true;copy.disabled=true;let done=0,success=0;summary.textContent='جارٍ رفع '+selected.length+' صورة...';const workers=Array.from({length:Math.min(5,selected.length)},async(_,worker)=>{for(let i=worker;i<selected.length;i+=5){selected[i]._status.textContent='جارٍ الرفع...';await uploadOne(selected[i],i);done++;if(links[i])success++;bar.style.width=(done/selected.length*100)+'%';summary.textContent='اكتمل '+done+' من '+selected.length+' — نجح '+success}});await Promise.all(workers);start.disabled=false;copy.disabled=success===0;summary.textContent='انتهى الرفع: نجح '+success+' من '+selected.length+' صورة. الروابط مرتبة حسب اختيارك.';start.textContent='إعادة رفع الصور';});
copy.addEventListener('click',async()=>{const text=links.filter(Boolean).join('\n');if(!text)return;try{await navigator.clipboard.writeText(text);copy.textContent='تم نسخ الروابط ✓'}catch{summary.textContent='تعذر النسخ التلقائي؛ انسخ الروابط الظاهرة يدويًا.'}});
</script></html>\`}
function cors(req,env){let o=req.headers.get('Origin')||'',a=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);return {...(a.includes(o)?{'access-control-allow-origin':o,'vary':'Origin'}:{}),'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Content-Type, Authorization'};}
async function upload(req,env){
 if(env.UPLOAD_TOKEN&&req.headers.get('Authorization')!==`Bearer ${env.UPLOAD_TOKEN}`)return json({success:false,error:'غير مصرح: يلزم UPLOAD_TOKEN صحيح.'},401);
 if(!env.IMGBB_API_KEY)return json({success:false,error:'أضف IMGBB_API_KEY في Cloudflare Secrets.'},500);
 let bytes,name='upload.jpg',type='image/jpeg';
 try{const ct=req.headers.get('content-type')||'';
  if(ct.includes('multipart/form-data')){let f=(await req.formData()).get('image');if(!(f instanceof File))return json({success:false,error:'أرسل الصورة في الحقل image.'},400);if(!f.type.startsWith('image/'))return json({success:false,error:'الملف ليس صورة.'},415);if(f.size>MAX_BYTES)return json({success:false,error:'الحد الأقصى 32MB.'},413);bytes=await f.arrayBuffer();name=f.name||name;type=f.type||type;}
  else if(ct.includes('application/json')){let b=await req.json();if(typeof b.image!=='string')return json({success:false,error:'حقل image بصيغة Base64 مطلوب.'},400);let raw=b.image.replace(/^data:image\/[^;]+;base64,/,'');let bin=atob(raw);if(bin.length>MAX_BYTES)return json({success:false,error:'الحد الأقصى 32MB.'},413);let a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);bytes=a.buffer;name=b.name||name;type=b.mimeType||type;if(!type.startsWith('image/'))return json({success:false,error:'نوع الملف يجب أن يكون صورة.'},415);}
  else return json({success:false,error:'استخدم multipart/form-data أو application/json.'},415);
 }catch{return json({success:false,error:'تعذر قراءة الصورة.'},400)}
 let form=new FormData();form.append('image',new Blob([bytes],{type}),name);form.append('name',name.replace(/\.[^.]+$/,'').slice(0,128));
 let upstream;try{upstream=await fetch('https://api.imgbb.com/1/upload?key='+encodeURIComponent(env.IMGBB_API_KEY),{method:'POST',body:form})}catch{return json({success:false,error:'تعذر الاتصال بـ ImgBB.'},502)}
 let out;try{out=await upstream.json()}catch{return json({success:false,error:'استجابة ImgBB غير مفهومة.'},502)}
 if(!upstream.ok||!out.success||!out.data?.url)return json({success:false,error:out.error?.message||'ImgBB رفض الصورة.'},502);
 return json({success:true,data:{url:out.data.url,display_url:out.data.display_url||out.data.url,id:out.data.id||null,title:out.data.title||name}});
}

async function mcp(req,env){
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store",...cors(req,env)};
 const reply=(id,result)=>json({jsonrpc:"2.0",id,result},200,headers);
 const fail=(id,code,message)=>json({jsonrpc:"2.0",id,error:{code,message}},200,headers);
 let body;try{body=await req.json()}catch{return json({jsonrpc:"2.0",id:null,error:{code:-32700,message:"Parse error"}},400,headers)}
 if(!body||body.jsonrpc!=="2.0"||typeof body.method!=="string")return fail(body?.id??null,-32600,"Invalid Request");
 const id=body.id;
 if(body.method==="notifications/initialized"||body.method==="notifications/cancelled")return new Response(null,{status:202,headers});
 if(body.method==="initialize"){
  const requested=body.params?.protocolVersion;
  const supported=["2025-03-26","2024-11-05"];
  const protocolVersion=supported.includes(requested)?requested:"2025-03-26";
  return reply(id,{protocolVersion,capabilities:{tools:{listChanged:false}},serverInfo:{name:"image-publish-hub",version:"1.0.0"},instructions:"Upload images to ImgBB using the upload_image tool. The service accepts one image per tool call and returns its direct public URL."});
 }
 if(body.method==="ping")return reply(id,{});
 if(body.method==="tools/list")return reply(id,{tools:[{name:"upload_image",description:"Upload one image to the user's ImgBB image hosting account. Supply the image as Base64 (raw Base64 or a data URL). Returns the direct public image URL. Maximum image size: 32 MB.",inputSchema:{type:"object",properties:{image_base64:{type:"string",description:"Image bytes encoded as Base64. A data:image/...;base64, prefix is also accepted."},filename:{type:"string",description:"Original image filename, including extension."},mime_type:{type:"string",description:"Image MIME type, for example image/jpeg or image/png."}},required:["image_base64"],additionalProperties:false}}]});
 if(body.method==="tools/call"){
  const name=body.params?.name,args=body.params?.arguments||{};
  if(name!=="upload_image")return fail(id,-32602,"Unknown tool");
  if(typeof args.image_base64!=="string"||!args.image_base64.length)return fail(id,-32602,"image_base64 is required");
  const mimeType=typeof args.mime_type==="string"?args.mime_type:"image/jpeg";
  if(!mimeType.startsWith("image/"))return reply(id,{isError:true,content:[{type:"text",text:"نوع الملف يجب أن يكون صورة."}]});
  const payload={image:args.image_base64,name:typeof args.filename==="string"?args.filename:"upload.jpg",mimeType};
  const uploadReq=new Request(new URL("/api/upload",req.url),{method:"POST",headers:{"content-type":"application/json",...(req.headers.get("authorization")?{authorization:req.headers.get("authorization")}:{})},body:JSON.stringify(payload)});
  const uploaded=await upload(uploadReq,env);
  let result;try{result=await uploaded.json()}catch{result={success:false,error:"Upload failed"}}
  if(!uploaded.ok||!result.success)return reply(id,{isError:true,content:[{type:"text",text:result.error||"فشل رفع الصورة."}]});
  const textResult=JSON.stringify(result.data);
  return reply(id,{content:[{type:"text",text:textResult}],structuredContent:result.data,isError:false});
 }
 if(id===undefined)return new Response(null,{status:202,headers});
 return fail(id,-32601,"Method not found");
}

export default {async fetch(req,env){let u=new URL(req.url),h=cors(req,env);if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h});if(u.pathname==='/mcp'&&req.method==='POST')return mcp(req,env);if(u.pathname==='/mcp'&&req.method==='GET')return json({success:false,error:'MCP endpoint accepts POST requests.'},405,{...h,'allow':'POST, OPTIONS'});if(u.pathname==='/'&&req.method==='GET')return new Response(page(),{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});if(u.pathname==='/health'&&req.method==='GET')return json({success:true,service:'image-publish-hub',status:'ok'},200,h);if(u.pathname==='/api/upload'&&req.method==='POST'){let r=await upload(req,env),hh=new Headers(r.headers);for(let[k,v]of Object.entries(h))hh.set(k,v);return new Response(r.body,{status:r.status,headers:hh})}return json({success:false,error:'المسار غير موجود.'},404,h)}};
