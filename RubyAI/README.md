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

## What Ruby can do (v1.1)
Chat • Python/JavaScript/HTML code generation • Run JavaScript • Calculator • Long-term memory (facts, taught knowledge, notes, your name) • Explanations • Stories/essays/plans • Date/time • Jokes • Export/clear memory

**Preview/download rebuild (v1.4):** the live preview no longer uses an iframe at all — Ruby builds the page right into her own screen (nothing for a browser/viewer to block, no more white screen), runs its scripts, and cleans up when you close it. Downloads are now delivered as a direct data-file link placed in the page (blob method kept as backup), and New Tab clicks a real target=_blank link instead of a popup call.

**Preview/download fix (v1.3):** downloads now use a proper in-page download link (required by Edge/Firefox — a hidden off-page link silently does nothing in some browsers), the live preview loads via a real file URL with an automatic fallback, and every file card + the preview bar gained a **↗ New tab** button as another way to open/save a file.

**Chats, Settings, Memory & Sync (v1.2):** sidebar Chats menu with all your previous chats + ＋ New Chat • 🗑 Trash mode — tick chats (or Select all), hit Delete, confirm Yes/No, Yes deletes forever • ⚙️ Settings menu — on/off switches (memory, file cards, live preview, Enter-to-send, animations), Create Account, and Sync with Ruby AI Desktop (account info + password form; password stored only as a hash on-device — Ruby has no cloud server yet, so sync links the account on this device) • 🧠 Memory menu — export chat memory (all chats + memory as JSON), show/clear memory, delete old chats.

**Real files (v1.1):** every code/file answer comes with a file card — **Open & use it here** (HTML opens inside Ruby AI in a live preview you can click around in, ✕ to close; ask for changes like 'make the background blue' and the open preview updates live), **Download** (the actual .html/.xml/.py/.js/.txt/etc file), and **ZIP support** (Ruby makes real .zip files; click 'See what's inside' to list and preview the files inside before downloading).

## Honest limits
Ruby is NOT a trained large language model like Claude or ChatGPT — no single file built without training data/compute can honestly be that. Ruby never pretends otherwise and never fakes an answer: if she doesn't know something, she says so and lets you **teach** her (`teach: topic is answer`), which she then remembers. That honesty + teachability is the Ruby Architecture idea.

## Build your own AI on Ruby Architecture
Copy `src/ruby-core.js`, replace the Knowledge and CodeGen modules with your own, keep Memory + Intent + Planner. Your AI, your name, your theme — powered by Ruby Architecture. See ARCHITECTURE.md.

## License
MIT — free to use, copy, modify and share. Keep the Ruby Architecture credit.
