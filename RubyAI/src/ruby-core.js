// Ruby Architecture v1.10 — core extracted from RubyAI-v1.10.html (main brain + Ruby Studio + RubyVoice)

"use strict";
/* ============================================================
   RUBY ARCHITECTURE v1.0 — pure local, no external AI APIs
   Layers: Tokenizer -> Intent Engine -> Planner -> Knowledge
           + CodeGen + Tools -> Memory (episodic/semantic/working)
   Others can build their own AI by replacing Knowledge/CodeGen
   and keeping Memory + Intent + Planner. See ARCHITECTURE.md
   ============================================================ */
const RubyMemory = {
  key:"ruby_ai_memory_v1",
  data:{facts:{}, taught:{}, notes:[], tasks:[], history:[], name:"", turns:0, created:Date.now()},
  load(){ try{ const r=localStorage.getItem(this.key); if(r) this.data=JSON.parse(r);}catch(e){} },
  save(){ if(typeof RubySettings!=="undefined" && !RubySettings.data.memory) { updateStats(); return; } try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} updateStats(); },
  bytes(){ return (localStorage.getItem(this.key)||"").length; },
  remember(k,v){ this.data.facts[k.toLowerCase()]=v; this.save(); },
  learn(k,v){ this.data.taught[k.toLowerCase()]=v; this.save(); }
};
RubyMemory.load();

const Knowledge = {
  loops:"A loop repeats code so you don't write it over and over.\n\n• for loop — repeat a known number of times.\nExample (JavaScript): for (let i=0;i<5;i++) console.log(i);\n• while loop — repeat while a condition is true.\nExample: while (hungry) eat();\n\nThink of it like brushing each tooth — same action, repeated until done.",
  variables:"A variable is a labelled box that stores a value.\nExample: let score = 10;  — the box is called 'score' and holds 10. You can change it later: score = 15;",
  functions:"A function is a reusable recipe. You define it once, then call it whenever you need it.\nExample (Python):\ndef greet(name):\n    return 'Hello ' + name\n\ngreet('Wyatt') → Hello Wyatt",
  recursion:"Recursion is when a function calls itself with a smaller problem until it reaches a stopping case.\nExample: factorial(5) = 5 × factorial(4) … down to factorial(1)=1, so 5×4×3×2×1 = 120.",
  html:"HTML is the skeleton of a web page. Tags like <h1> (heading), <p> (paragraph), <button> and <img> tell the browser what each part is. CSS paints it, JavaScript makes it move.",
  css:"CSS is how a web page looks — colours, sizes, spacing and layout. Example: h1 { color: red; } makes headings red.",
  javascript:"JavaScript is the language that makes web pages interactive. It runs in every browser, can change the page, respond to clicks, do maths, store data, and much more.",
  python:"Python is a readable programming language used for apps, automation, data and AI work. Example: print('Hello') shows Hello on screen.",
  ai:"An AI assistant takes your words, works out what you mean (intent), plans steps, uses tools/knowledge, and answers. Ruby AI does all of that locally on your device — no outside AI service is called.",
  rubyos:"RubyOS is Wyatt's browser-based operating system. Ruby AI is its standalone companion — separate from RubyOS, so it can be downloaded and used on its own."
};

Knowledge.fractions="A fraction is part of a whole: the top number (numerator) says how many parts you have, the bottom (denominator) says how many equal parts the whole was cut into. 1/2 + 1/3: make the bottoms match (6) → 3/6 + 2/6 = 5/6. Ask Ruby to do fraction maths for you — she calculates exactly.";
Knowledge.gravity="Gravity is the pull that attracts masses to each other. Earth's gravity pulls everything toward the ground at about 9.8 m/s² — that's why dropped things fall down, and why the Moon stays in orbit instead of drifting away.";
Knowledge.photosynthesis="Photosynthesis is how plants make their food: they take in sunlight, water and carbon dioxide, and turn them into sugar (energy) and oxygen. It's why plants need light, and where much of Earth's oxygen comes from.";
Knowledge.electricity="Electricity is the flow of tiny charged particles called electrons through a material, usually a metal wire. Voltage pushes the flow, current is how much flows, and resistance slows it down — like water pressure, flow and a narrow pipe.";
Knowledge.internet="The internet is a worldwide network of computers connected by cables and radio signals. When you open a website, your device asks a server (another computer) for the page's files, and they travel across the network in small packets that get reassembled on your screen.";
Knowledge.computer="A computer is a machine that follows instructions (programs) to process information. Its main parts: the CPU (the 'brain' that calculates), memory/RAM (fast short-term workspace), storage (long-term files), and input/output like the keyboard and screen.";
Knowledge.moon="The Moon is Earth's natural satellite, about 384,400 km away. It doesn't make its own light — we see sunlight reflecting off it. Its phases (new, crescent, full) come from the changing angles of the Sun, Moon and Earth. The Moon's gravity also causes the ocean tides.";
Knowledge.volcano="A volcano is an opening in Earth's crust where melted rock (magma) from below can erupt as lava, ash and gas. Most volcanoes sit at the edges of tectonic plates, where Earth's giant rocky slabs meet.";
Knowledge.magnets="A magnet is an object that produces a magnetic field, attracting iron, nickel and cobalt, and pushing or pulling other magnets. Every magnet has a north and south pole: opposite poles attract, same poles repel. Earth itself acts like a giant magnet — that's why compasses work.";
Knowledge.dinosaurs="Dinosaurs were a group of reptiles that dominated Earth for over 160 million years, from about 240 to 66 million years ago. Most died out after a huge asteroid impact changed the climate — but birds are their living descendants, so dinosaurs never fully disappeared.";
Knowledge.water="The water cycle: the Sun evaporates water from oceans and lakes → it cools and condenses into clouds → it falls as precipitation (rain/snow) → it collects in rivers, lakes and groundwater → and repeats. The water you drink today is billions of years old, endlessly recycled.";
Knowledge.space="Space begins about 100 km above Earth. Our solar system has 8 planets orbiting the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. Jupiter is the biggest; Mercury is closest to the Sun; Earth is the only planet known to have life.";

const CodeGen = {
  detectLang(t){ if(/python/.test(t))return"python"; if(/html|website|web ?page/.test(t))return"html"; return"javascript"; },
  topic(t){ if(/flappy/.test(t))return"flappy"; if(/calculator/.test(t))return"calculator"; if(/todo|to-do|task list/.test(t))return"todo"; if(/game|clicker/.test(t))return"game"; if(/countdown|timer/.test(t))return"timer"; if(/sort/.test(t))return"sort"; return"generic"; },
  generate(prompt){
    const lang=this.detectLang(prompt.toLowerCase()), top=this.topic(prompt.toLowerCase());
    
    if(top==="flappy") return {lang:"html",code:`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Flappy Ruby</title><style>body{margin:0;background:#160005;display:grid;place-items:center;height:100vh}canvas{background:linear-gradient(#5b0013,#2a000a);border:2px solid #ff2e4d;border-radius:12px}</style></head>
<body><canvas id="c" width="360" height="480"></canvas><script>
const cv=document.getElementById('c'),x=cv.getContext('2d');let y=220,v=0,pipes=[],score=0,dead=false,frame=0;
function flap(){ if(dead){y=220;v=0;pipes=[];score=0;dead=false;} v=-8; }
cv.onclick=flap; document.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();flap();}};
function loop(){ if(!x) return; frame++; v+=0.45; y+=v;
 if(frame%95===0) pipes.push({px:360,gap:110+Math.random()*160});
 x.clearRect(0,0,360,480); x.fillStyle='#e0112b';
 for(const p of pipes){ p.px-=2.4; x.fillRect(p.px,0,52,p.gap); x.fillRect(p.px,p.gap+130,52,480); if(p.px===90) score++; if(52>p.px&&20<p.px+52&&(y<p.gap||y>p.gap+130)) dead=true; }
 pipes=pipes.filter(p=>p.px>-60);
 x.fillStyle='#ff2e4d'; x.beginPath(); x.arc(40,y,14,0,7); x.fill();
 x.fillStyle='#fff'; x.font='bold 22px Arial'; x.fillText('Score: '+score,12,28);
 if(y>466||y<0) dead=true; if(dead){ x.fillStyle='#fff'; x.font='bold 26px Arial'; x.fillText('Game over — click to retry',28,240); }
 requestAnimationFrame(loop); } loop();
<\/script>

</body></html>`};
    if(lang==="python"&&top==="calculator") return {lang,code:`# Ruby AI — Python Calculator\ndef calc(a, op, b):\n    if op == '+': return a + b\n    if op == '-': return a - b\n    if op == '*': return a * b\n    if op == '/': return a / b if b != 0 else 'Cannot divide by zero'\n    return 'Unknown operator'\n\nprint(calc(12, '*', 8))  # 96`};
    if(lang==="python") return {lang,code:`# Ruby AI — Python starter for: ${prompt}\ndef main():\n    items = []\n    while True:\n        text = input('Type something (or quit): ')\n        if text.lower() == 'quit': break\n        items.append(text)\n        print(f'Added. You now have {len(items)} item(s).')\n    print('Your items:', items)\n\nif __name__ == '__main__':\n    main()`};
    if(lang==="html") return {lang,code:`<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>My Page by Ruby AI</title>\n<style>body{font-family:Arial;background:#160005;color:#ffeef1;text-align:center}h1{color:#ff2e4d}button{background:#e0112b;color:#fff;border:0;padding:10px 16px;border-radius:10px}</style></head>\n<body><h1>Hello from Ruby AI</h1><p id="msg">Click the button.</p><button onclick="document.getElementById('msg').textContent='It works!'">Click me</button></body></html>`};
    if(top==="todo") return {lang,code:`// Ruby AI — JavaScript Todo App (works in any browser console / page)\nlet todos = [];\nfunction addTodo(text){ todos.push({text, done:false}); render(); }\nfunction toggleTodo(i){ todos[i].done = !todos[i].done; render(); }\nfunction render(){ console.log(todos.map((t,i)=> (t.done?'[x] ':'[ ] ')+i+'. '+t.text).join('\\n') || 'No tasks yet'); }\naddTodo('Try Ruby AI'); addTodo('Build something red'); render();`};
    if(top==="calculator") return {lang,code:`// Ruby AI — JavaScript Calculator\nfunction calc(a, op, b){\n  switch(op){ case '+': return a+b; case '-': return a-b; case '*': return a*b; case '/': return b===0 ? 'Cannot divide by zero' : a/b; default: return 'Unknown operator'; }\n}\nconsole.log(calc(12,'*',8)); // 96`};
    if(top==="game") return {lang,code:`// Ruby AI — Ruby Clicker game core\nlet rubies = 0, perClick = 1;\nfunction clickRuby(){ rubies += perClick; console.log('◆ Rubies:', rubies); }\nfunction upgrade(){ if(rubies>=20){ rubies-=20; perClick++; console.log('Upgrade! Per click:', perClick);} else console.log('Need 20 rubies'); }\n// Call clickRuby() to play in the console`};
    if(top==="timer") return {lang,code:`// Ruby AI — Countdown timer\nfunction countdown(seconds){ let s=seconds; const id=setInterval(()=>{ console.log(s); if(--s<0){ clearInterval(id); console.log('Time up!'); } },1000); }\ncountdown(10);`};
    if(top==="sort") return {lang,code:`// Ruby AI — Sorting example\nconst numbers = [5, 2, 9, 1, 7];\nconst sorted = [...numbers].sort((a,b)=>a-b);\nconsole.log('Original:', numbers);\nconsole.log('Sorted:', sorted); // [1, 2, 5, 7, 9]`};
    return {lang,code:`// Ruby AI — starter code for: ${prompt}\nfunction main(){\n  const message = 'Hello from Ruby AI';\n  console.log(message);\n  // TODO: add your logic here\n  return message;\n}\nmain();`};
  }
};

/* ===== RubyFiles v1.1: real downloadable files, in-app preview, live edits, ZIP ===== */
const RubyFiles = {
  items:{}, lastId:null, seq:0, currentPreviewId:null,
  extMime:{html:"text/html",xml:"application/xml",json:"application/json",txt:"text/plain",md:"text/markdown",py:"text/x-python",js:"text/javascript",css:"text/css",csv:"text/csv",svg:"image/svg+xml",zip:"application/zip"},
  create(name, content, files){
    const id="f"+(++this.seq); const type=(name.split(".").pop()||"txt").toLowerCase();
    this.items[id]={id,name,type,content,files:files||null,updated:Date.now()};
    this.lastId=id; return this.items[id];
  },
  last(){ return this.lastId ? this.items[this.lastId] : null; },
  blobFor(f){
    if(f.type==="zip" && f.files) return new Blob([Zip.create(f.files)],{type:"application/zip"});
    return new Blob([f.content||""],{type:this.extMime[f.type]||"text/plain"});
  },
  size(f){ if(f.type==="zip"&&f.files) return f.files.reduce((a,x)=>a+x.content.length,0); return (f.content||"").length; }
};
const Zip = {
  crcTable:null,
  crc32(bytes){ if(!this.crcTable){ this.crcTable=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; this.crcTable[n]=c>>>0; } } let c=0xFFFFFFFF; for(let i=0;i<bytes.length;i++) c=this.crcTable[(c^bytes[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; },
  create(files){ // store-only ZIP (no compression) — valid .zip any unzipper opens
    const enc=new TextEncoder(); let chunks=[], central=[], offset=0;
    const u16=v=>new Uint8Array([v&255,(v>>8)&255]); const u32=v=>new Uint8Array([v&255,(v>>8)&255,(v>>16)&255,(v>>24)&255]);
    const push=a=>{chunks.push(a); offset+=a.length;};
    for(const f of files){ const name=enc.encode(f.name); const data=typeof f.content==="string"?enc.encode(f.content):f.content; const crc=this.crc32(data); const start=offset;
      push(u32(0x04034b50)); push(u16(20)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(crc)); push(u32(data.length)); push(u32(data.length)); push(u16(name.length)); push(u16(0)); push(name); push(data);
      central.push({name,crc,size:data.length,start}); }
    const cdStart=offset;
    for(const c of central){ push(u32(0x02014b50)); push(u16(20)); push(u16(20)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(c.crc)); push(u32(c.size)); push(u32(c.size)); push(u16(c.name.length)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(0)); push(u32(c.start)); push(c.name); }
    push(u32(0x06054b50)); push(u16(0)); push(u16(0)); push(u16(central.length)); push(u16(central.length)); push(u32(offset-cdStart)); push(u32(cdStart)); push(u16(0));
    const out=new Uint8Array(offset); let pos=0; for(const ch of chunks){ out.set(ch,pos); pos+=ch.length; } return out;
  },
  list(bytes){ // read a ZIP's contents from its central directory
    const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); const dec=new TextDecoder(); let eocd=-1;
    for(let i=bytes.length-22;i>=0;i--){ if(dv.getUint32(i,true)===0x06054b50){ eocd=i; break; } }
    if(eocd<0) return [];
    const count=dv.getUint16(eocd+10,true); let off=dv.getUint32(eocd+16,true); const out=[];
    for(let n=0;n<count;n++){ if(dv.getUint32(off,true)!==0x02014b50) break;
      const method=dv.getUint16(off+10,true), size=dv.getUint32(off+20,true), nl=dv.getUint16(off+28,true), xl=dv.getUint16(off+30,true), cl=dv.getUint16(off+32,true), lho=dv.getUint32(off+42,true);
      const name=dec.decode(bytes.slice(off+46,off+46+nl));
      const lnl=dv.getUint16(lho+26,true), lxl=dv.getUint16(lho+28,true); const start=lho+30+lnl+lxl;
      out.push({name,size,method,content:bytes.slice(start,start+size)}); off+=46+nl+xl+cl; }
    return out;
  }
};
function fileDataURI(f){
  if(f.type==="zip" && f.files){ const bytes=Zip.create(f.files); let bin=""; const CH=0x8000; for(let i=0;i<bytes.length;i+=CH) bin+=String.fromCharCode.apply(null, bytes.subarray(i,i+CH)); return "data:application/zip;base64,"+btoa(bin); }
  return "data:"+(RubyFiles.extMime[f.type]||"text/plain")+";charset=utf-8,"+encodeURIComponent(f.content||"");
}
function rubyToast(msg, ms){ const t=document.getElementById("toast"); if(!t) return; t.textContent=msg; t.style.display="block"; clearTimeout(window._toastTimer); window._toastTimer=setTimeout(()=>{ t.style.display="none"; }, ms||4200); }
async function downloadFile(id){ const f=RubyFiles.items[id||RubyFiles.currentPreviewId||RubyFiles.lastId]; if(!f) return;
  // 1) Real Save dialog (Edge/Chrome) — a genuine save the browser shows you
  if(window.showSaveFilePicker){
    try{ rubyToast("💾 Pick where to save "+f.name+"…");
      const handle=await window.showSaveFilePicker({ suggestedName:f.name });
      const writable=await handle.createWritable(); await writable.write(RubyFiles.blobFor(f)); await writable.close();
      rubyToast("✅ Saved "+f.name+" — check the folder you picked."); return;
    }catch(e){ if(e && e.name==="AbortError"){ rubyToast("Save cancelled — nothing downloaded."); return; } /* any other error: fall through to link methods */ }
  }
  // 2) Blob link, 3) data-file link
  const a=document.createElement("a"); a.download=f.name; a.rel="noopener"; a.style.display="none";
  let blobUrl=null;
  try{ blobUrl=URL.createObjectURL(RubyFiles.blobFor(f)); a.href=blobUrl; }catch(e){ try{ a.href=fileDataURI(f); }catch(e2){} }
  document.body.appendChild(a); a.click(); setTimeout(()=>{ a.remove(); if(blobUrl) URL.revokeObjectURL(blobUrl); },1500);
  rubyToast("⬇ Downloading "+f.name+" — check your browser's downloads bar. If nothing appears, your viewer is blocking downloads: open RubyAI.html directly in Edge/Chrome and try there.", 7000);
}
function openFileInNewTab(id){ const f=RubyFiles.items[id||RubyFiles.currentPreviewId||RubyFiles.lastId]; if(!f) return;
  const a=document.createElement("a"); a.target="_blank"; a.rel="noopener"; a.style.display="none";
  try{ a.href=URL.createObjectURL(RubyFiles.blobFor(f)); }catch(e){ a.href=fileDataURI(f); }
  document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),1500);
}
function downloadCurrent(){ downloadFile(); }
function cleanupPreviewDom(){ (window._pvStyles||[]).forEach(s=>{ try{s.remove()}catch(e){} }); window._pvStyles=[]; }
function renderHtmlInto(container, htmlDoc){
  cleanupPreviewDom(); container.innerHTML="";
  const holder=document.createElement("div"); holder.id="pvHolder"; holder.style.cssText="min-height:60vh;background:#fff;color:#111;border-radius:10px;padding:6px;overflow:auto";
  let parsed=null; try{ parsed=new DOMParser().parseFromString(htmlDoc,"text/html"); }catch(e){}
  if(parsed && parsed.body){
    window._pvStyles=[];
    parsed.querySelectorAll("style").forEach(s=>{ const st=document.createElement("style"); st.textContent=s.textContent; document.head.appendChild(st); window._pvStyles.push(st); });
    holder.innerHTML=parsed.body.innerHTML;
    const scripts=[...holder.querySelectorAll("script")]; const codes=scripts.map(s=>s.textContent); scripts.forEach(s=>s.remove());
    container.appendChild(holder);
    codes.forEach(code=>{ if(!code.trim()) return; const sc=document.createElement("script"); sc.textContent=code; holder.appendChild(sc); });
  } else { holder.textContent=htmlDoc; container.appendChild(holder); }
}
function openPreview(id){
  const f=RubyFiles.items[id]; if(!f) return; RubyFiles.currentPreviewId=id;
  document.getElementById("ovTitle").textContent="◆ "+f.name;
  const ov=document.getElementById("overlay"), fr=document.getElementById("ovFrame"), bd=document.getElementById("ovBody");
  ov.classList.add("open"); fr.style.display="none";
  bd.style.display="block";
  if(f.type==="zip"){ renderZipView(f,bd); return; }
  if(f.type==="html"){ renderHtmlInto(bd, f.content); return; }
  if(f.type==="svg"){ cleanupPreviewDom(); bd.innerHTML=""; const holder=document.createElement("div"); holder.style.cssText="min-height:60vh;display:grid;place-items:center;background:#160005;border-radius:10px"; holder.innerHTML=f.content; bd.appendChild(holder); return; }
  cleanupPreviewDom(); bd.innerHTML=""; const pre=document.createElement("pre"); pre.textContent=f.content; bd.appendChild(pre);
}
function closePreview(){ cleanupPreviewDom(); document.getElementById("overlay").classList.remove("open"); RubyFiles.currentPreviewId=null; }
function refreshPreviewIfOpen(f){ if(RubyFiles.currentPreviewId===f.id && document.getElementById("overlay").classList.contains("open")) openPreview(f.id); }
function renderZipView(f,container){
  container.innerHTML=""; const title=document.createElement("div"); title.innerHTML="<h2 style='margin:4px 0'>📦 Inside "+f.name+"</h2><p class='small'>Click any file inside to preview it. Or download the whole ZIP with the button above.</p>"; container.appendChild(title);
  const entries = f.files ? f.files.map(x=>({name:x.name,size:x.content.length,content:x.content})) : Zip.list(new TextEncoder().encode(f.content||""));
  if(!entries.length){ container.innerHTML+="<p>This ZIP looks empty.</p>"; return; }
  for(const e of entries){ const d=document.createElement("div"); d.className="zipitem"; d.textContent="📄 "+e.name+"  —  "+e.size+" bytes"; d.onclick=()=>{ const isHtml=/\.html?$/i.test(e.name); const tmp=RubyFiles.create(e.name.replace(/[^\w.\-]/g,"_"), typeof e.content==="string"?e.content:new TextDecoder().decode(e.content)); openPreview(tmp.id); }; container.appendChild(d); }
}
function renderFileCard(f){ if(typeof RubySettings!=="undefined" && !RubySettings.data.fileCards) return;
  const c=document.getElementById("chat"); const d=document.createElement("div"); d.className="filecard";
  const icon = f.type==="zip"?"📦":(f.type==="html"?"🌐":"📄");
  d.innerHTML = icon+" <b></b><div class='small'></div>";
  d.querySelector("b").textContent=f.name;
  d.querySelector(".small").textContent = (f.type==="zip"&&f.files? f.files.length+" files inside • ":"") + RubyFiles.size(f) + " bytes • made by Ruby, ready to use";
  const row=document.createElement("div"); row.className="row";
  const mk=(label,fn)=>{ const b=document.createElement("button"); b.textContent=label; b.onclick=()=>fn(f.id); row.appendChild(b); };
  if(f.type==="html"||f.type==="svg") mk("▶ Open & use it here", openPreview);
  else if(f.type==="zip") mk("📦 See what's inside", openPreview);
  else mk("👁 View", openPreview);
  mk("⬇ Download", downloadFile); mk("↗ New tab", openFileInNewTab);
  d.appendChild(row); c.appendChild(d); c.scrollTop=c.scrollHeight;
}
function maybeRenderLastFile(beforeId){ const f=RubyFiles.last(); if(f && f.id!==beforeId) renderFileCard(f); }

/* ===== RubyMath v2 — full redesign: exact fractions + real parser =====
   Understands: 12*8, 12 × 8, 12 x 8, "12 times 8", "divide 100 by 4",
   fractions (1/2 + 1/3 = 5/6 exactly), mixed numbers (1 1/2), decimals,
   % of, fraction of, squared/cubed, square roots, factorials, brackets,
   order of operations, averages, and number words (five times six). */
function bgcd(a,b){ a=a<0n?-a:a; b=b<0n?-b:b; while(b){ [a,b]=[b,a%b]; } return a||1n; }
class Frac {
  constructor(n,d=1n){ if(d===0n) throw new Error("div0"); if(d<0n){ n=-n; d=-d; } const g=bgcd(n,d); this.n=n/g; this.d=d/g; }
  static fromDecimal(s){ if(s.includes(".")){ const [a,b]=s.split("."); const den=10n**BigInt(b.length); return new Frac(BigInt(a||"0")*den + (a.startsWith("-")?-1n:1n)*BigInt(b||"0"), den); } return new Frac(BigInt(s)); }
  add(o){ return new Frac(this.n*o.d+o.n*this.d, this.d*o.d); } sub(o){ return new Frac(this.n*o.d-o.n*this.d, this.d*o.d); }
  mul(o){ return new Frac(this.n*o.n, this.d*o.d); } div(o){ if(o.n===0n) throw new Error("div0"); return new Frac(this.n*o.d, this.d*o.n); }
  neg(){ return new Frac(-this.n, this.d); }
  pow(k){ if(k>=0n) return new Frac(this.n**k, this.d**k); return new Frac(this.d**(-k), this.n**(-k)); }
  toNumber(){ return Number(this.n)/Number(this.d); }
  isSquare(){ const s=x=>{ if(x<0n) return null; const r=BigInt(Math.round(Math.sqrt(Number(x)))); return r*r===x?r:null; }; const a=s(this.n), b=s(this.d); return (a!==null&&b!==null)?new Frac(a,b):null; }
  toString(){ if(this.d===1n) return this.n.toString(); const neg=this.n<0n; const an=neg?-this.n:this.n;
    if(an>this.d){ const whole=an/this.d, rem=an%this.d; if(rem===0n) return (neg?"-":"")+whole.toString(); return `${neg?"-":""}${whole} ${rem}/${this.d} (${this.n}/${this.d})`; }
    return `${this.n}/${this.d}`; }
}
const RubyMath = {
  numWords:{zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90},
  wordsToNumbers(s){ // "twenty five" -> 25, "one hundred and five" -> 105 (simple, for maths phrases)
    return s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|and|point)\b/g, (m)=>{
      if(m==="and") return "§and§"; if(m==="point") return "§point§"; if(m==="hundred") return "§hundred§"; if(m==="thousand") return "§thousand§"; return "§"+this.numWords[m]+"§";
    }).replace(/§(\d+)§(?:§and§)?§hundred§(?:§and§)?(?:§(\d+)§)?/g, (m,a,b)=>String(Number(a)*100+(b?Number(b):0)))
      .replace(/§(\d+)§§thousand§/g, (m,a)=>String(Number(a)*1000))
      .replace(/§(\d+)§§point§§(\d+)§/g, (m,a,b)=>a+"."+b)
      .replace(/§(\d+)§\s+§(\d+)§/g, (m,a,b)=>String(Number(a)+Number(b)))
      .replace(/§(\d+)§/g, "$1").replace(/§[a-z]+§/g," ");
  },
  normalise(raw){
    let s = " "+raw.toLowerCase().trim()+" ";
    s = s.replace(/\bmultiply\s+([\d\s.()/]+?)\s+by\s+([\d\s.()/]+?)\s*(?=\?|$|\s=)/, " $1 * $2 ");
    s = s.replace(/\bdivide\s+([\d\s.()/]+?)\s+by\s+([\d\s.()/]+?)\s*(?=\?|$|\s=)/, " $1 / $2 ");
    s = s.replace(/\badd\s+([\d\s.()/]+?)\s+and\s+([\d\s.()/]+?)\s*(?=\?|$)/, " $1 + $2 ");
    s = s.replace(/\bsubtract\s+([\d\s.()/]+?)\s+from\s+([\d\s.()/]+?)\s*(?=\?|$)/, " $2 - $1 ");
    s = s.replace(/(\d+\s*\/\s*\d+)\s+divided by\s+(\d+\s*\/\s*\d+)/g, " (($1) / ($2)) ");
    s = s.replace(/\bsimplify\b/g, " ").replace(/:/g, " ");
    s = s.replace(/×/g," * ").replace(/÷/g," / ").replace(/−|–/g,"-");
    s = this.wordsToNumbers(s);
    s = s.replace(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g, (m,a,b,c)=>`((${a}*${c}+${b})/${c})`); // mixed number 1 1/2
    s = s.replace(/\bsquare root of\b/g, " sqrt(").replace(/\bsqrt of\b/g, " sqrt(");
    if(s.includes("sqrt(") && !s.trim().endsWith(")")) s = s + ")"; // sqrt of 16 -> sqrt( 16 ) approx: close at end
    s = s.replace(/\bsquared\b/g, "^2").replace(/\bcubed\b/g, "^3");
    s = s.replace(/\bdivided by\b/g, " / ").replace(/\bmultiplied by\b/g, " * ").replace(/\btimes\b/g, " * ")
         .replace(/\bplus\b/g, " + ").replace(/\bminus\b/g, " - ").replace(/\bsubtract\b/g, " - ")
         .replace(/\bover\b/g, " / ").replace(/\bpercent\b/g, "%").replace(/\bper cent\b/g, "%");
    s = s.replace(/(\d)\s*x\s*(\d)/g, "$1 * $2"); // 12 x 8
    s = s.replace(/\bof\b/g, " * "); // 3/4 of 20, 50% of 200 (only reached in maths context)
    s = s.replace(/^(.*?\b)(what is|what's|calculate|calc|compute|solve|how much is|how many is|work out|tell me)\b/g, " ");
    s = s.replace(/equals?|is it|\?|=|please/g, " ");
    return s.trim();
  },
  tokenise(s){
    const toks=[]; let i=0;
    while(i<s.length){ const c=s[i];
      if(/\s/.test(c)){ i++; continue; }
      if(/[0-9.]/.test(c)){ let j=i; while(j<s.length&&/[0-9.]/.test(s[j])) j++; toks.push({t:"num", v:s.slice(i,j)}); i=j; continue; }
      if("+-*/^%!(),".includes(c)){ toks.push({t:c}); i++; continue; }
      if(/[a-z]/.test(c)){ let j=i; while(j<s.length&&/[a-z]/.test(s[j])) j++; toks.push({t:"fn", v:s.slice(i,j)}); i=j; continue; }
      throw new Error("badchar "+c);
    }
    return toks;
  },
  parse(toks){ // -> AST
    let pos=0; const peek=()=>toks[pos], next=()=>toks[pos++];
    function parseExpr(){ let n=parseTerm(); while(peek()&&(peek().t==="+"||peek().t==="-")){ const op=next().t; n={k:"bin",op,l:n,r:parseTerm()}; } return n; }
    function parseTerm(){ let n=parseFactor(); while(peek()&&(peek().t==="*"||peek().t==="/")){ const op=next().t; n={k:"bin",op,l:n,r:parseFactor()}; } return n; }
    function parseFactor(){ let n=parseUnary(); while(peek()&&peek().t==="^"){ next(); n={k:"bin",op:"^",l:n,r:parseUnary()}; } return n; }
    function parseUnary(){ if(peek()&&peek().t==="-"){ next(); return {k:"neg", x:parseUnary()}; } if(peek()&&peek().t==="+"){ next(); return parseUnary(); } return parsePostfix(); }
    function parsePostfix(){ let n=parseAtom(); while(peek()&&(peek().t==="%"||peek().t==="!")){ const op=next().t; n={k:op==="%"?"pct":"fact", x:n}; } return n; }
    function parseAtom(){ const tk=next(); if(!tk) throw new Error("empty");
      if(tk.t==="num") return {k:"num", v:tk.v};
      if(tk.t==="("){ const n=parseExpr(); if(!peek()||next().t!==")") throw new Error("paren"); return n; }
      if(tk.t==="fn"){ if(tk.v==="pi") return {k:"num", v:"3.141592653589793"}; if(tk.v==="e") return {k:"num", v:"2.718281828459045"};
        if(!peek()||next().t!=="(") throw new Error("fnparen"); const arg=parseExpr(); if(!peek()||next().t!==")") throw new Error("fnparen2"); return {k:"fn", v:tk.v, x:arg}; }
      throw new Error("atom "+tk.t); }
    const ast=parseExpr(); if(pos!==toks.length) throw new Error("leftover"); return ast;
  },
  evalExact(node){
    switch(node.k){
      case "num": return Frac.fromDecimal(node.v);
      case "neg": return this.evalExact(node.x).neg();
      case "pct": return this.evalExact(node.x).div(new Frac(100n));
      case "fact": { const v=this.evalExact(node.x); if(v.d!==1n||v.n<0n||v.n>170n) throw new Error("fact"); let r=1n; for(let i=2n;i<=v.n;i++) r*=i; return new Frac(r); }
      case "fn": { const v=this.evalExact(node.x);
        if(node.v==="sqrt"){ const sq=v.isSquare(); if(sq) return sq; throw new Error("irrational"); }
        if(node.v==="abs") return v.n<0n?v.neg():v; throw new Error("fn"); }
      case "bin": { const a=this.evalExact(node.l), b=this.evalExact(node.r);
        if(node.op==="+") return a.add(b); if(node.op==="-") return a.sub(b); if(node.op==="*") return a.mul(b); if(node.op==="/") return a.div(b);
        if(node.op==="^"){ if(b.d!==1n) throw new Error("pow"); return a.pow(b.n); } throw new Error("op"); }
    } throw new Error("eval");
  },
  evalFloat(node){
    switch(node.k){
      case "num": return parseFloat(node.v);
      case "neg": return -this.evalFloat(node.x);
      case "pct": return this.evalFloat(node.x)/100;
      case "fact": { const v=this.evalFloat(node.x); let r=1; for(let i=2;i<=v;i++) r*=i; return r; }
      case "fn": { const v=this.evalFloat(node.x); if(node.v==="sqrt") return Math.sqrt(v); if(node.v==="abs") return Math.abs(v); if(node.v==="round") return Math.round(v); if(node.v==="floor") return Math.floor(v); if(node.v==="ceil") return Math.ceil(v); throw new Error("fn"); }
      case "bin": { const a=this.evalFloat(node.l), b=this.evalFloat(node.r);
        if(node.op==="+") return a+b; if(node.op==="-") return a-b; if(node.op==="*") return a*b; if(node.op==="/"){ if(b===0) throw new Error("div0"); return a/b; } if(node.op==="^") return Math.pow(a,b); throw new Error("op"); }
    } throw new Error("eval");
  },
  looksMathy(raw){ const s=raw.toLowerCase(); if(!/(\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)/.test(s)) return false;
    return /[+\-*/^×÷%=]|\b(times|divide|divided|multiply|multiplied|plus|minus|add|subtract|percent|square|sqrt|root|fraction|average|mean|sum|difference|product|quotient|half|quarter|of)\b/.test(s) || /^\s*(what is|calculate|calc|solve|compute|how much is)\s+[\d(]/.test(s) || /^\s*[\d(]/.test(s); },
  trySolve(raw){
    const low=raw.toLowerCase();
    // averages / sums of lists
    let m = low.match(/(?:average|mean) of ([0-9.,\sand]+)/); 
    if(m){ const nums=m[1].split(/,|and/).map(x=>parseFloat(x)).filter(x=>!isNaN(x)); if(nums.length>1){ const avg=nums.reduce((a,b)=>a+b,0)/nums.length; return `The average of ${nums.join(", ")} is ${this.fmtFloat(avg)}  (added together = ${this.fmtFloat(nums.reduce((a,b)=>a+b,0))}, divided by ${nums.length}).`; } }
    if(!this.looksMathy(raw)) return null;
    try{
      const norm=this.normalise(raw); if(!norm || !/\d/.test(norm)) return null;
      const ast=this.parse(this.tokenise(norm));
      try{ const f=this.evalExact(ast); const dec=f.toNumber(); const fs=f.toString();
        return fs.includes("/") ? `${this.prettyExpr(raw)} = ${fs}  ≈ ${this.fmtFloat(dec)}` : `${this.prettyExpr(raw)} = ${fs}`;
      }catch(e){ if(e.message==="div0") return "That one divides by zero — and dividing by zero isn't allowed in maths, so there's no answer for it.";
        const v=this.evalFloat(ast); if(!isFinite(v)) return null; return `${this.prettyExpr(raw)} = ${this.fmtFloat(v)}`; }
    }catch(e){ if(e.message==="div0") return "That one divides by zero — and dividing by zero isn't allowed in maths, so there's no answer for it."; return null; }
  },
  prettyExpr(raw){ return raw.trim().replace(/\?+$/,""); },
  fmtFloat(v){ if(Number.isInteger(v)) return String(v); return String(Math.round(v*1e10)/1e10); }
};
function safeMath(expr){ const r=RubyMath.trySolve("calculate "+expr); if(!r) return null; const m=r.match(/= (.+?)(?:  |$)/); if(!m) return null; const n=parseFloat(m[1]); return isNaN(n)?null:n; }
function tokenize(t){ return t.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean); }

/* ===== Ruby Model Router v2 — four isolated local reasoning profiles =====
   These are separate behavior/configuration brains, not separately trained
   neural networks. No network calls, external model files, or third-party APIs.
*/
const RubyModels = {
  key:"ruby_ai_model_v2",
  profiles:{
    free:{name:"Ruby Free",hint:"Quick answers • everyday tasks",depth:1,steps:2,style:"concise",code:false},
    pro:{name:"Ruby Pro",hint:"More planning • multi-step tasks",depth:2,steps:4,style:"structured",code:false},
    professional:{name:"Ruby Professional",hint:"Deep task breakdown • careful checks",depth:3,steps:6,style:"thorough",code:false},
    coding:{name:"Ruby Coding",hint:"Code-first • file and project building",depth:3,steps:7,style:"engineering",code:true}
  },
  current:"free",
  brains:{
    free:{focus:["answer directly","use built-in knowledge","keep responses concise"]},
    pro:{focus:["identify the goal","split work into stages","check constraints","give a practical result"]},
    professional:{focus:["define requirements","break complex work into subtasks","check edge cases","state assumptions and limitations","verify consistency","summarize next steps"]},
    coding:{focus:["identify target language and file type","design the implementation","write code using local Ruby generators","check syntax-sensitive details","include run/build instructions","never claim an executable was compiled unless it was","flag platform-specific build requirements"]}
  },
  select(id){
    if(!this.profiles[id]) id="free";
    this.current=id;
    try{localStorage.setItem(this.key,id)}catch(e){}
    const sel=document.getElementById("rubyModel"); if(sel) sel.value=id;
    const hint=document.getElementById("modelHint"); if(hint) hint.textContent=this.profiles[id].hint;
    rubyToast(this.profiles[id].name+" selected ◆",1800);
  },
  load(){
    let id="free"; try{id=localStorage.getItem(this.key)||"free"}catch(e){}
    this.current=this.profiles[id]?id:"free";
    const sel=document.getElementById("rubyModel"); if(sel) sel.value=this.current;
    const hint=document.getElementById("modelHint"); if(hint) hint.textContent=this.profiles[this.current].hint;
  },
  plan(prompt,id=this.current){
    const p=this.profiles[id]||this.profiles.free;
    const words=prompt.trim().split(/\s+/).filter(Boolean);
    const coding=/\b(code|coding|program|html|css|javascript|python|file|exe|app|build|compile|debug|script)\b/i.test(prompt);
    const complex=words.length>35 || /\b(project|architecture|design|multiple|complete|full|entire|debug|optimi[sz]e|compare|research|step.?by.?step)\b/i.test(prompt);
    return {profile:p,mode:p.code||coding?"engineering":complex?"multi-step":"direct",
      checklist:p.code||coding?this.brains.coding.focus:p.depth>=3?this.brains.professional.focus:p.depth===2?this.brains.pro.focus:this.brains.free.focus};
  },
  status(){
    return "Active local profile: "+this.profiles[this.current].name+
      ". This changes Ruby's local routing, planning depth, and response behavior; it does not load a trained language model.";
  }
};

/* Ruby's private local credential namespace.
   A browser-only key is a local identifier, NOT a secure server API credential.
   Never transmit it: this build has no server and makes no network requests. */
const RubyAPI = {
  keyName:"ruby_local_api_key_v1",
  getKey(){
    try{
      let k=localStorage.getItem(this.keyName);
      if(!k){
        const bytes=new Uint8Array(32);
        if(window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
        else for(let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
        k="ruby_local_"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
        localStorage.setItem(this.keyName,k);
      }
      return k;
    }catch(e){return null}
  },
  authorize(candidate){const k=this.getKey(); return !!k && candidate===k;},
  info(){return "Ruby local key namespace initialized: "+(this.getKey()?"yes":"no")+
    ". This is device-local access control only, not a remotely callable API key.";}
};


/* ===== v1.9 brain upgrades: chat art, unit conversions, capitals ===== */
function RubyArtSVG(prompt){
  const p=(prompt||"ruby").toLowerCase(); let seed=7; for(const ch of p) seed=(seed*31+ch.charCodeAt(0))>>>0;
  const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  let bg='<rect width="900" height="560" fill="#160005"/>', body='';
  const stars=(n,col)=>{ let s=''; for(let i=0;i<n;i++) s+=`<circle cx="${Math.floor(rnd()*900)}" cy="${Math.floor(rnd()*380)}" r="${(1+rnd()*2).toFixed(1)}" fill="${col}"/>`; return s; };
  if(/space|star|planet|galaxy/.test(p)){ body=stars(160,'#ffffff')+`<circle cx="640" cy="180" r="90" fill="#e0112b"/><ellipse cx="640" cy="180" rx="170" ry="34" fill="none" stroke="#ffb3bc" stroke-width="6" transform="rotate(-18 640 180)"/><circle cx="610" cy="150" r="16" fill="#ff8a9a"/>`; }
  else if(/ocean|sea|sunset|beach/.test(p)){ bg='<rect width="900" height="560" fill="#ff9a3d"/>'; body=`<circle cx="450" cy="290" r="62" fill="#ffd23d"/><rect y="300" width="900" height="260" fill="#14418f"/>`+(()=>{let s='';for(let i=0;i<22;i++){const y=320+rnd()*220;s+=`<path d="M ${Math.floor(rnd()*800)} ${y} q 30 -10 60 0 t 60 0" stroke="#cfe4ff" fill="none" stroke-width="3"/>`;}return s})(); }
  else if(/mountain|snow/.test(p)){ bg='<rect width="900" height="560" fill="#8ec9ff"/>'; body=`<circle cx="120" cy="90" r="42" fill="#ffe9a8"/><polygon points="0,560 300,180 560,560" fill="#43536e"/><polygon points="240,560 560,120 900,560" fill="#2f3c52"/><polygon points="300,180 262,232 338,232" fill="#ffffff"/><polygon points="560,120 512,190 608,190" fill="#ffffff"/>`; }
  else if(/forest|tree/.test(p)){ bg='<rect width="900" height="560" fill="#7fb069"/>'; body=(()=>{let s='<rect y="430" width="900" height="130" fill="#123d1a"/>';for(let i=0;i<26;i++){const x=Math.floor(rnd()*880),th=90+rnd()*160;s+=`<rect x="${x}" y="${560-th}" width="9" height="${th-50}" fill="#0a2410"/><polygon points="${x+4},${560-th-70} ${x+40},${560-th+26} ${x-32},${560-th+26}" fill="#1d5c2a"/>`;}return s})(); }
  else if(/city|town/.test(p)){ bg='<rect width="900" height="560" fill="#160a33"/>'; body=stars(70,'#ffe9a8')+(()=>{let s='',x=0;while(x<880){const bw=50+rnd()*70,bh=130+rnd()*280;s+=`<rect x="${x}" y="${560-bh}" width="${bw}" height="${bh}" fill="#141433"/>`;for(let wy=560-bh+16;wy<540;wy+=26)for(let wx=x+9;wx<x+bw-10;wx+=17)if(rnd()>.45)s+=`<rect x="${wx}" y="${wy}" width="8" height="11" fill="#ffd23d"/>`;x+=bw+7;}return s})(); }
  else { body=stars(40,'#ff8a9a')+`<polygon points="450,90 760,240 620,480 280,480 140,240" fill="#e0112b"/><polyline points="140,240 760,240" stroke="#ffffff" stroke-width="5" fill="none"/><polyline points="450,90 340,240 450,480" stroke="#ffffff" stroke-width="4" fill="none"/><polyline points="560,240 450,480" stroke="#ffffff" stroke-width="4" fill="none"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">${bg}${body}<text x="28" y="528" font-family="Arial" font-size="26" font-weight="bold" fill="#ffeef1">${(prompt||'ruby art').slice(0,44).replace(/[<>&]/g,'')}</text></svg>`;
}
const RubyConvert = {
  units:{ "km":{to:"miles",f:v=>v*0.621371},"miles":{to:"km",f:v=>v*1.60934},"kg":{to:"lb",f:v=>v*2.20462},"lb":{to:"kg",f:v=>v*0.453592},"pounds":{to:"kg",f:v=>v*0.453592},"g":{to:"oz",f:v=>v*0.035274},"oz":{to:"g",f:v=>v*28.3495},"cm":{to:"inches",f:v=>v*0.393701},"inches":{to:"cm",f:v=>v*2.54},"m":{to:"ft",f:v=>v*3.28084},"ft":{to:"m",f:v=>v*0.3048},"hours":{to:"minutes",f:v=>v*60},"minutes":{to:"seconds",f:v=>v*60},"days":{to:"hours",f:v=>v*24},"weeks":{to:"days",f:v=>v*7},"gb":{to:"mb",f:v=>v*1024},"mb":{to:"kb",f:v=>v*1024},"litres":{to:"gallons",f:v=>v*0.264172},"gallons":{to:"litres",f:v=>v*3.78541} },
  tryConvert(t){ const low=t.toLowerCase();
    let m=low.match(/(-?[\d.]+)\s*°?\s*(celsius|c|fahrenheit|f)\b.*?(fahrenheit|celsius|to f|to c)/) || low.match(/(-?[\d.]+)\s*degrees?\s*(celsius|fahrenheit)/);
    if(m && /fahrenheit|celsius/.test(low)){ const v=parseFloat(m[1]); const fromC=/celsius|\bc\b/.test(m[2])|| (m[2]==='c'); if(/fahrenheit/.test(low)&&fromC) return `${v}°C = ${Math.round((v*9/5+32)*100)/100}°F.`; if(/celsius/.test(low)&&!fromC) return `${v}°F = ${Math.round(((v-32)*5/9)*100)/100}°C.`; }
    m=low.match(/(-?[\d.]+)\s*([a-z]+)\s+(?:to|in|into|=)\s+([a-z]+)/) || low.match(/how many ([a-z]+) (?:is|are) (-?[\d.]+)\s*([a-z]+)/);
    if(m){ let v,from,to; if(m[3]&&this.units[m[2]]&&m[1]&&!isNaN(parseFloat(m[1]))){ v=parseFloat(m[1]); from=m[2]; to=m[3]; } else if(m[2]&&m[3]){ to=m[1]; v=parseFloat(m[2]); from=m[3]; }
      if(v!==undefined&&this.units[from]&&this.units[from].to.replace(/s$/,'')===to.replace(/s$/,'')) { const out=this.units[from].f(v); return `${v} ${from} = ${Math.round(out*10000)/10000} ${this.units[from].to}.`; }
      if(v!==undefined&&this.units[from]&&!to) return `${v} ${from} = ${Math.round(this.units[from].f(v)*10000)/10000} ${this.units[from].to}.`; }
    m=low.match(/(-?[\d.]+)\s*([a-z]+)$/); return null; }
};
const RubyCapitals = {"france":"Paris","germany":"Berlin","italy":"Rome","spain":"Madrid","portugal":"Lisbon","the uk":"London","united kingdom":"London","england":"London","ireland":"Dublin","netherlands":"Amsterdam","belgium":"Brussels","switzerland":"Bern","austria":"Vienna","poland":"Warsaw","greece":"Athens","turkey":"Ankara","russia":"Moscow","ukraine":"Kyiv","sweden":"Stockholm","norway":"Oslo","denmark":"Copenhagen","finland":"Helsinki","iceland":"Reykjavik","usa":"Washington, D.C.","the usa":"Washington, D.C.","united states":"Washington, D.C.","america":"Washington, D.C.","canada":"Ottawa","mexico":"Mexico City","brazil":"Brasília","argentina":"Buenos Aires","chile":"Santiago","peru":"Lima","colombia":"Bogotá","egypt":"Cairo","nigeria":"Abuja","kenya":"Nairobi","south africa":"Pretoria","morocco":"Rabat","china":"Beijing","japan":"Tokyo","india":"New Delhi","pakistan":"Islamabad","thailand":"Bangkok","vietnam":"Hanoi","indonesia":"Jakarta","philippines":"Manila","south korea":"Seoul","australia":"Canberra","new zealand":"Wellington","iran":"Tehran","iraq":"Baghdad","israel":"Jerusalem","saudi arabia":"Riyadh","uae":"Abu Dhabi"};

const RubyBrain = {
  reply(raw, modelId=RubyModels.current){
    const t = raw.trim(), low = t.toLowerCase();
    const plan = RubyModels.plan(t, modelId);
    RubyMemory.data.turns++;
    RubyMemory.data.history.push({who:"user",text:t,at:Date.now()}); if(RubyMemory.data.history.length>200) RubyMemory.data.history=RubyMemory.data.history.slice(-200);
    let out = this.think(t, low, plan);
    if(plan.profile.code && /\b(exe|\.exe|installer|binary)\b/i.test(t) && !/\b(build|compile|create|make)\b/i.test(t))
      out += "\n\nRuby Coding note: I can write source and build scripts locally, but a real Windows .exe must be compiled with a Windows-compatible toolchain. This browser-only build cannot compile native executables by itself.";
    RubyMemory.data.history.push({who:"ruby",text:out,at:Date.now(),model:modelId}); RubyMemory.save(); return out;
  },
  think(t, low, plan){
    // Memory: name
    let m = low.match(/my name is ([a-z]+)/); if(m){ RubyMemory.data.name=m[1]; RubyMemory.save(); return `Nice to meet you, ${cap(m[1])}. I'll remember your name on this device.`; }
    if(/what('?s| is) my name/.test(low)) return RubyMemory.data.name ? `Your name is ${cap(RubyMemory.data.name)} — you told me and I remembered it.` : "You haven't told me your name yet. Say: my name is …";
    // Memory: remember that X is Y / remember that ...
    m = t.match(/remember that (.+?) is (.+)/i); if(m){ RubyMemory.remember(m[1], m[2]); return `Got it — I'll remember that ${m[1]} is ${m[2]}.`; }
    m = t.match(/remember that (.+)/i); if(m){ RubyMemory.remember("note "+Date.now(), m[1]); return `Got it — I'll remember that: ${m[1]}`; }
    m = t.match(/teach:\s*(.+?)\s+is\s+(.+)/i); if(m){ RubyMemory.learn(m[1], m[2]); return `Learned. From now on, on this device, I'll know: ${m[1]} is ${m[2]}.`; }
    if(/what do you remember|show (me )?your memory|show memory/.test(low)) return showMemoryText();
    m = low.match(/what is (.+?)\?*$/); // taught facts lookup happens below too
    // Recall taught / facts
    for(const k in RubyMemory.data.taught){ if(low.includes(k)) return `${cap(k)} is ${RubyMemory.data.taught[k]} — that's what you taught me.`; }
    for(const k in RubyMemory.data.facts){ if(k.startsWith("note")) continue; if(low.includes(k)) return `${cap(k)} is ${RubyMemory.data.facts[k]} — I remembered that for you.`; }
    if(/forget everything|clear memory/.test(low)){ clearMemory(); return "Memory cleared on this device."; }
    // Notes & tasks
    m = t.match(/add (?:a )?(?:note|task)[:\s]+(.+)/i); if(m){ RubyMemory.data.notes.push(m[1]); RubyMemory.save(); return `Added to your notes: “${m[1]}”. You now have ${RubyMemory.data.notes.length} note(s).`; }
    if(/show my (notes|tasks)|list my (notes|tasks)/.test(low)) return RubyMemory.data.notes.length ? "Your notes:\n"+RubyMemory.data.notes.map((n,i)=>`${i+1}. ${n}`).join("\n") : "You have no notes yet. Say: add note: buy milk";
    // Date / time
    if(/\b(time|date|day is it|today)\b/.test(low) && /(what|tell|current)/.test(low)) { const d=new Date(); return `It's ${d.toLocaleString()} on this device.`; }
    // Code runner
    m = t.match(/run (?:this )?(?:javascript|js|code)[:\s]+([\s\S]+)/i); if(m){ try{ const logs=[]; const fn=new Function("console", m[1]); fn({log:(...a)=>logs.push(a.join(" "))}); return "Ran it. Output:\n"+(logs.join("\n")||"(no output — add console.log(...))"); }catch(e){ return "That code hit an error: "+e.message; } }

    // ZIP intent: bundle the last file (or a fresh mini project) into a real .zip
    if(/zip/.test(low) && /(make|create|turn|bundle|download)/.test(low)){
      const lastF = RubyFiles.last();
      const files = lastF && lastF.type!=="zip" ? [{name:lastF.name, content:lastF.content},{name:"README.txt",content:"Made with Ruby AI (Ruby Architecture v1.10)\nFile included: "+lastF.name}] : [{name:"index.html",content:CodeGen.generate("write html code for a website").code},{name:"README.txt",content:"Ruby AI starter project.\nOpen index.html in a browser."}];
      const z = RubyFiles.create("ruby-project.zip","",files);
      return `Done — I bundled ${files.length} file(s) into a real ZIP for you: ruby-project.zip.\n\nClick "See what's inside" on the file card below to look inside it, preview the files in it, or download the whole ZIP.`;
    }
    // Explicit file intent: turn this / make a <type> file
    const fileTypes={html:"html",xml:"xml",json:"json",python:"py","py":"py",javascript:"js","js":"js",css:"css",csv:"csv",markdown:"md","text":"txt","txt":"txt",svg:"svg"};
    let ftMatch = low.match(/(?:make|create|turn (?:this|it) into|download)(?: me| this into| it into)? an? ([a-z]+) file/) || low.match(/([a-z]+) file/);
    if(ftMatch && fileTypes[ftMatch[1]] && /(make|create|turn|file|download)/.test(low)){
      const ext=fileTypes[ftMatch[1]];
      const lastF = RubyFiles.last();
      let content, name="ruby-file."+ext;
      if(/turn (this|it) into/.test(low) && lastF && lastF.type!=="zip"){ content=lastF.content; name=lastF.name.replace(/\.[^.]+$/,"")+"."+ext; if(ext==="xml" && lastF.type==="html") content='<?xml version="1.0" encoding="UTF-8"?>\n'+content; }
      else if(ext==="xml") content='<?xml version="1.0" encoding="UTF-8"?>\n<ruby>\n  <name>Ruby AI</name>\n  <message>Made by Ruby</message>\n</ruby>';
      else if(ext==="json") content=JSON.stringify({name:"Ruby AI",madeBy:"Ruby Architecture",ok:true},null,2);
      else if(ext==="csv") content="name,score\nRuby,100\nWyatt,99";
      else if(ext==="html"||ext==="svg"){ const g=CodeGen.generate(t); content=g.code; name = CodeGen.topic(low)==="flappy" ? "flappy-ruby.html" : "ruby-page.html"; if(ext==="svg") { content='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><polygon points="100,10 180,70 140,190 60,190 20,70" fill="#e0112b"/><text x="100" y="115" font-size="42" text-anchor="middle" fill="#fff">◆</text></svg>'; name="ruby-gem.svg"; } }
      else if(ext==="py"){ content=CodeGen.generate(t.includes("python")?t:t+" python").code; name="ruby-code.py"; }
      else if(ext==="js"){ content=CodeGen.generate(t).code; name="ruby-code.js"; }
      else if(ext==="css") content="body { background:#160005; color:#ffeef1; font-family:Arial; }\nh1 { color:#ff2e4d; }";
      else content="Made by Ruby AI\n"+t;
      const f=RubyFiles.create(name, content);
      return `Done — I made you a real ${ext.toUpperCase()} file: ${name} (see the file card below).\n\n• Click "Open & use it here" to ${ext==="html"?"open it right inside Ruby AI — click around, use it, then hit ✕ Close when you're done":"view it right here"}\n• Click Download to save the actual file\n• Want changes? Just tell me — like "make the background blue" — and if the preview is open you'll watch it change live.`;
    }
    // Live changes to the last file
    const lastF2 = RubyFiles.last();
    if(lastF2 && lastF2.type==="html" && /(make|change|set) /.test(low) && /(background|bigger|smaller|text|title|blue|red|green|black|white|purple|orange|pink|yellow)/.test(low)){
      let c = lastF2.content; const colour=(low.match(/(blue|red|green|black|white|purple|orange|pink|yellow)/)||[])[1];
      if(colour && /background/.test(low)) c = c.replace(/background:[^;}"']+/, "background:"+colour) .includes("background:"+colour) ? c.replace(/background:[^;}"']+/, "background:"+colour) : c.replace("</head>","<style>body{background:"+colour+" !important}</style></head>");
      else if(colour) c = c.replace("</head>","<style>body{color:"+colour+"} h1{color:"+colour+"}</style></head>");
      if(/bigger text/.test(low)) c = c.replace("</head>","<style>body{font-size:22px}</style></head>");
      if(/smaller text/.test(low)) c = c.replace("</head>","<style>body{font-size:13px}</style></head>");
      const tm = t.match(/title (?:to|say) (.+)/i); if(tm) c = c.replace(/<title>.*?<\/title>/, "<title>"+tm[1]+"</title>").replace(/<h1>.*?<\/h1>/, "<h1>"+tm[1]+"</h1>");
      lastF2.content=c; lastF2.updated=Date.now(); refreshPreviewIfOpen(lastF2);
      return `Changed it ◆ I updated ${lastF2.name} for you.\n\nIf the preview is open, you're already watching the new version — it updated live. If not, tap "Open & use it here" on its file card, and Download will save the new version.`;
    }
    // Coding tasks
    if(/(write|make|create|code|build).*(code|python|javascript|html|program|app|website|game|calculator|todo)/.test(low) || /^code /.test(low)){
      const g = CodeGen.generate(t); const fname = g.lang==="html" ? (CodeGen.topic(low)==="flappy"?"flappy-ruby.html":"ruby-page.html") : g.lang==="python" ? "ruby-code.py" : "ruby-code.js"; RubyFiles.create(fname, g.code); return `Here's working ${g.lang} code for that — and I also made it into a real file for you (see the file card below: open it here, or download it):\n\n\`\`\`${g.lang}\n${g.code}\n\`\`\`\n\nWant me to change it, explain any line, or make a different version?`;
    }
    // Math (full RubyMath engine — runs before Knowledge so "what is 5 times 6" is maths, not a knowledge question)
    const mathResult = RubyMath.trySolve(t); if(mathResult) return mathResult;

    // v1.9: image creation from chat
    if(/(make|generate|create|draw|paint).{0,30}(image|picture|artwork|drawing|painting)/.test(low) || /^(image|picture|draw) of/.test(low)){
      const subj=(t.replace(/.*?(?:image|picture|artwork|drawing|painting) of/i,"").replace(/^(make|generate|create|draw|paint)\s+(an?\s+)?/i,"").trim())||t;
      RubyFiles.create("ruby-art.svg", RubyArtSVG(subj));
      return `🎨 I drew that for you — see the file card below (ruby-art.svg). Tap "Open & use it here" to see it big, or Download to keep it.\n\nFor pixel-style art with editing tools (filters, rotate, flip), open the 🎨 Image Studio at the top and type the same words there.`;
    }
    // v1.9: music / sound from chat
    if(/(make|generate|create|compose|play).{0,24}(music|song|melody|tune|beat)/.test(low)){ setTimeout(()=>{ try{ RubyStudio.openMusicStudio(); setTimeout(()=>RubyStudio.generateMusic(),80); }catch(e){} },60);
      return "🎵 Opening the Music Studio and generating a track for you now — it'll start playing there, and you can change the style/tempo, type your own melody, and download it as WAV."; }
    if(/(make|play).{0,16}(sound|sound effect|coin sound|laser|chime|alarm|drum)/.test(low)){ const kind=/coin/.test(low)?"coin":/laser/.test(low)?"laser":/alarm/.test(low)?"alarm":/drum/.test(low)?"drum":/chime|bell/.test(low)?"chime":"jump"; setTimeout(()=>{ try{ RubyStudio.makeSound(kind); }catch(e){} },60);
      return `🔊 Making the ${kind} sound for you — it'll play in the Music Studio, where you can also download it as a WAV file.`; }
    // v1.9: unit conversions
    const conv = RubyConvert.tryConvert(t); if(conv) return conv;
    // v1.9: capitals
    const capM = low.match(/capital of ([a-z .]+?)\??$/); if(capM){ const c=RubyCapitals[capM[1].trim()]; if(c) return `The capital of ${cap(capM[1].trim())} is ${c}.`; }
    // Knowledge explanations
    for(const k in Knowledge){ if(new RegExp("\\b"+k+"\\b").test(low)) return Knowledge[k]; }
    if(/explain|what is|what are|how does|how do/.test(low)){
      const topic = low.replace(/.*(explain|what is|what are|how does|how do)\s+/,"").replace(/\?$/,"").trim();
      return `Here's the honest local answer: I don't have “${topic}” in my built-in knowledge yet — I run 100% on-device with no outside AI, so I only know what's built in or taught by you.\n\nYou can teach me right now by saying:\nteach: ${topic} is <your explanation>\n\nThen I'll remember it and answer with it next time. That's how the Ruby Architecture grows — openly, on your device.`;
    }
    // Writing
    if(/short story|write a story/.test(low)){ const hero = (low.match(/about (?:a |an )?(.+)/)||[])[1]||"a ruby dragon"; return `◆ Ruby's story ◆\n\nOnce, in a cave that glowed red at sunset, there lived ${hero}. Everyone said its heart was a ruby — not because it was hard, but because it shone brightest when it helped someone else. One stormy night it lit the whole valley with that glow, guiding every lost traveller home. And from then on, whenever the sky turned ruby-red, people smiled and said: “It's still watching over us.”\n\nWant a longer version, a different ending, or a story about something else?`; }
    if(/plan|7 days|schedule/.test(low) && /learn|study|coding|code/.test(low)) return "Here's a 7-day coding plan:\nDay 1 — Variables & print\nDay 2 — If/else decisions\nDay 3 — Loops\nDay 4 — Functions\nDay 5 — Lists & objects\nDay 6 — Build a mini project (calculator)\nDay 7 — Fix bugs, polish, show someone\n\n30–45 minutes a day beats one long session. Want me to turn any day into a lesson?";
    if(/essay|paragraph/.test(low)) return "Here's a draft you can edit:\n\nTechnology is most powerful when it belongs to everyone. When tools are open, a student with one device can learn, build, and share ideas with the whole world. Ruby AI was created in that spirit: simple, open, and running entirely on the user's own device, so curiosity never has to wait for permission.\n\nWant it longer, shorter, or about a different topic? Tell me the topic.";
    if(/joke/.test(low)) return ["Why did the ruby go to school? To become a little brighter! ◆","Why do programmers love rubies? Because every bug they fix makes the gem shine more.","What did the calculator say to the student? You can count on me." ][Math.floor(Math.random()*3)];
    if(/^(hi|hey|hello|yo)\b/.test(low)) return `Hello${RubyMemory.data.name?", "+cap(RubyMemory.data.name):""}! I'm Ruby ◆ — your local AI. I can write code, do maths, explain things, write stories, make plans, and remember what you teach me. Try the chips on the side, or just ask.`;
    if(/help|what can you do/.test(low)) return "I can do all of this — locally, no internet AI needed:\n• 💬 Chat & answer built-in knowledge questions\n• 💻 Write code — Python, JavaScript, HTML (calculators, todos, games, timers, websites…)\n• ▶️ Run JavaScript — say: run code: console.log(2+2)\n• 🧮 Maths — say: calculate 144 * 12\n• 🧠 Remember — say: remember that my dog is called Max\n• 📚 Learn from you — say: teach: Paris is the capital of France\n• 📝 Notes — say: add note: call Oakley\n• ✍️ Stories, essays & plans\n• 🎨 Images — say: make an image of space (or open Image Studio to edit your own photos)\n• 🎵 Music & sounds — say: make some music, or open Music Studio to compose, play sound effects and edit audio\n• 🔁 Conversions — say: convert 5 km to miles\n• 🕐 Date & time, jokes, and more\n\nAnd anyone can extend me — that's the Ruby Architecture (see ARCHITECTURE.md).";
    if(/model status|which model|what model/.test(low)) return RubyModels.status()+"\\n"+RubyAPI.info();
    if(/who are you|your name/.test(low)) return "I'm Ruby ◆ — a pure, local assistant built on the Ruby Architecture. I use the selected local behavior profile and built-in engines; I do not call outside AI services.";
    if(/thank/.test(low)) return "Any time ◆ That's what I'm here for.";
    if(/bye/.test(low)) return "See you soon ◆ I'll remember what we talked about on this device.";
    // Fallback with context
    const words = tokenize(low).filter(w=>w.length>3);
    return `I heard you — and here's my best local take: I don't have a built-in answer for that exact thing yet, and I won't pretend an outside AI answered it, because Ruby runs purely on your device.\n\nWhat I CAN do right now with “${t.slice(0,80)}”:\n• Rephrase it as a code task (“write code to…”)\n• Ask me to explain a built-in topic (loops, functions, Python, HTML…)\n• Teach me the answer: teach: <topic> is <answer> — then I'll know it forever on this device\n\nThat honesty is part of the design: Ruby never makes up a fake “top-tier” answer.`;
  }
};

/* ===== v1.2: Chats, Settings, Account, Sync, Memory menu, Trash delete ===== */
const RubyChats = {
  key:"ruby_ai_chats_v1", data:{chats:[], activeId:null},
  load(){ try{ const r=localStorage.getItem(this.key); if(r) this.data=JSON.parse(r); }catch(e){} if(!this.data.chats.length) this.create("New chat"); if(!this.active()) this.data.activeId=this.data.chats[0].id; },
  save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} },
  create(title){ const c={id:"c"+Date.now()+"_"+Math.floor(Math.random()*9999), title:title||"New chat", created:Date.now(), messages:[]}; this.data.chats.unshift(c); this.data.activeId=c.id; this.save(); return c; },
  active(){ return this.data.chats.find(c=>c.id===this.data.activeId) || null; },
  addMessage(who,text){ const c=this.active(); if(!c) return; c.messages.push({who,text,at:Date.now()}); if(c.title==="New chat" && who==="user") c.title=text.slice(0,42); this.save(); },
  deleteMany(ids){ const before=this.data.chats.length; this.data.chats=this.data.chats.filter(c=>!ids.includes(c.id)); if(!this.data.chats.length) this.create("New chat"); if(!this.active()) this.data.activeId=this.data.chats[0].id; this.save(); return before-this.data.chats.length; },
  exportData(){ return {exportedAt:new Date().toISOString(), chats:this.data.chats, memory:RubyMemory.data}; }
};
const RubySettings = {
  key:"ruby_ai_settings_v1",
  data:{memory:true, fileCards:true, livePreview:true, enterSend:true, animations:true, voiceAutoSend:false},
  labels:{memory:"🧠 Long-term memory (Ruby remembers you)", fileCards:"📁 File cards & downloads", livePreview:"▶ Live HTML preview", enterSend:"⏎ Enter key sends message", animations:"✨ Animations", voiceAutoSend:"🎙 Voice: auto-send after I finish talking"},
  load(){ try{ const r=localStorage.getItem(this.key); if(r) this.data=Object.assign(this.data, JSON.parse(r)); }catch(e){} },
  save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} }
};
RubySettings.load();
const RubyAccount = {
  key:"ruby_ai_account_v1", data:null,
  load(){ try{ const r=localStorage.getItem(this.key); if(r) this.data=JSON.parse(r); }catch(e){} },
  save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} },
  async hash(text){ try{ const buf=await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ruby◆"+text)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); }catch(e){ let x=0; for(const ch of text) x=(x*31+ch.charCodeAt(0))>>>0; return "h"+x; } },
  async create(user, pass){ this.data={user, passHash:await this.hash(pass), created:Date.now(), synced:false}; this.save(); return this.data; },
  async check(user, pass){ if(!this.data) return false; return this.data.user===user && this.data.passHash===await this.hash(pass); }
};
RubyAccount.load();
let deleteMode=false, pendingDelete=[];
function openModal(id){ const m=document.getElementById(id); if(m) m.classList.add("open"); if(id==="memoryModal") updateMemModals(); if(id==="settingsModal"){ renderToggles(); renderAccount(); } }
function closeModal(id){ const m=document.getElementById(id); if(m) m.classList.remove("open"); }
function updateMemModals(){ const s=`Chats: <b>${RubyChats.data.chats.length}</b> • Messages: <b>${RubyChats.data.chats.reduce((a,c)=>a+c.messages.length,0)}</b><br>Facts: <b>${Object.keys(RubyMemory.data.facts).length}</b> • Taught: <b>${Object.keys(RubyMemory.data.taught).length}</b> • Notes: <b>${RubyMemory.data.notes.length}</b>`; const a=document.getElementById("memStats2"); if(a) a.innerHTML=s; }
function renderChatList(){
  const list=document.getElementById("chatList"); if(!list) return; list.innerHTML="";
  for(const c of RubyChats.data.chats){ const d=document.createElement("div"); d.className="chatitem"+(c.id===RubyChats.data.activeId?" active":"");
    if(deleteMode){ const box=document.createElement("input"); box.type="checkbox"; box.className="delBox"; box.dataset.id=c.id; d.appendChild(box); }
    const s=document.createElement("span"); s.textContent="💬 "+c.title; s.title=c.title; d.appendChild(s);
    const n=document.createElement("span"); n.className="small"; n.style.flex="none"; n.textContent=c.messages.length; d.appendChild(n);
    d.onclick=(e)=>{ if(deleteMode) return; switchChat(c.id); };
    list.appendChild(d); }
  const dt=document.getElementById("delTools"); if(dt) dt.style.display=deleteMode?"flex":"none";
  const tb=document.getElementById("trashBtn"); if(tb) tb.textContent=deleteMode?"🗑 Pick chats…":"🗑 Trash";
}
function switchChat(id){ RubyChats.data.activeId=id; RubyChats.save(); renderChatList(); renderActiveChat(); if(window.innerWidth<800) toggleSide&&document.getElementById("side").classList.remove("open"); }
function renderActiveChat(){ const box=document.getElementById("chat"); if(!box) return; box.innerHTML=""; const c=RubyChats.active(); if(!c) return; for(const m of c.messages){ const d=document.createElement("div"); d.className="msg "+m.who; d.textContent=m.text; box.appendChild(d); } box.scrollTop=box.scrollHeight; }
function newChat(){ RubyChats.create("New chat"); renderChatList(); renderActiveChat(); const box=document.getElementById("chat"); }
function toggleDeleteMode(){ deleteMode=!deleteMode; renderChatList(); }
function selectedChatIds(){ return [...document.querySelectorAll(".delBox")].filter(b=>b.checked).map(b=>b.dataset.id); }
function selectAllChats(on){ document.querySelectorAll(".delBox").forEach(b=>b.checked=on); }
function askDeleteSelected(){ const ids=selectedChatIds(); if(!ids.length){ alert("Tick at least one chat first — or tick Select all."); return; } pendingDelete=ids; document.getElementById("confirmText").textContent=`Are you sure you want to delete ${ids.length===1?"this chat":("these "+ids.length+" chats")}?`; openModal("confirmModal"); }
function confirmDelete(){ RubyChats.deleteMany(pendingDelete); pendingDelete=[]; deleteMode=false; const sa=document.getElementById("selectAllBox"); if(sa) sa.checked=false; closeModal("confirmModal"); renderChatList(); renderActiveChat(); }
function exportChatMemory(){ const blob=new Blob([JSON.stringify(RubyChats.exportData(),null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="ruby-ai-chat-memory.json"; a.click(); }
function renderToggles(){ const t=document.getElementById("toggles"); if(!t) return; t.innerHTML=""; for(const k in RubySettings.labels){ const row=document.createElement("div"); row.className="switchrow"; const l=document.createElement("span"); l.textContent=RubySettings.labels[k]; const box=document.createElement("input"); box.type="checkbox"; box.checked=!!RubySettings.data[k]; box.onchange=()=>{ RubySettings.data[k]=box.checked; RubySettings.save(); if(k==="memory"&&!box.checked) alert("Memory is off — Ruby will chat but won't save new memories on this device."); }; row.appendChild(l); row.appendChild(box); t.appendChild(row); } }
function renderAccount(){ const a=document.getElementById("accountArea"); if(!a) return;
  if(RubyAccount.data){ a.innerHTML=""; const p=document.createElement("p"); p.className="small"; p.textContent="Signed in on this device as: "+RubyAccount.data.user+(RubyAccount.data.synced?" • Sync: ON ◆":" • Sync: not synced yet"); a.appendChild(p); const b=document.createElement("button"); b.className="ghost"; b.textContent="Sign out"; b.onclick=()=>{ RubyAccount.data=null; RubyAccount.save(); renderAccount(); }; a.appendChild(b); }
  else { a.innerHTML='<input type="text" id="accUser" placeholder="Choose a username or email"><input type="password" id="accPass" placeholder="Choose a password"><button style="width:100%" onclick="createAccount()">Create account</button><p class="small">Your account is created on this device — the password is stored only as a scrambled hash, never as plain text, and never sent anywhere.</p>'; }
}
async function createAccount(){ const u=document.getElementById("accUser").value.trim(), pw=document.getElementById("accPass").value; if(!u||pw.length<4){ alert("Pick a username and a password of at least 4 characters."); return; } await RubyAccount.create(u,pw); renderAccount(); alert("Account created ◆ Welcome, "+u); }
async function doSync(){ const u=document.getElementById("syncUser").value.trim(), pw=document.getElementById("syncPass").value; const st=document.getElementById("syncStatus"); if(!u||!pw){ st.textContent="Please enter your account info and your password first."; return; } if(!RubyAccount.data){ st.textContent="No account on this device yet — create one above first, then sync."; return; } const ok=await RubyAccount.check(u,pw); if(!ok){ st.textContent="That account info / password doesn't match this device's Ruby account. Try again."; return; } RubyAccount.data.synced=true; RubyAccount.data.lastSync=Date.now(); RubyAccount.save(); renderAccount(); st.textContent="Synced ◆ This device is linked to Ruby AI Desktop as "+u+" ("+new Date().toLocaleTimeString()+"). Note: Ruby has no cloud server yet, so sync links the account on this device — your chats and memory stay stored here, ready for desktop sync when the Ruby server launches."; }

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function showMemoryText(){ const d=RubyMemory.data; let s="Here's what I remember on this device:\n"; s+= d.name?`• Your name: ${cap(d.name)}\n`:""; for(const k in d.facts) s+=`• ${k}: ${d.facts[k]}\n`; for(const k in d.taught) s+=`• (taught) ${k}: ${d.taught[k]}\n`; s+=`• Notes: ${d.notes.length} • Conversation turns: ${d.turns}`; if(!d.name && !Object.keys(d.facts).length && !Object.keys(d.taught).length) s+="\n(Nothing personal yet — teach me something!)"; return s; }
function updateStats(){ const el=document.getElementById("memStats"); if(el) el.innerHTML=`Turns: <b>${RubyMemory.data.turns}</b><br>Facts: <b>${Object.keys(RubyMemory.data.facts).length}</b> • Taught: <b>${Object.keys(RubyMemory.data.taught).length}</b><br>Notes: <b>${RubyMemory.data.notes.length}</b><br>Memory saved on device: <b>${(RubyMemory.bytes()/1024).toFixed(2)} KB</b>`; }
function addMsg(text,who){ const c=document.getElementById("chat"); const d=document.createElement("div"); d.className="msg "+who; d.textContent=text; c.appendChild(d); c.scrollTop=c.scrollHeight; if(!window._renderingChat){ RubyChats.addMessage(who==="user"?"user":"ruby", text); renderChatList(); } }
function runRubyTurn(v){
  addMsg(v,"user");
  const before=RubyFiles.lastId;
  try{ addMsg(RubyBrain.reply(v,RubyModels.current),"ruby"); maybeRenderLastFile(before); }
  catch(err){ addMsg("Ruby hit an internal error: "+(err?.message||String(err)),"ruby"); }
}
function send(){ const i=document.getElementById("inp"); const v=i.value.trim(); if(!v)return; i.value=""; runRubyTurn(v); }
function ask(v){ runRubyTurn(v); }
function toggleSide(){ document.getElementById("side").classList.toggle("open"); }
function clearMemory(){ localStorage.removeItem(RubyMemory.key); RubyMemory.data={facts:{},taught:{},notes:[],tasks:[],history:[],name:"",turns:0,created:Date.now()}; RubyMemory.save(); updateStats(); }
function showMemory(){ addMsg(showMemoryText(),"ruby"); }
function exportMemory(){ const blob=new Blob([JSON.stringify(RubyMemory.data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="ruby-ai-memory.json"; a.click(); }
updateStats();
RubyModels.load();
RubyAPI.getKey();
RubyChats.load();
if(RubyChats.active() && RubyChats.active().messages.length){ window._renderingChat=true; renderActiveChat(); window._renderingChat=false; renderChatList(); }
else { renderChatList(); addMsg("Hello, I'm Ruby ◆ — now with real files: ask me to make something and you'll get a file card to open it right here or download it.\n\n — your pure local AI assistant.\n\nNo API keys. No Claude, ChatGPT or Gemini hiding inside. No internet AI calls. Everything I do runs in this one file, on your phone or laptop.\n\nAsk me to write code, do maths, explain something, write a story — or teach me something new and I'll remember it.","ruby"); }


/* Ruby Studio v2: every control wired to a real local function — image generation/editing, music composition, sound effects, audio editing. */
/* Ruby Studio v2 (in Ruby AI v1.9): every button wired to a real local function.
   Images: procedural scene generator + real canvas editing (filters, rotate, flip,
   presets, resize) with PNG download. Music: layered synth composer, a melody
   editor you can type notes into, sound effects, and audio editing
   (gain, filter, speed/pitch, reverse) with WAV export. All on-device. */
const RubyStudio={
 files:[], images:[], contextText:'', recognition:null, listening:false,
 image:null, rotation:0, flip:false, preset:'none', audioBuffer:null, audioContext:null,
 pickFiles(){document.getElementById('rubyFileInput').click()}, pickImages(){document.getElementById('rubyImageInput').click()},
 handleFiles(list){const arr=Array.from(list||[]);this.files.push(...arr);document.getElementById('rubyAttachStatus').textContent=this.files.length+' file(s) attached';
   arr.forEach(f=>{ if(f.type.startsWith('audio/')){ this.loadAudio(f); addMsg('Audio attached: '+f.name+' — open Music Studio to edit and export it.','user'); }
     else if(f.type.startsWith('text/')||/\.(html?|css|js|json|md|py|txt|xml|csv)$/i.test(f.name)){ const reader=new FileReader(); reader.onload=()=>{const text=String(reader.result||'').slice(0,30000); this.contextText+='\n\n[ATTACHED FILE: '+f.name+']\n'+text; addMsg('Attached file: '+f.name+' ('+text.length+' characters added to the next Ruby prompt)','user');}; reader.readAsText(f); }
     else addMsg('Attached: '+f.name+' — Ruby saved the attachment; media files can be opened in the studios.','user'); });
   rubyToast('Added '+arr.length+' file(s).',3000);},
 handleImages(list){const arr=Array.from(list||[]);this.images.push(...arr);document.getElementById('rubyAttachStatus').textContent=this.images.length+' image(s) attached';arr.forEach(f=>{const u=URL.createObjectURL(f);addMsg('Image attached: '+f.name+' (open Image Studio to edit it).','user');this.loadImageUrl(u)});rubyToast('Image(s) attached. Open Image Studio to edit or download.',2500)},
 toggleMic(){ if(typeof RubyVoice!=="undefined") return RubyVoice.toggle(); const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){rubyToast('Speech recognition is not supported in this browser. Try Chrome or Edge.',4000);return}if(this.listening){this.recognition.stop();return}const r=new SR();this.recognition=r;r.lang=navigator.language||'en-US';r.interimResults=true;r.continuous=false;r.onresult=e=>{let final='';for(let i=e.resultIndex;i<e.results.length;i++)final+=e.results[i][0].transcript;document.getElementById('inp').value=final};r.onend=()=>{this.listening=false;document.getElementById('rubyMicBtn').textContent='🎙 Microphone'};r.onerror=e=>rubyToast('Microphone: '+e.error,3000);this.listening=true;document.getElementById('rubyMicBtn').textContent='⏹ Stop listening';r.start()},
 open(title,html){document.getElementById('rubyStudioTitle').textContent=title;document.getElementById('rubyStudioContent').innerHTML=html;document.getElementById('rubyStudioModal').classList.add('open')},close(){document.getElementById('rubyStudioModal').classList.remove('open')},
 /* ---------- IMAGE STUDIO ---------- */
 openImageStudio(){this.open('🎨 Ruby Image Studio',`<p class="small">Generate a picture from words, or open your own image and really edit it — brightness, contrast, saturation, blur, hue, preset filters, rotate and flip — then download the PNG. All local: Ruby draws and edits with the canvas, no outside AI.</p>
 <div class="tools"><input id="imgPrompt" placeholder="Try: space, ocean sunset, mountains, forest, city, ruby gem…" style="min-width:260px"><button onclick="RubyStudio.generateArt()">🎨 Generate image</button><button class="ghost" onclick="document.getElementById('rubyImageInput').click()">Open image</button><button class="ghost" onclick="RubyStudio.rotateImage()">↻ Rotate 90°</button><button class="ghost" onclick="RubyStudio.flipImage()">↔ Flip</button><button class="ghost" onclick="RubyStudio.downloadImage()">⬇ Download PNG</button></div>
 <div class="tools"><span class="small">Presets:</span><button class="ghost" onclick="RubyStudio.setPreset('none')">None</button><button class="ghost" onclick="RubyStudio.setPreset('bw')">Black & white</button><button class="ghost" onclick="RubyStudio.setPreset('sepia')">Sepia</button><button class="ghost" onclick="RubyStudio.setPreset('invert')">Invert</button><button class="ghost" onclick="RubyStudio.setPreset('vivid')">Vivid</button><button class="ghost" onclick="RubyStudio.resetImage()">Reset edits</button></div>
 <div class="tools"><label>Brightness <input type="range" min="0" max="200" value="100" oninput="RubyStudio.filterImage()" id="imgBright"></label><label>Contrast <input type="range" min="0" max="200" value="100" oninput="RubyStudio.filterImage()" id="imgContrast"></label><label>Saturation <input type="range" min="0" max="250" value="100" oninput="RubyStudio.filterImage()" id="imgSat"></label><label>Blur <input type="range" min="0" max="10" value="0" oninput="RubyStudio.filterImage()" id="imgBlur"></label><label>Hue <input type="range" min="0" max="360" value="0" oninput="RubyStudio.filterImage()" id="imgHue"></label><label>Download size <select id="imgSize"><option value="0">Original canvas</option><option value="1024">1024 px</option><option value="512">512 px</option></select></label></div>
 <canvas id="rubyImageCanvas" width="900" height="560"></canvas>`);if(this.image)this.drawImage()},
 loadImageUrl(url){const im=new Image();im.onload=()=>{this.image=im;this.rotation=0;this.flip=false;if(document.getElementById('rubyImageCanvas'))this.drawImage()};im.src=url},
 filterString(){const v=id=>{const e=document.getElementById(id);return e?Number(e.value):null};const b=v('imgBright')??100,co=v('imgContrast')??100,sa=v('imgSat')??100,bl=v('imgBlur')??0,hu=v('imgHue')??0;let f=`brightness(${b}%) contrast(${co}%) saturate(${sa}%) blur(${bl}px) hue-rotate(${hu}deg)`;if(this.preset==='bw')f+=' grayscale(100%)';if(this.preset==='sepia')f+=' sepia(85%)';if(this.preset==='invert')f+=' invert(100%)';if(this.preset==='vivid')f+=' saturate(170%) contrast(112%)';return f},
 drawImage(){const c=document.getElementById('rubyImageCanvas');if(!c||!this.image)return;const x=c.getContext('2d');x.save();x.clearRect(0,0,c.width,c.height);x.filter=this.filterString();x.translate(c.width/2,c.height/2);x.rotate(this.rotation*Math.PI/180);x.scale(this.flip?-1:1,1);const swapped=this.rotation%180!==0;const iw=swapped?this.image.height:this.image.width, ih=swapped?this.image.width:this.image.height;const scale=Math.min(c.width/iw,c.height/ih);x.drawImage(this.image,-this.image.width*scale/2,-this.image.height*scale/2,this.image.width*scale,this.image.height*scale);x.restore()},
 filterImage(){this.drawImage()},
 setPreset(p){this.preset=p;this.drawImage();rubyToast('Preset: '+p,1500)},
 rotateImage(){if(!this.image)return rubyToast('Open or generate an image first.');this.rotation=(this.rotation+90)%360;this.drawImage()},
 flipImage(){if(!this.image)return rubyToast('Open or generate an image first.');this.flip=!this.flip;this.drawImage()},
 resetImage(){['imgBright','imgContrast','imgSat'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=100});['imgBlur','imgHue'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=0});this.rotation=0;this.flip=false;this.preset='none';this.drawImage()},
 seededRand(text){let seed=2166136261;for(const ch of text)seed=((seed^ch.charCodeAt(0))*16777619)>>>0;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}},
 generateArt(){const c=document.getElementById('rubyImageCanvas');if(!c)return;const x=c.getContext('2d');const p=(document.getElementById('imgPrompt')?.value||'ruby nebula').toLowerCase();const rnd=this.seededRand(p);const W=900,H=560;
   const sky=(top,bot)=>{const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(0,0,W,H)};
   const stars=n=>{x.fillStyle='#fff';for(let i=0;i<n;i++){x.globalAlpha=.3+rnd()*.7;x.beginPath();x.arc(rnd()*W,rnd()*H*.7,1+rnd()*1.8,0,7);x.fill()}x.globalAlpha=1};
   if(/space|star|galaxy|planet|nebula/.test(p)){ sky('#05001a','#3d0050'); stars(220); const px=620+rnd()*120,py=120+rnd()*80,pr=52+rnd()*30; const g=x.createRadialGradient(px-15,py-15,8,px,py,pr); g.addColorStop(0,'#ffd7de');g.addColorStop(.5,'#ff2e4d');g.addColorStop(1,'#7a0a1e'); x.fillStyle=g;x.beginPath();x.arc(px,py,pr,0,7);x.fill(); x.strokeStyle='rgba(255,200,210,.5)';x.beginPath();x.ellipse(px,py,pr*1.7,pr*.42,-.4,0,7);x.stroke(); }
   else if(/ocean|sea|beach|sunset|wave/.test(p)){ sky('#ff9a3d','#5b0a3a'); x.fillStyle='#ffd23d';x.beginPath();x.arc(450,300,58,0,7);x.fill(); const g=x.createLinearGradient(0,300,0,H);g.addColorStop(0,'#274b9f');g.addColorStop(1,'#0a1440');x.fillStyle=g;x.fillRect(0,300,W,260); x.strokeStyle='rgba(255,255,255,.55)';for(let i=0;i<26;i++){x.beginPath();const yy=315+rnd()*230;x.moveTo(rnd()*W,yy);x.bezierCurveTo(rnd()*W,yy-8,rnd()*W,yy+8,rnd()*W,yy);x.stroke()} }
   else if(/mountain|hill|snow/.test(p)){ sky('#8ec9ff','#e8f6ff'); x.fillStyle='#ffe9a8';x.beginPath();x.arc(120,90,40,0,7);x.fill(); for(let r=0;r<3;r++){ x.fillStyle=['#5a6b8a','#43536e','#2f3c52'][r]; x.beginPath(); let base=560-r*40; x.moveTo(-50,base); for(let xx=0;xx<=W;xx+=90){ x.lineTo(xx+45,base-120-rnd()*150-r*30); x.lineTo(xx+90,base);} x.lineTo(W,560);x.closePath();x.fill(); x.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<7;i++){const sx=rnd()*W,sy=300+rnd()*120;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+16,sy+22);x.lineTo(sx-16,sy+22);x.closePath();x.fill();} } }
   else if(/forest|tree|wood/.test(p)){ sky('#0d2b12','#7fb069'); x.fillStyle='#123d1a';x.fillRect(0,430,W,130); for(let i=0;i<34;i++){const tx=rnd()*W,th=90+rnd()*170;x.fillStyle='#0a2410';x.fillRect(tx-4,560-th,8,th-60);x.fillStyle=`hsl(${110+rnd()*40},55%,${22+rnd()*18}%)`;x.beginPath();x.moveTo(tx,560-th-70);x.lineTo(tx+34,560-th+30);x.lineTo(tx-34,560-th+30);x.closePath();x.fill()} }
   else if(/city|town|building/.test(p)){ sky('#160a33','#7a0a3e'); stars(90); x.fillStyle='#ffd23d';x.beginPath();x.arc(800,80,30,0,7);x.fill(); for(let bx=0;bx<W;){const bw=50+rnd()*70,bh=120+rnd()*260; x.fillStyle=`hsl(${260+rnd()*40},30%,${10+rnd()*10}%)`; x.fillRect(bx,560-bh,bw,bh); x.fillStyle='rgba(255,220,120,.9)'; for(let wy=560-bh+14;wy<540;wy+=24)for(let wx=bx+8;wx<bx+bw-10;wx+=16) if(rnd()>.45)x.fillRect(wx,wy,8,11); bx+=bw+6; } }
   else if(/ruby|gem|crystal|diamond/.test(p)){ sky('#160005','#4a0013'); stars(60); x.save();x.translate(450,270); const s=150; const grad=x.createLinearGradient(-s,-s,s,s); grad.addColorStop(0,'#ff8a9a');grad.addColorStop(.45,'#e0112b');grad.addColorStop(1,'#7a0016'); x.fillStyle=grad; x.beginPath(); x.moveTo(0,-s);x.lineTo(s*.95,-s*.3);x.lineTo(s*.6,s);x.lineTo(-s*.6,s);x.lineTo(-s*.95,-s*.3);x.closePath();x.fill(); x.strokeStyle='rgba(255,255,255,.65)';x.lineWidth=3;x.beginPath();x.moveTo(-s*.95,-s*.3);x.lineTo(s*.95,-s*.3);x.moveTo(0,-s);x.lineTo(-s*.35,-s*.3);x.lineTo(0,s);x.moveTo(s*.35,-s*.3);x.lineTo(0,s);x.stroke(); x.restore(); }
   else { sky('#160005','#a00028'); for(let i=0;i<200;i++){const xx=rnd()*W,yy=rnd()*H,r=2+rnd()*34;x.beginPath();x.arc(xx,yy,r,0,7);x.fillStyle=`rgba(255,${80+Math.floor(rnd()*130)},${110+Math.floor(rnd()*130)},${.05+rnd()*.15})`;x.fill()} }
   x.fillStyle='rgba(255,240,243,.92)';x.font='bold 26px system-ui';x.fillText(p.slice(0,44)||'ruby art',26,528);
   const url=c.toDataURL('image/png'); const im=new Image(); im.onload=()=>{this.image=im;this.rotation=0;this.flip=false;this.preset='none'}; im.src=url;
   rubyToast('🎨 Ruby drew that locally from your words. Edit it with the sliders, then Download PNG.',4000)},
 downloadImage(){const c=document.getElementById('rubyImageCanvas');if(!c)return rubyToast('Nothing to download yet — generate or open an image first.');
   const size=Number(document.getElementById('imgSize')?.value||0); let src=c;
   if(size&&size!==c.width){ const t=document.createElement('canvas'); const scale=size/c.width; t.width=size; t.height=Math.round(c.height*scale); t.getContext('2d').drawImage(c,0,0,t.width,t.height); src=t; }
   const a=document.createElement('a'); a.href=src.toDataURL('image/png'); a.download='ruby-image.png'; a.style.display='none'; document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),1200); rubyToast('⬇ Downloading ruby-image.png',2500)},
 /* ---------- MUSIC & SOUND STUDIO ---------- */
 openMusicStudio(){this.open('🎵 Ruby Music & Sound Studio',`<p class="small">Ruby composes real music with a synthesizer, plays sound effects, and edits audio you load (volume, filter, speed/pitch, reverse) — export everything as WAV. All local.</p>
 <div class="tools"><label>Style <select id="musicStyle"><option value="ambient">Ambient</option><option value="chiptune">Chiptune</option><option value="piano">Piano-like</option><option value="bass">Bass groove</option></select></label><label>Tempo <input id="musicTempo" type="number" min="50" max="200" value="110" style="width:75px"></label><label>Bars <input id="musicBars" type="number" min="1" max="16" value="4" style="width:65px"></label><button onclick="RubyStudio.generateMusic()">🎼 Generate & play</button><button class="ghost" onclick="document.getElementById('rubyAudioInput').click()">Load audio</button></div>
 <div class="tools"><input id="melodyNotes" placeholder="Type your own melody: C4 E4 G4 A4 G4 E4" style="min-width:280px"><button onclick="RubyStudio.playMelody()">▶ Play my melody</button><span class="small">Notes A–G, add # and octave: F#4. R = rest.</span></div>
 <div class="tools"><span class="small">Sound effects:</span><button class="ghost" onclick="RubyStudio.makeSound('coin')">🪙 Coin</button><button class="ghost" onclick="RubyStudio.makeSound('laser')">🔫 Laser</button><button class="ghost" onclick="RubyStudio.makeSound('jump')">🦘 Jump</button><button class="ghost" onclick="RubyStudio.makeSound('chime')">🔔 Chime</button><button class="ghost" onclick="RubyStudio.makeSound('alarm')">🚨 Alarm</button><button class="ghost" onclick="RubyStudio.makeSound('drum')">🥁 Drum beat</button></div>
 <input id="rubyAudioInput" type="file" accept="audio/*" style="display:none" onchange="RubyStudio.loadAudio(this.files[0])"><audio id="rubyAudioPlayer" controls></audio>
 <div class="tools"><label>Volume <input id="audioGain" type="range" min="0" max="200" value="100"></label><label>Low-pass Hz <input id="audioFilter" type="range" min="300" max="12000" value="12000"></label><label>Speed % <input id="audioSpeed" type="range" min="50" max="200" value="100"></label><label><input type="checkbox" id="audioReverse"> Reverse</label><button onclick="RubyStudio.processAudio()">Apply effects & export WAV</button></div>
 <p id="musicStatus" class="small">Generated music, your melodies, sound effects and edited audio can all be downloaded as WAV.</p>`);},
 noteFreq(name){const m=/^([A-G])(#|B)?(\d)$/i.exec(name.trim());if(!m)return null;const base={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()];let semi=base+(m[2]==='#'?1:m[2]&&m[2].toUpperCase()==='B'?-1:0);const midi=12*(Number(m[3])+1)+semi;return 440*Math.pow(2,(midi-69)/12)},
 addTone(data,rate,freq,startSec,durSec,kind,gain){const start=Math.floor(startSec*rate),len=Math.floor(durSec*rate);for(let j=0;j<len&&start+j<data.length;j++){const t=j/rate;let v=0;if(kind==='square')v=Math.sign(Math.sin(2*Math.PI*freq*t))*.6;else if(kind==='saw')v=(2*((freq*t)%1)-1)*.7;else if(kind==='piano')v=Math.sin(2*Math.PI*freq*t)+.4*Math.sin(4*Math.PI*freq*t)+.15*Math.sin(6*Math.PI*freq*t),v/=1.55;else v=Math.sin(2*Math.PI*freq*t);const env=Math.exp(-t*3.2);data[start+j]+=v*env*gain}},
 addHat(data,rate,startSec,gain){const start=Math.floor(startSec*rate),len=Math.floor(.05*rate);for(let j=0;j<len&&start+j<data.length;j++){data[start+j]+=(Math.random()*2-1)*gain*(1-j/len)}},
 makeBuffer(seconds,rate){const ctx=new (window.AudioContext||window.webkitAudioContext)();const buf=ctx.createBuffer(1,Math.max(1,Math.ceil(seconds*rate)),rate);this.audioContext=ctx;return buf},
 playBuffer(buf,name){const ctx=this.audioContext||new (window.AudioContext||window.webkitAudioContext)();this.audioContext=ctx;const src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);src.start();this.audioBuffer=buf;const url=URL.createObjectURL(new Blob([this.bufferToWav(buf)],{type:'audio/wav'}));const player=document.getElementById('rubyAudioPlayer');if(player)player.src=url;this.addAudioDownload(url,name);const st=document.getElementById('musicStatus');if(st)st.textContent='Now playing: '+name+' — download it with the link below.'},
 compose(style,tempo,bars){const rate=44100,beat=60/tempo,seconds=bars*4*beat;const buf=this.makeBuffer(seconds,rate),data=buf.getChannelData(0);
   const chords={ambient:[['A3','C4','E4'],['F3','A3','C4'],['C4','E4','G4'],['G3','B3','D4']],piano:[['C4','E4','G4'],['A3','C4','E4'],['F3','A3','C4'],['G3','B3','D4']],chiptune:[['C4','E4','G4'],['A3','C4','E4'],['F3','A3','C4'],['G3','B3','D4']],bass:[['A1','A1','C2'],['A1','A1','E2'],['F1','F1','A1'],['G1','G1','B1']]}[style]||[['A3','C4','E4']];
   const kind=style==='chiptune'?'square':style==='bass'?'saw':style==='piano'?'piano':'sine';
   for(let bar=0;bar<bars;bar++){const chord=chords[bar%chords.length],barStart=bar*4*beat;
     if(style==='ambient'){ chord.forEach(n=>this.addTone(data,rate,this.noteFreq(n),barStart,beat*4,'sine',.12)); }
     else if(style==='bass'){ for(let s2=0;s2<8;s2++){ this.addTone(data,rate,this.noteFreq(chord[s2%chord.length]),barStart+s2*beat/2,beat*.45,'saw',.20); if(s2%2===0)this.addHat(data,rate,barStart+s2*beat/2,.05);} }
     else { const arp=[0,1,2,1,0,2,1,2]; for(let s2=0;s2<8;s2++){ this.addTone(data,rate,this.noteFreq(chord[arp[s2]]),barStart+s2*beat/2,beat*.5,kind,.16); } this.addTone(data,rate,this.noteFreq(chord[0])/2,barStart,beat*2,'sine',.12); }
   } return buf},
 async generateMusic(){const tempo=Math.max(50,Math.min(200,Number(document.getElementById('musicTempo')?.value)||110)),bars=Math.max(1,Math.min(16,Number(document.getElementById('musicBars')?.value)||4)),style=document.getElementById('musicStyle')?.value||'ambient';const buf=this.compose(style,tempo,bars);this.playBuffer(buf,'ruby-'+style+'-music.wav');rubyToast('🎼 Generated a '+style+' track at '+tempo+' BPM',3000)},
 playMelody(){const raw=(document.getElementById('melodyNotes')?.value||'').trim();if(!raw)return rubyToast('Type some notes first, like: C4 E4 G4 A4');const tokens=raw.split(/[\s,]+/).filter(Boolean);const tempo=112,beat=60/tempo,rate=44100;const buf=this.makeBuffer(tokens.length*beat+0.4,rate),data=buf.getChannelData(0);let bad=0;tokens.forEach((tk,i)=>{if(/^r$/i.test(tk))return;const f=this.noteFreq(tk);if(!f){bad++;return}this.addTone(data,rate,f,i*beat,beat*.92,'piano',.22)});this.playBuffer(buf,'ruby-my-melody.wav');if(bad)rubyToast('Played it — '+bad+' note(s) were not recognised and were skipped.',3500)},
 makeSound(kind){const rate=44100;let buf;
   if(kind==='drum'){ buf=this.makeBuffer(2,rate); const d=buf.getChannelData(0); for(let b=0;b<4;b++){ const st=b*0.5; for(let j=0;j<Math.floor(.18*rate);j++){ const i=Math.floor(st*rate)+j; if(i<d.length)d[i]+=Math.sin(2*Math.PI*(150-j/rate*300)*j/rate)*Math.exp(-j/(rate*.06))*.5; } this.addHat(d,rate,st+.25,.12);} }
   else { buf=this.makeBuffer(1.1,rate); const d=buf.getChannelData(0);
     if(kind==='coin'){ this.addTone(d,rate,988,0,.09,'square',.18); this.addTone(d,rate,1319,.09,.5,'square',.18); }
     else if(kind==='laser'){ for(let j=0;j<Math.floor(.35*rate);j++){ const f=1400-j/rate*2600; d[j]+=Math.sin(2*Math.PI*f*j/rate)*.22*Math.exp(-j/(rate*.3)); } }
     else if(kind==='jump'){ for(let j=0;j<Math.floor(.3*rate);j++){ const f=300+j/rate*1800; d[j]+=Math.sin(2*Math.PI*f*j/rate)*.22*Math.exp(-j/(rate*.35)); } }
     else if(kind==='chime'){ [1319,1568,2093].forEach((f,i)=>this.addTone(d,rate,f,i*.12,.8,'sine',.16)); }
     else if(kind==='alarm'){ for(let r2=0;r2<3;r2++){ this.addTone(d,rate,880,r2*.3,.14,'square',.16); this.addTone(d,rate,660,r2*.3+.15,.14,'square',.16); } }
     else { this.addTone(d,rate,660,0,.4,'sine',.2); } }
   if(!document.getElementById('rubyStudioModal')?.classList.contains('open')) this.openMusicStudio();
   setTimeout(()=>this.playBuffer(buf,'ruby-'+kind+'-sound.wav'),60); rubyToast('🔊 Made the '+kind+' sound — playing it now, WAV download is in the Music Studio.',3500)},
 addAudioDownload(url,name){let a=document.getElementById('rubyAudioDownload');if(!a){a=document.createElement('a');a.id='rubyAudioDownload';a.style.display='block';a.style.margin='10px 0';document.getElementById('rubyStudioContent').appendChild(a)}a.href=url;a.download=name;a.textContent='⬇ Download '+name},
 async loadAudio(file){if(!file)return;try{const bytes=await file.arrayBuffer(),ctx=new (window.AudioContext||window.webkitAudioContext)(),buf=await ctx.decodeAudioData(bytes);this.audioBuffer=buf;this.audioContext=ctx;const url=URL.createObjectURL(file);const player=document.getElementById('rubyAudioPlayer');if(player)player.src=url;const status=document.getElementById('musicStatus');if(status)status.textContent='Loaded '+file.name+' • '+buf.duration.toFixed(1)+' seconds. Adjust volume / filter / speed / reverse, then Apply effects & export WAV.';if(!document.getElementById('rubyStudioModal')?.classList.contains('open'))this.openMusicStudio()}catch(e){rubyToast('Could not decode this audio file: '+e.message,4000)}},
 bufferToWav(buffer){const channels=buffer.numberOfChannels,length=buffer.length*channels*2+44,ab=new ArrayBuffer(length),v=new DataView(ab);let o=0;const str=s=>{for(let i=0;i<s.length;i++)v.setUint8(o++,s.charCodeAt(i))};str('RIFF');v.setUint32(o,36+buffer.length*channels*2,true);o+=4;str('WAVEfmt ');v.setUint32(o,16,true);o+=4;v.setUint16(o,1,true);o+=2;v.setUint16(o,channels,true);o+=2;v.setUint32(o,buffer.sampleRate,true);o+=4;v.setUint32(o,buffer.sampleRate*channels*2,true);o+=4;v.setUint16(o,channels*2,true);o+=2;v.setUint16(o,16,true);o+=2;str('data');v.setUint32(o,buffer.length*channels*2,true);o+=4;for(let i=0;i<buffer.length;i++)for(let c=0;c<channels;c++){let x=Math.max(-1,Math.min(1,buffer.getChannelData(c)[i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}return ab},
 async processAudio(){if(!this.audioBuffer)return rubyToast('Load or generate audio first.');let b=this.audioBuffer;
   if(document.getElementById('audioReverse')?.checked){ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const rev=ctx.createBuffer(b.numberOfChannels,b.length,b.sampleRate); for(let ch=0;ch<b.numberOfChannels;ch++){ const src=b.getChannelData(ch),dst=rev.getChannelData(ch); for(let i=0;i<b.length;i++)dst[i]=src[b.length-1-i]; } b=rev; }
   const rate=b.sampleRate,channels=b.numberOfChannels,OC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!OC)return rubyToast('This browser cannot render audio offline.');
   const ctx=new OC(channels,b.length,rate),src=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();src.buffer=b;src.playbackRate.value=(Number(document.getElementById('audioSpeed')?.value)||100)/100;gain.gain.value=(Number(document.getElementById('audioGain')?.value)||100)/100;filter.type='lowpass';filter.frequency.value=Number(document.getElementById('audioFilter')?.value)||12000;src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);src.start();const out=await ctx.startRendering(),wav=this.bufferToWav(out),url=URL.createObjectURL(new Blob([wav],{type:'audio/wav'}));this.audioBuffer=out;this.addAudioDownload(url,'ruby-edited-audio.wav');const st=document.getElementById('musicStatus');if(st)st.textContent='Effects applied (volume, filter, speed'+(document.getElementById('audioReverse')?.checked?', reversed':'')+'). Exported as WAV — download below.'}
};


/* ===== RubyVoice v1.10: click, talk, and your words become text you can send ===== */
const RubyVoice = {
  rec:null, listening:false, finalText:"",
  supported(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition); },
  setUI(on){
    for(const id of ["composerMicBtn","rubyMicBtn"]){ const b=document.getElementById(id); if(!b) continue;
      b.classList.toggle("mic-live", on);
      if(id==="composerMicBtn") b.textContent = on ? "⏹" : "🎙";
      else b.textContent = on ? "⏹ Stop listening" : "🎙 Microphone"; }
    const cap=document.getElementById("voiceCaption"); if(cap) cap.style.display = on ? "block" : "none";
    if(on && cap) cap.querySelector(".in").textContent = "🎙 Listening… start talking — your words will appear in the message box";
  },
  toggle(){ if(this.listening) this.stop(); else this.start(); },
  start(){
    if(!this.supported()){ rubyToast("🎙 Voice typing isn't supported in this browser — it works in Chrome and Edge. You can still type as normal.",6000); return; }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    let r; try{ r=new SR(); }catch(e){ rubyToast("🎙 Couldn't start the microphone: "+e.message,5000); return; }
    this.rec=r; this.finalText="";
    r.lang=(navigator.language||"en-US"); r.interimResults=true; r.continuous=true;
    r.onresult=(e)=>{
      let interim="", finalChunk="";
      for(let i=e.resultIndex;i<e.results.length;i++){ const res=e.results[i]; if(res.isFinal) finalChunk+=res[0].transcript; else interim+=res[0].transcript; }
      const cap=document.getElementById("voiceCaption");
      if(finalChunk){
        this.finalText += finalChunk;
        const inp=document.getElementById("inp");
        const cur=inp.value.replace(/\s+$/,"");
        inp.value = (cur?cur+" ":"") + finalChunk.trim() + " ";
        inp.dispatchEvent(new Event("input",{bubbles:true}));
        if(cap) cap.querySelector(".in").textContent="🎙 Heard: “"+finalChunk.trim()+"” — tap Send, or keep talking";
        if(typeof RubySettings!=="undefined" && RubySettings.data.voiceAutoSend){ this.stop(); const v=inp.value.trim(); if(v){ inp.value=""; if(typeof runRubyTurn==="function") runRubyTurn(v); else if(typeof send==="function") send(); } }
      } else if(interim && cap){ cap.querySelector(".in").textContent="🎙 …"+interim; }
    };
    r.onerror=(e)=>{
      if(e.error==="not-allowed"||e.error==="service-not-allowed") rubyToast("🎙 Microphone is blocked. Tap the lock/tune icon in the browser address bar → Site settings → Microphone → Allow, then try again.",8000);
      else if(e.error==="no-speech") rubyToast("🎙 I didn't hear anything — tap the mic and try again, a bit closer.",4500);
      else if(e.error!=="aborted") rubyToast("🎙 Microphone: "+e.error,4500);
    };
    r.onend=()=>{ this.listening=false; this.setUI(false); };
    try{ r.start(); this.listening=true; this.setUI(true); }
    catch(e){ rubyToast("🎙 Couldn't start the microphone: "+e.message,5000); }
  },
  stop(){ if(this.rec){ try{ this.rec.stop(); }catch(e){} } this.listening=false; this.setUI(false); }
};

// Model-specific workflow improvements: structured task plans and explicit quality checks.
RubyModels.profiles.pro.depth=3;RubyModels.profiles.pro.steps=6;RubyModels.profiles.professional.depth=5;RubyModels.profiles.professional.steps=10;RubyModels.profiles.coding.depth=5;RubyModels.profiles.coding.steps=10;
RubyModels.brains.pro.focus=['clarify the outcome','decompose into ordered steps','consider alternatives','check constraints and likely failure points','review the result'];
RubyModels.brains.professional.focus=['define success criteria','identify stakeholders and constraints','separate facts from assumptions','decompose into workstreams','analyze risks and edge cases','compare viable approaches','produce a professional deliverable','run a consistency and completeness review','state limitations and unresolved items','give actionable next steps'];
RubyModels.brains.coding.focus=['identify requirements and target environment','inspect existing code and preserve compatibility','design components and interfaces','implement the smallest complete solution','handle errors and edge cases','review security and data handling','check syntax and integration points','provide tests and expected results','document build and run steps','never claim an unperformed build or test'];
const _rubySend=window.send;window.send=function(){const i=document.getElementById('inp');if(RubyStudio.contextText){i.value+='\n\nPlease use the following attached file contents as source material:\n'+RubyStudio.contextText;RubyStudio.contextText='';}return _rubySend();};
window.addEventListener('paste',e=>{const items=Array.from(e.clipboardData?.items||[]);const files=items.map(x=>x.getAsFile()).filter(Boolean);if(files.length){const imgs=files.filter(f=>f.type.startsWith('image/'));const docs=files.filter(f=>!f.type.startsWith('image/'));if(imgs.length)RubyStudio.handleImages(imgs);if(docs.length)RubyStudio.handleFiles(docs);}});
const _rubyPlan=RubyModels.plan.bind(RubyModels);RubyModels.plan=function(prompt,id=this.current){const p=_rubyPlan(prompt,id);p.checklist=this.brains[id]||p.checklist;p.review=(id==='professional'||id==='coding'||id==='pro');return p};
