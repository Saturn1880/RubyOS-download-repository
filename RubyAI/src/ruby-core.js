// Ruby Architecture v1.1 — core extracted from RubyAI.html

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
  save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} updateStats(); },
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
function loop(){ frame++; v+=0.45; y+=v;
 if(frame%95===0) pipes.push({px:360,gap:110+Math.random()*160});
 x.clearRect(0,0,360,480); x.fillStyle='#e0112b';
 for(const p of pipes){ p.px-=2.4; x.fillRect(p.px,0,52,p.gap); x.fillRect(p.px,p.gap+130,52,480); if(p.px===90) score++; if(52>p.px&&20<p.px+52&&(y<p.gap||y>p.gap+130)) dead=true; }
 pipes=pipes.filter(p=>p.px>-60);
 x.fillStyle='#ff2e4d'; x.beginPath(); x.arc(40,y,14,0,7); x.fill();
 x.fillStyle='#fff'; x.font='bold 22px Arial'; x.fillText('Score: '+score,12,28);
 if(y>466||y<0) dead=true; if(dead){ x.fillStyle='#fff'; x.font='bold 26px Arial'; x.fillText('Game over — click to retry',28,240); }
 requestAnimationFrame(loop); } loop();
<\/script></body></html>`};
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
function downloadFile(id){ const f=RubyFiles.items[id||RubyFiles.currentPreviewId||RubyFiles.lastId]; if(!f) return; const a=document.createElement("a"); a.href=URL.createObjectURL(RubyFiles.blobFor(f)); a.download=f.name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
function downloadCurrent(){ downloadFile(); }
function openPreview(id){
  const f=RubyFiles.items[id]; if(!f) return; RubyFiles.currentPreviewId=id;
  document.getElementById("ovTitle").textContent="◆ "+f.name;
  const ov=document.getElementById("overlay"), fr=document.getElementById("ovFrame"), bd=document.getElementById("ovBody");
  ov.classList.add("open");
  if(f.type==="zip"){ fr.style.display="none"; bd.style.display="block"; renderZipView(f,bd); return; }
  if(f.type==="html"||f.type==="svg"){ bd.style.display="none"; fr.style.display="block"; fr.srcdoc = f.type==="svg" ? "<body style='margin:0;display:grid;place-items:center;background:#160005'>"+f.content+"</body>" : f.content; }
  else { fr.style.display="none"; bd.style.display="block"; bd.innerHTML=""; const pre=document.createElement("pre"); pre.textContent=f.content; bd.appendChild(pre); }
}
function closePreview(){ document.getElementById("overlay").classList.remove("open"); RubyFiles.currentPreviewId=null; }
function refreshPreviewIfOpen(f){ if(RubyFiles.currentPreviewId===f.id && document.getElementById("overlay").classList.contains("open")) openPreview(f.id); }
function renderZipView(f,container){
  container.innerHTML=""; const title=document.createElement("div"); title.innerHTML="<h2 style='margin:4px 0'>📦 Inside "+f.name+"</h2><p class='small'>Click any file inside to preview it. Or download the whole ZIP with the button above.</p>"; container.appendChild(title);
  const entries = f.files ? f.files.map(x=>({name:x.name,size:x.content.length,content:x.content})) : Zip.list(new TextEncoder().encode(f.content||""));
  if(!entries.length){ container.innerHTML+="<p>This ZIP looks empty.</p>"; return; }
  for(const e of entries){ const d=document.createElement("div"); d.className="zipitem"; d.textContent="📄 "+e.name+"  —  "+e.size+" bytes"; d.onclick=()=>{ const isHtml=/\.html?$/i.test(e.name); const tmp=RubyFiles.create(e.name.replace(/[^\w.\-]/g,"_"), typeof e.content==="string"?e.content:new TextDecoder().decode(e.content)); openPreview(tmp.id); }; container.appendChild(d); }
}
function renderFileCard(f){
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
  mk("⬇ Download", downloadFile);
  d.appendChild(row); c.appendChild(d); c.scrollTop=c.scrollHeight;
}
function maybeRenderLastFile(beforeId){ const f=RubyFiles.last(); if(f && f.id!==beforeId) renderFileCard(f); }

function safeMath(expr){
  const clean = expr.replace(/[^0-9+\-*/(). %^]/g,"").trim(); if(!clean || !/[0-9]/.test(clean)) return null;
  try{ const js = clean.replace(/\^/g,"**"); const v = Function('"use strict"; return ('+js+')')(); return (typeof v==="number" && isFinite(v)) ? v : null; }catch(e){ return null; }
}
function tokenize(t){ return t.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean); }
const RubyBrain = {
  reply(raw){
    const t = raw.trim(), low = t.toLowerCase(); RubyMemory.data.turns++;
    RubyMemory.data.history.push({who:"user",text:t,at:Date.now()}); if(RubyMemory.data.history.length>200) RubyMemory.data.history=RubyMemory.data.history.slice(-200);
    let out = this.think(t, low); RubyMemory.data.history.push({who:"ruby",text:out,at:Date.now()}); RubyMemory.save(); return out;
  },
  think(t, low){
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
      const files = lastF && lastF.type!=="zip" ? [{name:lastF.name, content:lastF.content},{name:"README.txt",content:"Made with Ruby AI (Ruby Architecture v1.1)\nFile included: "+lastF.name}] : [{name:"index.html",content:CodeGen.generate("write html code for a website").code},{name:"README.txt",content:"Ruby AI starter project.\nOpen index.html in a browser."}];
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
    // Math
    if(/^(calculate|calc|what is|solve|compute)\s+/.test(low) || /^[0-9]/.test(low)){ const expr = low.replace(/^(calculate|calc|what is|solve|compute)\s+/,"").replace(/=?\??$/,""); const v=safeMath(expr); if(v!==null) return `${expr.trim()} = ${Math.round(v*1e10)/1e10}`; }
    const bare = safeMath(low.replace(/\?$/,"")); if(bare!==null && /[+\-*/^]/.test(low)) return `That works out to ${Math.round(bare*1e10)/1e10}.`;
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
    if(/help|what can you do/.test(low)) return "I can do all of this — locally, no internet AI needed:\n• 💬 Chat & answer built-in knowledge questions\n• 💻 Write code — Python, JavaScript, HTML (calculators, todos, games, timers, websites…)\n• ▶️ Run JavaScript — say: run code: console.log(2+2)\n• 🧮 Maths — say: calculate 144 * 12\n• 🧠 Remember — say: remember that my dog is called Max\n• 📚 Learn from you — say: teach: Paris is the capital of France\n• 📝 Notes — say: add note: call Oakley\n• ✍️ Stories, essays & plans\n• 🕐 Date & time, jokes, and more\n\nAnd anyone can extend me — that's the Ruby Architecture (see ARCHITECTURE.md).";
    if(/who are you|your name/.test(low)) return "I'm Ruby ◆ — a pure, local AI assistant built on the Ruby Architecture. I don't call Claude, ChatGPT, Gemini or any outside AI. Everything I do happens in this file, on your device.";
    if(/thank/.test(low)) return "Any time ◆ That's what I'm here for.";
    if(/bye/.test(low)) return "See you soon ◆ I'll remember what we talked about on this device.";
    // Fallback with context
    const words = tokenize(low).filter(w=>w.length>3);
    return `I heard you — and here's my best local take: I don't have a built-in answer for that exact thing yet, and I won't pretend an outside AI answered it, because Ruby runs purely on your device.\n\nWhat I CAN do right now with “${t.slice(0,80)}”:\n• Rephrase it as a code task (“write code to…”)\n• Ask me to explain a built-in topic (loops, functions, Python, HTML…)\n• Teach me the answer: teach: <topic> is <answer> — then I'll know it forever on this device\n\nThat honesty is part of the design: Ruby never makes up a fake “top-tier” answer.`;
  }
};
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function showMemoryText(){ const d=RubyMemory.data; let s="Here's what I remember on this device:\n"; s+= d.name?`• Your name: ${cap(d.name)}\n`:""; for(const k in d.facts) s+=`• ${k}: ${d.facts[k]}\n`; for(const k in d.taught) s+=`• (taught) ${k}: ${d.taught[k]}\n`; s+=`• Notes: ${d.notes.length} • Conversation turns: ${d.turns}`; if(!d.name && !Object.keys(d.facts).length && !Object.keys(d.taught).length) s+="\n(Nothing personal yet — teach me something!)"; return s; }
function updateStats(){ const el=document.getElementById("memStats"); if(el) el.innerHTML=`Turns: <b>${RubyMemory.data.turns}</b><br>Facts: <b>${Object.keys(RubyMemory.data.facts).length}</b> • Taught: <b>${Object.keys(RubyMemory.data.taught).length}</b><br>Notes: <b>${RubyMemory.data.notes.length}</b><br>Memory saved on device: <b>${(RubyMemory.bytes()/1024).toFixed(2)} KB</b>`; }
function addMsg(text,who){ const c=document.getElementById("chat"); const d=document.createElement("div"); d.className="msg "+who; d.textContent=text; c.appendChild(d); c.scrollTop=c.scrollHeight; }
function send(){ const i=document.getElementById("inp"); const v=i.value.trim(); if(!v)return; i.value=""; addMsg(v,"user"); const before=RubyFiles.lastId; setTimeout(()=>{ addMsg(RubyBrain.reply(v),"ruby"); maybeRenderLastFile(before); },120); }
function ask(v){ addMsg(v,"user"); const before=RubyFiles.lastId; setTimeout(()=>{ addMsg(RubyBrain.reply(v),"ruby"); maybeRenderLastFile(before); },120); }
function toggleSide(){ document.getElementById("side").classList.toggle("open"); }
function clearMemory(){ localStorage.removeItem(RubyMemory.key); RubyMemory.data={facts:{},taught:{},notes:[],tasks:[],history:[],name:"",turns:0,created:Date.now()}; RubyMemory.save(); updateStats(); }
function showMemory(){ addMsg(showMemoryText(),"ruby"); }
function exportMemory(){ const blob=new Blob([JSON.stringify(RubyMemory.data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="ruby-ai-memory.json"; a.click(); }
updateStats();
addMsg("Hello, I'm Ruby ◆ — now with real files: ask me to make something and you'll get a file card to open it right here or download it.\n\n — your pure local AI assistant.\n\nNo API keys. No Claude, ChatGPT or Gemini hiding inside. No internet AI calls. Everything I do runs in this one file, on your phone or laptop.\n\nAsk me to write code, do maths, explain something, write a story — or teach me something new and I'll remember it.","ruby");
