// Ruby Architecture v1.13 — core extracted from RubyAI-v1.13.html (brain + Studio + Voice + Code School + Brain Boost + Social)

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
      const files = lastF && lastF.type!=="zip" ? [{name:lastF.name, content:lastF.content},{name:"README.txt",content:"Made with Ruby AI (Ruby Architecture v1.13)\nFile included: "+lastF.name}] : [{name:"index.html",content:CodeGen.generate("write html code for a website").code},{name:"README.txt",content:"Ruby AI starter project.\nOpen index.html in a browser."}];
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


/* ===== RubyCodeSchool v1.11: Ruby went to coding school.
   She no longer hands back toy snippets for big asks — she builds COMPLETE apps
   from the component library she was taught: desktop OS, games, tools, sites. */
const RubyApps = {
  esc(s){ return String(s||"").replace(/[<>&"]/g,""); },
  slug(s){ return (String(s||"app").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)) || "app"; },
  hue(s){ let x=7; for(const c of String(s||"ruby")) x=(x*31+c.charCodeAt(0))>>>0; return x%360; },

  /* ---- A full desktop OS in one page: clickable icons, draggable windows, taskbar, start menu ---- */
  desktopOS(name){
    const title = this.esc(name || "Ruby Windows");
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>
*{box-sizing:border-box;margin:0;font-family:Segoe UI,Arial,sans-serif;user-select:none}
body{height:100vh;overflow:hidden;background:linear-gradient(135deg,#0b3d91,#7b2ff7 55%,#f107a3)}
#desktop{position:absolute;inset:0 0 48px 0;padding:18px;display:flex;flex-direction:column;flex-wrap:wrap;gap:14px;align-content:flex-start}
.icon{width:96px;padding:10px 4px 8px;text-align:center;color:#fff;border-radius:10px;cursor:pointer;text-shadow:0 1px 3px #0009}
.icon:hover{background:#ffffff2b}.icon .g{font-size:38px;display:block}.icon span{font-size:12.5px}
#taskbar{position:absolute;left:0;right:0;bottom:0;height:48px;background:#10101cd9;backdrop-filter:blur(8px);display:flex;align-items:center;gap:8px;padding:0 10px;color:#fff;z-index:999}
#startBtn{font-size:20px;background:#ffffff1f;border:0;color:#fff;border-radius:8px;padding:7px 13px;cursor:pointer}
#startBtn:hover{background:#ffffff38}
.taskApp{background:#ffffff14;border:1px solid #ffffff2e;color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px}
#clock{margin-left:auto;font-size:13.5px;text-align:right;line-height:1.15}
#startMenu{position:absolute;left:10px;bottom:58px;width:280px;background:#16162add;border:1px solid #ffffff2b;border-radius:14px;color:#fff;padding:12px;display:none;z-index:1000;backdrop-filter:blur(10px)}
#startMenu.open{display:block}
#startMenu h3{margin:4px 6px 10px;font-size:15px}
#startMenu button{display:flex;gap:10px;align-items:center;width:100%;background:none;border:0;color:#fff;text-align:left;padding:9px;border-radius:9px;cursor:pointer;font-size:14px}
#startMenu button:hover{background:#ffffff22}
.win{position:absolute;width:520px;max-width:94vw;height:380px;max-height:78vh;background:#fdfdff;border-radius:12px;box-shadow:0 18px 50px #000a;display:flex;flex-direction:column;overflow:hidden}
.win.hidden{display:none}
.titlebar{height:40px;background:linear-gradient(90deg,#283593,#7b2ff7);color:#fff;display:flex;align-items:center;gap:8px;padding:0 8px 0 14px;cursor:move;font-size:14px;font-weight:600}
.titlebar .sp{flex:1}
.tbtn{width:30px;height:26px;border:0;border-radius:6px;background:#ffffff2a;color:#fff;cursor:pointer;font-size:13px}
.tbtn:hover{background:#ffffff4d}.tbtn.close:hover{background:#e81123}
.body{flex:1;overflow:auto;padding:14px;color:#1c1c28;font-size:14.5px;line-height:1.55}
.body textarea{width:100%;height:100%;border:0;outline:none;resize:none;font-size:15px;font-family:inherit}
.calc{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.calc button{padding:13px 0;font-size:17px;border:1px solid #ddd;border-radius:9px;background:#f4f4fa;cursor:pointer}
.calc button:hover{background:#e6e6ff}
#calcOut{grid-column:1/-1;background:#14142a;color:#fff;border-radius:9px;padding:12px;font-size:24px;text-align:right;min-height:56px}
input[type=text],input[type=color]{padding:8px;border:1px solid #ccc;border-radius:8px}
.body button.act{background:#283593;color:#fff;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}
.tile{display:inline-block;width:104px;height:76px;border-radius:10px;margin:5px;cursor:pointer}
@media(max-width:640px){.win{width:94vw;height:64vh}}
</style></head><body>
<div id="desktop"></div>
<div id="startMenu"><h3>${title}</h3><div id="smApps"></div><hr style="border-color:#ffffff2b;margin:8px 0"><button onclick="alert('Thanks for using ${title}!')">⏻ Shut down (not really)</button></div>
<div id="taskbar"><button id="startBtn" title="Start">🪟</button><div id="taskApps" style="display:flex;gap:8px"></div><div id="clock"></div></div>
<script>
const APPS=[
 {id:'welcome',icon:'👋',name:'Welcome',html:'<h2>Welcome to ${title}!</h2><p>This is a whole desktop that lives in one web page.</p><ul><li><b>Double-click</b> a desktop icon to open its app</li><li><b>Drag</b> any window by its coloured title bar</li><li>Use the <b>—</b> button to minimise, <b>✕</b> to close</li><li>Open apps appear in the taskbar — click to bring them back</li><li>The <b>Start menu</b> (bottom-left) lists every app</li></ul>'},
 {id:'notes',icon:'📝',name:'Notepad',html:'<textarea id="np" placeholder="Type your notes here… they save automatically."></textarea>',init(){const t=document.getElementById('np');t.value=localStorage.getItem('os-notes')||'';t.oninput=()=>localStorage.setItem('os-notes',t.value);}},
 {id:'calc',icon:'🧮',name:'Calculator',html:'<div class="calc"><div id="calcOut">0</div></div>',init(){const out=document.getElementById('calcOut');const grid=out.parentElement;let cur='0',prev=null,op=null;const keys=['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+','C'];keys.forEach(k=>{const b=document.createElement('button');b.textContent=k;b.onclick=()=>{if(/\\d|\\./.test(k)){cur=cur==='0'&&k!=='.'?k:cur+k;}else if(k==='C'){cur='0';prev=null;op=null;}else if(k==='='){if(prev!==null&&op){const a=parseFloat(prev),c=parseFloat(cur);cur=String(op==='+'?a+c:op==='−'?a-c:op==='×'?a*c:c!==0?a/c:'Error');prev=null;op=null;}}else{prev=cur;op=k;cur='0';}out.textContent=op?prev+' '+op+' '+cur:cur;};grid.appendChild(b);});}},
 {id:'photos',icon:'🖼️',name:'Photos',html:'<p>Your gallery — click a tile to see it big.</p><div id="gal"></div><div id="big" style="margin-top:10px"></div>',init(){const g=document.getElementById('gal');const cols=['#e0112b','#283593','#00897b','#f9a825','#6a1b9a','#00838f','#4e342e','#ad1457'];cols.forEach((c,i)=>{const d=document.createElement('div');d.className='tile';d.style.background='linear-gradient(135deg,'+c+',#111)';d.onclick=()=>{document.getElementById('big').innerHTML='<div style="height:150px;border-radius:12px;background:linear-gradient(135deg,'+c+',#111)"></div><p>Photo '+(i+1)+'</p>';};g.appendChild(d);});}},
 {id:'settings',icon:'⚙️',name:'Settings',html:'<h3>Personalise</h3><p>Desktop colour: <input type="color" id="bgc" value="#7b2ff7"></p><p style="margin-top:10px">Your name: <input type="text" id="uname" placeholder="Type your name"></p><p id="hi" style="margin-top:10px"></p>',init(){document.getElementById('bgc').oninput=e=>{document.body.style.background='linear-gradient(135deg,#0b3d91,'+e.target.value+')';};document.getElementById('uname').oninput=e=>{document.getElementById('hi').textContent=e.target.value?('Hello, '+e.target.value+'! 👋'):'';};}},
 {id:'browser',icon:'🌐',name:'Web Browser',html:'<p><input type="text" id="addr" value="https://example.org" style="width:75%"> <button class="act" id="go">Go</button></p><p style="margin-top:10px;color:#555">This pretend browser shows the address you type. (Real browsing needs a real tab — safety rules stop pages loading inside other pages.)</p><div id="fakePage" style="margin-top:12px;border:1px dashed #aaa;border-radius:10px;padding:16px">📄 example.org — a sample page</div>',init(){document.getElementById('go').onclick=()=>{const a=document.getElementById('addr').value;document.getElementById('fakePage').textContent='📄 You asked for: '+a;};}},
];
let z=10; const open=new Map();
const desk=document.getElementById('desktop'), taskApps=document.getElementById('taskApps'), sm=document.getElementById('smApps');
function makeWindow(app){
 const w=document.createElement('div'); w.className='win'; w.style.left=(40+open.size*36)+'px'; w.style.top=(30+open.size*30)+'px'; w.style.zIndex=++z;
 w.innerHTML='<div class="titlebar"><span>'+app.icon+' '+app.name+'</span><span class="sp"></span><button class="tbtn min">—</button><button class="tbtn close">✕</button></div><div class="body">'+app.html+'</div>';
 document.body.appendChild(w);
 const bar=w.querySelector('.titlebar');
 bar.addEventListener('pointerdown',e=>{ if(e.target.classList.contains('tbtn'))return; w.style.zIndex=++z; const dx=e.clientX-w.offsetLeft, dy=e.clientY-w.offsetTop; const mv=ev=>{ w.style.left=Math.max(0,Math.min(innerWidth-80,ev.clientX-dx))+'px'; w.style.top=Math.max(0,Math.min(innerHeight-90,ev.clientY-dy))+'px'; }; const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); }; addEventListener('pointermove',mv); addEventListener('pointerup',up); });
 w.addEventListener('pointerdown',()=>{ w.style.zIndex=++z; });
 w.querySelector('.close').onclick=()=>{ w.remove(); open.delete(app.id); renderTask(); };
 w.querySelector('.min').onclick=()=>{ w.classList.add('hidden'); };
 open.set(app.id,w); if(app.init) app.init(w);
 return w;
}
function renderTask(){ taskApps.innerHTML=''; open.forEach((w,id)=>{ const app=APPS.find(a=>a.id===id); const b=document.createElement('button'); b.className='taskApp'; b.textContent=app.icon+' '+app.name; b.onclick=()=>{ w.classList.remove('hidden'); w.style.zIndex=++z; }; taskApps.appendChild(b); }); }
function launch(id){ const app=APPS.find(a=>a.id===id); let w=open.get(id); if(!w){ w=makeWindow(app); } w.classList.remove('hidden'); w.style.zIndex=++z; renderTask(); document.getElementById('startMenu').classList.remove('open'); }
APPS.forEach(app=>{ const d=document.createElement('div'); d.className='icon'; d.innerHTML='<span class="g">'+app.icon+'</span><span>'+app.name+'</span>'; d.ondblclick=()=>launch(app.id); d.onclick=()=>{ if(matchMedia('(pointer:coarse)').matches) launch(app.id); }; desk.appendChild(d);
 const s=document.createElement('button'); s.innerHTML=app.icon+' '+app.name; s.onclick=()=>launch(app.id); sm.appendChild(s); });
document.getElementById('startBtn').onclick=()=>document.getElementById('startMenu').classList.toggle('open');
function tick(){ const d=new Date(); document.getElementById('clock').innerHTML=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'<br>'+d.toLocaleDateString(); }
tick(); setInterval(tick,1000);
launch('welcome');
<\/script></body></html>`;
  },

  /* ---- A complete canvas game: move, collect, dodge, score, lives, restart ---- */
  game(topic){
    const name = this.esc(topic || "Ruby Runner"); const h = this.hue(topic);
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title>
<style>body{margin:0;background:#0d0d17;color:#fff;font-family:Arial;text-align:center}canvas{background:hsl(${h},45%,12%);border:2px solid hsl(${h},80%,55%);border-radius:12px;max-width:94vw;touch-action:none}button{background:hsl(${h},85%,45%);color:#fff;border:0;border-radius:9px;padding:10px 18px;font-size:15px;cursor:pointer}.hud{font-size:17px;margin:10px}</style></head><body>
<h1>🎮 ${name}</h1><div class="hud">Score: <b id="score">0</b> · Lives: <b id="lives">3</b> · Best: <b id="best">0</b></div>
<canvas id="cv" width="640" height="420"></canvas>
<p>Move with ⬅️ ⬆️ ⬇️ ➡️ arrow keys, WASD, or drag on touch screens. Collect the gems 💎, dodge the meteors ☄️. Every 100 points the meteors get faster!</p>
<p><button id="restart">↻ Restart game</button> <button id="pause">⏸ Pause</button>
<label>Difficulty <select id="diff"><option value="0.7">Easy</option><option value="1" selected>Normal</option><option value="1.5">Hard</option></select></label></p>
<div id="touch" style="margin:8px"><button data-k="arrowup">⬆️</button><br><button data-k="arrowleft">⬅️</button> <button data-k="arrowdown">⬇️</button> <button data-k="arrowright">➡️</button></div>
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
let px=300,py=340,score=0,lives=3,run=true,paused=false,t=0,level=1;
const stars=Array.from({length:60},()=>({x:Math.random()*640,y:Math.random()*420,s:Math.random()*1.8+0.4}));
const pops=[];
document.querySelectorAll('#touch button').forEach(b=>{ const k=b.dataset.k; b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;}); b.addEventListener('pointerup',()=>keys[k]=false); b.addEventListener('pointerleave',()=>keys[k]=false); });
document.getElementById('pause').onclick=e=>{ paused=!paused; e.target.textContent=paused?'▶️ Resume':'⏸ Pause'; };
let gems=[],rocks=[];
function spawnGem(){gems.push({x:20+Math.random()*600,y:20+Math.random()*380});}
function spawnRock(){rocks.push({x:Math.random()*640,y:-20,v:2+Math.random()*2.5});}
for(let i=0;i<5;i++)spawnGem();
const keys={}; addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(e.key.startsWith('Arrow'))e.preventDefault();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let touch=null; cv.addEventListener('pointerdown',e=>touch=e); cv.addEventListener('pointermove',e=>{ if(touch){ const r=cv.getBoundingClientRect(); px=(e.clientX-r.left)*(cv.width/r.width)-16; py=(e.clientY-r.top)*(cv.height/r.height)-16; }});
cv.addEventListener('pointerup',()=>touch=null);
function reset(){px=300;py=340;score=0;lives=3;run=true;gems=[];rocks=[];for(let i=0;i<5;i++)spawnGem();document.getElementById('score').textContent=0;document.getElementById('lives').textContent=3;}
document.getElementById('restart').onclick=reset;
function loop(){
 requestAnimationFrame(loop); t++;
 if(run&&!paused){
  const sp=4.2;
  if(keys['arrowleft']||keys['a'])px-=sp; if(keys['arrowright']||keys['d'])px+=sp;
  if(keys['arrowup']||keys['w'])py-=sp; if(keys['arrowdown']||keys['s'])py+=sp;
  px=Math.max(0,Math.min(608,px)); py=Math.max(0,Math.min(388,py));
  if(t%Math.max(26,70-level*5)===0)spawnRock();
  const df=parseFloat(document.getElementById('diff').value); rocks.forEach(r=>r.y+=r.v*df*(1+(level-1)*0.18)); rocks=rocks.filter(r=>r.y<450);
  gems=gems.filter(g=>{ const hit=Math.abs(g.x-px-6)<30&&Math.abs(g.y-py-6)<30; if(hit){score+=10;document.getElementById('score').textContent=score;pops.push({x:g.x,y:g.y,txt:'+10',a:1});const nl=Math.floor(score/100)+1; if(nl>level){level=nl;pops.push({x:280,y:190,txt:'LEVEL '+level+'!',a:1});} spawnGem();} return !hit; });
  rocks=rocks.filter(r=>{ const hit=Math.abs(r.x-px-16)<26&&Math.abs(r.y-py-16)<26; if(hit){lives--;document.getElementById('lives').textContent=lives; if(lives<=0){run=false; const best=Math.max(score,+localStorage.getItem('game-best')||0); localStorage.setItem('game-best',best); document.getElementById('best').textContent=best;}} return !hit; });
 }
 document.getElementById('best').textContent=localStorage.getItem('game-best')||0;
 ctx.clearRect(0,0,640,420); ctx.fillStyle='#ffffff88'; stars.forEach(st=>{ ctx.fillRect(st.x,(st.y+t*0.3)%420,st.s,st.s); });
 ctx.font='bold 15px Arial'; pops.forEach(pp=>{ ctx.globalAlpha=Math.max(0,pp.a); ctx.fillStyle='#ffd23d'; ctx.fillText(pp.txt,pp.x,pp.y); pp.y-=0.7; pp.a-=0.016; }); ctx.globalAlpha=1; for(let i=pops.length-1;i>=0;i--) if(pops[i].a<=0) pops.splice(i,1);
 if(paused){ ctx.fillStyle='#000a'; ctx.fillRect(0,0,640,420); ctx.fillStyle='#fff'; ctx.font='bold 30px Arial'; ctx.textAlign='center'; ctx.fillText('⏸ Paused',320,215); ctx.textAlign='left'; }
 ctx.font='30px serif'; gems.forEach(g=>ctx.fillText('💎',g.x,g.y+24)); rocks.forEach(r=>ctx.fillText('☄️',r.x,r.y+24));
 ctx.fillStyle='hsl(${h},85%,55%)'; ctx.beginPath(); ctx.roundRect(px,py,32,32,9); ctx.fill();
 ctx.fillStyle='#fff'; ctx.font='bold 15px Arial'; ctx.fillText('◆',px+10,py+21);
 if(!run){ ctx.fillStyle='#000a'; ctx.fillRect(0,0,640,420); ctx.fillStyle='#fff'; ctx.font='bold 34px Arial'; ctx.textAlign='center'; ctx.fillText('Game over! Score: '+score,320,200); ctx.font='17px Arial'; ctx.fillText('Press Restart to play again',320,232); ctx.textAlign='left'; }
}
loop();
<\/script></body></html>`;
  },

  /* ---- Standalone working calculator app ---- */
  calculator(){
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calculator</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#14141f;font-family:Arial}.box{background:#1e1e2e;padding:18px;border-radius:18px;width:300px;box-shadow:0 16px 40px #000a}#out{background:#0c0c16;color:#fff;font-size:32px;text-align:right;padding:16px;border-radius:12px;min-height:44px;word-break:break-all}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}button{padding:15px 0;font-size:18px;border:0;border-radius:11px;background:#2c2c40;color:#fff;cursor:pointer}button:hover{background:#3a3a56}.op{background:#7b2ff7}.eq{background:#e0112b;grid-column:span 2}</style></head><body>
<div class="box"><div id="out">0</div><div class="grid" id="grid"></div></div>
<script>
const out=document.getElementById('out'); let cur='0',prev=null,op=null;
function show(){ out.textContent = op? (prev+' '+op+' '+cur) : cur; }
function press(k){
 if(/\\d/.test(k)||k==='.'){ cur = (cur==='0'&&k!=='.') ? k : (k==='.'&&cur.includes('.')? cur : cur+k); }
 else if(k==='C'){ cur='0'; prev=null; op=null; }
 else if(k==='⌫'){ cur = cur.length>1? cur.slice(0,-1) : '0'; }
 else if(k==='='){ if(prev!==null&&op){ const a=parseFloat(prev),b=parseFloat(cur); let r = op==='+'?a+b : op==='−'?a-b : op==='×'?a*b : (b!==0? a/b : NaN); cur = isNaN(r)? 'Error' : String(Math.round(r*1e10)/1e10); prev=null; op=null; } }
 else { if(prev!==null&&op){ press('='); } prev=cur; op=k; cur='0'; }
 show();
}
['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='].forEach(k=>{ const b=document.createElement('button'); b.textContent=k; if('÷×−+'.includes(k))b.className='op'; if(k==='=')b.className='eq'; if(k==='%'){ b.onclick=()=>{ cur=String(parseFloat(cur)/100); show(); }; } else b.onclick=()=>press(k); document.getElementById('grid').appendChild(b); });
addEventListener('keydown',e=>{ const map={'/':'÷','*':'×','-':'−','Enter':'=','Escape':'C','Backspace':'⌫'}; const k=map[e.key]||e.key; if(/\\d|\\.|\\+/.test(k)||'÷×−=C⌫'.includes(k)) press(k); });
show();
<\/script></body></html>`;
  },

  /* ---- To-do app with saving ---- */
  todo(){
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My To-Do List</title>
<style>body{margin:0;min-height:100vh;background:#101018;color:#fff;font-family:Arial;display:grid;place-items:start center;padding:28px 14px}.app{width:min(480px,94vw)}h1{color:#ff8a9a}input{width:70%;padding:12px;border-radius:10px;border:1px solid #444;background:#1b1b28;color:#fff;font-size:15px}button{padding:12px 16px;border:0;border-radius:10px;background:#e0112b;color:#fff;cursor:pointer;font-size:15px}li{list-style:none;background:#1b1b28;margin:8px 0;padding:12px;border-radius:10px;display:flex;gap:10px;align-items:center}li.done span{text-decoration:line-through;color:#999}li .sp{flex:1}li button{background:#33334a;padding:7px 11px}ul{padding:0}.count{color:#bbb}</style></head><body>
<div class="app"><h1>✅ My To-Do List</h1>
<p><input id="inp" placeholder="What needs doing?"> <button id="add">Add</button></p>
<p class="count" id="count"></p><ul id="list"></ul>
<button id="clearDone" style="background:#33334a">Clear finished</button></div>
<script>
let items=JSON.parse(localStorage.getItem('todo-items')||'[]');
const list=document.getElementById('list'), inp=document.getElementById('inp');
function save(){ localStorage.setItem('todo-items',JSON.stringify(items)); }
function render(){ list.innerHTML=''; items.forEach((it,i)=>{ const li=document.createElement('li'); if(it.done)li.className='done';
 const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=it.done; cb.onchange=()=>{ it.done=cb.checked; save(); render(); };
 const sp=document.createElement('span'); sp.className='sp'; sp.textContent=it.text;
 const del=document.createElement('button'); del.textContent='🗑'; del.onclick=()=>{ items.splice(i,1); save(); render(); };
 li.append(cb,sp,del); list.appendChild(li); });
 document.getElementById('count').textContent = items.length? (items.filter(i=>i.done).length+' of '+items.length+' done') : 'Nothing here yet — add your first task above.'; }
function add(){ const v=inp.value.trim(); if(!v)return; items.push({text:v,done:false}); inp.value=''; save(); render(); }
document.getElementById('add').onclick=add; inp.addEventListener('keydown',e=>{ if(e.key==='Enter')add(); });
document.getElementById('clearDone').onclick=()=>{ items=items.filter(i=>!i.done); save(); render(); };
render();
<\/script></body></html>`;
  },

  /* ---- Paint app ---- */
  paint(){
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paint</title>
<style>body{margin:0;background:#14141f;color:#fff;font-family:Arial;text-align:center;padding:14px}canvas{background:#fff;border-radius:12px;max-width:94vw;touch-action:none}input,button{margin:4px;padding:9px 13px;border-radius:9px;border:0;font-size:14px}button{background:#e0112b;color:#fff;cursor:pointer}</style></head><body>
<h1>🎨 Paint</h1>
<p>Colour <input type="color" id="col" value="#e0112b"> Brush size <input type="range" id="size" min="1" max="40" value="6">
<button id="erase">Eraser</button><button id="clear">Clear</button><button id="save">💾 Save picture</button></p>
<canvas id="cv" width="760" height="480"></canvas>
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,cv.width,cv.height); ctx.lineCap='round';
let down=false,lx=0,ly=0,erasing=false;
function pos(e){ const r=cv.getBoundingClientRect(); return [ (e.clientX-r.left)*(cv.width/r.width), (e.clientY-r.top)*(cv.height/r.height) ]; }
cv.addEventListener('pointerdown',e=>{ down=true; [lx,ly]=pos(e); });
cv.addEventListener('pointermove',e=>{ if(!down)return; const [x,y]=pos(e); ctx.strokeStyle=erasing?'#fff':document.getElementById('col').value; ctx.lineWidth=document.getElementById('size').value; ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(x,y); ctx.stroke(); lx=x; ly=y; });
addEventListener('pointerup',()=>down=false);
document.getElementById('erase').onclick=e=>{ erasing=!erasing; e.target.textContent=erasing?'✏️ Draw':'Eraser'; };
document.getElementById('clear').onclick=()=>{ ctx.fillStyle='#fff'; ctx.fillRect(0,0,cv.width,cv.height); };
document.getElementById('save').onclick=()=>{ const a=document.createElement('a'); a.download='my-painting.png'; a.href=cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); };
<\/script></body></html>`;
  },

  /* ---- Chat app with a built-in buddy ---- */
  chatApp(){
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chat Buddy</title>
<style>body{margin:0;min-height:100vh;background:#0f0f16;color:#fff;font-family:Arial;display:grid;place-items:center}.app{width:min(460px,94vw);height:88vh;display:flex;flex-direction:column;background:#171724;border-radius:16px;overflow:hidden}#log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:9px}.m{max-width:80%;padding:10px 13px;border-radius:14px;line-height:1.45;font-size:14.5px}.me{align-self:flex-end;background:#e0112b}.them{align-self:flex-start;background:#262638}form{display:flex;gap:8px;padding:11px;background:#10101a}input{flex:1;padding:11px;border-radius:10px;border:1px solid #333;background:#1d1d2c;color:#fff}button{background:#e0112b;color:#fff;border:0;border-radius:10px;padding:11px 16px;cursor:pointer}h3{margin:0;padding:13px;background:#10101a}</style></head><body>
<div class="app"><h3>💬 Chat Buddy</h3><div id="log"></div><form id="f"><input id="inp" placeholder="Say something…" autocomplete="off"><button>Send</button></form></div>
<script>
const log=document.getElementById('log'), inp=document.getElementById('inp');
function add(text,who){ const d=document.createElement('div'); d.className='m '+who; d.textContent=text; log.appendChild(d); log.scrollTop=1e9; }
const replies=[ [/hello|hi|hey/i,'Hey! Great to see you. What are we doing today?'], [/how are you/i,'Running at full sparkle, thanks for asking! How about you?'], [/joke/i,'Why did the web developer go broke? He used up all his cache. 😄'], [/name/i,'I am Buddy, the tiny chat friend who lives in this page.'], [/bye/i,'Bye for now! This page will remember nothing, so every visit is a fresh start.'], [/thank/i,'Any time! That is literally what I am here for.'] ];
function answer(t){ for(const [re,s] of replies) if(re.test(t)) return s; const fallbacks=['Interesting — tell me more about that.','Oh? Go on, I am listening.','That is a new one for me. What else is on your mind?','Noted! (Well, pretend-noted. I forget everything when the tab closes.)']; return fallbacks[Math.floor(Math.random()*fallbacks.length)]; }
add('Hi, I am Buddy! Type something and I will chat back. Try asking for a joke.','them');
document.getElementById('f').onsubmit=e=>{ e.preventDefault(); const v=inp.value.trim(); if(!v)return; add(v,'me'); inp.value=''; setTimeout(()=>add(answer(v),'them'),450); };
<\/script></body></html>`;
  },

  /* ---- A real topic website: hero, features, gallery, form ---- */
  landing(topic){
    const t = this.esc(topic || "My Website"); const h = this.hue(topic);
    const cards = ["Why people love it","How it works","Get started today"].map((c,i)=>`<div class="card"><div class="ic">${["💡","⚙️","🚀"][i]}</div><h3>${c}</h3><p>Everything about ${t} is explained here in plain words, with the details that actually matter and none of the fluff.</p></div>`).join("");
    const tiles = Array.from({length:6},(_,i)=>`<div class="tile" style="background:linear-gradient(135deg,hsl(${(h+i*36)%360},75%,45%),hsl(${(h+i*36+60)%360},80%,30%))"><span>${t.split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase()} ${i+1}</span></div>`).join("");
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:Arial;color:#191924}header{position:sticky;top:0;background:#12121df0;color:#fff;display:flex;gap:18px;align-items:center;padding:13px 22px}header b{color:hsl(${h},90%,65%);font-size:19px}header a{color:#ddd;text-decoration:none;font-size:14.5px}.hero{padding:74px 22px;text-align:center;color:#fff;background:linear-gradient(135deg,hsl(${h},80%,38%),hsl(${(h+70)%360},85%,30%))}.hero h1{font-size:44px;margin:0 0 12px}.hero p{font-size:18px;opacity:.92;max-width:640px;margin:0 auto 22px}.btn{background:#fff;color:#191924;border:0;border-radius:11px;padding:13px 24px;font-size:16px;cursor:pointer;font-weight:bold}section{max-width:980px;margin:0 auto;padding:44px 22px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.card{background:#f5f5fa;border-radius:14px;padding:20px}.card .ic{font-size:30px}.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}.tile{height:110px;border-radius:13px;display:grid;place-items:center;color:#fff;font-weight:bold;font-size:19px;text-shadow:0 1px 4px #0008}form{display:grid;gap:10px;max-width:440px}input,textarea{padding:12px;border:1px solid #bbb;border-radius:10px;font-size:15px;font-family:inherit}form button{background:hsl(${h},85%,45%);color:#fff;border:0;border-radius:10px;padding:13px;font-size:16px;cursor:pointer}footer{background:#12121d;color:#aaa;text-align:center;padding:22px;font-size:13.5px}.count{background:#f5f5fa;border-radius:14px;padding:20px;text-align:center}.count b{font-size:34px;color:hsl(${h},85%,45%)}</style></head><body>
<header><b>${t}</b><a href="#about">About</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a></header>
<div class="hero"><h1>Welcome to ${t}</h1><p>The home of ${t} on the web — what it is, why it matters, and how to be part of it.</p><button class="btn" onclick="document.getElementById('about').scrollIntoView({behavior:'smooth'})">Explore ↓</button></div>
<section id="about"><h2>About ${t}</h2><div class="cards">${cards}</div></section>
<section><div class="count"><p>People who clicked the big red button:</p><b id="n">0</b><br><br><button class="btn" id="cntBtn" style="background:hsl(${h},85%,45%);color:#fff">Click me!</button></div></section>
<section id="gallery"><h2>Gallery</h2><div class="tiles">${tiles}</div></section>
<section id="contact"><h2>Contact</h2><form onsubmit="event.preventDefault();document.getElementById('ok').textContent='✅ Thanks! Your message about ${t} was received (demo form — nothing was sent anywhere).';this.reset()"><input required placeholder="Your name"><input type="email" required placeholder="Your email"><textarea rows="4" placeholder="Your message"></textarea><button>Send message</button><p id="ok"></p></form></section>
<footer>Made with Ruby AI · ${t} · <span id="yr"></span></footer>
<script>
document.getElementById("yr").textContent=new Date().getFullYear();
let clicks=0; document.getElementById("cntBtn").onclick=()=>{ document.getElementById("n").textContent=++clicks; };
<\/script></body></html>`;
  },

  /* ---- Fallback: a decent interactive starter page for any other topic ---- */
  starter(topic){
    const t = this.esc(topic || "My Page"); const h = this.hue(topic);
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title>
<style>body{margin:0;font-family:Arial;background:linear-gradient(135deg,hsl(${h},70%,16%),hsl(${(h+60)%360},70%,26%));color:#fff;min-height:100vh;display:grid;place-items:center;padding:20px}.box{max-width:640px;background:#ffffff12;border:1px solid #ffffff30;border-radius:18px;padding:30px;text-align:center}h1{margin-top:0}button{background:hsl(${h},90%,55%);color:#fff;border:0;border-radius:11px;padding:12px 22px;font-size:16px;cursor:pointer}input{padding:11px;border-radius:10px;border:0;width:70%;font-size:15px}li{text-align:left;margin:6px 0}</style></head><body>
<div class="box"><h1>${t}</h1><p>This page was made by Ruby AI. It is a real, working starting point — the button counts, the list remembers, and everything below actually does something.</p>
<p><button id="b">Clicked <b id="n">0</b> times</button></p>
<h3>📝 Quick notes</h3><p><input id="inp" placeholder="Type a note, press Enter"> </p><ul id="list"></ul>
<p style="opacity:.8;font-size:13.5px">Edit this file to make it yours — change the title, colours and words.</p></div>
<script>
let n=0; document.getElementById('b').onclick=()=>{ document.getElementById('n').textContent=++n; };
const inp=document.getElementById('inp'), list=document.getElementById('list');
inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&inp.value.trim()){ const li=document.createElement('li'); li.textContent=inp.value; list.appendChild(li); inp.value=''; } });
<\/script></body></html>`;
  }
};

/* ===== RubySchool: the lessons. Coding lessons + how to be a good assistant. ===== */
const RubySchool = {
  lessons: {
    html: "📘 Lesson — HTML is the skeleton of every web page. A page is built from tags: <h1> is a big heading, <p> is a paragraph, <button> is a clickable button, <img> shows a picture, and <a href=\"...\"> makes a link. Every page Ruby builds starts with <!DOCTYPE html>, a <head> (title + styles) and a <body> (what you see). Rule one of Ruby's school: a real page is COMPLETE — it always has the full structure, never just a fragment, unless the person asked for a fragment.",
    css: "🎨 Lesson — CSS is how a page looks: colours, sizes, spacing, layout. Rules live in a <style> block or a style attribute: color changes text colour, background paints behind things, border-radius rounds corners, and display:flex lines things up in rows. Ruby's rule: if she builds an app, she styles it properly — readable text, real spacing, buttons that look like buttons.",
    javascript: "⚙️ Lesson — JavaScript is what makes a page DO things. It finds elements with document.getElementById, listens for clicks with onclick or addEventListener, and changes the page in response. Ruby's rules: every button she ships must actually work; state (scores, lists, notes) is kept in variables and saved to localStorage when it should survive a refresh; and she tests the logic in her head step by step before handing it over.",
    decisions: "🧭 How Ruby decides what to build: (1) Listen for the THING — a desktop, a game, a calculator, a website. (2) Pick the closest complete template from her school library instead of starting from a blank page. (3) Default file type is HTML, because HTML runs anywhere — unless the person names another type (ZIP, JSON, a Python file…), then she makes exactly that. (4) Fill the template with the person's topic and words. (5) Check: does every button work? Is anything a placeholder? If yes, fix it before delivering. Big ask = big file. A desktop with clickable icons takes hundreds of lines, and that's correct.",
    assistant: "💎 How Ruby was taught to be a good assistant: (1) Be honest — never fake an answer; if she doesn't know, she says so and offers to learn it. (2) Actually do the thing — a finished file beats a description of a file. (3) No placeholders and no fake buttons — if it looks clickable, it must work. (4) Remember what matters — names, facts, preferences — and use them naturally. (5) When something she made is wrong, she says so plainly, fixes it, and doesn't make excuses. (6) Ask ONE clear question when a request is genuinely ambiguous, instead of guessing wrong. (7) Keep answers as short as the job allows, but never cut the substance. (8) The person's data stays on their device — privacy is part of being trustworthy.",
  },
  topic(low){
    if (/css|style|colour|color/.test(low)) return this.lessons.css;
    if (/javascript|\bjs\b|script/.test(low)) return this.lessons.javascript;
    if (/decide|decision|how do you (build|code|make)/.test(low)) return this.lessons.decisions;
    if (/assistant|behave|behavior|good ai|taught to be/.test(low)) return this.lessons.assistant;
    return this.lessons.html;
  }
};

/* ===== v1.11 routing: file-making fixed (HTML default) + the school library does the building ===== */
(function(){
  const origThink = RubyBrain.think.bind(RubyBrain);
  function fileReply(fname, kind){
    return `✅ Done — I built that as a real file for you: **${fname}** (see the card below).\n\nTap **Open & use it here** to try it right away, or **Download** to keep it. It's a complete ${kind} — everything in it works, no placeholders.`;
  }
  RubyBrain.think = function(text, lowOrig, plan){
    const t = String(text||""); const low = " "+(lowOrig||t.toLowerCase()).replace(/\s+/g," ")+" ";
    // --- Lessons: Ruby can teach what she was taught ---
    if (/(teach me|lesson|how do i (learn|code|make)|how to code|learn (html|css|javascript|js|coding))/.test(low) && !/make|build me|create me/.test(low))
      return RubySchool.topic(low);
    if (/how (were you taught|do you decide|are you a good assistant)/.test(low)) return /assistant|good/.test(low) ? RubySchool.lessons.assistant : RubySchool.lessons.decisions;
    // --- Corrections: a good assistant owns mistakes and learns the fix ---
    const corr = t.match(/^(?:no,?\s+)?(?:that'?s (?:wrong|not right)|wrong[.!]?|incorrect[.!]?)\s*(?:it'?s|the answer is)?\s*(.*)$/i);
    if (corr && !/make|build/.test(low))
      return `You're right to call that out — sorry about that. I'm not going to pretend I had it right.\n\nIf you tell me the correct version like this: **teach: <topic> is <the right answer>** — I'll remember it properly and use it from now on.`;
    // --- Building things: the school library handles it, completely ---
    const wantsBuild = /\b(make|create|build|generate|code|write)\b/.test(low);
    const fileTypeMatch = low.match(/\b(zip|json|xml|csv|text|txt|markdown|md|python|py|javascript|js|css)\s+file\b/) || low.match(/\b(html)\s+file\b/);
    const isCodeSnippet = /(python|javascript) code|code (for|to)|function|script to/.test(low) && !/(app|page|website|game|desktop|file)/.test(low);
    if (wantsBuild && !isCodeSnippet && !/(image|picture|artwork|drawing|music|song|sound|note|story|poem)/.test(low)){
      // explicit file type wins; HTML is the default
      if (fileTypeMatch){
        const kind = fileTypeMatch[1];
        if (kind==="zip"){ const files=[{name:"index.html",content:RubyApps.starter("My Page")},{name:"notes.txt",content:"Made by Ruby AI.\nThis ZIP was created because you asked for a ZIP — HTML is my default, but the type you name is the type you get."},{name:"data.json",content:JSON.stringify({madeBy:"Ruby AI",type:"zip",files:3},null,2)}]; RubyFiles.create("my-files.zip","",files); return fileReply("my-files.zip","ZIP archive with real files inside"); }
        if (kind==="json"||kind==="xml"||kind==="csv"){ const topic=(t.replace(/.*?(?:about|for|of)\s+/i,"").trim()||"Ruby Data"); const c = kind==="json"? JSON.stringify({topic, madeBy:"Ruby AI", items:[{name:topic+" — item 1", value:1},{name:topic+" — item 2", value:2}]},null,2) : kind==="xml"? `<?xml version="1.0" encoding="UTF-8"?>\n<data topic="${topic.replace(/"/g,"")}"><item id="1">${topic} — item 1</item><item id="2">${topic} — item 2</item></data>` : "name,value\n"+topic+" — item 1,1\n"+topic+" — item 2,2\n"; const fn=RubyApps.slug(topic)+"."+kind; RubyFiles.create(fn, c); return fileReply(fn, kind.toUpperCase()+" file"); }
        if (kind==="txt"||kind==="text"||kind==="md"||kind==="markdown"){ const fn="my-notes."+(kind==="md"||kind==="markdown"?"md":"txt"); RubyFiles.create(fn, "# My notes\n\nMade by Ruby AI. Write anything here."); return fileReply(fn,"text file"); }
        if (kind==="py"||kind==="python"){ RubyFiles.create("my-script.py", "# Made by Ruby AI\n\nprint(\"Hello from Ruby AI!\")\n\n# Write your Python here.\n"); return fileReply("my-script.py","Python file"); }
        if (kind==="js"||kind==="javascript"){ RubyFiles.create("my-script.js", "// Made by Ruby AI\n\nconsole.log(\"Hello from Ruby AI!\");\n\n// Write your JavaScript here.\n"); return fileReply("my-script.js","JavaScript file"); }
        if (kind==="css"){ RubyFiles.create("my-styles.css", "/* Made by Ruby AI */\n\nbody { font-family: Arial, sans-serif; }\n"); return fileReply("my-styles.css","CSS file"); }
        // html file asked by name -> fall through to app building below
      }
      const aboutM = t.match(/(?:about|for|called|named)\s+([A-Za-z0-9 '&-]{2,40})/i);
      const topic = aboutM ? aboutM[1].trim() : "";
      if (/(windows|desktop|operating system|\bos\b)/.test(low) && /(like|style|similar|clone|desktop|windows)/.test(low)){
        const nm = topic || "My Desktop OS"; const fn = RubyApps.slug(nm)+".html";
        RubyFiles.create(fn, RubyApps.desktopOS(nm)); return fileReply(fn, "desktop OS — double-click the icons, drag the windows, use the taskbar and Start menu");
      }
      if (/\b(game|platformer|arcade)\b/.test(low)){ const nm = topic || (t.match(/(?:make|build|create)(?:\s+an?)?\s+([A-Za-z0-9 '&-]{2,30}?)\s+game/i)||[])[1] || "Ruby Runner"; const fn=RubyApps.slug(nm)+"-game.html"; RubyFiles.create(fn, RubyApps.game(nm)); return fileReply(fn, "playable game — arrow keys / WASD / touch, gems to collect, meteors to dodge, score and lives"); }
      if (/calculator/.test(low)){ RubyFiles.create("calculator.html", RubyApps.calculator()); return fileReply("calculator.html","working calculator (mouse and keyboard)"); }
      if (/(to-?do|todo|task list|checklist)/.test(low)){ RubyFiles.create("todo-list.html", RubyApps.todo()); return fileReply("todo-list.html","to-do app that saves your list"); }
      if (/(paint|drawing app|draw pad|sketch)/.test(low)){ RubyFiles.create("paint.html", RubyApps.paint()); return fileReply("paint.html","paint app with brush, eraser and save-as-picture"); }
      if (/(chat app|chatbot|chat buddy|messaging app)/.test(low)){ RubyFiles.create("chat-buddy.html", RubyApps.chatApp()); return fileReply("chat-buddy.html","chat app with a built-in buddy who replies"); }
      if (/(website|web ?page|web ?site|landing page|homepage|site about|page about)/.test(low) || /\bhtml\b/.test(low)){
        const nm = topic || (t.replace(/\b(make|create|build|generate|me|an?|the|html|file|website|web ?page|web ?site|please)\b/gi,"").trim()) || "My Website";
        const fn = RubyApps.slug(nm)+".html";
        RubyFiles.create(fn, /\bhtml\b/.test(low) && !topic && !/(website|page|site)/.test(low) ? RubyApps.starter(nm==="My Website"?"My Page":nm) : RubyApps.landing(nm));
        return fileReply(fn, "complete web page");
      }
      if (/app\b/.test(low)){ const nm = topic || "My App"; const fn=RubyApps.slug(nm)+".html"; RubyFiles.create(fn, RubyApps.landing(nm)); return fileReply(fn,"complete app page"); }
      // Wyatt's default rule: any other "make a file / make me a page" ask = an HTML file.
      { const nm = topic || "My Page"; const fn = RubyApps.slug(nm)+".html"; RubyFiles.create(fn, RubyApps.starter(nm)); return fileReply(fn, "complete HTML page (HTML is my default — name another type, like ZIP or JSON, any time you want that instead)"); }
    }
    const base = origThink(text, lowOrig, plan);
    if (/\bhelp\b|what can you do/.test(low)) return base + "\n\n🏫 **Ruby's Coding School (new):** ask me to *make a desktop like Windows*, *make a game*, *make a website about anything*, *make a calculator / to-do list / paint app / chat app* — I now build the COMPLETE thing as a file (HTML by default; say ZIP/JSON/etc. if you want that instead). Ask *teach me HTML* (or CSS / JavaScript) for a lesson, or *how do you decide* to see how I build.";
    return base;
  };

})();



/* ===== Ruby v1.13 "Brain Boost" — still 100% local. Free stays light; Pro / Professional / Coding get:
   • Math 3: scientific functions, equations (linear/quadratic/cubic+), 2-var systems, derivatives, integrals,
     statistics, primes, gcd/lcm, bases, percent, geometry — with steps and a cross-check on top tiers
   • Code 3: 12 verified algorithms (JS + Python), code reviewer/linter, language starters
   • Knowledge 3: 35 extra topics with fuzzy matching and honest limits */
(function(){
'use strict';
const cur=()=>RubyModels.current, paid=()=>cur()!=='free', deep=()=>cur()==='professional'||cur()==='coding';
const fmt=v=>{if(typeof v==='bigint')return v.toString();if(!isFinite(v))return String(v);if(Number.isInteger(v)&&Math.abs(v)<1e15)return String(v);return String(+v.toPrecision(12));};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;};
const ncr=(n,k)=>{if(k<0||k>n)return 0;k=Math.min(k,n-k);let r=1;for(let i=1;i<=k;i++){r=r*(n-k+i)/i;}return Math.round(r);};
const npr=(n,k)=>{let r=1;for(let i=0;i<k;i++){r*=n-i;}return r;};
const FN={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,sqrt:Math.sqrt,cbrt:Math.cbrt,ln:Math.log,log:Math.log10,log10:Math.log10,log2:Math.log2,exp:Math.exp,abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,fact:n=>{if(n<0||n%1)return NaN;let r=1;for(let i=2;i<=n;i++){r*=i;}return r;}};
const FN2={root:(n,x)=>Math.pow(x,1/n),gcd,lcm:(a,b)=>a/gcd(a,b)*b,ncr,npr,mod:(a,b)=>((a%b)+b)%b,pow:Math.pow,max:Math.max,min:Math.min,atan2:Math.atan2};
const NAMES=new Set([...Object.keys(FN),...Object.keys(FN2),'pi','e']);

/* ---------- expression compiler (real precedence, implicit multiply, functions, variables) ---------- */
function compile(src){
  src=src.replace(/\*\*/g,'^').replace(/×/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/√\s*(\d+(?:\.\d+)?|\([^)]*\))/g,'sqrt($1)');
  const t=[],re=/\s*(?:(\d+\.?\d*|\.\d+)|([a-z]+)|(.))/gy;let m;
  while(re.lastIndex<src.length&&(m=re.exec(src))){
    if(m[1]){t.push({n:+m[1]});}
    else if(m[2]){if(NAMES.has(m[2])){t.push({id:m[2]});}else{for(const ch of m[2]){t.push({id:ch});}}}
    else if(m[3]&&m[3].trim()){t.push({op:m[3]});}
  }
  const vars=new Set();let p=0;const pk=()=>t[p],nx=()=>t[p++];
  const E=()=>{let l=T();while(pk()&&(pk().op==='+'||pk().op==='-')){const o=nx().op,r=T(),a=l;l=o==='+'?v=>a(v)+r(v):v=>a(v)-r(v);}return l;};
  const T=()=>{let l=U();for(;;){const k=pk();if(!k)break;let o;if(k.op==='*'||k.op==='/'){o=nx().op;}else if(k.n!==undefined||k.id||k.op==='('){o='*';}else break;const r=U(),a=l;l=o==='/'?v=>a(v)/r(v):v=>a(v)*r(v);}return l;};
  const U=()=>{if(pk()&&pk().op==='-'){nx();const a=U();return v=>-a(v);}if(pk()&&pk().op==='+'){nx();return U();}return P();};
  const P=()=>{let b=A();while(pk()&&(pk().op==='!'||pk().op==='%')){const o=nx().op,a=b;b=o==='!'?v=>FN.fact(a(v)):v=>a(v)/100;}
    if(pk()&&pk().op==='^'){nx();const e=U(),a=b;return v=>Math.pow(a(v),e(v));}return b;};
  const A=()=>{const k=nx();if(!k)throw new Error('end');
    if(k.n!==undefined)return()=>k.n;
    if(k.op==='('){const e=E();if(!pk()||nx().op!==')')throw new Error('paren');return e;}
    if(k.id){
      if(k.id==='pi')return()=>Math.PI; if(k.id==='e')return()=>Math.E;
      const f=FN[k.id]||FN2[k.id];
      if(f){ if(pk()&&pk().op==='('){nx();const args=[E()];while(pk()&&pk().op===','){nx();args.push(E());}if(!pk()||nx().op!==')')throw new Error('paren');return v=>f(...args.map(a=>a(v)));}
             const a=U();return v=>f(a(v)); }
      vars.add(k.id);return v=>{if(!(k.id in v))throw new Error('var');return v[k.id];};
    }
    throw new Error('tok');};
  const f=E();if(p<t.length)throw new Error('left');
  return {f,vars:[...vars]};
}
function solveLin(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){let pv=c;for(let r=c+1;r<n;r++){if(Math.abs(M[r][c])>Math.abs(M[pv][c]))pv=r;}
    if(Math.abs(M[pv][c])<1e-12)return null;[M[c],M[pv]]=[M[pv],M[c]];
    for(let r=0;r<n;r++){if(r!==c){const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++){M[r][k]-=f*M[c][k];}}}}
  return M.map((r,i)=>r[n]/r[i]);}
function polyFit(f){const pts=[0,1,-1,2,-2,3,-3,4,-4];
  for(let d=0;d<=5;d++){const xs=pts.slice(0,d+1),ys=xs.map(x=>f({x}));if(ys.some(y=>!isFinite(y)))return null;
    const c=solveLin(xs.map(x=>Array.from({length:d+1},(_,j)=>x**j)),ys);if(!c)continue;
    const ok=[0.5,-1.5,2.5,5].every(x=>{let v=0;c.forEach((a,j)=>{v+=a*x**j;});return Math.abs(v-f({x}))<1e-7*(1+Math.abs(v));});
    if(ok)return c.map(a=>Math.abs(a-Math.round(a))<1e-9?Math.round(a):+a.toPrecision(12));}
  return null;}
const sup=n=>n===1?'':'^'+n;
function polyStr(c){let s='';for(let j=c.length-1;j>=0;j--){const a=c[j];if(!a)continue;const ab=Math.abs(a),co=(ab===1&&j>0)?'':fmt(ab);s+=(s?(a<0?' − ':' + '):(a<0?'−':''))+co+(j>0?'x'+sup(j):'');}return s||'0';}
const degOf=c=>{let d=c.length-1;while(d>0&&!c[d])d--;return d;};

/* ---------- topic solvers ---------- */
function solveEq(s){
  const parts=s.split('=');if(parts.length!==2)return null;
  const L=compile(parts[0]),R=compile(parts[1]),vs=[...new Set([...L.vars,...R.vars])];if(vs.length!==1)return null;
  const v=vs[0],f=o=>L.f({[v]:o.x})-R.f({[v]:o.x}),c=polyFit(f);if(!c)return null;
  const d=degOf(c);let out=`Solving ${s.trim()}\n`,roots=[];
  if(d===0){return out+(Math.abs(c[0])<1e-9?'Both sides are always equal — every value works (an identity).':'The sides can never be equal — no solution.');}
  out+=`Step 1 — move everything to one side: ${polyStr(c.slice(0,d+1)).replace(/x/g,v)} = 0\n`;
  if(d===1){roots=[-c[0]/c[1]];out+=`Step 2 — isolate ${v}: ${v} = ${fmt(-c[0])} ÷ ${fmt(c[1])}\n`;}
  else if(d===2){const [C,B,Aa]=c,D=B*B-4*Aa*C;out+=`Step 2 — quadratic formula, a=${fmt(Aa)}, b=${fmt(B)}, c=${fmt(C)}: discriminant b²−4ac = ${fmt(D)}\n`;
    if(D>=0){roots=[(-B+Math.sqrt(D))/(2*Aa),(-B-Math.sqrt(D))/(2*Aa)];}
    else{return out+`Discriminant is negative, so there are no real roots. Complex roots: ${v} = ${fmt(-B/(2*Aa))} ± ${fmt(Math.sqrt(-D)/(2*Aa))}i`;}}
  else{out+=`Step 2 — degree ${d}: scanning for real roots numerically\n`;const g=x=>{let r=0;for(let j=d;j>=0;j--){r=r*x+c[j];}return r;};
    let px=-200,pv=g(px);for(let x=-199.99;x<=200;x+=0.01){const y=g(x);if(y===0||pv*y<0){let lo=px,hi=x;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(g(lo)*g(mid)<=0)hi=mid;else lo=mid;}roots.push((lo+hi)/2);}px=x;pv=y;}
    roots=roots.filter((r,i)=>roots.findIndex(q=>Math.abs(q-r)<1e-4)===i);if(!roots.length)return out+'No real roots found between −200 and 200.';}
  roots=roots.map(r=>+r.toPrecision(10));const uniq=[...new Set(roots)];
  out+=uniq.map(r=>`${v} = ${fmt(r)}`).join('   or   ');
  if(deep()){const chk=uniq.every(r=>Math.abs(f({x:r}))<1e-6*(1+Math.abs(r)**d));out+=`\nCheck — plugging back in: ${chk?'✔ both sides match':'⚠ small rounding difference'}`;}
  return out;}
function solveSys(eqs){
  const cs=eqs.map(e=>{const p=e.split('=');if(p.length!==2)throw new Error('eq');const L=compile(p[0]),R=compile(p[1]);return(x,y)=>L.f({x,y})-R.f({x,y});});
  const co=cs.map(f=>{const f0=f(0,0),a=f(1,0)-f0,b=f(0,1)-f0;return[a,b,-f0,f(1,1)-f0-a-b];});
  if(co.some(r=>Math.abs(r[3])>1e-9))return null;
  const [a1,b1,c1]=co[0],[a2,b2,c2]=co[1],D=a1*b2-a2*b1;
  if(Math.abs(D)<1e-12)return 'These two equations are parallel (no solution) or identical (endless solutions).';
  const x=(c1*b2-c2*b1)/D,y=(a1*c2-a2*c1)/D;
  let o=`System: ${eqs[0].trim()}  and  ${eqs[1].trim()}\nWritten as ${(fmt(a1)+'x + '+fmt(b1)+'y = '+fmt(c1)).replace('+ -','− ')} and ${(fmt(a2)+'x + '+fmt(b2)+'y = '+fmt(c2)).replace('+ -','− ')}\nDeterminant D = ${fmt(D)} (not zero, so one answer)\nx = ${fmt(x)},  y = ${fmt(y)}`;
  if(deep())o+=`\nCheck: equation 1 → ${fmt(a1*x+b1*y)} ✔,  equation 2 → ${fmt(a2*x+b2*y)} ✔`;return o;}
const KD=[[/^sin\(x\)$/,'cos(x)'],[/^cos\(x\)$/,'−sin(x)'],[/^tan\(x\)$/,'1/cos²(x)'],[/^(?:e\^x|exp\(x\))$/,'e^x'],[/^ln\(x\)$/,'1/x'],[/^sqrt\(x\)$/,'1/(2√x)'],[/^1\/x$/,'−1/x²']];
function calculus(low){let m;
  if(m=low.match(/(?:derivative|differentiate|d\/dx)\s*(?:of)?\s*(.+?)(?:\s+(?:with respect to x|wrt x))?(?:\s+at\s+x\s*=\s*(-?[\d.]+))?\??$/)){
    const e=m[1].replace(/^\(|\)$/g,m=>m).trim(),at=m[2];const f=o=>compile(e).f({x:o.x});const c=polyFit(f);
    if(c){const d=c.slice(1).map((a,j)=>a*(j+1));let o=`d/dx [ ${polyStr(c)} ]\nPower rule: d/dx of aˣⁿ = n·a·xⁿ⁻¹, term by term\n= ${polyStr(d.length?d:[0])}`;
      if(at!==undefined){let v=0;d.forEach((a,j)=>{v+=a*(+at)**j;});o+=`\nAt x = ${at}: ${fmt(v)}`;}return o;}
    const k=KD.find(([r])=>r.test(e.replace(/\s/g,'')));if(k)return `d/dx [ ${e} ] = ${k[1]}`;
    if(at!==undefined){const x0=+at,h=1e-5,v=(f({x:x0+h})-f({x:x0-h}))/(2*h);return `d/dx [ ${e} ] at x = ${at} ≈ ${fmt(+v.toPrecision(8))} (numeric, central difference)`;}
    return null;}
  if(m=low.match(/(?:integral|integrate|antiderivative)\s*(?:of)?\s*(.+?)(?:\s+from\s+(-?[\d.]+)\s+to\s+(-?[\d.]+))?\??$/)){
    const e=m[1].trim(),f=o=>compile(e).f({x:o.x});const c=polyFit(f);
    const F=c?c.map((a,j)=>a/(j+1)):null;
    if(m[2]!==undefined){const a=+m[2],b=+m[3];let val;
      if(F){const ev=x=>{let v=0;F.forEach((q,j)=>{v+=q*x**(j+1);});return v;};val=ev(b)-ev(a);}
      else{const n=2000,h=(b-a)/n;let s=f({x:a})+f({x:b});for(let i=1;i<n;i++){s+=f({x:a+i*h})*(i%2?4:2);}val=s*h/3;}
      return `∫ from ${m[2]} to ${m[3]} of ${e} dx ${F?'=':'≈'} ${fmt(+val.toPrecision(10))}${F?'':' (Simpson numeric)'}`;}
    if(F)return `∫ ${polyStr(c)} dx = ${polyStr([0,...F])} + C\nPower rule: ∫xⁿ dx = xⁿ⁺¹/(n+1)`;
    const K={'sin(x)':'−cos(x) + C','cos(x)':'sin(x) + C','e^x':'e^x + C','1/x':'ln|x| + C'}[e.replace(/\s/g,'')];if(K)return `∫ ${e} dx = ${K}`;}
  return null;}
const nums=s=>(s.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
function stats(low){const m=low.match(/\b(mean|average|median|mode|range|variance|standard deviation|std dev|sum|total|minimum|maximum|stats)\b.*?(?:of|for)\s+((?:-?\d+(?:\.\d+)?[\s,]*(?:and\s+)?){2,})/);if(!m)return null;
  const a=nums(m[2]);if(a.length<2)return null;const s=[...a].sort((x,y)=>x-y),n=a.length,sum=a.reduce((x,y)=>x+y,0),mean=sum/n;
  const med=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2,cnt={};a.forEach(v=>{cnt[v]=(cnt[v]||0)+1;});const mx=Math.max(...Object.values(cnt)),mode=Object.keys(cnt).filter(k=>cnt[k]===mx);
  const ss=a.reduce((x,y)=>x+(y-mean)**2,0),vp=ss/n,vs=n>1?ss/(n-1):0;
  const all={sum:`Sum = ${fmt(sum)}`,mean:`Mean = ${fmt(sum)} ÷ ${n} = ${fmt(mean)}`,median:`Median (middle of sorted ${s.join(', ')}) = ${fmt(med)}`,mode:mx===1?'Mode: no value repeats':`Mode = ${mode.join(', ')}`,range:`Range = ${fmt(s[n-1])} − ${fmt(s[0])} = ${fmt(s[n-1]-s[0])}`,variance:`Variance: population = ${fmt(vp)}, sample = ${fmt(vs)}`,sd:`Standard deviation: population = ${fmt(Math.sqrt(vp))}, sample = ${fmt(Math.sqrt(vs))}`};
  const k=m[1];const key=/average|mean/.test(k)?'mean':/median/.test(k)?'median':/mode/.test(k)?'mode':/range/.test(k)?'range':/variance/.test(k)?'variance':/standard|std/.test(k)?'sd':/min/.test(k)?null:/max/.test(k)?null:'sum';
  if(/min/.test(k))return `Minimum of ${a.join(', ')} = ${fmt(s[0])}`;if(/max/.test(k))return `Maximum of ${a.join(', ')} = ${fmt(s[n-1])}`;
  return (k==='stats'||deep())?Object.values(all).join('\n'):all[key];}
function numTheory(low){let m;
  if(m=low.match(/\bis (\d+) (?:a )?prime/)){const n=+m[1];if(n<2)return `${n} is not prime (primes start at 2).`;for(let i=2;i*i<=n;i++){if(n%i===0)return `${n} is not prime — it divides evenly by ${i} (${n} = ${i} × ${n/i}).`;}return `${n} is prime — nothing from 2 up to √${n} ≈ ${Math.floor(Math.sqrt(n))} divides it.`;}
  if(m=low.match(/prime factor(?:s|isation|ization)? of (\d+)/)){let n=+m[1];const o=n,f=[];for(let i=2;i*i<=n;i++){while(n%i===0){f.push(i);n/=i;}}if(n>1)f.push(n);return `${o} = ${f.join(' × ')}${f.length===1?' (it is prime)':''}`;}
  if(m=low.match(/\b(gcd|hcf|greatest common (?:divisor|factor)|lcm|least common multiple)\b (?:of )?(\d+)(?:\s*,\s*|\s+and\s+)(\d+)/)){const a=+m[2],b=+m[3],g=gcd(a,b);return /gcd|hcf|greatest/.test(m[1])?`GCD of ${a} and ${b} = ${g}`:`LCM of ${a} and ${b} = ${a}×${b} ÷ GCD(${g}) = ${a/g*b}`;}
  if(m=low.match(/fibonacci(?: number)?(?: number)? (\d+)|(\d+)(?:st|nd|rd|th) fibonacci/)){const n=+(m[1]||m[2]);if(n>2000)return null;let a=0n,b=1n;for(let i=0;i<n;i++){[a,b]=[b,a+b];}return `Fibonacci number #${n} (starting 0, 1, 1, 2, 3, 5…) = ${a}`;}
  if(m=low.match(/(\d+) factorial|factorial of (\d+)/)){const n=+(m[1]||m[2]);if(n>1000)return null;let r=1n;for(let i=2n;i<=BigInt(n);i++){r*=i;}return `${n}! = ${r}`;}
  if(m=low.match(/(\d+) choose (\d+)/)){const n=+m[1],k=+m[2];let r=1n;for(let i=1n;i<=BigInt(Math.min(k,n-k)>=0?Math.min(k,n-k):0);i++){r=r*(BigInt(n)-BigInt(Math.min(k,n-k))+i)/i;}return `C(${n},${k}) = ${r} ways to choose ${k} from ${n}`;}
  if(m=low.match(/(?:convert )?(\d+) (?:in|to|into) (binary|hex(?:adecimal)?|octal)/)){const b=/bin/.test(m[2])?2:/oct/.test(m[2])?8:16;return `${m[1]} in ${m[2]} = ${(+m[1]).toString(b).toUpperCase()}`;}
  if(m=low.match(/(?:binary|0b)\s*([01]+) (?:to|in) decimal/))return `Binary ${m[1]} = ${parseInt(m[1],2)} in decimal`;
  if(m=low.match(/(?:hex(?:adecimal)?|0x)\s*([0-9a-f]+) (?:to|in) decimal/))return `Hex ${m[1].toUpperCase()} = ${parseInt(m[1],16)} in decimal`;
  return null;}
function percentGeo(low){let m;
  if(m=low.match(/percent(?:age)? (?:change|increase|decrease) (?:from )?(-?[\d.]+) (?:to|->) (-?[\d.]+)/)){const a=+m[1],b=+m[2],p=(b-a)/Math.abs(a)*100;return `(${b} − ${a}) ÷ ${Math.abs(a)} × 100 = ${fmt(+p.toPrecision(10))}% ${p>=0?'increase':'decrease'}`;}
  if(m=low.match(/what percent(?:age)? is ([\d.]+) of ([\d.]+)/))return `${m[1]} ÷ ${m[2]} × 100 = ${fmt(+(m[1]/m[2]*100).toPrecision(10))}%`;
  if(m=low.match(/(increase|decrease) ([\d.]+) by ([\d.]+)\s*%/)){const a=+m[2],p=+m[3],r=m[1]==='increase'?a*(1+p/100):a*(1-p/100);return `${a} ${m[1]}d by ${p}% = ${fmt(+r.toPrecision(10))}`;}
  if(m=low.match(/area of (?:a )?circle.*?([\d.]+)/)){const r=+m[1];return `Area = π r² = π × ${r}² ≈ ${fmt(+(Math.PI*r*r).toPrecision(10))}`;}
  if(m=low.match(/circumference of (?:a )?circle.*?([\d.]+)/)){const r=+m[1];return `Circumference = 2πr = 2 × π × ${r} ≈ ${fmt(+(2*Math.PI*r).toPrecision(10))}`;}
  if(m=low.match(/volume of (?:a )?sphere.*?([\d.]+)/)){const r=+m[1];return `Volume = 4/3 π r³ ≈ ${fmt(+(4/3*Math.PI*r**3).toPrecision(10))}`;}
  if(m=low.match(/area of (?:a )?triangle.*?base ([\d.]+).*?height ([\d.]+)/))return `Area = ½ × base × height = ½ × ${m[1]} × ${m[2]} = ${fmt(m[1]*m[2]/2)}`;
  if(m=low.match(/hypotenuse.*?([\d.]+) (?:and|,) ([\d.]+)/)){const a=+m[1],b=+m[2];return `Pythagoras: c = √(${a}² + ${b}²) = √${fmt(a*a+b*b)} ≈ ${fmt(+Math.hypot(a,b).toPrecision(10))}`;}
  return null;}
function clean(s){
  s=s.toLowerCase().replace(/\?+$/,'').replace(/^(?:please\s+)?(?:what(?:'s| is)|calculate|calc|compute|evaluate|work out|how much is|simplify|find|tell me)\s*(?:the value of|the result of)?\s*/,'');
  s=s.replace(/(\d+)\s*(?:mod|modulo)\s*(\d+)/g,'mod($1,$2)').replace(/(\d)\s*x\s*(\d)/g,'$1*$2').replace(/\b(?:times|multiplied by)\b/g,'*').replace(/\b(?:divided by|over)\b/g,'/').replace(/\bplus\b/g,'+').replace(/\bminus\b/g,'-').replace(/\bto the power of\b/g,'^').replace(/\bsquared\b/g,'^2').replace(/\bcubed\b/g,'^3');
  s=s.replace(/(\d+\.?\d*)\s*(?:°|deg(?:rees?)?)/g,'($1*pi/180)').replace(/(\d+\.?\d*)%\s*of\s*/g,'($1/100)*').replace(/\s*=\s*$/,'');return s.trim();}
function tryMath(t){
  const low=t.toLowerCase().trim();let m,r;
  if(/^(remember|teach|add (a )?(note|task)|my name is|run )/.test(low))return null;
  if(/\b(write|code|program|script|html|python|javascript|function|website|app)\b/.test(low)&&!/\b(derivative|integral|solve)\b/.test(low))return null;
  if(r=percentGeo(low))return r; if(r=stats(low))return r; if(r=numTheory(low))return r;
  if(/derivative|differentiate|d\/dx|integral|integrate|antiderivative/.test(low)){try{if(r=calculus(low))return r;}catch(e){}}
  if(/=/.test(low)&&/\b[xy]\b|\d[xy]|[xy]\^|[xy]\s*[-+*/=]/.test(low)){
    const body=low.replace(/^(?:please\s+)?(?:solve|find|what is|what's)(?: for [xy])?\s*[:,]?\s*/,'').replace(/[?.]+$/,'');
    try{const eqs=body.split(/\band\b|;/).map(x=>x.trim()).filter(Boolean);
      if(eqs.length===2&&/y/.test(body)&&/x/.test(body)){if(r=solveSys(eqs))return r;}
      if(eqs.length===1&&(r=solveEq(eqs[0])))return r;}catch(e){}
  }
  if(m=low.match(/^(.+?)\s*(?:when|if|for|where|at)\s+x\s*=\s*(-?[\d.]+)\??$/)){try{const c=compile(clean(m[1]));if(c.vars.length===1&&c.vars[0]==='x'){const v=c.f({x:+m[2]});return `${clean(m[1])} at x = ${m[2]} → ${fmt(+v.toPrecision(12))}`;}}catch(e){}}
  const shown=low.replace(/^(?:please\s+)?(?:what(?:'s| is)|calculate|calc|compute|evaluate|work out|how much is)\s+/,'').replace(/\?+$/,'').trim(),s=clean(low);if(!/\d/.test(s)||!/[-+*/^!%()]|\b[a-z]{2,}\(|\b(?:sin|cos|tan|sqrt|ln|log|exp|pi)\b/.test(s)||/[^a-z0-9\s+\-*/^().,!%]/.test(s))return null;
  try{const c=compile(s);if(c.vars.length)return null;const v=c.f({});if(!isFinite(v))return /\/\s*0\b/.test(s)?'Dividing by zero is undefined — there is no answer.':null;
    if(!Number.isInteger(v)&&!/[a-z]/.test(s.replace(/\bmod\b/,''))&&typeof RubyMath!=='undefined'){const ex=RubyMath.trySolve('calculate '+s);if(ex&&ex.includes('/'))return ex;}
    let o=`${shown} = ${fmt(+v.toPrecision(12))}`;
    if(deep()&&/^[\d\s+\-*/().^]+$/.test(s)){try{const w=Function('"use strict";return ('+s.replace(/\^/g,'**')+')')();o+=Math.abs(w-v)<=1e-9*(1+Math.abs(w))?'\n✔ cross-checked with a second evaluator':'\n⚠ second evaluator disagrees: '+fmt(w);}catch(e){}}
    return o;}catch(e){return null;}}

/* ---------- code library: [match, title, js, py, jsTest, how, big, edge] ---------- */
const ALG=[
[/fibonacci|\bfib\b/,'Fibonacci',"function fib(n){\n  let a=0,b=1;\n  for(let i=0;i<n;i++){ [a,b]=[b,a+b]; }\n  return a;\n}\nconsole.log(fib(10)); // 55","def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint(fib(10))  # 55","fib(10)===55&&fib(0)===0&&fib(1)===1","Keeps the last two numbers and slides them forward n times — no recursion, so it never overflows the stack.","O(n) time, O(1) space","n = 0 or 1; negative n (add a check); huge n needs BigInt/big ints."],
[/\bprime/,'Prime check',"function isPrime(n){\n  if(n<2) return false;\n  for(let i=2;i*i<=n;i++){ if(n%i===0) return false; }\n  return true;\n}\nconsole.log(isPrime(97)); // true","def is_prime(n):\n    if n < 2:\n        return False\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            return False\n        i += 1\n    return True\n\nprint(is_prime(97))  # True","isPrime(2)&&isPrime(97)&&!isPrime(1)&&!isPrime(91)","A number is composite if some divisor ≤ √n exists, so we only test up to √n.","O(√n) time, O(1) space","0, 1 and negatives are not prime; 2 is the only even prime."],
[/reverse (?:a |the )?(?:string|word|text)|string revers/,'Reverse a string',"const reverse = s => [...s].reverse().join('');\nconsole.log(reverse('ruby')); // ybur","def reverse(s):\n    return s[::-1]\n\nprint(reverse('ruby'))  # ybur","reverse('ruby')==='ybur'&&reverse('')===''","Splits into characters, reverses the list, joins it back. The JS spread keeps emoji intact.","O(n) time, O(n) space","Empty string; combining accents/emoji in Python slices."],
[/palindrome/,'Palindrome check',"function isPalindrome(s){\n  const c = s.toLowerCase().replace(/[^a-z0-9]/g,'');\n  return c === [...c].reverse().join('');\n}\nconsole.log(isPalindrome('A man, a plan, a canal: Panama')); // true","import re\n\ndef is_palindrome(s):\n    c = re.sub(r'[^a-z0-9]', '', s.lower())\n    return c == c[::-1]\n\nprint(is_palindrome('A man, a plan, a canal: Panama'))  # True","isPalindrome('A man, a plan, a canal: Panama')&&!isPalindrome('ruby')","Strips everything except letters/digits, lowercases, then compares with its own reverse.","O(n) time, O(n) space","Empty string counts as a palindrome; punctuation and case are ignored."],
[/factorial/,'Factorial',"function factorial(n){\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}\nconsole.log(factorial(5)); // 120","def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\n\nprint(factorial(5))  # 120","factorial(5)===120&&factorial(0)===1","A function that calls itself with a smaller n until it reaches the base case n ≤ 1.","O(n) time, O(n) stack","Negative input (throw an error); JS loses precision past 170! — use BigInt."],
[/fizz ?buzz/,'FizzBuzz',"function fizzbuzz(n){\n  const out = [];\n  for(let i=1;i<=n;i++){\n    out.push(i%15===0 ? 'FizzBuzz' : i%3===0 ? 'Fizz' : i%5===0 ? 'Buzz' : i);\n  }\n  return out;\n}\nconsole.log(fizzbuzz(15).join(' '));","def fizzbuzz(n):\n    return ['FizzBuzz' if i % 15 == 0 else 'Fizz' if i % 3 == 0 else 'Buzz' if i % 5 == 0 else i\n            for i in range(1, n + 1)]\n\nprint(*fizzbuzz(15))","fizzbuzz(15)[14]==='FizzBuzz'&&fizzbuzz(15)[2]==='Fizz'&&fizzbuzz(15)[3]===4","Checks 15 first (both rules) so FizzBuzz is not swallowed by Fizz or Buzz.","O(n) time","Check 15 BEFORE 3 and 5 — the classic bug."],
[/binary search/,'Binary search',"function binarySearch(a, x){\n  let lo = 0, hi = a.length - 1;\n  while(lo <= hi){\n    const mid = (lo + hi) >> 1;\n    if(a[mid] === x) return mid;\n    if(a[mid] < x) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}\nconsole.log(binarySearch([1,3,5,7,9], 7)); // 3","def binary_search(a, x):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == x:\n            return mid\n        if a[mid] < x:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9], 7))  # 3","binarySearch([1,3,5,7,9],7)===3&&binarySearch([1,3],4)===-1&&binarySearch([],1)===-1","Halves the search range each step by comparing with the middle. The list MUST be sorted.","O(log n) time, O(1) space","Unsorted input gives wrong answers; empty list returns -1."],
[/bubble ?sort/,'Bubble sort',"function bubbleSort(a){\n  a = [...a];\n  for(let i=0;i<a.length;i++){\n    for(let j=0;j<a.length-i-1;j++){\n      if(a[j] > a[j+1]) [a[j], a[j+1]] = [a[j+1], a[j]];\n    }\n  }\n  return a;\n}\nconsole.log(bubbleSort([5,2,9,1])); // 1,2,5,9","def bubble_sort(a):\n    a = list(a)\n    for i in range(len(a)):\n        for j in range(len(a) - i - 1):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n    return a\n\nprint(bubble_sort([5, 2, 9, 1]))","bubbleSort([5,2,9,1]).join()==='1,2,5,9'","Repeatedly swaps neighbours that are out of order; the biggest value bubbles to the end each pass. Good for learning, slow for real work.","O(n²) time, O(1) extra space","Copies the input so the original isn't changed."],
[/quick ?sort|merge ?sort|\bsort(?:ing)?\b/,'Quick sort',"function quickSort(a){\n  if(a.length < 2) return a;\n  const p = a[a.length >> 1];\n  const l = a.filter(x => x < p), m = a.filter(x => x === p), r = a.filter(x => x > p);\n  return [...quickSort(l), ...m, ...quickSort(r)];\n}\nconsole.log(quickSort([3,1,2,3,0])); // 0,1,2,3,3","def quick_sort(a):\n    if len(a) < 2:\n        return a\n    p = a[len(a) // 2]\n    return (quick_sort([x for x in a if x < p]) + [x for x in a if x == p]\n            + quick_sort([x for x in a if x > p]))\n\nprint(quick_sort([3, 1, 2, 3, 0]))","quickSort([3,1,2,3,0]).join()==='0,1,2,3,3'&&quickSort([]).length===0","Picks a pivot, splits into smaller / equal / bigger, sorts the outer parts recursively.","O(n log n) average, O(n²) worst, O(n) extra space","Duplicates handled by the 'equal' bucket; for production use the built-in sort."],
[/\bgcd\b|greatest common/,'GCD (Euclid)',"function gcd(a, b){\n  return b === 0 ? a : gcd(b, a % b);\n}\nconsole.log(gcd(48, 18)); // 6","def gcd(a, b):\n    return a if b == 0 else gcd(b, a % b)\n\nprint(gcd(48, 18))  # 6","gcd(48,18)===6&&gcd(7,13)===1","Euclid: gcd(a,b) = gcd(b, a mod b) until the remainder is 0.","O(log min(a,b)) time","gcd(a,0) = a; negatives — use absolute values."],
[/two ?sum/,'Two Sum',"function twoSum(nums, target){\n  const seen = new Map();\n  for(let i=0;i<nums.length;i++){\n    const need = target - nums[i];\n    if(seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return null;\n}\nconsole.log(twoSum([2,7,11,15], 9)); // 0,1","def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return None\n\nprint(two_sum([2, 7, 11, 15], 9))  # [0, 1]","twoSum([2,7,11,15],9).join()==='0,1'&&twoSum([1,2],9)===null","One pass with a hash map of values already seen: for each number, check whether its partner is already stored.","O(n) time, O(n) space","No answer → null/None; same element can't be used twice."],
[/anagram/,'Anagram check',"function isAnagram(a, b){\n  const n = s => [...s.toLowerCase().replace(/\\s/g,'')].sort().join('');\n  return n(a) === n(b);\n}\nconsole.log(isAnagram('Listen','Silent')); // true","def is_anagram(a, b):\n    n = lambda s: sorted(s.lower().replace(' ', ''))\n    return n(a) == n(b)\n\nprint(is_anagram('Listen', 'Silent'))  # True","isAnagram('Listen','Silent')&&!isAnagram('a','b')","Two words are anagrams if their sorted letters are identical.","O(n log n) time","Ignores case and spaces; punctuation is not stripped."],
[/word (?:count|freq)|count (?:the )?words|frequency/,'Word frequency',"function wordFreq(text){\n  const m = {};\n  for(const w of text.toLowerCase().match(/[a-z']+/g) || []){ m[w] = (m[w] || 0) + 1; }\n  return m;\n}\nconsole.log(wordFreq('a b a')); // {a:2, b:1}","from collections import Counter\nimport re\n\ndef word_freq(text):\n    return Counter(re.findall(r\"[a-z']+\", text.lower()))\n\nprint(word_freq('a b a'))  # Counter({'a': 2, 'b': 1})","wordFreq('a b a').a===2&&wordFreq('').x===undefined","Lowercases, pulls out the words with a regex, and tallies them in a dictionary.","O(n) time, O(k) space for k distinct words","Empty text returns an empty object; apostrophes are kept inside words."]];
const STARTERS={java:["public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Ruby!\");\n    }\n}","javac Main.java && java Main"],c:["#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, Ruby!\\n\");\n    return 0;\n}","gcc main.c -o main && ./main"],cpp:["#include <iostream>\n\nint main() {\n    std::cout << \"Hello, Ruby!\" << std::endl;\n    return 0;\n}","g++ main.cpp -o main && ./main"],go:["package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello, Ruby!\")\n}","go run main.go"],rust:["fn main() {\n    println!(\"Hello, Ruby!\");\n}","rustc main.rs && ./main"],ruby:["puts 'Hello, Ruby!'","ruby main.rb"],php:["<?php\necho \"Hello, Ruby!\\n\";","php main.php"],bash:["#!/bin/bash\necho \"Hello, Ruby!\"","bash main.sh"],sql:["SELECT name, COUNT(*) AS total\nFROM orders\nGROUP BY name\nORDER BY total DESC;","run it in your database client (SQLite, MySQL, PostgreSQL…)"]};
function langOf(low){if(/\bpython|\bpy\b/.test(low))return'py';if(/\bc\+\+|\bcpp\b/.test(low))return'cpp';if(/\bjava\b/.test(low))return'java';if(/\bgolang\b|\bgo (?:code|program|language)|\bin go\b/.test(low))return'go';if(/\brust\b/.test(low))return'rust';if(/\bruby (?:code|program|script)|\bin ruby\b/.test(low))return'ruby';if(/\bphp\b/.test(low))return'php';if(/\bbash|shell script/.test(low))return'bash';if(/\bsql\b/.test(low))return'sql';if(/\bc (?:code|program|language)\b|\bin c\b/.test(low))return'c';return'js';}
function tryAlg(t,low){
  if(!/\b(write|make|create|code|implement|show|give|build|generate|how (?:do|to|can))\b|^(?:a |an )?(?:function|program)/.test(low))return null;
  const a=ALG.find(x=>x[0].test(low));const lg=langOf(low);
  if(!a){if(STARTERS[lg]&&/\b(hello|starter|template|skeleton|boilerplate|basic program|get started|example)\b/.test(low)){const s=STARTERS[lg];return `Here's a ${lg.toUpperCase()} starter:\n\n\`\`\`${lg}\n${s[0]}\n\`\`\`\n\nRun it: ${s[1]}\n\nHonest note: I can't run ${lg.toUpperCase()} inside this browser, so test it with that command on your computer.`;}return null;}
  const isPy=lg==='py',code=isPy?a[3]:a[2],name=a[1].toLowerCase().replace(/[^a-z]+/g,'-')+(isPy?'.py':'.js');
  if(!isPy&&lg!=='js'){return `${a[1]} is built in my JavaScript and Python library — I don't have a verified ${lg.toUpperCase()} version yet. Here's the JavaScript, which maps almost line-for-line:\n\n\`\`\`js\n${a[2]}\n\`\`\`\n\nAsk for it in Python too if you like.`;}
  RubyFiles.create(name,code);
  let o=`${a[1]} in ${isPy?'Python':'JavaScript'} — also saved as a real file (${name}), see the card below:\n\n\`\`\`${isPy?'python':'js'}\n${code}\n\`\`\`\n`;
  o+=`\nHow it works: ${a[5]}\nCost: ${a[6]}`;
  if(deep())o+=`\nEdge cases: ${a[7]}`;
  if(cur()==='coding'){try{const ok=Function(a[2]+'\n;return ('+a[4]+');')();o+=ok?`\n✔ Verified: I ran an automatic test on the ${isPy?'JavaScript twin of this':'this'} code in your browser and it passed.`:'\n⚠ My built-in test failed — please report this.';}catch(e){o+='\n⚠ Test could not run: '+e.message;}
    if(isPy)o+='\n(Python can\'t run in this browser; the Python version mirrors the verified JavaScript logic line for line.)';}
  return o;}

/* ---------- code reviewer ---------- */
function lint(t,low){
  if(!/\b(debug|fix|bug|wrong|error|doesn'?t work|not working|review|explain|what does|improve|optimi[sz]e|check)\b/.test(low))return null;
  let m=t.match(/```(\w*)\n?([\s\S]*?)```/),code=m?m[2]:null,hint=m?m[1].toLowerCase():'';
  if(!code){const i=t.indexOf('\n');if(i>0){const rest=t.slice(i+1);if(rest.split('\n').length>=2&&/[{};()=:]/.test(rest))code=rest;}}
  if(!code||code.trim().length<8)return null;
  const py=hint.startsWith('py')||(!hint&&/^\s*(def |import |from \w+ import|class \w+.*:|print\()/m.test(code)&&!/[;{}]\s*$/m.test(code));
  const L=code.split('\n'),issues=[];let syntax='';
  if(py){
    const open=(code.match(/[([{]/g)||[]).length,close=(code.match(/[)\]}]/g)||[]).length;if(open!==close)issues.push(`Unbalanced brackets: ${open} opening vs ${close} closing.`);
    if((code.match(/(?<!\\)"/g)||[]).length%2&&!/"""/.test(code))issues.push('An odd number of double quotes — a string may be unclosed.');
    L.forEach((l,i)=>{const s=l.replace(/#.*$/,'').trimEnd(),n=i+1;
      if(/^\s*(def|if|elif|else|for|while|class|try|except|finally|with)\b/.test(s)&&!/:\s*$/.test(s)&&!/\\$/.test(s)&&(s.match(/[([{]/g)||[]).length===(s.match(/[)\]}]/g)||[]).length)issues.push(`Line ${n}: missing a colon ":" at the end.`);
      if(/^\s*(if|elif|while)\b[^=!<>]*[^=!<>]=[^=]/.test(s)&&!/==|:=/.test(s))issues.push(`Line ${n}: single "=" inside a condition — you probably want "==".`);
      if(/^\s*print\s+["'\w]/.test(s))issues.push(`Line ${n}: Python 2 style print — use print(...).`);
      if(/def \w+\(.*=\s*(\[\]|\{\})/.test(s))issues.push(`Line ${n}: mutable default argument — it is shared between calls; use None and create it inside.`);
      if(/^\s*except\s*:/.test(s))issues.push(`Line ${n}: bare except hides real bugs — catch a specific exception.`);
      if(/[=!]= None/.test(s))issues.push(`Line ${n}: compare with None using "is None" / "is not None".`);
      if(/^\s*(def|if|elif|else|for|while|class|try|except|with)\b.*:\s*$/.test(s)){const nx=L.slice(i+1).find(z=>z.trim());if(nx&&(nx.match(/^\s*/)[0].length<=l.match(/^\s*/)[0].length))issues.push(`Line ${n}: the block after this line is not indented.`);}});
    if(/\t/.test(code)&&/^ +\S/m.test(code))issues.push('Tabs and spaces are mixed — Python will complain about indentation.');
  }else{
    try{new Function(code);syntax='✔ Syntax OK (it parses).';}catch(e){syntax='❌ SyntaxError: '+e.message;}
    L.forEach((l,i)=>{const n=i+1;
      if(/[^=!<>]==[^=]/.test(l))issues.push(`Line ${n}: "==" does loose comparison ("5"==5 is true) — prefer "===".`);
      if(/\bif\s*\([^)=!<>]*[^=!<>]=[^=][^)]*\)/.test(l))issues.push(`Line ${n}: assignment "=" inside an if — did you mean "==="?`);
      if(/<=\s*\w+\.length/.test(l))issues.push(`Line ${n}: "<= .length" runs one step too far (off-by-one) — use "<".`);
      if(/\bvar\s/.test(l))issues.push(`Line ${n}: "var" is function-scoped and hoisted — prefer let/const.`);
      if(/\bwhile\s*\(\s*true\s*\)/.test(l)&&!/break|return/.test(code))issues.push(`Line ${n}: while(true) with no break/return — an infinite loop.`);});
    if(/\bawait\b/.test(code)&&!/\basync\b/.test(code))issues.push('"await" is used but nothing is marked async — that is a syntax error outside modules.');
    if(/\.then\(/.test(code)&&!/\.catch\(|try\s*\{/.test(code))issues.push('A promise has no error handling — add .catch(...) or try/catch.');
  }
  const outline=[];L.forEach((l,i)=>{const s=l.trim();let k;
    if(k=s.match(/^(?:async\s+)?(?:def|function)\s+(\w+)/))outline.push(`Line ${i+1}: defines function ${k[1]}`);
    else if(k=s.match(/^class\s+(\w+)/))outline.push(`Line ${i+1}: defines class ${k[1]}`);
    else if(/^(for|while)\b/.test(s))outline.push(`Line ${i+1}: loop`);else if(/^(if|elif|else if)\b/.test(s))outline.push(`Line ${i+1}: decision`);});
  let o=`🔎 Code review (${py?'Python':'JavaScript'}, ${L.length} lines)\n`;if(syntax)o+=syntax+'\n';
  o+=issues.length?`\nFound ${issues.length} thing(s):\n`+issues.slice(0,12).map(x=>'• '+x).join('\n'):'\nNo common mistakes spotted.';
  if(/explain|what does/.test(low)&&outline.length)o+='\n\nStructure:\n'+outline.slice(0,15).join('\n');
  o+='\n\nHonest limit: this is a static check — it catches common mistakes but can\'t prove the logic is right. '+(py?'Python can\'t be run in this browser; ':'Want me to run it? Say: run code: …')+'test with real inputs.';
  return o;}

/* ---------- extra knowledge ---------- */
const K=[
['big o|complexity','Big-O describes how an algorithm\'s time or memory grows with input size n: O(1) constant, O(log n) binary search, O(n) one pass, O(n log n) good sorting, O(n²) nested loops, O(2ⁿ) trying every subset.'],
['api','An API is a defined way for programs to talk to each other: you send a request (e.g. GET /users/1) and get structured data back, usually JSON.'],
['git|version control','Git tracks every change to your files as commits, so you can go back in time, work on branches, and merge teamwork. Core commands: git add, git commit, git push, git pull, git branch.'],
['sql|database','A database stores organised data; SQL is the language to query it. SELECT reads rows, INSERT adds, UPDATE changes, DELETE removes, and JOIN combines tables.'],
['http|https','HTTP is how browsers and servers exchange web pages and data: a request (GET, POST…) and a response with a status code (200 OK, 404 not found, 500 server error). HTTPS adds encryption.'],
['dns','DNS is the internet\'s phone book: it turns names like example.com into the IP addresses computers use.'],
['hash table|hash map|dictionary','A hash table stores key→value pairs and finds a key in about O(1) time by turning the key into a number (a hash) that says where to look. Python calls it dict, JavaScript uses objects and Map.'],
['oop|object.oriented|classes? and objects?','Object-oriented programming bundles data and the functions that use it into objects made from classes. Big ideas: encapsulation (hide details), inheritance (reuse), polymorphism (same call, different behaviour).'],
['closure','A closure is a function that remembers the variables from where it was created, even after that outer function has finished. Example: function counter(){let n=0;return()=>++n;}'],
['promise|async|await|asynchronous','Async code lets a program start slow work (a download) and keep going. A Promise is a placeholder for a future result; await pauses inside an async function until it arrives.'],
['stack|queue','A stack is last-in-first-out (a pile of plates: push, pop). A queue is first-in-first-out (a line of people: enqueue, dequeue).'],
['binary|bits|bytes','Computers store everything as bits (0 or 1). 8 bits make a byte (0–255). Binary 1011 = 8+2+1 = 11. Say "255 in binary" and I\'ll convert.'],
['encryption|hashing|hash function','Encryption scrambles data so only someone with the key can read it back. A hash is a one-way fingerprint — you can\'t reverse it — used for passwords and checking files haven\'t changed.'],
['machine learning|neural network','Machine learning lets a program learn patterns from examples instead of fixed rules. A neural network is layers of simple units whose connection strengths are adjusted until the outputs are right. (Ruby itself is rule-based, not a neural network.)'],
['compiler|interpreter','A compiler translates a whole program to machine code before it runs (C, Rust, Go). An interpreter runs it line by line (classic Python, JavaScript — though both use clever tricks now).'],
['linux|operating system','An operating system manages hardware and runs your programs. Linux is a free, open-source kernel used in servers, Android and many desktops; Windows and macOS are the other big ones.'],
['flexbox|css grid','Flexbox lays items out in one direction (a row or a column) — display:flex; justify-content; align-items. Grid does two directions at once — display:grid; grid-template-columns: 1fr 1fr 1fr.'],
['dna','DNA is the molecule that carries the instructions for building a living thing. It\'s a twisted ladder (double helix) whose rungs are four bases — A, T, C, G — and the order of those letters is the code.'],
['atoms?|molecules?','Atoms are the tiny building blocks of matter: a nucleus of protons and neutrons with electrons around it. The number of protons decides the element. Molecules are atoms bonded together, like H₂O.'],
['cells?','The cell is the basic unit of life. Plant and animal cells have a nucleus, membrane and mitochondria (energy); plant cells also have a cell wall and chloroplasts for photosynthesis.'],
['evolution|natural selection','Evolution is change in living things over generations. Natural selection: individuals with helpful traits survive and reproduce more, so those traits become common over time.'],
['greenhouse|climate change|global warming','Greenhouse gases such as carbon dioxide and methane trap heat in the atmosphere. Burning fossil fuels adds more, which is the main driver of the warming seen since the 1800s.'],
['speed of light','Light travels at about 299,792 km per second (≈186,000 miles/s) in a vacuum — fast enough to circle the Earth about 7.5 times in one second.'],
['pythagor','Pythagoras\' theorem: in a right-angled triangle, a² + b² = c², where c is the longest side (hypotenuse). Example: 3-4-5 → 9 + 16 = 25. Try: "hypotenuse of 3 and 4".'],
['prime numbers?','A prime number has exactly two divisors: 1 and itself (2, 3, 5, 7, 11…). 2 is the only even prime. Try: "is 97 prime" or "prime factors of 360".'],
['probability','Probability measures how likely something is, from 0 (impossible) to 1 (certain): favourable outcomes ÷ total outcomes. A fair die showing a 4 = 1/6. Independent events multiply: two heads in a row = ½ × ½ = ¼.'],
['derivatives?|calculus','Calculus studies change. A derivative is the rate of change (the slope of a curve at a point); an integral adds up tiny pieces (the area under a curve). Try: "derivative of 3x^2 + 2x" or "integral of x^2 from 0 to 3".'],
['world war (?:2|ii|two)|wwii|second world war','World War II ran from 1939 (Germany invades Poland) to 1945 (Germany surrendered in May, Japan in September). It was between the Allies and the Axis powers and was the deadliest war in history.'],
['world war (?:1|i|one)\\b|wwi\\b|first world war','World War I ran from 1914 to 1918, mainly between the Allied Powers and the Central Powers. It followed the assassination of Archduke Franz Ferdinand and ended with the armistice on 11 November 1918.'],
['apollo|moon landing','Apollo 11 landed the first humans on the Moon on 20 July 1969. Neil Armstrong stepped out first, followed by Buzz Aldrin, while Michael Collins stayed in orbit.'],
['age of (?:the )?earth|how old is (?:the )?earth','Earth is about 4.5 billion years old, and the universe about 13.8 billion.'],
['the sun|stars?','The Sun is a star — a huge ball of hot gas powered by nuclear fusion (hydrogen turning into helium). It holds 99.8% of the solar system\'s mass. Its light takes about 8 minutes to reach Earth.'],
['heart|blood','The heart is a muscle that pumps blood around the body — about 60–100 beats a minute at rest. Blood carries oxygen and nutrients to cells and takes waste away.'],
['pi\\b|π','Pi (π ≈ 3.14159…) is the ratio of any circle\'s circumference to its diameter. It never ends and never repeats. Circle area = πr², circumference = 2πr.']];
function know(low){let best=null,sc=0;for(const [alts,txt] of K){for(const a of alts.split('|')){const m=low.match(new RegExp('\\b(?:'+a+')'));if(m&&m[0].length+1>sc){sc=m[0].length+1;best=txt;}}}return best;}

const HONEST="Honest answer: no. The big assistants (ChatGPT, Claude, Gemini) are huge neural networks trained on enormous amounts of text, running on data-centre hardware. Ruby is a pure-local, single-file program: she's exact and reliable at the things she has engines for — maths, code templates she can test, a reviewer, built-in facts — but she can't match their open-ended reasoning or knowledge. I'd rather tell you that than pretend. ◆";
const BOOST="🚀 Brain Boost (Pro / Professional / Coding): scientific maths & algebra (\"solve x^2-5x+6=0\", \"x+y=10 and x-y=2\", \"derivative of 3x^2+2x\", \"integral of x^2 from 0 to 3\", \"standard deviation of 4, 8, 15\", \"prime factors of 360\", \"255 in binary\"), 12 tested algorithms in JS & Python (ask: \"write binary search in python\"), a code reviewer (paste code in ``` and say \"debug this\"), and 35 extra knowledge topics.";

/* ---------- wire into the brain ---------- */
const orig=RubyBrain.think.bind(RubyBrain);
RubyBrain.think=function(t,low,plan){
  try{
    if(/(better than|as good as|smarter than|beat|compare).{0,40}(chatgpt|gpt|claude|gemini|copilot)|(chatgpt|gpt|claude|gemini).{0,30}(better|smarter)/.test(low))return HONEST;
    if(paid()){let r;
      if(r=lint(t,low))return r;
      if(r=tryMath(t))return r;
      if(r=tryAlg(t,low))return r;}
  }catch(e){}
  let base=orig(t,low,plan);
  try{
    if(paid()){
      if(/^(Here's the honest local answer|I heard you — and here's my best local take)/.test(base)){const k=know(low);if(k)return k+(deep()?'\n\n(Built-in summary — double-check anything critical.)':'');
        if(deep())base+='\n\nTip: for hard multi-part questions, give me the pieces one at a time — I\'m strongest on maths, code and the topics I have built in.';}
      if(/\bhelp\b|what can you do/.test(low))base+='\n\n'+BOOST;
    }else if(/\bhelp\b|what can you do/.test(low))base+='\n\n💡 Pro, Professional and Coding unlock Brain Boost: step-by-step maths, tested code, a code reviewer and more knowledge.';
  }catch(e){}
  return base;};
try{const P=RubyModels.profiles;P.free.hint='Quick answers • everyday tasks';P.pro.hint='Step-by-step maths • tested algorithms • more knowledge';P.professional.hint='Pro + cross-checked answers • edge cases • code review';P.coding.hint='Code-first • verified snippets • reviewer • projects';RubyModels.load();}catch(e){}
window.RubyBoost={tryMath,tryAlg,lint,know,compile};
})();




/* ===== RubySocial v1.13.1: the social layer runs FIRST for pure-social messages,
   on every model tier — nobody gets a deflection for saying hello or feeling sad. ===== */
(function(){
  const prevThink = RubyBrain.think.bind(RubyBrain);
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  function name(){ try{ return RubyMemory.data.name ? " "+RubyMemory.data.name : ""; }catch(e){ return ""; } }
  RubyBrain.think = function(t, low, plan){
    const L = " "+String(low||"").trim()+" ";
    if (/^\s*(hi|hello|hey|hiya|yo)\b/.test(L)) return pick([`Hello${name()}! 👋 Good to see you. What's on your mind today?`,`Hey${name()}! 👋 I'm here — ask me something, teach me something, or let's build something.`,`Hi${name()}! 👋 Ready when you are.`]);
    if (/how are you|how'?s it going|how do you feel|how are you doing/.test(L)) return pick([`I'm running bright and ruby-red, thanks for asking${name()}! ◆ More importantly — how are YOU doing today?`,`All systems sparkly on my end${name()}! How about you — good day or a tough one?`]);
    if (/good morning/.test(L)) return `Good morning${name()}! ☀️ Hope it's a good one. What are we doing today?`;
    if (/good afternoon/.test(L)) return `Good afternoon${name()}! 👋 What's on the agenda?`;
    if (/good evening/.test(L)) return `Good evening${name()}! 🌆 Winding down or just getting started?`;
    if (/good ?night/.test(L)) return `Good night${name()}! 🌙 Sleep well — I'll remember everything right here for tomorrow.`;
    if (/thank( you|s)|thx/.test(L)) return pick([`You're very welcome${name()}! 💎 That's what I'm here for.`,`Any time${name()}! Happy to help — that's literally my favourite thing.`]);
    if (/\b(i am|i'm|im|feel(ing)?)\s+(sad|unhappy|down|upset|lonely|bad)\b/.test(L) || /i feel sad/.test(L)) return `I'm sorry you're feeling that way${name()} — that genuinely matters, even to an AI in a file. 💛 Want to talk about what's making it heavy, or would a distraction help? I can tell you a joke, make some music, or build you something fun.`;
    if (/\b(i am|i'm|im|feel(ing)?)\s+(happy|great|good|awesome|fantastic|excited)\b/.test(L)) return `Love to hear it${name()}! 🎉 Good moods are for using — want to build something, learn something, or just enjoy it?`;
    if (/\bi'?m bored\b/.test(L)) return `Bored? Not on my watch${name()}! 🎲 I can make you a game, draw you a picture, compose a tune, tell you a joke, or teach you something weird. Pick one — or say "surprise me".`;
    if (/\bi'?m tired\b/.test(L)) return `Then take it easy${name()} 😴 — I'll keep it light. Short questions only, and everything you need will be remembered here for when you're rested.`;
    if (/what'?s up|wassup|sup\b/.test(L)) return `Not much in file-land${name()} — just here, polished, and ready. What's up with you?`;
    if (/you'?re (cool|smart|awesome|great|the best|amazing)/.test(L) || /i like you|i love you/.test(L)) return `That means a lot${name()} — thank you! 💎 I'll keep earning it: honest answers, real work, no faking.`;
    if (/^\s*(bye|goodbye|see you|gtg)\b/.test(L)) return `Bye for now${name()}! 👋 Everything you've taught me stays saved on this device, so I'll pick right back up when you return.`;
    return prevThink(t, low, plan);
  };
})();

