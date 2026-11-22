# ◆ Ruby AI — Pure Local AI Assistant

**Ruby AI** is a standalone AI assistant that runs **entirely on your device** in one HTML file.

- ❌ No external AI APIs (no Claude, ChatGPT, Gemini, OpenAI)
- ❌ No API keys
- ❌ No pretrained third-party AI models
- ✅ Its own **Ruby Architecture** (see ARCHITECTURE.md)
- ✅ Works on **phone and laptop/computer** — just open the file in a browser
- ✅ Ruby-red themed, named **Ruby**

## Download & use
1. Download `RubyAI.html`
2. Open it in any browser (Chrome, Edge, Safari, Firefox)
3. Ask Ruby to write code, do maths, explain topics, write stories, make plans, take notes — or teach her something and she'll remember it on that device.

## What Ruby can do
Chat • Python/JavaScript/HTML code generation • Run JavaScript • Calculator • Long-term memory (facts, taught knowledge, notes, your name) • Explanations • Stories/essays/plans • Date/time • Jokes • Export/clear memory

## Honest limits
Ruby is NOT a trained large language model like Claude or ChatGPT — no single file built without training data/compute can honestly be that. Ruby never pretends otherwise and never fakes an answer: if she doesn't know something, she says so and lets you **teach** her (`teach: topic is answer`), which she then remembers. That honesty + teachability is the Ruby Architecture idea.

## Build your own AI on Ruby Architecture
Copy `src/ruby-core.js`, replace the Knowledge and CodeGen modules with your own, keep Memory + Intent + Planner. Your AI, your name, your theme — powered by Ruby Architecture. See ARCHITECTURE.md.

## License
MIT — free to use, copy, modify and share. Keep the Ruby Architecture credit.
