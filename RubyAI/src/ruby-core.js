// Ruby Architecture v1.0 — core extracted from RubyAI.html (Memory, Knowledge, CodeGen, RubyBrain)
// Builders: keep Memory+Intent+Planner, replace Knowledge/CodeGen with your own.

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
  topic(t){ if(/calculator/.test(t))return"calculator"; if(/todo|to-do|task list/.test(t))return"todo"; if(/game|clicker/.test(t))return"game"; if(/countdown|timer/.test(t))return"timer"; if(/sort/.test(t))return"sort"; return"generic"; },
  generate(prompt){
    const lang=this.detectLang(prompt.toLowerCase()), top=this.topic(prompt.toLowerCase());
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
    // Coding tasks
    if(/(write|make|create|code|build).*(code|python|javascript|html|program|app|website|game|calculator|todo)/.test(low) || /^code /.test(low)){
      const g = CodeGen.generate(t); return `Here's working ${g.lang} code for that:\n\n\`\`\`${g.lang}\n${g.code}\n\`\`\`\n\nWant me to change it, explain any line, or make a different version?`;
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
function send(){ const i=document.getElementById("inp"); const v=i.value.trim(); if(!v)return; i.value=""; addMsg(v,"user"); setTimeout(()=>addMsg(RubyBrain.reply(v),"ruby"),120); }
function ask(v){ addMsg(v,"user"); setTimeout(()=>addMsg(RubyBrain.reply(v),"ruby"),120); }
function toggleSide(){ document.getElementById("side").classList.toggle("open"); }
function clearMemory(){ localStorage.removeItem(RubyMemory.key); RubyMemory.data={facts:{},taught:{},notes:[],tasks:[],history:[],name:"",turns:0,created:Date.now()}; RubyMemory.save(); updateStats(); }
function showMemory(){ addMsg(showMemoryText(),"ruby"); }
function exportMemory(){ const blob=new Blob([JSON.stringify(RubyMemory.data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="ruby-ai-memory.json"; a.click(); }
updateStats();
addMsg("Hello, I'm Ruby ◆ — your pure local AI assistant.\n\nNo API keys. No Claude, ChatGPT or Gemini hiding inside. No internet AI calls. Everything I do runs in this one file, on your phone or laptop.\n\nAsk me to write code, do maths, explain something, write a story — or teach me something new and I'll remember it.","ruby");
